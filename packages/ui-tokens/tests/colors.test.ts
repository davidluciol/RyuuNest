import { describe, expect, it } from "vitest";

import { dragonNightColors } from "../src/colors.js";

/**
 * F01 — los colores semánticos salen de la tabla de SPEC §11.9.
 * Los genéricos del front-matter de `DESIGN.md` (surface-dim, primary-container,
 * background, error #ffb4ab…) no se usan: la única fuente son estos 13 tokens.
 */
describe("tokens de color (SPEC §11.9)", () => {
  it.each([
    ["bg", "#0B0E14"],
    ["surface", "#141923"],
    ["elevated", "#1B2230"],
    ["border", "#263147"],
    ["textPrimary", "#F2F0EA"],
    ["textSecondary", "#9BA5B5"],
    ["accent", "#35C98A"],
    ["progress", "#FF9F43"],
    ["accentAlt", "#9B7BFF"],
    ["badgeBg", "#1C2E29"],
    ["positive", "#4DD599"],
    ["warning", "#F5C451"],
    ["error", "#F06A6A"],
  ] as const)("dragonNightColors.%s es %s", (token, value) => {
    expect(dragonNightColors[token]).toBe(value);
  });

  it("solo expone los 13 tokens semánticos del SPEC (ni genéricos ni extras)", () => {
    expect(Object.keys(dragonNightColors).sort()).toEqual(
      [
        "accent",
        "accentAlt",
        "badgeBg",
        "bg",
        "border",
        "error",
        "elevated",
        "positive",
        "progress",
        "surface",
        "textPrimary",
        "textSecondary",
        "warning",
      ].sort(),
    );
  });
});
