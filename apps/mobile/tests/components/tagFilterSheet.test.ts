import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SAMPLE_TAG_FILTERS } from "../../src/screens/discover/discoverFixtures";

/**
 * F87 — los filtros de Aventuras son desplegables con casillas: un desplegable por grupo
 * que declara el módulo (`filters()`), casilla en `tags`/`multi` y radio en `select`, y el
 * contador de activos visible en el botón de filtros. Sin Metro: se fija la estructura del
 * código (como `discoverKeyboard.test.ts`); el render real lo verifica Playwright.
 */
const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("TagFilterSheet como desplegables con casillas (F87)", () => {
  const src = read("src/components/TagFilterSheet.tsx");

  it("cada grupo se abre y se cierra desde su cabecera", () => {
    expect(src).toMatch(/testID=\{`tag-filter-toggle-\$\{group\.id\}`\}/);
    expect(src).toMatch(/accessibilityState=\{\{ expanded/);
  });

  it("las opciones son filas con casilla (varias) o radio (una), no chips", () => {
    expect(src).toMatch(/testID=\{`tag-filter-option-\$\{group\.id\}-\$\{option\.value\}`\}/);
    expect(src).toMatch(/group\.multi \? checkboxStyle\(checked\) : radioStyle\(checked\)/);
    expect(src).not.toMatch(/<Chip/);
  });

  it("«Limpiar» y «Listo» quedan fijos al pie, fuera del desplazamiento (S25: listas largas)", () => {
    expect(src).toMatch(/footer=\{/);
    expect(read("src/components/SheetModal.tsx")).toMatch(/<\/ScrollView>\s*\{footer\}/);
  });
});

describe("contador de filtros activos visible (F87)", () => {
  it("el botón de filtros de Aventuras pinta el número de activos", () => {
    expect(read("src/screens/discover/DiscoverScreen.tsx")).toMatch(
      /testID="discover-filters-count"/,
    );
  });
});

describe("ejemplo de la galería (F87)", () => {
  it("trae SFW/NSFW (una), género, estado y tipo", () => {
    expect(SAMPLE_TAG_FILTERS.map((group) => [group.id, group.multi])).toEqual([
      ["content", false],
      ["genre", true],
      ["status", true],
      ["type", true],
    ]);
  });
});
