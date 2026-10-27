import { describe, expect, it } from "vitest";
import { typography } from "@ryuunest/ui-tokens";

import {
  LIBRARY_CARD_TITLE_LINES,
  libraryCardStyle,
  libraryCardTitleStyle,
  libraryCardBadgeStyle,
  libraryCardProgressStyle,
  libraryCardMetaStyle,
  libraryCardGridColumns,
} from "../../src/components/libraryCardStyles";

/**
 * F14a — tarjeta de serie de la cuadrícula de Biblioteca (SPEC §11.10,
 * RF-41, V7, T7): portada 2:3, radio 12, borde `border`, título a 2 líneas
 * sin «…», insignia de tipo neutra sobre la portada, barra de progreso de
 * 3 px cuando hay avance. Sin contador de no leídos (RF-42, v2).
 */
describe("libraryCardStyle (tarjeta de serie, cuadrícula)", () => {
  it("portada 2:3, radio 12, borde border, fondo surface", () => {
    expect(libraryCardStyle()).toMatchObject({
      aspectRatio: 2 / 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#263147",
      backgroundColor: "#141923",
    });
  });

  it("título a 2 líneas sin «…» (T7)", () => {
    expect(LIBRARY_CARD_TITLE_LINES).toBe(2);
    expect(libraryCardTitleStyle()).toMatchObject({
      numberOfLines: 2,
    });
  });

  it("insignia de tipo neutra sobre la portada (V1, V7)", () => {
    expect(libraryCardBadgeStyle()).toMatchObject({
      position: "absolute",
      top: 8,
      left: 8,
      height: 24,
      borderRadius: 9999,
      backgroundColor: "#1B2230",
    });
  });

  it("barra de progreso de 3 px en el borde inferior cuando hay avance (RF-41)", () => {
    expect(libraryCardProgressStyle(0.42)).toMatchObject({
      height: 3,
      backgroundColor: "#FF9F43",
      width: "42%",
    });
  });

  it("sin avance no hay barra visible", () => {
    expect(libraryCardProgressStyle(0).width).toBe("0%");
  });

  it("clampa el progreso a [0, 1]", () => {
    expect(libraryCardProgressStyle(-0.5).width).toBe("0%");
    expect(libraryCardProgressStyle(1.5).width).toBe("100%");
  });
});

describe("libraryCardMetaStyle (cuarta línea de datos, F15)", () => {
  it("secundaria en text-secondary con la tipografía labelMd; sin «…» (T7)", () => {
    expect(libraryCardMetaStyle()).toMatchObject({
      fontFamily: typography.labelMd.fontFamily,
      fontSize: typography.labelMd.fontSize,
      lineHeight: typography.labelMd.lineHeight,
      color: "#9BA5B5",
      numberOfLines: 2,
    });
  });
});

describe("libraryCardGridColumns (cuadrícula)", () => {
  it("móvil: 3 columnas", () => {
    expect(libraryCardGridColumns(375)).toBe(3);
  });

  it("móvil ancho: 3 columnas", () => {
    expect(libraryCardGridColumns(426)).toBe(3);
  });

  it("tablet: 6 columnas (máximo del tramo)", () => {
    expect(libraryCardGridColumns(768)).toBe(6);
  });

  it("escritorio: 8 columnas", () => {
    expect(libraryCardGridColumns(1440)).toBe(8);
  });
});
