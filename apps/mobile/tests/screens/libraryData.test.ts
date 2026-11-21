import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Folders, SeriesStore, SqliteStorage, type SqlDriver } from "@ryuunest/core";

import {
  openMigratedDriver,
  type NodeSqliteDriver,
} from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { loadLibraryData, resolveLibraryData } from "../../src/screens/library/libraryData";
import { GEMS_FOLDER_ID, type LibraryData } from "../../src/screens/library/libraryFixtures";

const reloj = { now: () => 1 };

/**
 * F14c — la pantalla Biblioteca lee del núcleo (`browseLibrary`, T23; `Folders`, T22)
 * y adapta las filas a `LibraryData`. Se prueba contra SQLite real (`node:sqlite`)
 * con el esquema migrado del SPEC §8.1.
 */
let driver: NodeSqliteDriver;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

async function addSeries(
  db: SqlDriver,
  s: {
    id: string;
    title: string;
    moduleId?: string;
    kind?: string | null;
    nsfw?: boolean;
    status?: string | null;
    folderId?: number | null;
    addedAt: number;
    progress?: {
      chapterId: string;
      title: string | null;
      page: number;
      total: number | null;
      at: number;
    };
  },
): Promise<void> {
  const moduleId = s.moduleId ?? "mod-a";
  await db.run(
    `INSERT INTO series (module_id, series_id, title, title_norm, kind, nsfw, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      s.id,
      s.title,
      s.title.toLowerCase(),
      s.kind === undefined ? "manga" : s.kind,
      s.nsfw === true ? 1 : 0,
      s.status === undefined ? "ongoing" : s.status,
      s.addedAt,
    ],
  );
  await db.run(
    `INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [moduleId, s.id, s.folderId ?? null, s.addedAt, s.addedAt],
  );
  if (s.progress !== undefined) {
    await db.run(
      `INSERT INTO progress (module_id, series_id, chapter_id, chapter_title, page_index, page_total, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        moduleId,
        s.id,
        s.progress.chapterId,
        s.progress.title,
        s.progress.page,
        s.progress.total,
        s.progress.at,
      ],
    );
  }
}

describe("resolveLibraryData (F14c)", () => {
  const fallback: LibraryData = { series: [], folders: [], sources: [{ id: "x", name: "x" }], tags: [] };

  it("sin base de datos en la plataforma (web) usa los datos de reserva", async () => {
    expect(await resolveLibraryData(async () => null, fallback)).toBe(fallback);
  });

  it("con base de datos lee del núcleo, no de la reserva", async () => {
    await addSeries(driver, { id: "real", title: "Real", addedAt: 1 });

    const data = await resolveLibraryData(async () => driver, fallback);

    expect(data.series.map((s) => s.seriesId)).toEqual(["real"]);
  });

  it("una base vacía muestra la biblioteca vacía real, sin sembrar nada", async () => {
    const data = await resolveLibraryData(async () => driver, fallback);

    expect(data).toMatchObject({ series: [], sources: [] });
    expect(await driver.get("SELECT COUNT(*) AS n FROM favorite")).toEqual({ n: 0 });
  });
});

describe("loadLibraryData (F14c)", () => {
  it("una base vacía da una biblioteca vacía", async () => {
    expect(await loadLibraryData(driver)).toMatchObject({ series: [], sources: [] });
  });

  it("adapta una serie con progreso, tipo, estado y carpeta", async () => {
    await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (?, ?, ?, ?)", [
      7,
      "Favoritas",
      0,
      1,
    ]);
    await addSeries(driver, {
      id: "s1",
      title: "Serie Uno",
      kind: "manhwa",
      status: "hiatus",
      folderId: 7,
      addedAt: 1000,
      progress: { chapterId: "c9", title: "Capítulo 9", page: 4, total: 20, at: 5000 },
    });

    const data = await loadLibraryData(driver);

    expect(data.series).toEqual([
      {
        seriesId: "s1",
        moduleId: "mod-a",
        title: "Serie Uno",
        kind: "manhwa",
        nsfw: false,
        status: "hiatus",
        folderId: "7",
        addedAt: 1000,
        lastReadAt: 5000,
        progress: { chapterId: "c9", chapterTitle: "Capítulo 9", pageIndex: 4, pageTotal: 20 },
      },
    ]);
  });

  it("sin tipo ni estado ni progreso conserva los huecos sin inventar valores", async () => {
    await addSeries(driver, {
      id: "s2",
      title: "Sin datos",
      kind: null,
      status: null,
      addedAt: 20,
    });

    const [serie] = (await loadLibraryData(driver)).series;

    expect(serie).toMatchObject({
      kind: null,
      status: "unknown",
      folderId: null,
      progress: null,
      lastReadAt: 20,
    });
  });

  it("un progreso sin total de páginas queda con total 0 y sin título usa el capítulo", async () => {
    await addSeries(driver, {
      id: "s3",
      title: "Tres",
      addedAt: 1,
      progress: { chapterId: "c1", title: null, page: 0, total: null, at: 2 },
    });

    const [serie] = (await loadLibraryData(driver)).series;

    expect(serie?.progress).toEqual({
      chapterId: "c1",
      chapterTitle: "c1",
      pageIndex: 0,
      pageTotal: 0,
    });
  });

  it("incluye las series NSFW (la pantalla las oculta con su filtro, RF-35)", async () => {
    await addSeries(driver, { id: "a", title: "A", addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", nsfw: true, addedAt: 2 });

    const data = await loadLibraryData(driver);

    expect(data.series.map((s) => [s.seriesId, s.nsfw])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });

  it("carpetas: Gemas (vista de todo) primero, Favoritos (del sistema) y las del usuario en su orden manual", async () => {
    await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (11, 'Segunda', 2, 1)");
    await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (12, 'Primera', 1, 1)");
    await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (13, 'Vacía', 3, 1)");
    await addSeries(driver, { id: "a", title: "A", folderId: 12, addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", folderId: 12, addedAt: 2 });
    await addSeries(driver, { id: "c", title: "C", folderId: 11, addedAt: 3 });
    await addSeries(driver, { id: "d", title: "D", addedAt: 4 });

    const { folders } = await loadLibraryData(driver);

    expect(folders).toEqual([
      { id: GEMS_FOLDER_ID, name: "Gemas", count: 4, kind: "gems" },
      { id: "1", name: "Favoritos", count: 0, kind: "favorites" },
      { id: "12", name: "Primera", count: 2 },
      { id: "11", name: "Segunda", count: 1 },
      { id: "13", name: "Vacía", count: 0 },
    ]);
  });

  it("etiquetas (F53): las de cada serie, las de cada carpeta y la lista para elegir; el recuento sigue la carpeta inteligente", async () => {
    await addSeries(driver, { id: "a", title: "A", addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", addedAt: 2 });
    await new SeriesStore({ driver, clock: reloj }).setTags("mod-a", "a", ["Seinen", "Acción"]);
    await new SeriesStore({ driver, clock: reloj }).setTags("mod-a", "b", ["Isekai"]);
    const carpetas = new Folders({ driver, clock: reloj });
    const id = await carpetas.create("Mis seinen", 5, ["Seinen"]);

    const data = await loadLibraryData(driver);

    expect(data.tags).toEqual(["Acción", "Isekai", "Seinen"]);
    expect(data.series.find((s) => s.seriesId === "a")?.tags).toEqual(["Acción", "Seinen"]);
    expect(data.folders.find((f) => f.id === String(id))).toEqual({
      id: String(id),
      name: "Mis seinen",
      count: 1,
      tags: ["Seinen"],
    });
  });

  it("en un primer arranque ya hay dos carpetas: Gemas y Favoritos (F52)", async () => {
    const { folders } = await loadLibraryData(driver);

    expect(folders.map((f) => f.name)).toEqual(["Gemas", "Favoritos"]);
  });

  it("las fuentes son los módulos distintos de las series, por nombre de módulo", async () => {
    await addSeries(driver, { id: "a", title: "A", moduleId: "zeta", addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", moduleId: "alfa", addedAt: 2 });
    await addSeries(driver, { id: "c", title: "C", moduleId: "alfa", addedAt: 3 });

    const { sources } = await loadLibraryData(driver);

    expect(sources).toEqual([
      { id: "alfa", name: "alfa" },
      { id: "zeta", name: "zeta" },
    ]);
  });

  it("el nombre visible de la fuente sale de ModuleRegistry; sin módulo instalado, su id (F57)", async () => {
    await addSeries(driver, { id: "a", title: "A", moduleId: "zeta", addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", moduleId: "alfa", addedAt: 2 });
    await new SqliteStorage(driver).set(
      "module:alfa",
      JSON.stringify({ id: "alfa", manifest: { name: "Alfa Scans" } }),
    );

    const { sources } = await loadLibraryData(driver);

    expect(sources).toEqual([
      { id: "alfa", name: "Alfa Scans" },
      { id: "zeta", name: "zeta" },
    ]);
  });

  it("cada serie lleva su portada con las cabeceras guardadas, o sin portada (F47)", async () => {
    await addSeries(driver, { id: "a", title: "A", addedAt: 1 });
    await addSeries(driver, { id: "b", title: "B", addedAt: 2 });
    await driver.run("UPDATE series SET cover_url = ?, cover_headers = ? WHERE series_id = 'a'", [
      "https://x.test/a.jpg",
      JSON.stringify({ Cookie: "s=1" }),
    ]);

    const { series } = await loadLibraryData(driver);

    expect(series.find((s) => s.seriesId === "a")?.cover).toEqual({
      uri: "https://x.test/a.jpg",
      headers: { Cookie: "s=1" },
    });
    expect(series.find((s) => s.seriesId === "b")?.cover).toBeUndefined();
  });

  it("recorre todas las páginas del cursor, sin repetir ni saltar series", async () => {
    for (let i = 1; i <= 7; i += 1) {
      await addSeries(driver, { id: `s${i}`, title: `Serie ${i}`, addedAt: i });
    }

    const { series } = await loadLibraryData(driver, { pageSize: 3 });

    expect(series.map((s) => s.seriesId)).toEqual(["s1", "s2", "s3", "s4", "s5", "s6", "s7"]);
  });
});
