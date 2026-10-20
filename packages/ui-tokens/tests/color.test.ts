import { describe, expect, it } from "vitest";

import { withAlpha } from "../src/color";

/**
 * F09 — `withAlpha` deriva una capa translúcida **de un token**, para no
 * escribir `rgba(...)` literales en la interfaz (`DESIGN_RULES.md` V2, AC-13).
 * No inventa valores de diseño: solo añade transparencia a un color existente.
 */
describe("withAlpha", () => {
  it("devuelve el rgba del token con la transparencia pedida", () => {
    expect(withAlpha("#35C98A", 0.1)).toBe("rgba(53, 201, 138, 0.1)");
    expect(withAlpha("#1B2230", 0.95)).toBe("rgba(27, 34, 48, 0.95)");
  });

  it("acepta los extremos de la transparencia", () => {
    expect(withAlpha("#0B0E14", 0)).toBe("rgba(11, 14, 20, 0)");
    expect(withAlpha("#0B0E14", 1)).toBe("rgba(11, 14, 20, 1)");
  });

  it("falla con un color o una transparencia inválidos", () => {
    expect(() => withAlpha("rojo", 0.5)).toThrow();
    expect(() => withAlpha("#35C98A", 1.5)).toThrow();
    expect(() => withAlpha("#35C98A", -0.1)).toThrow();
  });
});
