import { describe, expect, it } from "vitest";

import type { Host, ModuleApi, ModuleManifest } from "../../src/contract/types";
import { MemoryClearanceStore } from "../../src/host/challenge";
import { ModuleError } from "../../src/contract/errors";
import { moduleKey, type InstalledPackage } from "../../src/install/PackageInstaller";
import { createInstalledMounter } from "../../src/modules/installedMounter";
import { FakeScriptLoader, StubHttp } from "../../src/ports/fakes";
import { SqliteStorage } from "../../src/storage/SqliteStorage";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F25 — montador de módulos instalados compartido por móvil y web: lee el
 * paquete del registro, monta la `ModuleApi` con el runtime que pide el
 * manifest (declarativo o script) y pasa al cargador el paquete completo (R1).
 * Sin `loader`, un módulo script es UNSUPPORTED (caso del dispositivo, T40).
 */

const MANIFEST: ModuleManifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  runtime: "script",
  entry: "module.js",
  baseUrl: "https://sitio.test/",
  permissions: { domains: ["sitio.test"] },
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
} as ModuleManifest;

const PACKAGE = {
  "module.js": "export default function create(host) { return globalThis.__api; }",
  "bin/util.js": "export const x = 1;",
};

function installedPackage(overrides: Partial<InstalledPackage> = {}): InstalledPackage {
  return {
    id: "ejemplo",
    version: "1.0.0",
    repoUrl: "https://repo.test/",
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    permissions: { domains: ["sitio.test"] },
    manifest: MANIFEST,
    files: Object.entries(PACKAGE).map(([path, text]) => ({
      path,
      hex: Buffer.from(text, "utf8").toString("hex"),
    })),
    installedAt: 1_000,
    enabled: true,
    ...overrides,
  };
}

const api: ModuleApi = {
  search: async (query) => ({ items: [{ id: query, title: "Serie" }], hasNext: false }),
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

describe("createInstalledMounter", () => {
  it("monta un módulo script instalado pasando el paquete completo al loader (R1)", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    const loader = new FakeScriptLoader({ "module.js": () => api });
    const mounter = createInstalledMounter({ driver, http: new StubHttp(), loader });

    const mounted = await mounter.mount("ejemplo");
    expect(mounted.manifest.id).toBe("ejemplo");
    expect(loader.loaded).toEqual(["module.js"]);
    expect(loader.loadedFiles[0]).toEqual(PACKAGE);
    await expect(mounted.handle.api.search("dragon", 1)).resolves.toMatchObject({
      items: [{ id: "dragon" }],
    });
  });

  it("sin loader, un módulo script es UNSUPPORTED (caso del dispositivo hasta T40)", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    const mounter = createInstalledMounter({ driver, http: new StubHttp() });

    const error = await mounter.mount("ejemplo").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("UNSUPPORTED");
  });

  it("un módulo desactivado o ausente da NOT_FOUND", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage({ enabled: false })));
    const mounter = createInstalledMounter({ driver, http: new StubHttp() });

    const error = await mounter.mount("ejemplo").catch((e: unknown) => e);
    expect((error as ModuleError).code).toBe("NOT_FOUND");
    await expect(mounter.mount("ausente")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("tras actualizar el paquete (mismo id), el siguiente mount ejecuta la versión nueva", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    const v1: ModuleApi = { ...api, details: async () => { throw new Error("v1"); } };
    let current = v1;
    const loader = new FakeScriptLoader({ "module.js": () => current });
    const mounter = createInstalledMounter({ driver, http: new StubHttp(), loader });

    const first = await mounter.mount("ejemplo");
    expect(await mounter.mount("ejemplo")).toBe(first);
    current = api;
    const manifest = { ...MANIFEST, version: "1.0.1" };
    await storage.set(
      moduleKey("ejemplo"),
      JSON.stringify(installedPackage({ version: "1.0.1", manifest })),
    );

    const second = await mounter.mount("ejemplo");
    expect(second.manifest.version).toBe("1.0.1");
    await expect(second.handle.api.details("x")).resolves.toMatchObject({ id: "x" });
  });

  it("tras desinstalar o desactivar un módulo ya montado, mount da NOT_FOUND", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    const loader = new FakeScriptLoader({ "module.js": () => api });
    const mounter = createInstalledMounter({ driver, http: new StubHttp(), loader });
    await mounter.mount("ejemplo");

    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage({ enabled: false })));
    await expect(mounter.mount("ejemplo")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    await mounter.mount("ejemplo");
    await storage.delete(moduleKey("ejemplo"));
    await expect(mounter.mount("ejemplo")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("aplica la pausa entre peticiones que declara el manifest (G6)", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    const manifest = { ...MANIFEST, network: { minDelayMs: 600 } };
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage({ manifest })));
    let host: Host | undefined;
    const loader = new FakeScriptLoader({
      "module.js": (h) => {
        host = h;
        return api;
      },
    });
    const mounter = createInstalledMounter({ driver, http: new StubHttp(), loader });

    await mounter.mount("ejemplo");
    const startedAt = Date.now();
    await host?.fetch("https://sitio.test/a");
    await host?.fetch("https://sitio.test/b");
    // Con el defecto del host (250 ms) serían ~250 ms.
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(550);
  });

  it("pasa las verificaciones guardadas al host del módulo (F100)", async () => {
    const driver = await openMigratedDriver();
    const storage = new SqliteStorage(driver);
    await storage.set(moduleKey("ejemplo"), JSON.stringify(installedPackage()));
    const clearances = new MemoryClearanceStore();
    await clearances.set("sitio.test", {
      cfClearance: "tok",
      userAgent: "UA-wv",
      expiresAt: Number.MAX_SAFE_INTEGER,
    });
    let host: Host | undefined;
    const loader = new FakeScriptLoader({
      "module.js": (h) => {
        host = h;
        return api;
      },
    });
    const http = new StubHttp();
    const mounter = createInstalledMounter({ driver, http, loader, clearances });

    await mounter.mount("ejemplo");
    await host?.fetch("https://sitio.test/lista");
    expect(http.requests[0]?.init?.headers).toEqual({
      "User-Agent": "UA-wv",
      Cookie: "cf_clearance=tok",
    });
  });
});
