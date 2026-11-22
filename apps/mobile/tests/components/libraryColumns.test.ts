import { readFileSync } from "node:fs";
import path from "node:path";
import { gridMaxWidth, layoutForWidth } from "@ryuunest/ui-tokens";
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

/**
 * F43 W17 — en tablet y escritorio la rejilla usa las columnas del tramo (SPEC §11.9) dentro del
 * tope de ancho `gridMaxWidth` (1100 px), en vez de 3 tarjetas gigantes.
 */
describe("libraryColumnsFor en pantallas anchas (F43 W17)", () => {
  it("el tope de la rejilla es 1100 px", () => {
    expect(gridMaxWidth).toBe(1100);
  });

  it("en escritorio usa 8 columnas, también por encima del tope", () => {
    expect(libraryColumnsFor(1440)).toBe(8);
    expect(libraryColumnsFor(1920)).toBe(8);
  });

  it("en tablet usa más de 3 y nunca menos que el ancho mínimo de tarjeta", () => {
    const columns = libraryColumnsFor(768);
    const { margin, gap } = layoutForWidth(768);
    expect(columns).toBeGreaterThan(3);
    expect((768 - 2 * margin - (columns - 1) * gap) / columns).toBeGreaterThanOrEqual(LIBRARY_CARD_MIN_WIDTH);
  });
});

describe("Guarida y Tesoros con tope de ancho centrado (F43 W17)", () => {
  const read = (file: string) =>
    readFileSync(path.resolve(import.meta.dirname, "../../src/screens", file), "utf8");

  it("usan contentColumnStyle(gridMaxWidth)", () => {
    expect(read("home/HomeScreen.tsx")).toMatch(/contentColumnStyle\(gridMaxWidth\)/);
    expect(read("library/LibraryScreen.tsx")).toMatch(/contentColumnStyle\(gridMaxWidth\)/);
  });
});
