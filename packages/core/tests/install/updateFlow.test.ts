import { describe, expect, it } from "vitest";

import { utf8Encode } from "../../src/bytes";
import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { RepoIndex } from "../../src/contract/repoIndex";
import type { ModuleManifest } from "../../src/contract/types";
import { InstallFlow } from "../../src/install/InstallFlow";
import { PackageInstaller, type ManifestValidator } from "../../src/install/PackageInstaller";
import { ModuleRegistry } from "../../src/modules/ModuleRegistry";
import type { Archive, ArchiveEntry } from "../../src/ports/archive";
import { FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import { RepoRegistry, type RepoIndexValidator } from "../../src/repo/RepoRegistry";

/**
 * F16 (RF-6) — actualizar un módulo instalado desde el índice de su repo:
 * previsualizar sin tocar nada y aplicar solo con la confirmación que pida el
 * registro (permisos ampliados o paso de declarativo a script).
 *
 * Hashes de vectores SHA-256 conocidos: "abc" (v1) y "a" (v2).
 */

const REPO_URL = "https://repo.example.com/index.json";
const V1_BYTES = utf8Encode("abc");
const V1_SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const V2_BYTES = utf8Encode("a");
const V2_SHA = "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb";

function manifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: "ejemplo",
    name: "Ejemplo",
    version: "1.0.0",
    apiVersion: 1,
    runtime: "declarative",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    baseUrl: "https://ejemplo.com",
    capabilities: ["search"],
    permissions: { domains: ["ejemplo.com"] },
    entry: "index.json",
    ...overrides,
  };
}

function indexWith(
  overrides: Partial<ModuleManifest>,
  pkg: { path: string; sha256: string; size: number },
): RepoIndex {
  const next = manifest(overrides);
  return {
    format: "ryuunest-repo",
    version: 1,
    name: "Repo de ejemplo",
    updatedAt: "2026-10-05T00:00:00Z",
    modules: [
      {
        id: next.id,
        name: next.name,
        version: next.version,
        apiVersion: 1,
        runtime: next.runtime,
        kinds: next.kinds,
        lang: next.lang,
        nsfw: next.nsfw,
        permissions: next.permissions,
        package: pkg.path,
        sha256: pkg.sha256,
        size: pkg.size,
      },
    ],
  };
}

const acceptIndex: RepoIndexValidator = (value) => ({ ok: true, value: value as RepoIndex });
const acceptManifest: ManifestValidator = (value) => ({ ok: true, value: value as ModuleManifest });

/** Archivo falso cuyo contenido cambia con la versión servida. */
class SwitchableArchive implements Archive {
  entries: ArchiveEntry[] = [];
  async unzip(): Promise<ArchiveEntry[]> {
    return this.entries;
  }
}

function entriesFor(next: ModuleManifest): ArchiveEntry[] {
  return [
    { path: "manifest.json", data: utf8Encode(JSON.stringify(next)) },
    { path: next.entry, data: utf8Encode("{}") },
  ];
}

async function setup() {
  const storage = new MemoryStorage();
  const routes: Record<string, { body?: string; bodyBytes?: Uint8Array }> = {};
  const http = new StubHttp(routes);
  const archive = new SwitchableArchive();
  const clock = new FixedClock(1_000);

  const repos = new RepoRegistry({ storage, http, clock, validateIndex: acceptIndex });
  const installer = new PackageInstaller({
    http,
    storage,
    clock,
    archive,
    validateManifest: acceptManifest,
  });
  const modules = new ModuleRegistry({ storage });
  const flow = new InstallFlow({ repos, installer, modules });

  /** Publica en el repo una versión del módulo (índice + paquete). */
  function publish(overrides: Partial<ModuleManifest>, bytes: Uint8Array, sha256: string): void {
    routes[REPO_URL] = {
      body: JSON.stringify(
        indexWith(overrides, { path: "packages/ejemplo.zip", sha256, size: bytes.length }),
      ),
    };
    routes["https://repo.example.com/packages/ejemplo.zip"] = { bodyBytes: bytes };
    archive.entries = entriesFor(manifest(overrides));
  }

  publish({}, V1_BYTES, V1_SHA);
  const repo = await repos.addRepo(REPO_URL);
  await flow.install(repo.id, "ejemplo", { confirmed: true });

  return { storage, http, repos, modules, flow, repo, publish, archive };
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
  expect((error as ModuleError).code).toBe(code);
  return error as ModuleError;
}

describe("InstallFlow · previewUpdate (RF-6)", () => {
  it("sin versión nueva en el índice dice que no hay actualización", async () => {
    const app = await setup();

    const preview = await app.flow.previewUpdate("ejemplo");

    expect(preview).toMatchObject({ available: false, currentVersion: "1.0.0" });
  });

  it("con versión nueva sin cambios sensibles no exige confirmación", async () => {
    const app = await setup();
    app.publish({ version: "1.1.0" }, V2_BYTES, V2_SHA);
    await app.repos.addRepo(REPO_URL);

    const preview = await app.flow.previewUpdate("ejemplo");

    expect(preview).toMatchObject({
      available: true,
      currentVersion: "1.0.0",
      nextVersion: "1.1.0",
      reasons: [],
      needsConfirmation: false,
      reinforced: false,
    });
  });

  it("avisa de los permisos ampliados antes de descargar nada", async () => {
    const app = await setup();
    app.publish(
      { version: "1.1.0", permissions: { domains: ["ejemplo.com", "cdn.ejemplo.com"] } },
      V2_BYTES,
      V2_SHA,
    );
    await app.repos.addRepo(REPO_URL);
    const requests = app.http.requests.length;

    const preview = await app.flow.previewUpdate("ejemplo");

    expect(preview).toMatchObject({ available: true, needsConfirmation: true });
    expect(preview.reasons.join(" ")).toContain("cdn.ejemplo.com");
    expect(app.http.requests).toHaveLength(requests);
  });

  it("el paso de declarativo a script pide confirmación reforzada", async () => {
    const app = await setup();
    app.publish({ version: "2.0.0", runtime: "script", entry: "index.js" }, V2_BYTES, V2_SHA);
    await app.repos.addRepo(REPO_URL);

    const preview = await app.flow.previewUpdate("ejemplo");

    expect(preview).toMatchObject({ needsConfirmation: true, reinforced: true });
  });

  it("un módulo no instalado lanza NOT_FOUND", async () => {
    const app = await setup();

    await captureError(app.flow.previewUpdate("nada"), "NOT_FOUND");
  });

  it("si el repo ya no lista el módulo lanza NOT_FOUND", async () => {
    const app = await setup();
    await app.repos.removeRepo(app.repo.id);

    await captureError(app.flow.previewUpdate("ejemplo"), "NOT_FOUND");
  });
});

describe("InstallFlow · applyUpdate (RF-6)", () => {
  it("aplica una actualización sin cambios sensibles conservando el estado", async () => {
    const app = await setup();
    await app.modules.setEnabled("ejemplo", false);
    app.publish({ version: "1.1.0" }, V2_BYTES, V2_SHA);
    await app.repos.addRepo(REPO_URL);

    const result = await app.flow.applyUpdate("ejemplo", {});

    expect(result.status).toBe("updated");
    const stored = await app.modules.get("ejemplo");
    expect(stored).toMatchObject({ version: "1.1.0", enabled: false, installedAt: 1_000 });
  });

  it("con permisos ampliados no aplica nada hasta confirmar (RF-6)", async () => {
    const app = await setup();
    app.publish(
      { version: "1.1.0", permissions: { domains: ["ejemplo.com", "cdn.ejemplo.com"] } },
      V2_BYTES,
      V2_SHA,
    );
    await app.repos.addRepo(REPO_URL);

    const result = await app.flow.applyUpdate("ejemplo", {});

    expect(result.status).toBe("needs-confirmation");
    expect((await app.modules.get("ejemplo"))?.version).toBe("1.0.0");

    const confirmed = await app.flow.applyUpdate("ejemplo", { confirmed: true });

    expect(confirmed.status).toBe("updated");
    expect((await app.modules.get("ejemplo"))?.permissions.domains).toContain("cdn.ejemplo.com");
  });

  it("pasar a script exige además la confirmación reforzada", async () => {
    const app = await setup();
    app.publish({ version: "2.0.0", runtime: "script", entry: "index.js" }, V2_BYTES, V2_SHA);
    await app.repos.addRepo(REPO_URL);

    const error = await captureError(
      app.flow.applyUpdate("ejemplo", { confirmed: true }),
      "UNSUPPORTED",
    );

    expect(error.message).toContain("reforzada");
    expect((await app.modules.get("ejemplo"))?.runtime).toBe("declarative");

    const result = await app.flow.applyUpdate("ejemplo", { confirmed: true, reinforced: true });

    expect(result.status).toBe("updated");
    expect((await app.modules.get("ejemplo"))?.runtime).toBe("script");
  });

  it("un hash incorrecto no deja nada a medias", async () => {
    const app = await setup();
    app.publish({ version: "1.1.0" }, V2_BYTES, "0".repeat(64));
    await app.repos.addRepo(REPO_URL);

    await captureError(app.flow.applyUpdate("ejemplo", {}), "PARSE");

    expect((await app.modules.get("ejemplo"))?.version).toBe("1.0.0");
  });

  it("rechaza un paquete cuyo manifest trae otro id", async () => {
    const app = await setup();
    app.publish({ version: "1.1.0" }, V2_BYTES, V2_SHA);
    await app.repos.addRepo(REPO_URL);
    // El índice dice «ejemplo» pero el paquete se presenta como otro módulo.
    app.archive.entries = entriesFor(manifest({ id: "otro", version: "1.1.0" }));

    await captureError(app.flow.applyUpdate("ejemplo", { confirmed: true }), "PARSE");

    expect((await app.modules.get("ejemplo"))?.version).toBe("1.0.0");
    expect(await app.modules.get("otro")).toBeUndefined();
  });

  it("sin versión nueva lanza UNSUPPORTED", async () => {
    const app = await setup();

    await captureError(app.flow.applyUpdate("ejemplo", {}), "UNSUPPORTED");
  });
});
