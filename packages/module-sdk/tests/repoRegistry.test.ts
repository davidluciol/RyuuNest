import { describe, expect, it } from "vitest";

import { FixedClock, MemoryStorage, ModuleError, RepoRegistry, StubHttp } from "@ryuunest/core";

import { validateRepoIndex } from "../src/index";

/**
 * Integración de T12: el validador real de `index.json` (T09) enlazado con el registro
 * de repos del núcleo. En el núcleo el validador entra **inyectado** (P-37), así que
 * aquí —donde están las dos piezas— se comprueba que encajan y que un índice inválido
 * se rechaza con la ruta y el motivo.
 */

const REPO_URL = "https://repo.example.com/index.json";

const validIndex = {
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
      runtime: "declarative",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
      permissions: { domains: ["ejemplo.com"] },
      package: "packages/ejemplo-1.0.0.zip",
      sha256: "b".repeat(64),
      size: 2048,
    },
  ],
};

function makeRegistry(body: string): RepoRegistry {
  return new RepoRegistry({
    storage: new MemoryStorage(),
    http: new StubHttp({ [REPO_URL]: { body } }),
    clock: new FixedClock(1_000),
    validateIndex: validateRepoIndex,
  });
}

async function captureError(promise: Promise<unknown>): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ModuleError);
  return error as ModuleError;
}

describe("T12 · RepoRegistry con el validador real (T09)", () => {
  it("acepta un índice válido y lista sus módulos con metadatos", async () => {
    const registry = makeRegistry(JSON.stringify(validIndex));

    const repo = await registry.addRepo(REPO_URL);
    const modules = await registry.listModules(repo.id);

    expect(repo.name).toBe("Mi repo");
    expect(modules).toHaveLength(1);
    expect(modules[0]).toMatchObject({ id: "ejemplo", runtime: "declarative", size: 2048 });
  });

  it("rechaza un índice inválido con la ruta y el motivo", async () => {
    const registry = makeRegistry(JSON.stringify({ ...validIndex, version: 2 }));

    const error = await captureError(registry.addRepo(REPO_URL));

    expect(error.code).toBe("PARSE");
    expect(error.message).toContain("version");
    expect(error.message).toContain("Debe ser 1");
  });
});
