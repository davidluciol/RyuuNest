import { describe, expect, it } from "vitest";
import { PAGED_PRELOAD_AHEAD } from "@ryuunest/core";

import { capFor } from "../../src/imageBudget";
import {
  NEXT_CHAPTER_PRELOAD,
  memoryCap,
  nextChapterPreload,
  pagedAhead,
  shouldPreloadNext,
} from "../../src/reader/preloadPlan";

/**
 * F19 — precarga dentro del presupuesto de memoria (SPEC §9, RF-21): en paginado, las páginas
 * que el núcleo declara por delante; al acercarse al final, las primeras del siguiente capítulo.
 * Siempre un número acotado, y nunca más de lo que cabe si el presupuesto está medido.
 */

const images = (count: number) => Array.from({ length: count }, (_value, index) => `img-${index}`);

describe("nextChapterPreload", () => {
  it("precarga solo las primeras imágenes del siguiente capítulo", () => {
    expect(NEXT_CHAPTER_PRELOAD).toBe(PAGED_PRELOAD_AHEAD);
    expect(nextChapterPreload(images(40), { inMemory: 0, cap: null })).toEqual(["img-0", "img-1"]);
  });

  it("si el capítulo trae menos imágenes, precarga las que haya", () => {
    expect(nextChapterPreload(images(1), { inMemory: 0, cap: null })).toEqual(["img-0"]);
    expect(nextChapterPreload([], { inMemory: 0, cap: null })).toEqual([]);
  });

  it("respeta el presupuesto: no precarga más de lo que cabe junto a lo que ya está en memoria", () => {
    expect(nextChapterPreload(images(40), { inMemory: 6, cap: 7 })).toEqual(["img-0"]);
    expect(nextChapterPreload(images(40), { inMemory: 7, cap: 7 })).toEqual([]);
    expect(nextChapterPreload(images(40), { inMemory: 9, cap: 7 })).toEqual([]);
  });

  it("con holgura de sobra no pasa del máximo", () => {
    expect(nextChapterPreload(images(40), { inMemory: 0, cap: 100 })).toHaveLength(NEXT_CHAPTER_PRELOAD);
  });
});

describe("memoryCap", () => {
  it("sin presupuesto medido no hay tope (P-45 sigue pendiente)", () => {
    expect(memoryCap(null, 400, 600)).toBeNull();
  });

  it("con presupuesto, cuántas imágenes decodificadas al tamaño de pantalla caben", () => {
    expect(memoryCap(100, 400, 600)).toBe(capFor(100, 400, 600));
    expect(memoryCap(100, 400, 600)).toBeGreaterThan(0);
  });
});

describe("shouldPreloadNext", () => {
  it("empieza al acercarse al final del capítulo, no antes", () => {
    expect(shouldPreloadNext(0, 40)).toBe(false);
    expect(shouldPreloadNext(36, 40)).toBe(false);
    expect(shouldPreloadNext(37, 40)).toBe(true);
    expect(shouldPreloadNext(39, 40)).toBe(true);
  });

  it("en un capítulo corto empieza desde el principio", () => {
    expect(shouldPreloadNext(0, 2)).toBe(true);
  });

  it("sin total de páginas no hay forma de saber que se acaba", () => {
    expect(shouldPreloadNext(5, null)).toBe(false);
  });
});

describe("pagedAhead", () => {
  it("devuelve las páginas por delante de la actual dentro de la ventana del núcleo", () => {
    expect(pagedAhead(images(10), { from: 3, to: 5 }, 3)).toEqual(["img-4", "img-5"]);
  });

  it("no pasa del final del capítulo", () => {
    expect(pagedAhead(images(5), { from: 3, to: 5 }, 3)).toEqual(["img-4"]);
  });

  it("sin ventana no hay nada que precargar", () => {
    expect(pagedAhead(images(10), null, 3)).toEqual([]);
  });
});
