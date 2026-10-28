import { describe, expect, it } from "vitest";
import { dragonNightColors, touchTarget, withAlpha } from "@ryuunest/ui-tokens";

import { DEFAULT_PAGE_ASPECT, pageAspect, pageFromViewable } from "../../src/reader/readerLayout";
import {
  readerBarStyle,
  readerCanvasStyle,
  readerIconButtonStyle,
} from "../../src/screens/reader/readerStyles";

/**
 * F18 — apariencia del lector (RF-22, `DESIGN.md` «Reader View Overlays»): barras `elevated` al
 * 95 % con borde `border`, sin sombras, marca ni mascota; lienzo en `bg`; áreas táctiles de 48.
 */

describe("readerBarStyle", () => {
  it("usa elevated al 95 % con borde border y sin sombras", () => {
    const style = readerBarStyle();

    expect(style.backgroundColor).toBe(withAlpha(dragonNightColors.elevated, 0.95));
    expect(style.borderColor).toBe(dragonNightColors.border);
    expect(style.borderWidth).toBe(1);
    expect(style.shadowOpacity).toBe(0);
    expect(style.elevation).toBe(0);
  });
});

describe("readerCanvasStyle", () => {
  it("el lienzo de lectura es el fondo del tema (nivel 0), sin relleno decorativo", () => {
    expect(readerCanvasStyle()).toEqual({ flex: 1, backgroundColor: dragonNightColors.bg });
  });
});

describe("readerIconButtonStyle", () => {
  it("cumple el área táctil mínima de 48", () => {
    const style = readerIconButtonStyle();

    expect(style.width).toBeGreaterThanOrEqual(touchTarget.min);
    expect(style.height).toBeGreaterThanOrEqual(touchTarget.min);
  });
});

describe("pageFromViewable", () => {
  it("la página de lectura es la más alta de las visibles", () => {
    expect(pageFromViewable([3, 4, 5])).toBe(3);
    expect(pageFromViewable([5, 3])).toBe(3);
  });

  it("sin páginas visibles no cambia nada", () => {
    expect(pageFromViewable([])).toBeNull();
  });
});

describe("pageAspect", () => {
  it("es ancho / alto de la imagen ya cargada", () => {
    expect(pageAspect(900, 1400)).toBeCloseTo(900 / 1400);
  });

  it("mientras no se conoce el tamaño, usa una página vertical típica", () => {
    expect(pageAspect(0, 0)).toBe(DEFAULT_PAGE_ASPECT);
    expect(pageAspect(undefined, undefined)).toBe(DEFAULT_PAGE_ASPECT);
    expect(DEFAULT_PAGE_ASPECT).toBeLessThan(1);
  });
});
