import { describe, expect, it } from "vitest";

import { nearestPage } from "../../src/screens/reader/readerData";

/**
 * Lector web, modo vertical: la página actual es la más cercana al centro entre TODAS las
 * visibles, no solo entre las que acaban de cambiar en el aviso del IntersectionObserver.
 * Caso real (426 px): la página 2 pasa a tarjeta de error, el aviso solo la trae a ella y el
 * lector saltaba a «2 / 3» aunque la 1 estaba más centrada.
 */
describe("nearestPage", () => {
  it("elige la más centrada entre todas las visibles", () => {
    const pages = [
      { index: 0, top: 125, bottom: 551 },
      { index: 1, top: 567, bottom: 781 },
      { index: 2, top: 797, bottom: 1223 },
    ];
    expect(nearestPage(pages, 450)).toBe(0);
  });

  it("sin páginas visibles no elige ninguna", () => {
    expect(nearestPage([], 450)).toBeNull();
  });
});
