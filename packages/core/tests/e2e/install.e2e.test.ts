import { describe, expect, it } from "vitest";

import { utf8Encode } from "../../src/bytes";
import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { RepoIndex } from "../../src/contract/repoIndex";
import type { ModuleManifest } from "../../src/contract/types";
import { InstallFlow } from "../../src/install/InstallFlow";
import { PackageInstaller, type ManifestValidator } from "../../src/install/PackageInstaller";
import { ModuleRegistry } from "../../src/modules/ModuleRegistry";
import type { ArchiveEntry } from "../../src/ports/archive";
import { FakeArchive, FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import { RepoRegistry, type RepoIndexValidator } from "../../src/repo/RepoRegistry";

/**
 * E2E del corte vertical 1 (SPEC §7.1, AC-2 y AC-8): añadir un repo fixture, previsualizar
 * el módulo, confirmar e instalarlo, y ver que queda **activo**.
 *
 * El validador de manifest vive en `module-sdk` (no se puede importar desde el núcleo,
 * P-37); aquí se inyecta uno de mentira. Sus mensajes reales se prueban en `module-sdk`.
 */

const REPO_URL = "https://repo.example.com/index.json";
const PACKAGE_PATH = "packages/ejemplo-1.0.0.zip";
const PACKAGE_URL = "https://repo.example.com/packages/ejemplo-1.0.0.zip";

const PACKAGE_BYTES = utf8Encode("abc");
/** SHA-256 de "abc" (vector de prueba conocido). */
const PACKAGE_SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

const MODULE_ENTRY = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1 as const,
  runtime: "script" as const,
  kinds: ["manga" as const],
  lang: "es",
  nsfw: false,
  permissions: { domains: ["ejemplo.com"] },
  package: PACKAGE_PATH,
  sha256: PACKAGE_SHA,
  size: PACKAGE_BYTES.length,
};

const INDEX: RepoIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Repo de ejemplo",
  updatedAt: "2026-10-05T00:00:00Z",
  modules: [MODULE_ENTRY],
};

const MANIFEST = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1 as const,
  runtime: "script" as const,
  kinds: ["manga" as const],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular" as const],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

const acceptIndex: RepoIndexValidator = (value) => ({ ok: true, value: value as RepoIndex });
const acceptManifest: ManifestValidator = (value) => ({
  ok: true,
  value: value as ModuleManifest,
});

function defaultEntries(): ArchiveEntry[] {
  return [
    { path: "manifest.json", data: utf8Encode(JSON.stringify(MANIFEST)) },
    { path: "index.js", data: utf8Encode("console.log(1)") },
  ];
}

function makeApp(
  overrides: {
    index?: unknown;
    manifestValidator?: ManifestValidator;
    entries?: ArchiveEntry[];
  } = {},
): {
  storage: MemoryStorage;
  http: StubHttp;
  repos: RepoRegistry;
  modules: ModuleRegistry;
  flow: InstallFlow;
} {
  const storage = new MemoryStorage();
  const http = new StubHttp({
    [REPO_URL]: { body: JSON.stringify(overrides.index ?? INDEX) },
    [PACKAGE_URL]: { bodyBytes: PACKAGE_BYTES },
  });

  const repos = new RepoRegistry({
    storage,
    http,
    clock: new FixedClock(1_000),
    validateIndex: acceptIndex,
  });
  const installer = new PackageInstaller({
    http,
    storage,
    clock: new FixedClock(1_000),
    archive: new FakeArchive(overrides.entries ?? defaultEntries()),
    validateManifest: overrides.manifestValidator ?? acceptManifest,
    appVersion: "1.0.0",
  });
  const modules = new ModuleRegistry({ storage });

  return { storage, http, repos, modules, flow: new InstallFlow({ repos, installer, modules }) };
}

async function captureError(
  promise: Promise<unknown>,
  code: ModuleErrorCode,
): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(error).toBeInstanceOf(ModuleError);
  const moduleError = error as ModuleError;
  expect(moduleError.code).toBe(code);
  return moduleError;
}

describe("E2E · repo → previsualizar → confirmar → módulo activo (AC-2, AC-8)", () => {
  it("instala un módulo del repo y lo deja activo", async () => {
    const app = makeApp();
    const repo = await app.repos.addRepo(REPO_URL);

    const preview = await app.flow.preview(repo.id, "ejemplo");
    expect(preview).toMatchObject({
      id: "ejemplo",
      name: "Ejemplo",
      runtime: "script",
      reinforced: true,
      permissions: { domains: ["ejemplo.com"] },
    });

    const installed = await app.flow.install(repo.id, "ejemplo", {
      confirmed: true,
      reinforced: true,
    });

    expect(installed.id).toBe("ejemplo");
    expect(installed.files.map((file) => file.path)).toEqual(["index.js", "manifest.json"]);
    const module = await app.modules.get("ejemplo");
    expect(module?.enabled).toBe(true);
    expect(module?.version).toBe("1.0.0");
  });

  it("sin confirmación no descarga ni instala nada (AC-8)", async () => {
    const app = makeApp();
    const repo = await app.repos.addRepo(REPO_URL);
    const requestsAfterRepo = app.http.requests.length;

    const error = await captureError(
      app.flow.install(repo.id, "ejemplo", { confirmed: false }),
      "UNSUPPORTED",
    );

    expect(error.message).toContain("confirmación");
    expect(app.http.requests).toHaveLength(requestsAfterRepo);
    expect(await app.modules.list()).toEqual([]);
  });

  it("un módulo script exige confirmación reforzada (SPEC §7.1, paso 3)", async () => {
    const app = makeApp();
    const repo = await app.repos.addRepo(REPO_URL);

    const error = await captureError(
      app.flow.install(repo.id, "ejemplo", { confirmed: true }),
      "UNSUPPORTED",
    );

    expect(error.message).toContain("reforzada");
    expect(await app.modules.list()).toEqual([]);
  });

  it("un módulo ya instalado no se pisa sin pasar por la actualización (RF-6)", async () => {
    const app = makeApp();
    const repo = await app.repos.addRepo(REPO_URL);
    await app.flow.install(repo.id, "ejemplo", { confirmed: true, reinforced: true });

    const error = await captureError(
      app.flow.install(repo.id, "ejemplo", { confirmed: true, reinforced: true }),
      "UNSUPPORTED",
    );

    expect(error.message).toContain("actualiza");
    expect(await app.modules.list()).toHaveLength(1);
  });

  it("previsualizar un módulo que no está en el repo lanza NOT_FOUND", async () => {
    const app = makeApp();
    const repo = await app.repos.addRepo(REPO_URL);

    await captureError(app.flow.preview(repo.id, "nada"), "NOT_FOUND");
  });
});

describe("E2E · rechazos con mensaje claro (AC-2)", () => {
  it("rechaza un hash incorrecto y no deja el módulo instalado", async () => {
    const app = makeApp({
      index: { ...INDEX, modules: [{ ...MODULE_ENTRY, sha256: "0".repeat(64) }] },
    });
    const repo = await app.repos.addRepo(REPO_URL);

    const error = await captureError(
      app.flow.install(repo.id, "ejemplo", { confirmed: true, reinforced: true }),
      "PARSE",
    );

    expect(error.message).toContain("hash");
    expect(await app.modules.list()).toEqual([]);
  });

  it("rechaza un manifest inválido con la ruta y el motivo", async () => {
    const app = makeApp({
      manifestValidator: () => ({
        ok: false,
        issues: [{ path: "apiVersion", message: "Debe ser 1" }],
      }),
    });
    const repo = await app.repos.addRepo(REPO_URL);

    const error = await captureError(
      app.flow.install(repo.id, "ejemplo", { confirmed: true, reinforced: true }),
      "PARSE",
    );

    expect(error.message).toContain("apiVersion");
    expect(await app.modules.list()).toEqual([]);
  });
});
