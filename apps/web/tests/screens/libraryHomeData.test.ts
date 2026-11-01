import { describe, expect, it } from "vitest";

import { Favorites } from "@ryuunest/core";
import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";

import { loadLibraryWeb, loadHomeWeb } from "../../src/screens/library/libraryData";

/**
 * F25 — Biblioteca e Inicio web sobre la base real (sin datos de ejemplo):
 * favoritos con progreso vía `browseLibrary` (cursor) y carpetas vía `Folders`.
 */

async function seed(driver: Awaited<ReturnType<typeof openMigratedDriver>>) {
  const { SeriesStore, ProgressStore } = await import("@ryuunest/core");
  const clock = { now: () => 1_000 };
  const series = new SeriesStore({ driver, clock });
  const favorites = new Favorites({ driver, clock });
  const progress = new ProgressStore({ driver, clock });

  await series.upsert({
    moduleId: "demo",
    seriesId: "s-1",
    title: "Dragón de prueba",
    coverUrl: "https://sitio.test/c.png",
    kind: "manga",
    nsfw: false,
    status: "ongoing",
  });
  await series.upsert({
    moduleId: "demo",
    seriesId: "s-2",
    title: "Otra serie",
    coverUrl: undefined,
    kind: undefined,
    nsfw: true,
    status: "unknown",
  });
  await favorites.add("demo", "s-1", null);
  await favorites.add("demo", "s-2", null);
  await progress.save({
    moduleId: "demo",
    seriesId: "s-1",
    chapterId: "ch-2",
    releaseId: "r-1",
    chapterTitle: "Cap. 2",
    pageIndex: 3,
    pageTotal: 10,
  });
}

describe("loadLibraryWeb / loadHomeWeb", () => {
  it("la biblioteca lista favoritos con portada y progreso, NSFW incluido para filtrar en pantalla", async () => {
    const driver = await openMigratedDriver();
    await seed(driver);

    const data = await loadLibraryWeb(driver);
    expect(data.entries).toHaveLength(2);
    const dragon = data.entries.find((e) => e.seriesId === "s-1");
    expect(dragon?.coverUrl).toBe("https://sitio.test/c.png");
    expect(dragon?.progress).toMatchObject({ chapterId: "ch-2", pageIndex: 3, pageTotal: 10 });
    // El núcleo devuelve NSFW también; la pantalla lo oculta si el ajuste está apagado.
    expect(data.entries.find((e) => e.seriesId === "s-2")?.nsfw).toBe(true);
  });

  it("Inicio: «continuar» = series con progreso; vacío real si no hay favoritos", async () => {
    const driver = await openMigratedDriver();
    const empty = await loadHomeWeb(driver);
    expect(empty.continueReading).toEqual([]);
    expect(empty.isEmpty).toBe(true);

    await seed(driver);
    const home = await loadHomeWeb(driver);
    expect(home.continueReading.map((e) => e.seriesId)).toEqual(["s-1"]);
    expect(home.isEmpty).toBe(false);
  });
});
