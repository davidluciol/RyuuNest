import { describe, expect, it } from "vitest";

import {
  MODULE_ERROR_CODES,
  ModuleError,
  isModuleError,
  isModuleErrorCode,
} from "../../src/contract/errors";

describe("contrato · ModuleError", () => {
  it("expone los ocho códigos del SPEC §6.4, en orden", () => {
    expect([...MODULE_ERROR_CODES]).toEqual([
      "NETWORK",
      "TIMEOUT",
      "BLOCKED",
      "RATE_LIMITED",
      "NOT_FOUND",
      "PARSE",
      "UNSUPPORTED",
      "INTERNAL",
    ]);
  });

  it("se instancia con cada código y es un Error con nombre propio", () => {
    for (const code of MODULE_ERROR_CODES) {
      const error = new ModuleError(code, `fallo ${code}`);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ModuleError);
      expect(error.name).toBe("ModuleError");
      expect(error.code).toBe(code);
      expect(error.message).toBe(`fallo ${code}`);
      expect(error.details).toBeUndefined();
    }
  });

  it("conserva los detalles tipados (url, status, selector)", () => {
    const error = new ModuleError("NETWORK", "sin red", {
      url: "https://ejemplo.com/serie/1",
      status: 503,
      selector: "div.element",
    });

    expect(error.details).toEqual({
      url: "https://ejemplo.com/serie/1",
      status: 503,
      selector: "div.element",
    });
  });

  it("reconoce sus códigos y distingue lo que no lo es", () => {
    expect(isModuleErrorCode("TIMEOUT")).toBe(true);
    expect(isModuleErrorCode("timeout")).toBe(false);
    expect(isModuleErrorCode(42)).toBe(false);
    expect(isModuleError(new ModuleError("PARSE", "x"))).toBe(true);
    expect(isModuleError(new Error("x"))).toBe(false);
  });
});
