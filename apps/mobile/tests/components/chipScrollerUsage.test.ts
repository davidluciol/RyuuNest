import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F34.3 — toda fila de chips de Fuentes y Biblioteca que se desplaza en
 * horizontal pasa por `ChipScroller` (degradado como pista). Un
 * `ScrollView horizontal` suelto vuelve a recortar chips sin avisar.
 */
const SCREENS = ["sources/SourcesScreen.tsx", "library/LibraryScreen.tsx"];

describe("filas de chips con pista de desplazamiento", () => {
  for (const file of SCREENS) {
    const source = readFileSync(join(__dirname, "../../src/screens", file), "utf8");

    it(`${file} usa ChipScroller`, () => {
      expect(source).toMatch(/import ChipScroller from "\.\.\/\.\.\/components\/ChipScroller"/);
      expect(source).toMatch(/<ChipScroller/);
    });

    it(`${file} no deja ScrollView horizontal sin pista`, () => {
      expect(source).not.toMatch(/<ScrollView\s+horizontal/);
    });
  }
});
