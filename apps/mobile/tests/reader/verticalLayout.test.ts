import { describe, expect, it } from "vitest";

import {
  anchorDelta,
  pageAtOffset,
  pageHeights,
  pageOffset,
  shouldMountImage,
} from "../../src/reader/verticalLayout";

/**
 * F18 — geometría del modo vertical continuo (SPEC §9): cada página ocupa su altura (conocida
 * tras cargar, estimada antes) y solo se montan las imágenes de la ventana que declara el
 * núcleo (`ReaderState.window`); el resto son huecos del mismo alto.
 */

const WIDTH = 400;

describe("pageHeights", () => {
  it("usa la relación de aspecto de cada página; sin medir, la típica 2:3", () => {
    expect(pageHeights(WIDTH, 3, { 1: 1 })).toEqual([600, 400, 600]);
  });

  it("sin ancho (aún sin layout) no hay alturas", () => {
    expect(pageHeights(0, 2, {})).toEqual([0, 0]);
  });
});

describe("pageOffset / pageAtOffset", () => {
  const heights = [600, 400, 600];

  it("el desplazamiento de una página es la suma de las alturas anteriores", () => {
    expect(pageOffset(heights, 0)).toBe(0);
    expect(pageOffset(heights, 1)).toBe(600);
    expect(pageOffset(heights, 2)).toBe(1000);
  });

  it("la página en un desplazamiento es la que cubre su borde superior", () => {
    expect(pageAtOffset(heights, 0)).toBe(0);
    expect(pageAtOffset(heights, 599)).toBe(0);
    expect(pageAtOffset(heights, 600)).toBe(1);
    expect(pageAtOffset(heights, 1000)).toBe(2);
  });

  it("más allá del final cae en la última página; sin páginas no hay ninguna", () => {
    expect(pageAtOffset(heights, 99_999)).toBe(2);
    expect(pageAtOffset([], 10)).toBeNull();
  });
});

describe("shouldMountImage", () => {
  it("solo monta las imágenes dentro de la ventana del núcleo, extremos incluidos", () => {
    const window = { from: 3, to: 7 };

    expect([2, 3, 5, 7, 8].map((index) => shouldMountImage(index, window))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });

  it("sin ventana (aún sin modo) no se monta nada", () => {
    expect(shouldMountImage(0, null)).toBe(false);
  });
});

describe("anchorDelta", () => {
  it("si una página por encima de la visible cambia de alto, hay que compensar el desplazamiento", () => {
    expect(anchorDelta({ changedIndex: 1, currentPage: 3, previousHeight: 600, nextHeight: 450 })).toBe(-150);
  });

  it("si cambia la visible o una posterior no se compensa nada", () => {
    expect(anchorDelta({ changedIndex: 3, currentPage: 3, previousHeight: 600, nextHeight: 450 })).toBe(0);
    expect(anchorDelta({ changedIndex: 5, currentPage: 3, previousHeight: 600, nextHeight: 450 })).toBe(0);
  });
});
