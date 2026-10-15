import { describe, expect, it } from "vitest";

import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { RepoIndex } from "../../src/contract/repoIndex";
import { FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import { RepoRegistry, type RepoIndexValidator } from "../../src/repo/RepoRegistry";
import type { ValidationResult } from "../../src/validation";

/**
 * Dominio de repositorios (SPEC §3.1, RF-2, RF-3 y RF-8).
 *
 * El validador de `index.json` vive en `module-sdk` (SPEC §5.1) y el núcleo no puede
 * importarlo (P-37), así que entra **inyectado** (`RepoIndexValidator`). Aquí se prueba
 * la costura: el registro rechaza, persiste y lista. La calidad de los mensajes del
 * validador real se prueba en `module-sdk`.
 */

const REPO_URL = "https://repo.example.com/index.json";
const OTHER_URL = "https://otro.example.com/index.json";

const VALID_INDEX: RepoIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Mi repo",
  updatedAt: "2026-10-05T00:00:00Z",
  modules: [
    {
      id: "ejemplo",
      name: "Ejemplo",
      version: "1.0.0",
      apiVersion: 1,
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
      permissions: { domains: ["ejemplo.com"] },
      package: "packages/ejemplo-1.0.0.zip",
      sha256: "a".repeat(64),
      size: 12345,
    },
  ],
};

/** Validador de mentira: acepta el índice salvo que la prueba pida rechazarlo. */
function fakeValidator(reject?: { path: string; message: string }): RepoIndexValidator {
  return (value) => {
    if (reject !== undefined) {
      const rejected: ValidationResult<RepoIndex> = { ok: false, issues: [reject] };
      return rejected;
    }
    return { ok: true, value: value as RepoIndex };
  };
}

function makeRegistry(
  options: {
    storage?: MemoryStorage;
    http?: StubHttp;
    clock?: FixedClock;
    validateIndex?: RepoIndexValidator;
  } = {},
): {
  registry: RepoRegistry;
  storage: MemoryStorage;
  http: StubHttp;
  clock: FixedClock;
} {
  const storage = options.storage ?? new MemoryStorage();
  const http =
    options.http ??
    new StubHttp({
      [REPO_URL]: { body: JSON.stringify(VALID_INDEX) },
      [OTHER_URL]: { body: JSON.stringify({ ...VALID_INDEX, name: "Otro" }) },
    });
  const clock = options.clock ?? new FixedClock(1_000);
  const registry = new RepoRegistry({
    storage,
    http,
    clock,
    validateIndex: options.validateIndex ?? fakeValidator(),
  });

  return { registry, storage, http, clock };
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

describe("RepoRegistry · añadir (RF-2, RF-3)", () => {
  it("persiste un repo válido y sus módulos quedan listables", async () => {
    const { registry, storage } = makeRegistry();

    const repo = await registry.addRepo(REPO_URL);

    expect(repo.url).toBe(REPO_URL);
    expect(repo.name).toBe("Mi repo");
    expect(repo.addedAt).toBe(1_000);
    expect(await registry.listRepos()).toEqual([repo]);
    expect(await storage.keys("repo:")).toHaveLength(1);

    const modules = await registry.listModules(repo.id);
    expect(modules).toHaveLength(1);
    const first = modules[0];
    expect(first).toMatchObject({
      repoId: repo.id,
      id: "ejemplo",
      name: "Ejemplo",
      version: "1.0.0",
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
      permissions: { domains: ["ejemplo.com"] },
    });
  });

  it("usa la URL como identificador del repo", async () => {
    const { registry } = makeRegistry();

    const repo = await registry.addRepo(REPO_URL);

    expect(repo.id).toBe(REPO_URL);
    expect(await registry.getRepo(REPO_URL)).toEqual(repo);
  });

  it("rechaza una URL que no es HTTPS sin llamar a la red", async () => {
    const { registry, http } = makeRegistry();

    const error = await captureError(
      registry.addRepo("http://repo.example.com/index.json"),
      "UNSUPPORTED",
    );

    expect(error.message).toContain("HTTPS");
    expect(http.requests).toHaveLength(0);
    expect(await registry.listRepos()).toEqual([]);
  });

  it("rechaza algo que no es una URL", async () => {
    const { registry, http } = makeRegistry();

    await captureError(registry.addRepo("esto no es una url"), "UNSUPPORTED");

    expect(http.requests).toHaveLength(0);
  });

  it("rechaza un index.json inválido con un mensaje claro y sin persistir", async () => {
    const { registry, storage } = makeRegistry({
      validateIndex: fakeValidator({ path: "version", message: "Debe ser 1" }),
    });

    const error = await captureError(registry.addRepo(REPO_URL), "PARSE");

    expect(error.message).toContain("version");
    expect(error.message).toContain("Debe ser 1");
    expect(await storage.keys()).toEqual([]);
  });

  it("rechaza un index.json que no es JSON", async () => {
    const { registry } = makeRegistry({ http: new StubHttp({ [REPO_URL]: { body: "{no json" } }) });

    const error = await captureError(registry.addRepo(REPO_URL), "PARSE");

    expect(error.message.toLowerCase()).toContain("json");
  });

  it("rechaza una respuesta no encontrada con el estado en los detalles", async () => {
    const { registry } = makeRegistry({ http: new StubHttp({}) });

    const error = await captureError(registry.addRepo(REPO_URL), "NOT_FOUND");

    expect(error.details?.status).toBe(404);
    expect(error.details?.url).toBe(REPO_URL);
  });

  it("no duplica un repo ya añadido y conserva su fecha de alta", async () => {
    const { registry, clock } = makeRegistry();

    const first = await registry.addRepo(REPO_URL);
    clock.set(5_000);
    const second = await registry.addRepo(REPO_URL);

    expect(await registry.listRepos()).toHaveLength(1);
    expect(second.addedAt).toBe(first.addedAt);
    expect(second.updatedAt).toBe(5_000);
  });
});

describe("RepoRegistry · listar (RF-3)", () => {
  it("lista los repos ordenados por fecha de alta", async () => {
    const { registry, clock } = makeRegistry();

    clock.set(2_000);
    await registry.addRepo(OTHER_URL);
    clock.set(1_000);
    await registry.addRepo(REPO_URL);

    expect((await registry.listRepos()).map((repo) => repo.url)).toEqual([REPO_URL, OTHER_URL]);
  });

  it("sin repoId, lista los módulos de todos los repos", async () => {
    const { registry } = makeRegistry();

    await registry.addRepo(REPO_URL);
    await registry.addRepo(OTHER_URL);

    const modules = await registry.listModules();
    expect(modules).toHaveLength(2);
    expect(new Set(modules.map((module) => module.repoId))).toEqual(new Set([REPO_URL, OTHER_URL]));
  });
});

describe("RepoRegistry · eliminar (RF-8)", () => {
  it("elimina el repo y su índice sin tocar otras claves del almacén", async () => {
    const { registry, storage } = makeRegistry();

    const repo = await registry.addRepo(REPO_URL);
    // Simula la fila de un módulo instalado (la guardará T14): no debe tocarse.
    await storage.set("installed:ejemplo", JSON.stringify({ id: "ejemplo", repoId: repo.id }));

    await registry.removeRepo(repo.id);

    expect(await registry.listRepos()).toEqual([]);
    expect(await registry.getRepo(repo.id)).toBeUndefined();
    expect(await registry.listModules(repo.id)).toEqual([]);
    expect(await storage.keys("repoIndex:")).toEqual([]);
    expect(await storage.get("installed:ejemplo")).toBeDefined();
  });

  it("no falla al eliminar un repo que no existe", async () => {
    const { registry } = makeRegistry();

    await expect(
      registry.removeRepo("https://nada.example.com/index.json"),
    ).resolves.toBeUndefined();
  });
});
