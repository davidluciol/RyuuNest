import { describe, expect, it } from "vitest";

import { switchColors } from "../../src/components/switchStyles";

/**
 * F16b — interruptor de fila de ajustes (sin diseño en Stitch: se compone con
 * `DESIGN.md`, SPEC §11.5): pista `border` apagada y `accent` encendida, pulgar
 * `bg` (oscuro sobre `accent`, DESIGN_RULES) y fondo iOS `surface`. Puro y
 * testeable sin Metro (Regla 4 del blueprint).
 */
describe("switchColors (interruptor)", () => {
  it("pista apagada border y encendida accent; pulgar bg", () => {
    expect(switchColors()).toEqual({
      track: { false: "#263147", true: "#35C98A" },
      thumb: "#0B0E14",
      iosBackground: "#141923",
    });
  });
});
