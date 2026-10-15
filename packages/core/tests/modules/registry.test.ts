import { describe, expect, it } from "vitest";

import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { InstalledPackage } from "../../src/install/PackageInstaller";
import { moduleKey } from "../../src/install/PackageInstaller";
import { MemoryStorage } from "../../src/ports/fakes";
import type { Storage } from "../../src/ports/storage";
import { ModuleRegistry } from "../../src/modules/ModuleRegistry";
/**
 * Ciclo de vida de los módulos instalados (SPEC §3.1, RF-5 y RF-6).
 *
 * El registro lee y escribe la fila `module:<id>` que dejó el instalador (T13).
 */

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

function makePackage(overrides: Partial<InstalledPackage> = {}): InstalledPackage {
  const id = overrides.id ?? "ejemplo";
  return {
    id,
    version: "1.0.0",
    repoUrl: "https://repo.example.com/index.json",
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    permissions: { domains: ["ejemplo.com"] },
    manifest: { ...MANIFEST, id },
    files: [{ path: "index.js", hex: "636f6e736f6c65" }],
    installedAt: 1_000,
    enabled: true,
    ...overrides,
  };
}

async function seed(storage: Storage, pkg: InstalledPackage): Promise<void> {
  await storage.set(moduleKey(pkg.id), JSON.stringify(pkg));
}

function makeRegistry(options: { storage?: MemoryStorage } = {}): {
  registry: ModuleRegistry;
  storage: MemoryStorage;
} {
  const storage = options.storage ?? new MemoryStorage();
  return { registry: new ModuleRegistry({ storage }), storage };
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

describe("ModuleRegistry · listar y consultar (RF-5)", () => {
  it("lista los módulos ordenados por id", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage({ id: "zeta" }));
    await seed(storage, makePackage({ id: "alfa" }));

    expect((await registry.list()).map((module) => module.id)).toEqual(["alfa", "zeta"]);
  });

  it("devuelve undefined si el módulo no está instalado", async () => {
    const { registry } = makeRegistry();

    expect(await registry.get("nada")).toBeUndefined();
  });
});

describe("ModuleRegistry · activar y desactivar (RF-5)", () => {
  it("cambia el estado sin reinstalar: los archivos no se tocan", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    const disabled = await registry.setEnabled("ejemplo", false);
    const enabled = await registry.setEnabled("ejemplo", true);

    expect(disabled.enabled).toBe(false);
    expect(enabled.enabled).toBe(true);
    expect(enabled.files).toEqual(makePackage().files);
    expect(enabled.installedAt).toBe(1_000);
  });

  it("lanza NOT_FOUND si el módulo no existe", async () => {
    const { registry } = makeRegistry();

    await captureError(registry.setEnabled("nada", false), "NOT_FOUND");
  });
});

describe("ModuleRegistry · último error (RF-5, RNF-8)", () => {
  it("guarda y consulta el último error", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    await registry.setLastError("ejemplo", "TIMEOUT al pedir el capítulo 3");

    expect((await registry.get("ejemplo"))?.lastError).toBe("TIMEOUT al pedir el capítulo 3");
  });

  it("borrar el error lo quita del registro", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage({ lastError: "viejo" }));

    const cleared = await registry.setLastError("ejemplo", undefined);

    expect(cleared.lastError).toBeUndefined();
  });
});

describe("ModuleRegistry · desinstalar (RF-5)", () => {
  it("elimina el registro y sus archivos de forma consistente", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    await registry.uninstall("ejemplo");

    expect(await registry.get("ejemplo")).toBeUndefined();
    expect(await storage.keys("module:")).toEqual([]);
  });

  it("no toca otros módulos", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage({ id: "ejemplo" }));
    await seed(storage, makePackage({ id: "otro" }));

    await registry.uninstall("ejemplo");

    expect((await registry.list()).map((module) => module.id)).toEqual(["otro"]);
  });

  it("no falla si el módulo no está instalado", async () => {
    const { registry } = makeRegistry();

    await expect(registry.uninstall("nada")).resolves.toBeUndefined();
  });
});

describe("ModuleRegistry · actualizar (RF-6)", () => {
  it("actualiza sin pedir confirmación si no cambian permisos ni runtime", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    const result = await registry.update(makePackage({ version: "2.0.0" }));

    expect(result).toEqual({
      status: "updated",
      module: expect.objectContaining({ version: "2.0.0" }),
    });
    expect((await registry.get("ejemplo"))?.version).toBe("2.0.0");
  });

  it("pide confirmación si se amplían los permisos y no aplica nada", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    const result = await registry.update(
      makePackage({
        version: "2.0.0",
        permissions: { domains: ["ejemplo.com", "cdn.example.com"] },
      }),
    );

    expect(result.status).toBe("needs-confirmation");
    if (result.status === "needs-confirmation") {
      expect(result.reasons.join(" ")).toContain("cdn.example.com");
    }
    expect((await registry.get("ejemplo"))?.version).toBe("1.0.0");
  });

  it("pide confirmación si pasa de declarativo a script", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage({ runtime: "declarative" }));

    const result = await registry.update(makePackage({ runtime: "script" }));

    expect(result.status).toBe("needs-confirmation");
    if (result.status === "needs-confirmation") {
      expect(result.reasons.join(" ")).toContain("script");
    }
  });

  it("con confirmación explícita, aplica la actualización", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage());

    const result = await registry.update(
      makePackage({
        version: "2.0.0",
        permissions: { domains: ["ejemplo.com", "cdn.example.com"] },
      }),
      { confirmed: true },
    );

    expect(result.status).toBe("updated");
    expect((await registry.get("ejemplo"))?.permissions.domains).toContain("cdn.example.com");
  });

  it("no pide confirmación si se reducen permisos o se pasa de script a declarativo", async () => {
    const { registry, storage } = makeRegistry();
    await seed(
      storage,
      makePackage({ runtime: "script", permissions: { domains: ["a.com", "b.com"] } }),
    );

    const result = await registry.update(
      makePackage({ runtime: "declarative", permissions: { domains: ["a.com"] } }),
    );

    expect(result.status).toBe("updated");
  });

  it("conserva el estado de activación y limpia el último error", async () => {
    const { registry, storage } = makeRegistry();
    await seed(storage, makePackage({ enabled: false, lastError: "viejo" }));

    await registry.update(makePackage({ version: "2.0.0" }));

    const module = await registry.get("ejemplo");
    expect(module?.enabled).toBe(false);
    expect(module?.lastError).toBeUndefined();
  });

  it("lanza NOT_FOUND si el módulo no está instalado", async () => {
    const { registry } = makeRegistry();

    await captureError(registry.update(makePackage()), "NOT_FOUND");
  });
});
