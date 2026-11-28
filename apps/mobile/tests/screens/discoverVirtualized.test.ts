import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(path.resolve(import.meta.dirname, "../..", file), "utf8");

// #182: con ZonaTMO, tras varias páginas del scroll infinito, Aventuras se volvía lenta de golpe:
// la cuadrícula era un ScrollView con `.map` y todas las tarjetas seguían montadas.
describe("Aventuras virtualizada (#182)", () => {
  const src = read("src/screens/discover/DiscoverScreen.tsx");

  it("el catálogo se pinta con FlashList, que recicla las filas fuera de pantalla", () => {
    expect(src).toMatch(/from "@shopify\/flash-list"/);
    expect(src).toMatch(/<FlashList/);
    expect(src).not.toMatch(/<CoverGrid entries=\{catalog\.entries\}/);
  });

  it("la página siguiente se pide con onEndReached, no midiendo el scroll a mano", () => {
    expect(src).toMatch(/onEndReached=/);
    expect(src).not.toMatch(/contentSize\.height - \(contentOffset\.y/);
  });

  it("las portadas recicladas no muestran la imagen anterior", () => {
    expect(read("src/components/LibraryCard.tsx")).toMatch(/recyclingKey=/);
  });
});
