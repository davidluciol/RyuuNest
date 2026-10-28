import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ChapterReadStore,
  ModuleError,
  ProgressStore,
  type ModuleApi,
  type ModuleManifest,
  type SeriesDetails,
} from "@ryuunest/core";

import {
  openMigratedDriver,
  type NodeSqliteDriver,
} from "../../../../packages/core/tests/support/nodeSqliteDriver";
import type { ModuleMounter } from "../../src/data/moduleMounter";
import {
  createReadingSource,
  createSampleReadingSource,
} from "../../src/screens/reader/readingSource";

/**
 * F18/F19 — la ficha y el lector leen de un módulo (`details`, `pages`) y de los almacenes del
 * núcleo (progreso, leídos). SQLite real y un módulo mínimo en el borde del contrato
 * `ModuleApi`; la versión de la web se prueba contra el sitio falso de `test-site`.
 */

let driver: NodeSqliteDriver;
const clock = { now: () => 5_000 };

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

const DETAILS: SeriesDetails = {
  id: "serie-1",
  title: "La serie",
  kind: "manhwa",
  nsfw: false,
  badges: [],
  genres: ["Fantasía"],
  status: "ongoing",
  altTitles: [],
  extra: {},
  chapters: [
    { id: "ch-2", title: "Dos", number: 2, releases: [{ id: "r-1", group: "Equipo" }] },
    { id: "ch-1", title: "Uno", number: 1, releases: [{ id: "r-1", group: "Equipo" }] },
  ],
};

function mounterFor(api: Partial<ModuleApi>): ModuleMounter {
  const manifest = { id: "m-a", name: "Módulo A" } as ModuleManifest;
  return {
    async mount() {
      return { manifest, handle: { api: api as ModuleApi, lastError: () => undefined } };
    },
  };
}

describe("createReadingSource · loadSeries", () => {
  it("devuelve la ficha del módulo sin progreso ni leídos cuando aún no se ha leído nada", async () => {
    const source = createReadingSource({ driver, mounter: mounterFor({ details: async () => DETAILS }) });

    const view = await source.loadSeries("m-a", "serie-1");

    expect(view.details.title).toBe("La serie");
    expect(view.details.chapters.map((chapter) => chapter.id)).toEqual(["ch-2", "ch-1"]);
    expect(view.moduleName).toBe("Módulo A");
    expect(view.progress).toBeNull();
    expect([...view.readChapterIds]).toEqual([]);
    expect(view.preferredReleaseId).toBeNull();
  });

  it("refleja el progreso guardado y los capítulos leídos", async () => {
    await new ProgressStore({ driver, clock }).save({
      moduleId: "m-a",
      seriesId: "serie-1",
      chapterId: "ch-2",
      pageIndex: 3,
      pageTotal: 12,
    });
    await new ChapterReadStore({ driver, clock }).markRead({
      moduleId: "m-a",
      seriesId: "serie-1",
      chapterId: "ch-1",
    });
    const source = createReadingSource({ driver, mounter: mounterFor({ details: async () => DETAILS }) });

    const view = await source.loadSeries("m-a", "serie-1");

    expect(view.progress).toEqual({ chapterId: "ch-2", pageIndex: 3, pageTotal: 12 });
    expect([...view.readChapterIds]).toEqual(["ch-1"]);
  });

  it("un fallo del módulo llega tal cual, con su código", async () => {
    const source = createReadingSource({
      driver,
      mounter: mounterFor({
        details: async () => {
          throw new ModuleError("NETWORK", "sin red");
        },
      }),
    });

    await expect(source.loadSeries("m-a", "serie-1")).rejects.toMatchObject({ code: "NETWORK" });
  });
});

describe("createReadingSource · loadPages", () => {
  it("devuelve las imágenes con las cabeceras que indica el módulo (RF-24)", async () => {
    const headers = { Referer: "https://sitio.test/lector", "User-Agent": "RyuuNest/0.0" };
    const source = createReadingSource({
      driver,
      mounter: mounterFor({
        pages: async (chapterId, releaseId) => ({
          title: `${chapterId}/${releaseId}`,
          images: [
            { url: "https://sitio.test/img/1.jpg", headers },
            { url: "https://sitio.test/img/2.jpg" },
          ],
        }),
      }),
    });

    const pages = await source.loadPages("m-a", "ch-2", "r-1");

    expect(pages.title).toBe("ch-2/r-1");
    expect(pages.images).toEqual([
      { url: "https://sitio.test/img/1.jpg", headers },
      { url: "https://sitio.test/img/2.jpg" },
    ]);
  });

  it("un capítulo sin imágenes es un error del módulo, no un lector vacío", async () => {
    const source = createReadingSource({
      driver,
      mounter: mounterFor({ pages: async () => ({ images: [] }) }),
    });

    await expect(source.loadPages("m-a", "ch-2", "r-1")).rejects.toMatchObject({ code: "PARSE" });
  });
});

describe("createSampleReadingSource (web)", () => {
  it("sirve la ficha de ejemplo desde el sitio falso, con el progreso de ejemplo", async () => {
    const source = createSampleReadingSource();

    const view = await source.loadSeries("m-ejemplo-a", "dragon-de-ceniza");

    expect(view.details.title).toBe("El dragón de ceniza");
    expect(view.details.chapters.map((chapter) => chapter.id)).toEqual(["ch-1", "ch-2", "ch-3"]);
    expect(view.progress).toEqual({ chapterId: "ch-2", pageIndex: 2, pageTotal: 4 });
    expect([...view.readChapterIds]).toEqual(["ch-1"]);
    expect(view.coverSource).toBeDefined();
  });

  it("sus páginas usan imágenes locales: nada se pide a un dominio externo (RNF-5)", async () => {
    const source = createSampleReadingSource();

    const pages = await source.loadPages("m-ejemplo-a", "ch-2", "r-oficial");

    expect(pages.images).toHaveLength(4);
    for (const image of pages.images) expect(image.asset).toBeDefined();
  });

  it("guarda el progreso en la sesión: una segunda lectura lo ve", async () => {
    const source = createSampleReadingSource();
    await new ProgressStore({ driver: source.driver, clock }).save({
      moduleId: "m-ejemplo-a",
      seriesId: "dragon-de-ceniza",
      chapterId: "ch-3",
      pageIndex: 1,
      pageTotal: 2,
    });

    const view = await source.loadSeries("m-ejemplo-a", "dragon-de-ceniza");

    expect(view.progress).toEqual({ chapterId: "ch-3", pageIndex: 1, pageTotal: 2 });
  });
});
