import { beforeEach, describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import type { MediaKind } from "../../src/contract/types";
import { browseLibrary, buildLibraryQuery, type LibraryEntry } from "../../src/library/queries";
import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Consultas de biblioteca (SPEC §3.5, §8.2, RF-26 a RF-29, RF-35 y RF-42) — T23.
 *
 * La biblioteca es la lista de favoritos enriquecida con su serie y su progreso, con
 * búsqueda, filtros combinables, tres órdenes y paginación por cursor. El NSFW se oculta
 * por defecto (RF-34 y RF-35).
 */

const MODULO = "tmo";
const OTRO_MODULO = "fm";

let driver: SqlDriver;
let clock: FixedClock;
let series: SeriesStore;
let carpetas: Folders;
let favoritos: Favorites;

/** Da de alta serie y favorito en el momento que se le da (tiempos siempre distintos). */
async function darAlta(
  momento: number,
  serieId: string,
  titulo: string,
  datos: { kind?: MediaKind; nsfw?: boolean; modulo?: string } = {},
): Promise<void> {
  const modulo = datos.modulo ?? MODULO;
  clock.set(momento);
  await series.upsert({
    moduleId: modulo,
    seriesId: serieId,
    title: titulo,
    coverUrl: `https://sitio.test/${serieId}.jpg`,
    kind: datos.kind ?? "manga",
    nsfw: datos.nsfw ?? false,
    status: "ongoing",
  });
  await favoritos.add(modulo, serieId, null);
}

/** Progreso escrito directamente (llega en T25); basta con la fila para ordenar. */
async function ponerProgreso(serieId: string, capitulo: string, pagina: number, momento: number) {
  await driver.run(
    "INSERT INTO progress (module_id, series_id, chapter_id, chapter_title, page_index, page_total, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [MODULO, serieId, capitulo, `Capítulo ${capitulo}`, pagina, 40, momento],
  );
}

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  series = new SeriesStore({ driver, clock });
  carpetas = new Folders({ driver, clock });
  favoritos = new Favorites({ driver, clock });

  // Orden por título normalizado: moonlit < ceniza < templo < nido < sombra (NSFW).
  await darAlta(1_000, "ceniza", "El dragón de ceniza", { kind: "manga" });
  await darAlta(2_000, "nido", "La guardiana del nido", { kind: "manhwa" });
  await darAlta(3_000, "moonlit", "Crónicas de Moonlit", { kind: "comic" });
  await darAlta(4_000, "templo", "El Templo de las Estrellas", { kind: "manhua" });
  await darAlta(5_000, "sombra", "Sombras del puerto", { kind: "manga", nsfw: true });
});

describe("browseLibrary · filtros del SPEC §3.5", () => {
  it("devuelve los favoritos con su serie y su progreso", async () => {
    await ponerProgreso("ceniza", "cap-3", 12, 50_000);

    const pagina = await browseLibrary(driver, { order: "name", limit: 10 });
    const ceniza = pagina.items.find((e) => e.seriesId === "ceniza");

    expect(ceniza).toEqual({
      moduleId: MODULO,
      seriesId: "ceniza",
      title: "El dragón de ceniza",
      coverUrl: "https://sitio.test/ceniza.jpg",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      folderId: null,
      addedAt: 1_000,
      progress: {
        chapterId: "cap-3",
        chapterTitle: "Capítulo cap-3",
        pageIndex: 12,
        pageTotal: 40,
        updatedAt: 50_000,
      },
    });
    // La NSFW sigue oculta por defecto (RF-35).
    expect(pagina.items.map((e) => e.seriesId)).toEqual(["moonlit", "ceniza", "templo", "nido"]);
  });

  it("busca por nombre sin acentos y sin distinguir mayúsculas (title_norm + LIKE)", async () => {
    const porDragon = await browseLibrary(driver, { search: "DRAGÓN", order: "name", limit: 10 });
    expect(porDragon.items.map((e) => e.seriesId)).toEqual(["ceniza"]);

    const porLunas = await browseLibrary(driver, { search: "luna", order: "name", limit: 10 });
    expect(porLunas.items).toEqual([]);
  });

  it("la búsqueda no deja que el texto amplíe el LIKE con comodines", async () => {
    await darAlta(6_000, "cien", "El 100% del nido", { kind: "manga" });

    const pagina = await browseLibrary(driver, { search: "100%", order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["cien"]);
  });

  it("filtra por tipo, solo o en conjunto", async () => {
    const vertical = await browseLibrary(driver, { kinds: ["manhwa"], order: "name", limit: 10 });
    expect(vertical.items.map((e) => e.seriesId)).toEqual(["nido"]);

    const mezcla = await browseLibrary(driver, {
      kinds: ["manhua", "comic"],
      order: "name",
      limit: 10,
    });
    expect(mezcla.items.map((e) => e.seriesId)).toEqual(["moonlit", "templo"]);
  });

  it("filtra por fuente (módulo)", async () => {
    await darAlta(6_000, "extra", "Una serie de otro portal", {
      kind: "manhua",
      modulo: OTRO_MODULO,
    });

    const pagina = await browseLibrary(driver, {
      moduleIds: [OTRO_MODULO],
      order: "name",
      limit: 10,
    });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["extra"]);
    expect(pagina.items[0]?.moduleId).toBe(OTRO_MODULO);
  });

  it("filtra por carpeta, y `null` son las series sin carpeta", async () => {
    const tesoros = await carpetas.create("Tesoros");
    const pendientes = await carpetas.create("Pendientes");
    await favoritos.move(MODULO, "nido", tesoros);
    await favoritos.move(MODULO, "moonlit", pendientes);

    const deTesoros = await browseLibrary(driver, { folderId: tesoros, order: "name", limit: 10 });
    expect(deTesoros.items.map((e) => e.seriesId)).toEqual(["nido"]);

    const sinCarpeta = await browseLibrary(driver, { folderId: null, order: "name", limit: 10 });
    expect(sinCarpeta.items.map((e) => e.seriesId)).toEqual(["ceniza", "templo"]);
  });

  it("con el filtro NSFW apagado no aparecen las series NSFW (RF-35)", async () => {
    const apagado = await browseLibrary(driver, { order: "name", limit: 10 });
    expect(apagado.items.map((e) => e.seriesId)).not.toContain("sombra");

    const encendido = await browseLibrary(driver, { nsfwVisible: true, order: "name", limit: 10 });
    expect(encendido.items.map((e) => e.seriesId)).toContain("sombra");
  });

  it("los filtros se combinan entre sí", async () => {
    const tesoros = await carpetas.create("Tesoros");
    await favoritos.move(MODULO, "nido", tesoros);
    await favoritos.move(MODULO, "templo", tesoros);

    const pagina = await browseLibrary(driver, {
      search: "guardiana",
      kinds: ["manhwa"],
      moduleIds: [MODULO],
      folderId: tesoros,
      order: "name",
      limit: 10,
    });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["nido"]);
  });

  it("no calcula contadores de no leídos ni totales de capítulos (RF-42 es v2)", async () => {
    const consulta = buildLibraryQuery({ order: "name", limit: 10 });
    expect(consulta.sql).not.toMatch(/chapter_read/i);
    expect(consulta.sql).not.toMatch(/COUNT\(/i);

    const pagina = await browseLibrary(driver, { order: "name", limit: 10 });
    for (const entrada of pagina.items) {
      expect(entrada).not.toHaveProperty("unreadCount");
      expect(entrada).not.toHaveProperty("chapterTotal");
    }
  });
});

describe("browseLibrary · «Leyendo» (P-70)", () => {
  it("solo devuelve las series con una fila en progress", async () => {
    await ponerProgreso("ceniza", "cap-3", 12, 50_000);
    await ponerProgreso("templo", "cap-1", 0, 60_000);

    const pagina = await browseLibrary(driver, { reading: true, order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["ceniza", "templo"]);
  });

  it("cuenta la serie aunque el capítulo esté en la última página (P-70, no la opción b)", async () => {
    await ponerProgreso("ceniza", "cap-3", 39, 50_000);

    const pagina = await browseLibrary(driver, { reading: true, order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["ceniza"]);
  });

  it("sin el filtro devuelve también las series sin progreso", async () => {
    await ponerProgreso("ceniza", "cap-3", 12, 50_000);

    const pagina = await browseLibrary(driver, { order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["moonlit", "ceniza", "templo", "nido"]);
  });

  it("`reading: false` devuelve las que no se han empezado", async () => {
    await ponerProgreso("ceniza", "cap-3", 12, 50_000);

    const pagina = await browseLibrary(driver, { reading: false, order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["moonlit", "templo", "nido"]);
  });

  it("se combina con la paginación por cursor sin repetir ni saltar series", async () => {
    await ponerProgreso("ceniza", "cap-1", 0, 50_000);
    await ponerProgreso("nido", "cap-1", 0, 60_000);
    await ponerProgreso("templo", "cap-1", 0, 70_000);

    const primera = await browseLibrary(driver, { reading: true, order: "name", limit: 2 });
    expect(primera.items.map((e) => e.seriesId)).toEqual(["ceniza", "templo"]);
    expect(primera.nextCursor).not.toBeNull();

    const segunda = await browseLibrary(driver, {
      reading: true,
      order: "name",
      limit: 2,
      cursor: primera.nextCursor ?? undefined,
    });
    expect(segunda.items.map((e) => e.seriesId)).toEqual(["nido"]);
  });

  it("la serie NSFW sigue oculta salvo que se pidan las NSFW (RF-35)", async () => {
    await ponerProgreso("sombra", "cap-1", 0, 50_000);

    const oculto = await browseLibrary(driver, { reading: true, order: "name", limit: 10 });
    expect(oculto.items.map((e) => e.seriesId)).toEqual([]);

    const visible = await browseLibrary(driver, {
      reading: true,
      nsfwVisible: true,
      order: "name",
      limit: 10,
    });
    expect(visible.items.map((e) => e.seriesId)).toEqual(["sombra"]);
  });
});

describe("browseLibrary · órdenes del SPEC §3.5 (RF-28)", () => {
  it("por nombre usa el título normalizado (minúsculas y sin acentos)", async () => {
    const pagina = await browseLibrary(driver, { order: "name", limit: 10 });

    expect(pagina.items.map((e) => e.title)).toEqual([
      "Crónicas de Moonlit",
      "El dragón de ceniza",
      "El Templo de las Estrellas",
      "La guardiana del nido",
    ]);
  });

  it("por último leído: la más reciente primero y las sin leer detrás", async () => {
    await ponerProgreso("nido", "cap-1", 3, 90_000);
    await ponerProgreso("moonlit", "cap-9", 1, 70_000);

    const pagina = await browseLibrary(driver, { order: "lastRead", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual([
      "nido",
      "moonlit",
      // Las sin progreso mantienen el orden por fecha de adición invertida.
      "templo",
      "ceniza",
    ]);
  });

  it("por fecha de adición: la más reciente primero", async () => {
    const pagina = await browseLibrary(driver, { order: "addedAt", limit: 10 });

    expect(pagina.items.map((e) => e.seriesId)).toEqual(["templo", "moonlit", "nido", "ceniza"]);
  });
});

describe("browseLibrary · paginación por cursor (SPEC §8.2)", () => {
  it("recorre todas las páginas sin repetir ni dejar entradas", async () => {
    const vistos: string[] = [];
    let cursor: string | undefined;

    for (let vuelta = 0; vuelta < 10; vuelta += 1) {
      const pagina = await browseLibrary(driver, { order: "name", limit: 2, cursor });
      vistos.push(...pagina.items.map((e) => e.seriesId));
      if (pagina.nextCursor === null) {
        break;
      }
      cursor = pagina.nextCursor;
    }

    expect(vistos).toEqual(["moonlit", "ceniza", "templo", "nido"]);
  });

  it("la última página no devuelve cursor", async () => {
    const pagina = await browseLibrary(driver, { order: "name", limit: 10 });

    expect(pagina.items).toHaveLength(4);
    expect(pagina.nextCursor).toBeNull();
  });

  it("el cursor vale también en los otros dos órdenes, sin solapes", async () => {
    for (const order of ["name", "lastRead", "addedAt"] as const) {
      const primera = await browseLibrary(driver, { order, limit: 2 });
      expect(primera.nextCursor, `cursor de ${order}`).not.toBeNull();

      const segunda = await browseLibrary(driver, {
        order,
        limit: 2,
        cursor: primera.nextCursor ?? undefined,
      });
      const primeras = primera.items.map(clave);
      const segundas = segunda.items.map(clave);
      expect(
        segundas.filter((k) => primeras.includes(k)),
        `repetidos en ${order}`,
      ).toEqual([]);
      expect(segundas.length, `segunda página de ${order}`).toBeGreaterThan(0);
    }
  });

  it("un cursor del orden equivocado se rechaza con un error tipado", async () => {
    const pagina = await browseLibrary(driver, { order: "name", limit: 2 });

    const error = await browseLibrary(driver, {
      order: "addedAt",
      limit: 2,
      cursor: pagina.nextCursor ?? undefined,
    }).then(
      () => undefined,
      (lanzado: unknown) => lanzado,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
  });

  it("un cursor ilegible se rechaza con PARSE", async () => {
    await expect(
      browseLibrary(driver, { order: "name", limit: 2, cursor: "{ esto no es json" }),
    ).rejects.toBeInstanceOf(ModuleError);
  });
});

describe("browseLibrary · planes de consulta (SPEC §8.2)", () => {
  it("el filtro por carpeta usa idx_favorite_folder", async () => {
    const plan = await explicar({ folderId: 1, order: "name", limit: 10 });

    expect(plan).toContain("idx_favorite_folder");
  });

  it("el orden por nombre se apoya en idx_series_title", async () => {
    const plan = await explicar({ order: "name", limit: 10 });

    expect(plan).toContain("idx_series_title");
  });

  it("la búsqueda por título no recorre `chapter_read` (RF-42 es v2)", async () => {
    const plan = await explicar({ search: "dragon", order: "name", limit: 10 });

    expect(plan).not.toContain("chapter_read");
  });
});

/** Clave `(modulo, serie)` de una entrada. */
function clave(entrada: LibraryEntry): string {
  return `${entrada.moduleId}/${entrada.seriesId}`;
}

/** Texto del plan de consulta de un filtro dado, para ver qué índices elige SQLite. */
async function explicar(filtro: Parameters<typeof buildLibraryQuery>[0]): Promise<string> {
  const consulta = buildLibraryQuery(filtro);
  const filas = await driver.all<{ detail: string }>(`EXPLAIN QUERY PLAN ${consulta.sql}`, [
    ...consulta.params,
  ]);
  return filas.map((f) => f.detail).join("\n");
}
