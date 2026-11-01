import { describe, expect, it } from "vitest";

import { FakeScriptLoader, StubHttp, type ModuleApi } from "@ryuunest/core";
import { moduleKey, type InstalledPackage } from "@ryuunest/core";
import { createInstalledDiscoverSource } from "@ryuunest/mobile-src/screens/discover/discoverData";
import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";

/**
 * F25 — la fuente de Descubrir sobre módulos instalados, en la web con loader
 * (P-115): los módulos `script` también se listan y se montan con él; sin
 * loader quedan fuera (comportamiento del dispositivo, D-5).
 */

function scriptPackage(): InstalledPackage {
  return {
    id: "zonatmo",
    version: "0.2.0",
    repoUrl: "https://repo.test/",
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    permissions: { domains: ["sitio.test"] },
    manifest: {
      id: "zonatmo",
      name: "ZonaTMO",
      version: "0.2.0",
      apiVersion: 1,
      runtime: "script",
      entry: "module.js",
      baseUrl: "https://sitio.test/",
      capabilities: ["search", "popular"],
      permissions: { domains: ["sitio.test"] },
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
    },
    files: [
      {
        path: "module.js",
        hex: Buffer.from("export default function create(host) { return api; }", "utf8").toString("hex"),
      },
    ],
    installedAt: 1_000,
    enabled: true,
  } as InstalledPackage;
}

describe("createInstalledDiscoverSource (web, con loader)", () => {
  it("lista el módulo script y lo monta con el loader al cargar", async () => {
    const driver = await openMigratedDriver();
    const { SqliteStorage } = await import("@ryuunest/core");
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("zonatmo"), JSON.stringify(scriptPackage()));

    const api: ModuleApi = {
      search: async (query) => ({ items: [{ id: `s-${query}`, title: "Serie" }], hasNext: false }),
      popular: async () => ({ items: [{ id: "pop-1", title: "Popular" }], hasNext: false }),
      details: async (id) => ({
        id,
        title: "Serie",
        genres: [],
        status: "unknown",
        altTitles: [],
        extra: {},
        chapters: [],
      }),
      pages: async () => ({ images: [] }),
    };
    const loader = new FakeScriptLoader({ "module.js": () => api });
    const source = createInstalledDiscoverSource({ driver, http: new StubHttp(), loader });

    const modules = await source.listModules();
    expect(modules.map((m) => m.id)).toEqual(["zonatmo"]);
    expect(modules[0]?.hasPopular).toBe(true);

    const result = await source.load({ moduleId: "zonatmo", query: "dragon", page: 1 });
    expect(result.catalog.entries).toEqual([
      expect.objectContaining({ seriesId: "s-dragon", title: "Serie" }),
    ]);
    expect(result.popular).toEqual([expect.objectContaining({ seriesId: "pop-1" })]);
    expect(loader.loaded).toEqual(["module.js"]);
  });

  it("sin loader, el módulo script no se lista (dispositivo hasta T40)", async () => {
    const driver = await openMigratedDriver();
    const { SqliteStorage } = await import("@ryuunest/core");
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("zonatmo"), JSON.stringify(scriptPackage()));

    const source = createInstalledDiscoverSource({ driver, http: new StubHttp() });
    expect(await source.listModules()).toEqual([]);
  });

  it("recuerda el último módulo en la tabla setting (RF-9)", async () => {
    const driver = await openMigratedDriver();
    const source = createInstalledDiscoverSource({ driver, http: new StubHttp() });
    expect(await source.recallLastModule()).toBe(null);
    await source.rememberLastModule("zonatmo");
    expect(await source.recallLastModule()).toBe("zonatmo");
  });
});
