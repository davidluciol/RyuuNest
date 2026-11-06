import { dragonNightColors } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { focusRingStyle } from "../../src/components/focusRing";
import { navItemStyle } from "../../src/components/shellStyles";

/**
 * F34.3 — anillo de foco: 2 px `accent` con separación de 2 px en todo
 * elemento pulsable (DESIGN «Boundary Framing & Focus Rings»). Sin foco el
 * contorno es transparente: un contorno no ocupa layout, no hay salto.
 */
describe("focusRingStyle", () => {
  it("con foco: 2 px accent, separación 2 px, sólido", () => {
    expect(focusRingStyle(true)).toEqual({
      outlineColor: dragonNightColors.accent,
      outlineWidth: 2,
      outlineOffset: 2,
      outlineStyle: "solid",
    });
  });

  it("sin foco: mismo grosor y separación, transparente", () => {
    expect(focusRingStyle(false)).toEqual({
      outlineColor: "transparent",
      outlineWidth: 2,
      outlineOffset: 2,
      outlineStyle: "solid",
    });
  });

  it("la barra inferior usa el mismo anillo", () => {
    const style = navItemStyle({ focused: true, pressed: false, disabled: false });
    expect(style).toMatchObject(focusRingStyle(true));
  });
});
