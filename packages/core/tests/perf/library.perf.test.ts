import { beforeAll, describe, expect, it } from "vitest";

import type { MediaKind } from "../../src/contract/types";
import { browseLibrary } from "../../src/library/queries";
import { normalizeTitle } from "../../src/library/SeriesStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { withTransaction } from "../../src/storage/SqlDriver";
import { NodeSqliteDriver, openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Prueba de carga de la biblioteca (SPEC §8.2, AC-4) — T23.
 *
 * 3000 series sintéticas (obras inventadas, sin títulos reales) y sus favoritos. El
 * criterio del Checkpoint F es que filtrar y buscar responda en menos de 300 ms en el
 * entorno de pruebas de Node; se mide cada consulta dos veces (la primera prepara los
 * planes de SQLite) y se toma la segunda.
 */

const TOTAL = 3_000;
const LIMITE_MS = 300;

const TIPOS: readonly MediaKind[] = ["manga", "manhua", "manhwa", "comic"];

/** Catálogo de nombres inventados; la combinación da 3000 títulos distintos. */
const ADJETIVOS = [
  "de ceniza",
  "del nido",
  "de luna rota",
  "del portal quieto",
  "de hierro",
  "del ala negra",
  "de sal y tinta",
  "del viento oblicuo",
];
const SUSTANTIVOS = ["El dragón", "La guardiana", "Las crónicas", "El templo", "Los portales"];

/** Serie sintética `i`: título con acentos y mayúsculas para que la normalización importe. */
function tituloDe(i: number): string {
  const base = `${SUSTANTIVOS[i % SUSTANTIVOS.length]} ${ADJETIVOS[i % ADJETIVOS.length]}`;
  return `${base} ${i}`.replace(/^El /u, "ÉL ");
}

let driver: SqlDriver;

beforeAll(async () => {
  driver = await openMigratedDriver();

  const ahora = 1_700_000_000_000;
  await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (1, 'Tesoros', 0, ?)", [
    ahora,
  ]);

  await withTransaction(driver, async () => {
    for (let i = 0; i < TOTAL; i += 1) {
      const modulo = i % 3 === 0 ? "tmo" : "fm";
      const serieId = `s-${i}`;
      // Títulos con acentos y mayúsculas, normalizados igual que en el dominio.
      const titulo = tituloDe(i);
      await driver.run(
        "INSERT INTO series (module_id, series_id, title, title_norm, cover_url, kind, nsfw, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          modulo,
          serieId,
          titulo,
          normalizeTitle(titulo),
          `https://sitio.test/${serieId}.jpg`,
          TIPOS[i % TIPOS.length] ?? "manga",
          i % 20 === 0 ? 1 : 0,
          "ongoing",
          ahora + i,
        ],
      );
      await driver.run(
        "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [modulo, serieId, i % 4 === 0 ? 1 : null, ahora + i, ahora + i],
      );
      if (i % 5 === 0) {
        await driver.run(
          "INSERT INTO progress (module_id, series_id, chapter_id, page_index, page_total, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [modulo, serieId, `cap-${i % 40}`, i % 30, 40, ahora - i],
        );
      }
    }
  });
});

/** Mide una consulta ya calentada: se ejecuta una vez fuera del cronómetro. */
async function milisegundos<T>(consulta: () => Promise<T>): Promise<number> {
  await consulta();
  const inicio = performance.now();
  await consulta();
  return performance.now() - inicio;
}

describe("biblioteca con 3000 series (AC-4)", () => {
  it("los datos de prueba están cargados", async () => {
    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM series");
    expect(filas[0]?.n).toBe(TOTAL);
  });

  it(`buscar por nombre responde en menos de ${LIMITE_MS} ms`, async () => {
    // La consulta va sin acento y en minúscula: se compara contra `title_norm`.
    const pagina = await browseLibrary(driver, { search: "DRAGÓN", order: "name", limit: 40 });
    expect(pagina.items.length).toBeGreaterThan(0);

    const ms = await milisegundos(() =>
      browseLibrary(driver, { search: "DRAGÓN", order: "name", limit: 40 }),
    );

    expect(ms).toBeLessThan(LIMITE_MS);
  });

  it(`filtrar por tipo y fuente responde en menos de ${LIMITE_MS} ms`, async () => {
    const ms = await milisegundos(() =>
      browseLibrary(driver, {
        kinds: ["manhwa", "manhua"],
        moduleIds: ["tmo"],
        order: "name",
        limit: 40,
      }),
    );

    expect(ms).toBeLessThan(LIMITE_MS);
  });

  it(`el filtro por carpeta con NSFW apagado responde en menos de ${LIMITE_MS} ms`, async () => {
    const ms = await milisegundos(() =>
      browseLibrary(driver, { folderId: 1, order: "name", limit: 40 }),
    );

    expect(ms).toBeLessThan(LIMITE_MS);
  });

  it(`ordenar por último leído responde en menos de ${LIMITE_MS} ms`, async () => {
    const ms = await milisegundos(() => browseLibrary(driver, { order: "lastRead", limit: 40 }));

    expect(ms).toBeLessThan(LIMITE_MS);
  });

  it(`ordenar por fecha de adición responde en menos de ${LIMITE_MS} ms`, async () => {
    const ms = await milisegundos(() => browseLibrary(driver, { order: "addedAt", limit: 40 }));

    expect(ms).toBeLessThan(LIMITE_MS);
  });

  it("recorrer la primera página de cada orden no pasa del límite", async () => {
    for (const order of ["name", "lastRead", "addedAt"] as const) {
      const ms = await milisegundos(() => browseLibrary(driver, { order, limit: 60 }));
      expect(ms, `orden ${order}`).toBeLessThan(LIMITE_MS);
    }
  });

  it("el cursor permite avanzar páginas sobre 3000 series sin repetir entradas", async () => {
    const vista = new Set<string>();
    let cursor: string | undefined;
    const inicio = performance.now();

    for (let vuelta = 0; vuelta < 5; vuelta += 1) {
      const pagina = await browseLibrary(driver, { order: "name", limit: 50, cursor });
      for (const entrada of pagina.items) {
        const clave = `${entrada.moduleId}/${entrada.seriesId}`;
        expect(vista.has(clave), `repetida: ${clave}`).toBe(false);
        vista.add(clave);
      }
      cursor = pagina.nextCursor ?? undefined;
      if (cursor === undefined) {
        break;
      }
    }

    expect(vista.size).toBe(250);
    expect(performance.now() - inicio).toBeLessThan(LIMITE_MS * 5);
  });

  it("el NSFW queda fuera por defecto también con 3000 series (RF-35)", async () => {
    const pagina = await browseLibrary(driver, { order: "name", limit: 1_000 });
    expect(pagina.items.some((e) => e.nsfw)).toBe(false);

    const conNsfw = await browseLibrary(driver, {
      nsfwVisible: true,
      order: "name",
      limit: 1_000,
    });
    expect(conNsfw.items.some((e) => e.nsfw)).toBe(true);
  });

  it("un adaptador sin migrar no esconde el problema: falla al primer uso", async () => {
    const virgen = NodeSqliteDriver.openInMemory();

    await expect(browseLibrary(virgen, { order: "name", limit: 10 })).rejects.toThrow();
    virgen.close();
  });
});
