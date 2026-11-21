import { afterEach, describe, expect, it } from "vitest";

import { dragonNightColors } from "../src/colors";
import { activeColors, applyTheme, getThemeVersion } from "../src/activeColors";

/** F90 — los componentes leen `activeColors`; `applyTheme` lo sustituye en vivo. */
describe("activeColors", () => {
  afterEach(() =>
    applyTheme({ id: "dragon-night", name: "Dragon Night", colors: dragonNightColors }),
  );

  it("arranca con Dragon Night", () => {
    expect(activeColors).toEqual(dragonNightColors);
  });

  it("applyTheme cambia los valores sobre el mismo objeto y sube la versión", () => {
    const before = getThemeVersion();
    applyTheme({ id: "x", name: "X", colors: { ...dragonNightColors, bg: "#000000" } });
    expect(activeColors.bg).toBe("#000000");
    expect(getThemeVersion()).toBe(before + 1);
  });
});
