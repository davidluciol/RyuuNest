import { dragonNightColors, spacing } from "@ryuunest/ui-tokens";

/**
 * F34.3 — anillo de foco de todo elemento pulsable: 2 px `accent` con
 * separación de 2 px (DESIGN «Boundary Framing & Focus Rings»). Sin foco el
 * contorno es transparente; un contorno no ocupa layout, así que no hay salto.
 */
const RING = spacing.xxs / 2;

export interface FocusRingShape {
  outlineColor: string;
  outlineWidth: number;
  outlineOffset: number;
  outlineStyle: "solid";
}

export function focusRingStyle(focused: boolean): FocusRingShape {
  return {
    outlineColor: focused ? dragonNightColors.accent : "transparent",
    outlineWidth: RING,
    outlineOffset: RING,
    outlineStyle: "solid",
  };
}
