import { describe, expect, it } from "vitest";

import { fonts, typography } from "../src/typography";

/**
 * F01 — escala tipográfica de SPEC §11.9. Manrope para títulos, Inter para cuerpo
 * y controles. Diferencia aceptada (DESIGN_RULES.md V12): `label-sm` se implementa
 * a 12 px, no a los 11 px de la tabla.
 */
describe("tipografía (SPEC §11.9)", () => {
  it("expone los 12 tokens del SPEC más el token mono (F34.2)", () => {
    expect(Object.keys(typography).sort()).toEqual(
      [
        "bodyLg",
        "bodyMd",
        "bodySm",
        "displayLg",
        "displayLgMobile",
        "headlineLg",
        "headlineMd",
        "headlineSm",
        "labelLg",
        "labelMd",
        "labelSm",
        "mono",
        "titleLg",
      ].sort(),
    );
  });

  it.each([
    ["displayLg", "Manrope", 40, 48, 700, -0.02],
    ["displayLgMobile", "Manrope", 30, 38, 700, -0.02],
    ["headlineLg", "Manrope", 28, 36, 700, -0.01],
    ["headlineMd", "Manrope", 22, 28, 600, -0.01],
    ["headlineSm", "Manrope", 18, 24, 600, 0],
    ["titleLg", "Manrope", 16, 22, 600, 0],
    ["bodyLg", "Inter", 16, 24, 400, 0],
    ["bodyMd", "Inter", 14, 20, 400, 0],
    ["bodySm", "Inter", 13, 18, 400, 0],
    ["labelLg", "Inter", 14, 20, 600, 0.01],
    ["labelMd", "Inter", 12, 16, 500, 0.02],
    // V12: 12 px en vez de 11 px (diferencia aceptada).
    ["labelSm", "Inter", 12, 14, 600, 0.04],
    // F34.2: códigos y detalle técnico (JetBrains Mono, OFL, local).
    ["mono", "JetBrains Mono", 13, 20, 400, 0],
  ] as const)(
    "%s: %s %s/%s peso %s tracking %s em",
    (token, family, size, lineHeight, weight, tracking) => {
      expect(typography[token]).toMatchObject({
        fontFamily: family,
        fontSize: size,
        lineHeight,
        fontWeight: weight,
        letterSpacing: tracking,
      });
    },
  );

  it("las familias son Manrope, Inter y JetBrains Mono (mono), con los pesos del diseño (P2-3)", () => {
    expect(fonts).toEqual({
      heading: "Manrope",
      body: "Inter",
      headingWeights: [600, 700],
      bodyWeights: [400, 500, 600],
      mono: "JetBrains Mono",
      monoWeights: [400, 500],
    });
  });

  it("ningún token de texto queda por debajo de 12 px (DESIGN_RULES.md V12)", () => {
    for (const style of Object.values(typography)) {
      expect(style.fontSize).toBeGreaterThanOrEqual(12);
    }
  });
});
