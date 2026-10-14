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

  it("valida cada módulo con la ruta indexada", () => {
    const bad = { ...validIndex, modules: [validEntry, { ...validEntry, id: "MAYÚSCULAS" }] };
    expect(pathsOf(validateRepoIndex(bad))).toContain("modules[1].id");
  });

  it("valida package, sha256 y size", () => {
    expect(
      pathsOf(validateRepoIndex({ ...validIndex, modules: [{ ...validEntry, package: "" }] })),
    ).toContain("modules[0].package");
    expect(
      pathsOf(validateRepoIndex({ ...validIndex, modules: [{ ...validEntry, sha256: "abc" }] })),
    ).toContain("modules[0].sha256");
    expect(
      pathsOf(validateRepoIndex({ ...validIndex, modules: [{ ...validEntry, size: -1 }] })),
    ).toContain("modules[0].size");
  });

  it("rechaza un índice que no es objeto", () => {
    expect(pathsOf(validateRepoIndex(42))).toEqual([""]);
  });
});
