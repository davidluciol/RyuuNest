import { describe, expect, it } from "vitest";

import type { ModuleApi, ModuleManifest } from "../../src/contract/types";
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
    files: Object.entries(PACKAGE).map(([path, text]) => ({ path, hex: Buffer.from(text, "utf8").toString("hex") })),
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
    await storage.set(
      moduleKey("ejemplo"),
      JSON.stringify(installedPackage({ enabled: false })),
    );
    const mounter = createInstalledMounter({ driver, http: new StubHttp() });

    const error = await mounter.mount("ejemplo").catch((e: unknown) => e);
    expect((error as ModuleError).code).toBe("NOT_FOUND");
    await expect(mounter.mount("ausente")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
