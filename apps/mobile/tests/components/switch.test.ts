import { contrastRatio, dragonNightColors, touchTarget, WCAG_AA } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { switchLabelKey, switchStyle } from "../../src/components/switchStyles";
import { t } from "../../src/i18n";

/**
 * F34.2 — interruptor propio (sustituye al `Switch` nativo de F16b): el apagado
 * debe verse sobre `bg` y `surface` (contraste no textual ≥ 3:1) y el estado no
 * puede depender solo del color (DESIGN «Non-Color Dependent Indicators»:
 * texto Sí/No junto al control). Puro y testeable sin Metro.
 */
const c = dragonNightColors;

describe("switchStyle (interruptor)", () => {
  it("apagado: relleno elevated y borde textSecondary", () => {
    const s = switchStyle(false);
    expect(s.track.backgroundColor).toBe(c.elevated);
    expect(s.track.borderColor).toBe(c.textSecondary);
    expect(s.thumb.backgroundColor).toBe(c.textSecondary);
  });

  it("encendido: pista y borde accent, pulgar bg", () => {
    const s = switchStyle(true);
    expect(s.track.backgroundColor).toBe(c.accent);
    expect(s.track.borderColor).toBe(c.accent);
    expect(s.thumb.backgroundColor).toBe(c.bg);
  });

  it("el borde apagado supera 3:1 sobre bg y sobre surface", () => {
    const border = switchStyle(false).track.borderColor;
    expect(contrastRatio(border, c.bg)).toBeGreaterThanOrEqual(WCAG_AA.nonText);
    expect(contrastRatio(border, c.surface)).toBeGreaterThanOrEqual(WCAG_AA.nonText);
  });

  it("el pulgar se distingue de su pista en ambos estados", () => {
    for (const value of [false, true]) {
      const s = switchStyle(value);
      expect(
        contrastRatio(s.thumb.backgroundColor, s.track.backgroundColor),
      ).toBeGreaterThanOrEqual(WCAG_AA.nonText);
    }
  });

  it("el pulgar va a la izquierda apagado y a la derecha encendido", () => {
    expect(switchStyle(true).thumb.left).toBeGreaterThan(switchStyle(false).thumb.left);
  });

  it("el área táctil mide al menos 48 dp", () => {
    const s = switchStyle(false);
    expect(s.hitHeight).toBeGreaterThanOrEqual(touchTarget.min);
    expect(s.track.height + s.hitSlop * 2).toBeGreaterThanOrEqual(touchTarget.min);
  });

  it("deshabilitado atenúa el control", () => {
    expect(switchStyle(true, true).opacity).toBeLessThan(1);
    expect(switchStyle(true, false).opacity).toBe(1);
  });
});

describe("switchLabelKey (marca no color)", () => {
  it("elige la clave según el estado y existe en el catálogo", () => {
    expect(switchLabelKey(true)).toBe("switch.on");
    expect(switchLabelKey(false)).toBe("switch.off");
    expect(t("switch.on")).toBe("Sí");
    expect(t("switch.off")).toBe("No");
  });
});
