import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F92 — los chips de filtro de Tesoros van en UNA sola fila con scroll horizontal
 * (antes eran tres filas apiladas). Quedan dos `ChipScroller`: la fila de chips
 * y el carrusel de tarjetas de carpeta.
 */
const source = readFileSync(join(__dirname, "../../src/screens/library/LibraryScreen.tsx"), "utf8");

describe("Tesoros: filtros en un solo carrusel", () => {
  it("usa un único ChipScroller para los chips y otro para las carpetas", () => {
    expect(source.match(/<ChipScroller/g)).toHaveLength(2);
  });

  it("la fila única conserva el testID library-filters con las categorías dentro", () => {
    expect(source).toMatch(/testID="library-filters"/);
    expect(source).not.toMatch(/testID="library-categories"/);
  });
});
