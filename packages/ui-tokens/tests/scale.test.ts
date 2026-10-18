import { describe, expect, it } from "vitest";

import { typography, type TypeStyle } from "../src/typography";
import { scaleSize, scaleStyle, scaleTypography } from "../src/scale";

/**
 * F04 — escala por densidad (SPEC §11.9): en TV todos los tamaños se
 * multiplican por 1,25. El redondeo da enteros de píxel; el tracking va en em,
 * que es proporcional al tamaño, así que no se escala.
 */
describe("scaleSize (factor de densidad)", () => {
  it("multiplica y redondea a entero de píxel", () => {
    expect(scaleSize(16, 1.25)).toBe(20);
    expect(scaleSize(22, 1.25)).toBe(28); // 27,5 → 28
    expect(scaleSize(13, 1.25)).toBe(16); // 16,25 → 16
    expect(scaleSize(30, 1.25)).toBe(38); // 37,5 → 38
  });

  it("con factor 1 devuelve el mismo valor", () => {
    expect(scaleSize(40, 1)).toBe(40);
  });
});

describe("scaleStyle (un estilo tipográfico)", () => {
  it("escala tamaño e interlineado y conserva familia, peso y tracking", () => {
    const scaled = scaleStyle(typography.headlineMd, 1.25);
    expect(scaled).toEqual<TypeStyle>({
      fontFamily: "Manrope",
      fontSize: 28,
      lineHeight: 35,
      fontWeight: 600,
      letterSpacing: -0.01,
    });
  });
});

describe("scaleTypography (la escala completa)", () => {
  it("con factor 1 reproduce exactamente la escala base", () => {
    expect(scaleTypography(1)).toEqual(typography);
  });

  it("el factor TV 1,25 multiplica todos los tamaños de los 12 tokens", () => {
    const tv = scaleTypography(1.25);
    expect(Object.keys(tv)).toEqual(Object.keys(typography));
    for (const name of Object.keys(typography) as (keyof typeof typography)[]) {
      expect(tv[name].fontSize).toBe(scaleSize(typography[name].fontSize, 1.25));
      expect(tv[name].lineHeight).toBe(scaleSize(typography[name].lineHeight, 1.25));
    }
  });

  it("en TV `body-lg` pasa de 16/24 a 20/30 y `display-lg` de 40/48 a 50/60", () => {
    const tv = scaleTypography(1.25);
    expect(tv.bodyLg.fontSize).toBe(20);
    expect(tv.bodyLg.lineHeight).toBe(30);
    expect(tv.displayLg.fontSize).toBe(50);
    expect(tv.displayLg.lineHeight).toBe(60);
  });
});
