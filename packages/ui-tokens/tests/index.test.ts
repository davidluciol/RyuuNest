import { describe, expect, it } from "vitest";

import * as uiTokens from "../src/index";

/**
 * F01 — `index.ts` es la única puerta de los componentes: todo token de
 * SPEC §11.9 debe ser alcanzable desde aquí (Regla 3 de AGENTS.md).
 */
describe("superficie pública de @ryuunest/ui-tokens", () => {
  it("exporta todos los grupos de tokens", () => {
    expect(Object.keys(uiTokens).sort()).toEqual(
      [
        "UI_TOKENS_VERSION",
        "WCAG_AA",
        "breakpoints",
        "breakpointForWidth",
        "contrastRatio",
        "coverAspectRatio",
        "defaultTheme",
        "densityLayout",
        "densities",
        "dragonNight",
        "dragonNightColors",
        "fontFiles",
        "fontLicenses",
        "fonts",
        "getTheme",
        "hexToRgb",
        "layoutForWidth",
        "radii",
        "relativeLuminance",
        "scaleSize",
        "scaleStyle",
        "scaleTypography",
        "spacing",
        "themes",
        "touchTarget",
        "typography",
      ].sort(),
    );
  });

  it("exporta las utilidades de contraste de F02 (AC-13)", () => {
    expect(uiTokens.contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(uiTokens.WCAG_AA.text).toBe(4.5);
  });

  it("los valores vuelven a ser los del SPEC cuando se importan desde el índice", () => {
    expect(uiTokens.dragonNight.colors.accent).toBe("#35C98A");
    expect(uiTokens.typography.displayLgMobile.fontSize).toBe(30);
    expect(uiTokens.spacing.md).toBe(16);
    expect(uiTokens.radii.cover).toBe(12);
    expect(uiTokens.densities.tv.fontScale).toBe(1.25);
  });
});
