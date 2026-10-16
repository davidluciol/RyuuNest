/**
 * Escala tipográfica (SPEC §11.9). Manrope para títulos, Inter para cuerpo y
 * controles (P2-3: ambas OFL, empaquetadas localmente; los pesos se fijan ahí).
 *
 * Valores en píxeles; `letterSpacing` en em (0 = sin tracking en el diseño).
 *
 * Diferencia aceptada (`DESIGN_RULES.md` V12): `labelSm` se implementa a 12 px
 * en vez de los 11 px de la tabla del SPEC — el mínimo para metadatos es 12 px.
 * Se registra en `design/stitch/DIFFS.md`.
 */

/** Familias y pesos que se empaquetan (F03). Sin pesos sintéticos. */
export const fonts = {
  heading: "Manrope",
  body: "Inter",
  headingWeights: [600, 700],
  bodyWeights: [400, 500, 600],
} as const;

/** Estilo completo de un token de texto. */
export interface TypeStyle {
  readonly fontFamily: "Manrope" | "Inter";
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: number;
  /** Tracking en em (0 = sin ajuste). */
  readonly letterSpacing: number;
}

export const typography = {
  displayLg: {
    fontFamily: "Manrope",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: 700,
    letterSpacing: -0.02,
  },
  displayLgMobile: {
    fontFamily: "Manrope",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: 700,
    letterSpacing: -0.02,
  },
  headlineLg: {
    fontFamily: "Manrope",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
    letterSpacing: -0.01,
  },
  headlineMd: {
    fontFamily: "Manrope",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 600,
    letterSpacing: -0.01,
  },
  headlineSm: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 600,
    letterSpacing: 0,
  },
  titleLg: {
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 600,
    letterSpacing: 0,
  },
  bodyLg: { fontFamily: "Inter", fontSize: 16, lineHeight: 24, fontWeight: 400, letterSpacing: 0 },
  bodyMd: { fontFamily: "Inter", fontSize: 14, lineHeight: 20, fontWeight: 400, letterSpacing: 0 },
  bodySm: { fontFamily: "Inter", fontSize: 13, lineHeight: 18, fontWeight: 400, letterSpacing: 0 },
  labelLg: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
    letterSpacing: 0.01,
  },
  labelMd: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 500,
    letterSpacing: 0.02,
  },
  // V12: 12 px en vez de 11 px (diferencia aceptada).
  labelSm: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: 600,
    letterSpacing: 0.04,
  },
} satisfies Record<string, TypeStyle>;

/** Nombres de los tokens de texto, para el lint de diseño (F09). */
export type TypeToken = keyof typeof typography;
