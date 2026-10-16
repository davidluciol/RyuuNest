import { describe, expect, it } from "vitest";

import { WCAG_AA, contrastRatio } from "../src/contrast";
import { dragonNightColors as c } from "../src/colors";

/**
 * F02 (AC-13) — los pares de color que la interfaz usa deben cumplir WCAG 2.1 AA.
 * Tabla derivada de SPEC §11.9 (reglas de color) y §11.10 (componentes):
 *  - texto principal y secundario sobre las tres superficies;
 *  - tinta `bg` sobre los rellenos `accent`/`progress` (regla de inversión);
 *  - `accent` como texto/borde sobre `badgeBg` (chip seleccionado);
 *  - `error`, `positive` y `warning` como texto o marca sobre las superficies.
 * Los rellenos e iconos se exigen al mínimo no textual (3:1); el texto, a 4,5:1.
 */

type Foreground = keyof typeof c;

const TEXT_PAIRS: ReadonlyArray<readonly [Foreground, keyof typeof c, string]> = [
  ["textPrimary", "bg", "texto principal sobre el fondo"],
  ["textPrimary", "surface", "texto sobre tarjetas y filas"],
  ["textPrimary", "elevated", "texto sobre hojas y diálogos"],
  ["textSecondary", "bg", "texto secundario sobre el fondo"],
  ["textSecondary", "surface", "texto secundario sobre tarjetas"],
  ["textSecondary", "elevated", "texto secundario sobre hojas (insignia neutra)"],
  ["bg", "accent", "tinta oscura sobre relleno accent (botón primario)"],
  ["bg", "progress", "tinta oscura sobre relleno progress (avance)"],
  ["accent", "badgeBg", "texto accent del chip seleccionado"],
  ["error", "bg", "texto error sobre el fondo (destructivo)"],
  ["error", "surface", "texto error sobre tarjetas"],
  ["error", "elevated", "texto error sobre hojas"],
];

const NON_TEXT_PAIRS: ReadonlyArray<readonly [Foreground, keyof typeof c, string]> = [
  ["accent", "bg", "contorno de foco sobre el fondo"],
  ["accent", "surface", "contorno de foco sobre tarjetas"],
  ["accent", "elevated", "contorno de foco sobre hojas"],
  ["progress", "bg", "barra de progreso sobre el fondo"],
  ["progress", "surface", "barra de progreso sobre tarjetas"],
  ["positive", "bg", "marca de capítulo completado"],
  ["warning", "bg", "icono de advertencia"],
];

describe("contraste AA de los pares usados (Dragon Night)", () => {
  it.each(TEXT_PAIRS)("%s sobre %s (%s) cumple 4,5:1", (fg, bg, why) => {
    const ratio = contrastRatio(c[fg], c[bg]);
    expect(ratio, `${why}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(NON_TEXT_PAIRS)("%s sobre %s (%s) cumple 3:1", (fg, bg, why) => {
    const ratio = contrastRatio(c[fg], c[bg]);
    expect(ratio, `${why}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(WCAG_AA.nonText);
  });
});

describe("regla de inversión (DESIGN.md: «Mandatory Button Text Inversion»)", () => {
  it("el texto claro sobre accent NO cumple AA: por eso la tinta es bg", () => {
    expect(contrastRatio(c.textPrimary, c.accent)).toBeLessThan(WCAG_AA.text);
  });

  it("el texto claro sobre progress NO cumple AA: por eso la tinta es bg", () => {
    expect(contrastRatio(c.textPrimary, c.progress)).toBeLessThan(WCAG_AA.text);
  });
});
