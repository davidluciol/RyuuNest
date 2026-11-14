import { describe, expect, it } from "vitest";

import { validateRepoIndex, type ValidationResult } from "../src/index";

const validEntry = {
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
};

const validIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Mi repo",
  updatedAt: "2026-10-05T00:00:00Z",
  modules: [validEntry],
};

function pathsOf(result: ValidationResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.path);
}

describe("índice de repo · válido", () => {
  it("acepta un índice válido y devuelve su valor", () => {
    const result = validateRepoIndex(validIndex);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.modules).toHaveLength(1);
    }
  });

  it("acepta una lista de módulos vacía", () => {
    expect(validateRepoIndex({ ...validIndex, modules: [] }).ok).toBe(true);
  });
});

describe("índice de repo · inválido", () => {
  it("exige el formato y la versión del índice", () => {
    expect(pathsOf(validateRepoIndex({ ...validIndex, format: "otro" }))).toContain("format");
    expect(pathsOf(validateRepoIndex({ ...validIndex, version: 2 }))).toContain("version");
  });

  it("exige name, updatedAt ISO y modules en forma de lista", () => {
    expect(pathsOf(validateRepoIndex({ ...validIndex, name: "" }))).toContain("name");
    expect(pathsOf(validateRepoIndex({ ...validIndex, updatedAt: "ayer" }))).toContain("updatedAt");
    expect(pathsOf(validateRepoIndex({ ...validIndex, modules: "no" }))).toContain("modules");
  });

  it("descarta la entrada rota con aviso (ruta indexada) y conserva el resto", () => {
    const bad = { ...validIndex, modules: [validEntry, { ...validEntry, id: "MAYÚSCULAS" }] };
    const result = validateRepoIndex(bad);

    expect(result.ok && result.value.modules).toHaveLength(1);
    expect(result.ok && result.value.warnings?.[0]).toContain("modules[1].id");
  });

  it("valida package, sha256 y size de cada entrada", () => {
    for (const [field, value] of [["package", ""], ["sha256", "abc"], ["size", -1]] as const) {
      const result = validateRepoIndex({
        ...validIndex,
        modules: [{ ...validEntry, [field]: value }],
      });
      expect(result.ok && result.value.warnings?.[0]).toContain(`modules[0].${field}`);
    }
  });

  it("rechaza un índice que no es objeto", () => {
    expect(pathsOf(validateRepoIndex(42))).toEqual([""]);
  });
});

describe("índice de repo · tolerancia por entrada (T38, R3)", () => {
  const v2 = { ...validEntry, id: "futuro", name: "Futuro", apiVersion: 2 };

  function valueOf(index: unknown, options = {}) {
    const result = validateRepoIndex(index, options);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("índice rechazado");
    return result.value;
  }

  it("un módulo con apiVersion 2 no invalida los de v1: queda «no compatible»", () => {
    const value = valueOf({ ...validIndex, modules: [validEntry, v2] });

    expect(value.modules.map((m) => m.id)).toEqual(["ejemplo"]);
    expect(value.incompatible).toEqual([
      { id: "futuro", name: "Futuro", reason: expect.stringContaining("apiVersion") },
    ]);
  });

  it("runtime o kinds desconocidos también son «no compatible»", () => {
    const value = valueOf({
      ...validIndex,
      modules: [
        { ...validEntry, id: "a", runtime: "wasm" },
        { ...validEntry, id: "b", kinds: ["manga", "novela"] },
      ],
    });

    expect(value.modules).toEqual([]);
    expect(value.incompatible?.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("una entrada rota se descarta con aviso y el resto sigue", () => {
    const value = valueOf({
      ...validIndex,
      modules: [{ ...validEntry, sha256: "abc" }, "no soy objeto", validEntry],
    });

    expect(value.modules).toHaveLength(1);
    expect(value.warnings).toHaveLength(2);
    expect(value.warnings?.[0]).toContain("modules[0].sha256");
  });

  it("acepta `minAppVersion` en la entrada y la oculta si la app es más vieja", () => {
    const entry = { ...validEntry, minAppVersion: "1.2.0" };

    expect(valueOf({ ...validIndex, modules: [entry] }).modules[0]?.minAppVersion).toBe("1.2.0");
    expect(valueOf({ ...validIndex, modules: [entry] }, { appVersion: "1.2.0" }).modules).toHaveLength(1);

    const old = valueOf({ ...validIndex, modules: [entry] }, { appVersion: "1.0.0" });
    expect(old.modules).toEqual([]);
    expect(old.incompatible?.[0]?.reason).toContain("1.2.0");
  });

  it("un `minAppVersion` que no es semver es una entrada rota", () => {
    const value = valueOf({ ...validIndex, modules: [{ ...validEntry, minAppVersion: "uno" }] });

    expect(value.modules).toEqual([]);
    expect(value.warnings?.[0]).toContain("minAppVersion");
  });

  it("los errores de la cabecera siguen invalidando el índice", () => {
    expect(pathsOf(validateRepoIndex({ ...validIndex, version: 2, modules: [v2] }))).toContain(
      "version",
    );
  });
});
