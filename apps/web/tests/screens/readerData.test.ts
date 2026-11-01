import { describe, expect, it } from "vitest";

import {
  ProgressStore,
  createInstalledMounter,
  FakeScriptLoader,
  StubHttp,
  type ModuleApi,
} from "@ryuunest/core";
import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";

import { bootReader, type ReaderTarget } from "../../src/screens/reader/readerData";

/**
 * F25 — arranque del lector web (puro): monta el módulo (worker en producción),
 * carga `details` + `pages`, abre el `ReaderController` sobre la base real y
 * reabre en la página guardada (RF-20). Sin datos de ejemplo.
 */

const details = {
  id: "s-1",
  title: "Dragón de prueba",
  genres: [],
  status: "ongoing",
  altTitles: [],
  extra: {},
  chapters: [
    { id: "ch-2", title: "Cap. 2", number: 2, releases: [{ id: "r-1", group: "Oficial" }] },
    { id: "ch-1", title: "Cap. 1", number: 1, releases: [{ id: "r-1", group: "Oficial" }] },
  ],
} as never;

const api: ModuleApi = {
  search: async () => ({ items: [], hasNext: false }),
  details: async () => details,
  pages: async (chapterId) => ({
    images: [
      { url: `https://sitio.test/${chapterId}/1.png` },
      { url: `https://sitio.test/${chapterId}/2.png`, headers: { Referer: "https://sitio.test/" } },
      { url: `https://sitio.test/${chapterId}/3.png` },
    ],
  }),
};

function pkg() {
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
    files: [{ path: "module.js", hex: Buffer.from("x", "utf8").toString("hex") }],
    installedAt: 1_000,
    enabled: true,
  };
}

async function setup() {
  const driver = await openMigratedDriver();
  const { SqliteStorage, moduleKey } = await import("@ryuunest/core");
  await new SqliteStorage(driver).set(moduleKey("demo"), JSON.stringify(pkg()));
  const mounter = createInstalledMounter({
    driver,
    http: new StubHttp(),
    loader: new FakeScriptLoader({ "module.js": () => api }),
  });
  return { driver, services: { driver, mounter, reporter: null } };
}

const target: ReaderTarget = { moduleId: "demo", seriesId: "s-1", chapterId: "ch-1" };

describe("bootReader (web)", () => {
  it("carga páginas del capítulo, ordena capítulos en orden de lectura y abre el controlador", async () => {
    const { services } = await setup();
    const boot = await bootReader(services, target);

    expect(boot.seriesTitle).toBe("Dragón de prueba");
    expect(boot.chapters.map((c) => c.id)).toEqual(["ch-1", "ch-2"]); // orden de lectura
    expect(boot.images).toHaveLength(3);
    expect(boot.images[1]?.headers?.Referer).toBe("https://sitio.test/");
    expect(boot.controller.snapshot.chapter?.chapterId).toBe("ch-1");
    expect(boot.controller.snapshot.pageTotal).toBe(3);
    expect(boot.controller.snapshot.nextChapter?.chapterId).toBe("ch-2");
  });

  it("reabre en la página guardada si el capítulo quedó a medias (RF-20)", async () => {
    const { driver, services } = await setup();
    await new ProgressStore({ driver, clock: { now: () => 1 } }).save({
      moduleId: "demo",
      seriesId: "s-1",
      chapterId: "ch-1",
      releaseId: "r-1",
      pageIndex: 1,
      pageTotal: 3,
    });

    const boot = await bootReader(services, target);
    expect(boot.controller.snapshot.pageIndex).toBe(1);
  });

  it("capítulo desconocido → NOT_FOUND contenido", async () => {
    const { services } = await setup();
    await expect(
      bootReader(services, { moduleId: "demo", seriesId: "s-1", chapterId: "ch-99" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
