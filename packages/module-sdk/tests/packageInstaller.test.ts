import { describe, expect, it } from "vitest";

import {
  FakeArchive,
  FixedClock,
  MemoryStorage,
  ModuleError,
  PackageInstaller,
  moduleKey,
  utf8Encode,
  type InstallRequest,
} from "@ryuunest/core";

import { validateManifest } from "../src/index";

/**
 * Integración de T13: el validador real de manifest (T09) enlazado con el instalador de
 * paquetes del núcleo. En el núcleo el validador entra **inyectado** (P-46).
 */

const REPO_URL = "https://repo.example.com/index.json";

const PACKAGE_BYTES = utf8Encode("abc");
/** SHA-256 de "abc" (vector de prueba conocido). */
const PACKAGE_SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

const manifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

function makeInstaller(manifestValue: unknown): {
  installer: PackageInstaller;
  storage: MemoryStorage;
  request: InstallRequest;
} {
  const storage = new MemoryStorage();
  const installer = new PackageInstaller({
    http: {
      request: async () => ({
        status: 200,
        headers: {},
        text: async () => "",
        bytes: async () => PACKAGE_BYTES,
      }),
    },
    archive: new FakeArchive([
      { path: "manifest.json", data: utf8Encode(JSON.stringify(manifestValue)) },
      { path: "index.js", data: utf8Encode("console.log(1)") },
    ]),
    storage,
    clock: new FixedClock(1_000),
    validateManifest,
  });

  return {
    installer,
    storage,
    request: {
      repoUrl: REPO_URL,
      package: "packages/ejemplo-1.0.0.zip",
      sha256: PACKAGE_SHA,
      size: 3,
    },
  };
}

describe("T13 · PackageInstaller con el validador real (T09)", () => {
  it("instala un paquete con manifest válido y lo guarda", async () => {
    const { installer, storage, request } = makeInstaller(manifest);

    const installed = await installer.install(request);

    expect(installed.id).toBe("ejemplo");
    expect(installed.files.map((file) => file.path)).toEqual(["index.js", "manifest.json"]);
    expect(await storage.get(moduleKey("ejemplo"))).toBeDefined();
  });

  it("rechaza un manifest inválido con la ruta y el motivo", async () => {
    const { installer, storage, request } = makeInstaller({ ...manifest, apiVersion: 2 });

    const error = await installer.install(request).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).message).toContain("apiVersion");
    expect((error as ModuleError).message).toContain("Debe ser 1");
    expect(await storage.keys()).toEqual([]);
  });
});
