import { describe, expect, it } from "vitest";
import { dragonNightColors, touchTarget } from "@ryuunest/ui-tokens";

import {
  FAB_ICON_SIZE,
  FAB_SIZE,
  floatingButtonIconColor,
  floatingButtonStyle,
} from "../../src/components/floatingButtonStyles";

/**
 * F53 — botón flotante «+» de Tesoros: círculo fijo abajo con el icono en verde (`accent`),
 * de al menos 48 × 48 (RNF-7) y sin sombra (RNF-12).
 */
describe("floatingButtonStyle", () => {
  it("al menos 48 × 48 y redondo", () => {
    const style = floatingButtonStyle();
    expect(FAB_SIZE).toBeGreaterThanOrEqual(touchTarget.min);
    expect(style.width).toBe(FAB_SIZE);
    expect(style.height).toBe(FAB_SIZE);
    expect(style.borderRadius).toBeGreaterThanOrEqual(FAB_SIZE / 2);
  });

  it("el icono «+» es verde (`accent`) y entra en el círculo", () => {
    expect(floatingButtonIconColor()).toBe(dragonNightColors.accent);
    expect(FAB_ICON_SIZE).toBeLessThan(FAB_SIZE);
  });

  it("sin sombra: fondo elevado y borde accent", () => {
    const style = floatingButtonStyle();
    expect(style.elevation).toBe(0);
    expect(style.shadowOpacity).toBe(0);
    expect(style.backgroundColor).toBe(dragonNightColors.elevated);
    expect(style.borderColor).toBe(dragonNightColors.accent);
  });
});
