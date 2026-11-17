import { describe, expect, it } from "vitest";
import { dragonNightColors, markers } from "@ryuunest/ui-tokens";

import {
  DRAGON_TREASURE_HEIGHT,
  DRAGON_TREASURE_WIDTH,
  dragonTreasureColors,
} from "../../src/components/dragonTreasureStyles";

/**
 * F56 — ilustración del dragón sin tesoros (vacío de búsqueda de Tesoros): SVG propio, sin
 * imágenes externas (RNF-5) y solo con colores del tema. Más ancha que el dragón marcador.
 */
describe("dragonTreasureColors", () => {
  it("todos los colores salen de los tokens del tema, sin hexadecimales propios", () => {
    const tokens = new Set<string>(Object.values(dragonNightColors));
    for (const [role, color] of Object.entries(dragonTreasureColors())) {
      expect(tokens.has(color), `${role} = ${color}`).toBe(true);
    }
  });

  it("el dragón va atenuado y las gemas en accent", () => {
    const colors = dragonTreasureColors();
    expect(colors.dragon).toBe(dragonNightColors.textSecondary);
    expect(colors.gem).toBe(dragonNightColors.accent);
  });
});

describe("tamaño", () => {
  it("más ancha que alta y al menos tan grande como el dragón mediano", () => {
    expect(DRAGON_TREASURE_WIDTH).toBeGreaterThan(DRAGON_TREASURE_HEIGHT);
    expect(DRAGON_TREASURE_HEIGHT).toBeGreaterThanOrEqual(markers.md);
  });
});
