import { describe, expect, it } from "vitest";
import { dragonNightColors, touchTarget } from "@ryuunest/ui-tokens";

import { libraryCardMenuStyle } from "../../src/components/libraryCardStyles";

/**
 * F54 — botón de menú «⋮» de la tarjeta de Tesoros: alternativa a la pulsación larga para
 * teclado y D-pad. Círculo visible de 36 px con área táctil de 48 (`hitSlop`, RNF-7); aparece
 * solo con el foco (P-163) y no lleva sombra.
 */
describe("libraryCardMenuStyle", () => {
  it("36 px visibles y 48 de área táctil", () => {
    const style = libraryCardMenuStyle();
    expect(style.size).toBe(36);
    expect(style.size + 2 * style.hitSlop).toBeGreaterThanOrEqual(touchTarget.min);
  });

  it("fondo elevado, icono de texto principal y sin sombra", () => {
    const style = libraryCardMenuStyle();
    expect(style.backgroundColor).toBe(dragonNightColors.elevated);
    expect(style.iconColor).toBe(dragonNightColors.textPrimary);
    expect(style.elevation).toBe(0);
    expect(style.shadowOpacity).toBe(0);
  });
});
