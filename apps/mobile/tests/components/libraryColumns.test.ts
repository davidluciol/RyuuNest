import { layoutForWidth } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { LIBRARY_CARD_MIN_WIDTH, libraryColumnsFor } from "../../src/components/libraryCardStyles";

/**
 * F34.3 — a 273 px la tarjeta de 3 columnas medía ~72 px y el título no cabía en
 * 2 líneas sin «…» (T7). Se usan 3 columnas solo si la tarjeta conserva su
 * ancho mínimo; si no, 2 (el mínimo del tramo móvil, SPEC §11.9).
 */
describe("libraryColumnsFor", () => {
  const { margin, gap } = layoutForWidth(360);
  const threeColumnsWidth = 3 * LIBRARY_CARD_MIN_WIDTH + 2 * gap + 2 * margin;

  it("en el ancho más estrecho de referencia usa 2 columnas", () => {
    expect(libraryColumnsFor(273)).toBe(2);
  });

  it("justo en el límite pasa a 3 y un píxel antes sigue en 2", () => {
    expect(libraryColumnsFor(threeColumnsWidth)).toBe(3);
    expect(libraryColumnsFor(threeColumnsWidth - 1)).toBe(2);
  });

  it("en teléfonos habituales mantiene 3 columnas", () => {
    expect(libraryColumnsFor(412)).toBe(3);
    expect(libraryColumnsFor(426)).toBe(3);
  });
});
