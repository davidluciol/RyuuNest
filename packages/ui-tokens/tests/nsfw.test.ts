import { describe, expect, it } from "vitest";

import { WCAG_AA, contrastRatio, dragonNightColors, nsfwColor } from "../src/index";

/**
 * F94 — borde naranja de las series NSFW: color propio (decisión del humano, 2026-11-19),
 * distinto del ámbar `progress` (V1) y con contraste de componente UI (3:1) sobre las superficies.
 */
describe("nsfwColor (F94)", () => {
  it("es #FF6B1A y no coincide con el ámbar de progreso", () => {
    expect(nsfwColor).toBe("#FF6B1A");
    expect(nsfwColor).not.toBe(dragonNightColors.progress);
  });

  it.each(["bg", "surface", "elevated"] as const)("cumple 3:1 sobre %s", (surface) => {
    expect(contrastRatio(nsfwColor, dragonNightColors[surface])).toBeGreaterThanOrEqual(
      WCAG_AA.nonText,
    );
  });
});
