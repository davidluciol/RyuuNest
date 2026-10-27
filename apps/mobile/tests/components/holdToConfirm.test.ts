import { describe, expect, it } from "vitest";

import {
  HOLD_DURATION_MS,
  holdFillScale,
  holdToConfirmStyle,
  holdToConfirmTextColor,
  holdTrackStyle,
} from "../../src/components/holdToConfirmStyles";

/**
 * F16 — confirmación reforzada (SPEC §7.1, paso 3): el botón de módulos
 * `script` solo confirma tras mantenerlo pulsado. Reglas puras del relleno de
 * progreso (solo `transform`, Regla 4) y del área táctil (RNF-7).
 */
describe("holdFillScale", () => {
  it("empieza en 0, avanza lineal y se queda en 1", () => {
    expect(holdFillScale(0)).toBe(0);
    expect(holdFillScale(HOLD_DURATION_MS / 2)).toBe(0.5);
    expect(holdFillScale(HOLD_DURATION_MS)).toBe(1);
    expect(holdFillScale(HOLD_DURATION_MS * 3)).toBe(1);
  });

  it("un tiempo negativo no produce una escala negativa", () => {
    expect(holdFillScale(-50)).toBe(0);
  });
});

describe("estilos del botón de mantener pulsado", () => {
  it("la duración es de 1,2 s: lo bastante larga para no ser accidental", () => {
    expect(HOLD_DURATION_MS).toBe(1200);
  });

  it("el área táctil mide 48 dp como mínimo y el relleno no recorta el contenido", () => {
    expect(holdToConfirmStyle()).toMatchObject({ minHeight: 48, overflow: "hidden" });
  });

  it("el relleno usa `progress` (atención, SPEC §11.9), ocupa todo el botón y crece desde la izquierda", () => {
    expect(holdTrackStyle()).toMatchObject({
      backgroundColor: "#FF9F43",
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
    });
  });

  it("el texto sobre el relleno es oscuro (`bg`), como pide el contraste de progress", () => {
    expect(holdToConfirmTextColor(true)).toBe("#0B0E14");
  });

  it("en reposo el texto es principal, legible sobre `elevated`", () => {
    expect(holdToConfirmTextColor(false)).toBe("#F2F0EA");
  });
});
