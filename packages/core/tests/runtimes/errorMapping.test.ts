import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { moduleErrorFromStatus, toModuleError } from "../../src/runtimes/errorMapping";

/**
 * Mapeo centralizado de fallos a los códigos del contrato (SPEC §6.4, T20).
 *
 * Vive en un solo sitio para que los runtime declarativo y script no repitan la
 * tabla: el estado HTTP de una respuesta y cualquier excepción suelta se traducen
 * aquí a un `ModuleErrorCode`.
 */

describe("errorMapping · estado HTTP a ModuleErrorCode", () => {
  it("mapea cada estado al código del contrato", () => {
    expect(moduleErrorFromStatus("https://sitio.test/a", 404).code).toBe("NOT_FOUND");
    expect(moduleErrorFromStatus("https://sitio.test/a", 429).code).toBe("RATE_LIMITED");
    expect(moduleErrorFromStatus("https://sitio.test/a", 401).code).toBe("BLOCKED");
    expect(moduleErrorFromStatus("https://sitio.test/a", 403).code).toBe("BLOCKED");
    expect(moduleErrorFromStatus("https://sitio.test/a", 500).code).toBe("NETWORK");
  });

  it("el fallo de estado conserva la url y el status como detalle", () => {
    const error = moduleErrorFromStatus("https://sitio.test/a", 404);

    expect(error).toBeInstanceOf(ModuleError);
    expect(error.details).toEqual({ url: "https://sitio.test/a", status: 404 });
    expect(error.message).toContain("404");
    expect(error.message).toContain("https://sitio.test/a");
  });
});

describe("errorMapping · cualquier fallo a ModuleErrorCode", () => {
  it("conserva intacto un ModuleError del módulo", () => {
    const original = new ModuleError("TIMEOUT", "tarde", { url: "https://sitio.test/a" });

    expect(toModuleError(original)).toBe(original);
  });

  it("convierte una excepción normal en INTERNAL con su mensaje", () => {
    const error = toModuleError(new Error("boom"));

    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe("boom");
  });

  it("convierte un valor que no es Error en INTERNAL con texto legible", () => {
    const error = toModuleError("texto suelto");

    expect(error.code).toBe("INTERNAL");
    expect(error.message).toBe("texto suelto");
  });
});
