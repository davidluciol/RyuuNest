import { describe, expect, it } from "vitest";

import { WCAG_AA, contrastRatio } from "../src/contrast";
import { dragonNightColors as c } from "../src/colors";
import { NON_TEXT_PAIRS, TEXT_PAIRS } from "../src/contrastPairs";

/**
 * F02 (AC-13) — los pares de color que la interfaz usa deben cumplir WCAG 2.1 AA.
 * Tabla derivada de SPEC §11.9 (reglas de color) y §11.10 (componentes):
 *  - texto principal y secundario sobre las tres superficies;
 *  - tinta `bg` sobre los rellenos `accent`/`progress` (regla de inversión);
 *  - `accent` como texto/borde sobre `badgeBg` (chip seleccionado);
 *  - `error`, `positive` y `warning` como texto o marca sobre las superficies.
 * Los rellenos e iconos se exigen al mínimo no textual (3:1); el texto, a 4,5:1.
 */

describe("contraste AA de los pares usados (Dragon Night)", () => {
  it.each(TEXT_PAIRS.map((p) => [...p]))("%s sobre %s (%s) cumple 4,5:1", (fg, bg, why) => {
    const ratio = contrastRatio(c[fg], c[bg]);
    expect(ratio, `${why}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it.each(NON_TEXT_PAIRS.map((p) => [...p]))("%s sobre %s (%s) cumple 3:1", (fg, bg, why) => {
    const ratio = contrastRatio(c[fg], c[bg]);
    expect(ratio, `${why}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(WCAG_AA.nonText);
  });
});

describe("regla de inversión (docs/DESIGN.md: «Mandatory Button Text Inversion»)", () => {
  it("el texto claro sobre accent NO cumple AA: por eso la tinta es bg", () => {
    expect(contrastRatio(c.textPrimary, c.accent)).toBeLessThan(WCAG_AA.text);
  });

  it("el texto claro sobre progress NO cumple AA: por eso la tinta es bg", () => {
    expect(contrastRatio(c.textPrimary, c.progress)).toBeLessThan(WCAG_AA.text);
  });
});
