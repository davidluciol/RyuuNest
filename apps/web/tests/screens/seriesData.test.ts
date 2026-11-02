import { describe, expect, it } from "vitest";

import {
  ChapterReadStore,
  ModuleError,
  ProgressStore,
  SeriesPrefs,
  createInstalledMounter,
  FakeScriptLoader,
  StubHttp,
  type ModuleApi,
} from "@ryuunest/core";
import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";

import {
  loadSeries,
  toggleFavorite,
  setPreferredRelease,
  chapterStateOf,
  type WebSeriesData,
} from "../../src/screens/series/seriesData";

/**
 * F25 — datos de la ficha de serie en web: `details()` del módulo montado en
 * el worker + progreso/leídos/preferencias/favorito sobre la base real
 * (sql.js + IndexedDB). Sin datos de ejemplo.
 */

const details = {
  id: "s-1",
  title: "Dragón de prueba",
  cover: "https://sitio.test/cover.png",
  kind: "manga",
  nsfw: false,
  description: "Una serie de prueba.",
  genres: ["Aventura"],
  status: "ongoing",
  altTitles: [],
  extra: {},
  releases: [{ id: "r-oficial", group: "Oficial" }],
  chapters: [
    {
      id: "ch-1",
      title: "Cap. 1",
      number: 1,
      date: null,
      read: false,
      releases: [{ id: "r-oficial", group: "Oficial" }],
    },
    {
      id: "ch-2",
      title: "Cap. 2",
      number: 2,
      date: null,
      read: false,
      releases: [{ id: "r-oficial", group: "Oficial" }],
    },
  ],
} as never;

const api: ModuleApi = {
  search: async () => ({ items: [], hasNext: false }),
  details: async () => details,
  pages: async () => ({ images: [] }),
};

function pkg(overrides: Record<string, unknown> = {}) {
  return {
    id: "demo",
    version: "1.0.0",
    repoUrl: "https://repo.test/",
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    permissions: { domains: ["sitio.test"] },
    manifest: {
      id: "demo",
      name: "Demo",
      version: "1.0.0",
      apiVersion: 1,
      runtime: "script",
      entry: "module.js",
      baseUrl: "https://sitio.test/",
      capabilities: ["search"],
      permissions: { domains: ["sitio.test"] },
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
    },
    files: [
      { path: "module.js", hex: Buffer.from("export default () => api", "utf8").toString("hex") },
    ],
    installedAt: 1_000,
    enabled: true,
    ...overrides,
  };
}

async function setup() {
  const driver = await openMigratedDriver();
  const { SqliteStorage, moduleKey } = await import("@ryuunest/core");
  const storage = new SqliteStorage(driver);
  await storage.set(moduleKey("demo"), JSON.stringify(pkg()));
  const loader = new FakeScriptLoader({ "module.js": () => api });
  const mounter = createInstalledMounter({ driver, http: new StubHttp(), loader });
  const services = { driver, mounter, reporter: null };
  return { driver, services };
}

describe("seriesData web (ficha sobre base real)", () => {
  it("loadSeries une details() del módulo con progreso, leídos y preferencias", async () => {
    const { driver, services } = await setup();
    const clock = { now: () => 1_000 };
    await new ProgressStore({ driver, clock }).save({
      moduleId: "demo",
      seriesId: "s-1",
      chapterId: "ch-2",
      releaseId: "r-oficial",
      pageIndex: 3,
      pageTotal: 10,
    });
    await new ChapterReadStore({ driver, clock }).markRead({
      moduleId: "demo",
      seriesId: "s-1",
      chapterId: "ch-1",
    });
    await new SeriesPrefs({ driver, clock }).setPreferredGroup("demo", "s-1", "r-oficial");

    const data: WebSeriesData = await loadSeries(services, "demo", "s-1");
    expect(data.details.title).toBe("Dragón de prueba");
    expect(data.moduleName).toBe("Demo");
    expect(data.progress).toEqual({ chapterId: "ch-2", pageIndex: 3, pageTotal: 10 });
    expect([...data.readChapterIds]).toEqual(["ch-1"]);
    expect(data.preferredReleaseId).toBe("r-oficial");
    expect(data.favorite).toBe(false);
    expect(chapterStateOf("ch-1", data)).toBe("completed");
    expect(chapterStateOf("ch-2", data)).toBe("in-progress");
  });

  it("toggleFavorite y setPreferredRelease persisten en la base", async () => {
    const { driver, services } = await setup();
    expect(await toggleFavorite(services, "demo", "s-1")).toBe(true);
    expect(await toggleFavorite(services, "demo", "s-1")).toBe(false);
    await setPreferredRelease(services, "demo", "s-1", "r-oficial");
    const again = await loadSeries(services, "demo", "s-1");
    expect(again.preferredReleaseId).toBe("r-oficial");
    expect(driver).toBeDefined();
  });

  it("un módulo que falla da el error contenido (RF-11)", async () => {
    const { services } = await setup();
    const badLoader = new FakeScriptLoader({
      "module.js": () => {
        throw new ModuleError("NETWORK", "sin red");
      },
    });
    const { driver } = await setup();
    void driver;
    const badServices = {
      driver: services.driver,
      mounter: createInstalledMounter({
        driver: services.driver,
        http: new StubHttp(),
        loader: badLoader,
      }),
      reporter: null,
    };
    // El ModuleError del módulo se propaga con su código (NETWORK), contenido.
    await expect(loadSeries(badServices, "demo", "s-1")).rejects.toMatchObject({ code: "NETWORK" });
  });
});
