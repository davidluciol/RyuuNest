import { describe, expect, it } from "vitest";

import { validateManifest, type ValidationIssue, type ValidationResult } from "../src/index";

const validManifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "declarative",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular", "search"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.json",
};

function expectInvalid(result: ValidationResult<unknown>): ValidationIssue[] {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("se esperaba un manifest inválido");
  }
  return result.issues;
}

function pathsOf(result: ValidationResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.path);
}

describe("manifest · válido", () => {
  it("acepta un manifest válido y devuelve su valor", () => {
    const result = validateManifest(validManifest);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(validManifest);
    }
  });

  it("acepta campos opcionales", () => {
    const result = validateManifest({
      ...validManifest,
      minAppVersion: "1.0.0",
      author: "Alguien",
      homepage: "https://ejemplo.com",
      license: "MIT",
    });

    expect(result.ok).toBe(true);
  });

  it("acepta `details` y `pages` en capabilities (P-82: la forma de zonatmo)", () => {
    const result = validateManifest({
      ...validManifest,
      capabilities: ["popular", "latest", "search", "details", "pages"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.capabilities).toEqual(["popular", "latest", "search", "details", "pages"]);
    }
  });

  it("acepta un manifest que solo declara `details` y `pages`", () => {
    expect(
      validateManifest({ ...validManifest, capabilities: ["details", "pages"] }).ok,
    ).toBe(true);
  });
});

describe("manifest · inválido", () => {
  it("rechaza un valor que no es objeto (ruta raíz)", () => {
    expect(pathsOf(validateManifest(null))).toEqual([""]);
    expect(pathsOf(validateManifest("no soy un manifest"))).toEqual([""]);
  });

  it("valida el id con [a-z0-9-]", () => {
    expect(expectInvalid(validateManifest({ ...validManifest, id: "Ejemplo" }))[0]?.path).toBe(
      "id",
    );
    expect(expectInvalid(validateManifest({ ...validManifest, id: "con espacio" }))[0]?.path).toBe(
      "id",
    );
  });

  it("exige los campos obligatorios con su ruta", () => {
    const { name: _name, ...withoutName } = validManifest;
    expect(pathsOf(validateManifest(withoutName))).toContain("name");

    const { permissions: _permissions, ...withoutPermissions } = validManifest;
    expect(pathsOf(validateManifest(withoutPermissions))).toContain("permissions");
  });

  it("exige apiVersion 1", () => {
    expect(expectInvalid(validateManifest({ ...validManifest, apiVersion: 2 }))[0]?.path).toBe(
      "apiVersion",
    );
  });

  it("valida runtime, lang, nsfw, baseUrl y entry", () => {
    expect(pathsOf(validateManifest({ ...validManifest, runtime: "web" }))).toContain("runtime");
    expect(pathsOf(validateManifest({ ...validManifest, lang: "" }))).toContain("lang");
    expect(pathsOf(validateManifest({ ...validManifest, nsfw: "no" }))).toContain("nsfw");
    expect(pathsOf(validateManifest({ ...validManifest, baseUrl: "no-es-una-url" }))).toContain(
      "baseUrl",
    );
    expect(pathsOf(validateManifest({ ...validManifest, entry: "" }))).toContain("entry");
  });

  it("valida los tipos de obra y las capacidades, con índice", () => {
    expect(pathsOf(validateManifest({ ...validManifest, kinds: [] }))).toContain("kinds");
    expect(pathsOf(validateManifest({ ...validManifest, kinds: ["manga", "webtoon"] }))).toContain(
      "kinds[1]",
    );
    expect(pathsOf(validateManifest({ ...validManifest, capabilities: ["bogus"] }))).toContain(
      "capabilities[0]",
    );
  });

  it("exige al menos un dominio en los permisos", () => {
    expect(pathsOf(validateManifest({ ...validManifest, permissions: { domains: [] } }))).toContain(
      "permissions.domains",
    );
    expect(
      pathsOf(validateManifest({ ...validManifest, permissions: { domains: ["", "ok.com"] } })),
    ).toContain("permissions.domains[0]");
  });

  it("reúne varios errores a la vez", () => {
    const issues = expectInvalid(
      validateManifest({ ...validManifest, id: "MAL", apiVersion: 3, nsfw: "sí" }),
    );

    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it("valida minAppVersion contra la versión de la app", () => {
    const tooNew = validateManifest(
      { ...validManifest, minAppVersion: "2.0.0" },
      {
        appVersion: "1.5.0",
      },
    );
    expect(pathsOf(tooNew)).toContain("minAppVersion");

    const compatible = validateManifest(
      { ...validManifest, minAppVersion: "1.0.0" },
      {
        appVersion: "1.5.0",
      },
    );
    expect(compatible.ok).toBe(true);

    expect(pathsOf(validateManifest({ ...validManifest, minAppVersion: "uno" }))).toContain(
      "minAppVersion",
    );
  });
});
