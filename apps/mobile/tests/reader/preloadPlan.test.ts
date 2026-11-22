import { describe, expect, it } from "vitest";
import { PAGED_PRELOAD_AHEAD } from "@ryuunest/core";

import { capFor } from "../../src/imageBudget";
import {
  NEXT_CHAPTER_PRELOAD,
  memoryCap,
  nextChapterPreload,
  PRELOAD_BATCH,
  batchOf,
  batchPages,
  batchProgress,
  batchesToPreload,
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

describe("precarga por lotes (F51)", () => {
  it("los lotes son de 5 páginas", () => {
    expect(PRELOAD_BATCH).toBe(5);
    expect(batchOf(0)).toBe(0);
    expect(batchOf(4)).toBe(0);
    expect(batchOf(5)).toBe(1);
  });

  it("pide el lote de la página actual y el siguiente, sin pasar del final", () => {
    expect(batchesToPreload(0, 23)).toEqual([0, 1]);
    expect(batchesToPreload(7, 23)).toEqual([1, 2]);
    expect(batchesToPreload(21, 23)).toEqual([4]);
    expect(batchesToPreload(0, 3)).toEqual([0]);
    expect(batchesToPreload(0, 0)).toEqual([]);
  });

  it("páginas de un lote, recortadas al total", () => {
    expect(batchPages(0, 23)).toEqual([0, 1, 2, 3, 4]);
    expect(batchPages(4, 23)).toEqual([20, 21, 22]);
  });

  it("progreso del lote de la página actual; null cuando ya está completo", () => {
    expect(batchProgress(new Set([0, 2]), 1, 23)).toEqual({ loaded: 2, size: 5 });
    expect(batchProgress(new Set([0, 1, 2, 3, 4]), 1, 23)).toBeNull();
    expect(batchProgress(new Set([20]), 22, 23)).toEqual({ loaded: 1, size: 3 });
    expect(batchProgress(new Set(), 0, 0)).toBeNull();
  });
});
