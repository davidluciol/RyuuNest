import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb, relativeLuminance } from "../src/contrast";

/**
 * F02 (AC-13) — contraste WCAG 2.1. Fórmulas de la recomendación oficial:
 * luminancia relativa (sRGB lineal) y razón (L1+0.05)/(L2+0.05).
 * Los valores de referencia salen de la propia especificación (blanco/negro = 21,
 * un color consigo mismo = 1) y de casos intermedios conocidos.
 */
describe("hexToRgb", () => {
  it("convierte hexadecimales de 6 dígitos a componentes 0-255", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#0B0E14")).toEqual([11, 14, 20]);
  });

  it("rechaza longitudes inválidas", () => {
    expect(() => hexToRgb("#fff")).toThrow(/hex/i);
    expect(() => hexToRgb("green")).toThrow(/hex/i);
  });
});

describe("relativeLuminance", () => {
  it("negro = 0 y blanco = 1", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("el rojo puro vale 0,2126 (solo contribuye R)", () => {
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 4);
  });
});

describe("contrastRatio", () => {
  it("blanco sobre negro = 21:1", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  it("un color consigo mismo = 1:1", () => {
    expect(contrastRatio("#35C98A", "#35C98A")).toBeCloseTo(1, 5);
  });

  it("es simétrica y redondeable a las cifras del diseño", () => {
    const a = contrastRatio("#9BA5B5", "#0B0E14");
    const b = contrastRatio("#0B0E14", "#9BA5B5");
    expect(a).toBeCloseTo(b, 5);
    expect(a).toBeGreaterThan(7); // text-secondary sobre bg cumple AA sobrado
    expect(a).toBeLessThan(8);
  });
});
