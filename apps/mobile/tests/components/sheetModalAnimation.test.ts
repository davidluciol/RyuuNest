import { describe, expect, it } from "vitest";

import { sheetAnimation } from "../../src/components/sheetModalStyles";

/**
 * F18 — el lector no anima nada (Regla 4 de `AGENTS.md`, F18): las hojas que se abren desde él
 * aparecen sin transición. En el resto de la app la hoja sigue entrando deslizando (F16).
 */
describe("sheetAnimation", () => {
  it("por defecto la hoja entra deslizando", () => {
    expect(sheetAnimation(true)).toBe("slide");
  });

  it("sin animación la hoja aparece de golpe", () => {
    expect(sheetAnimation(false)).toBe("none");
  });
});
