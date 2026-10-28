import { PAGED_PRELOAD_AHEAD, type PageWindow } from "@ryuunest/core";

import { capFor } from "../imageBudget";

/**
 * F19 — precarga dentro del presupuesto de memoria (SPEC §9, RF-21). Lógica pura: la pantalla
 * pide a `expo-image` que prefetch, a disco, lo que decide este módulo.
 */

/**
 * Primeras imágenes del siguiente capítulo que se precargan. Es la misma mirada hacia delante
 * que el núcleo declara para el modo paginado (T27, P-63: constante provisional).
 */
export const NEXT_CHAPTER_PRELOAD = PAGED_PRELOAD_AHEAD;

/**
 * Presupuesto de memoria de imágenes decodificadas, en MB. `null` hasta medirlo en el teléfono
 * (P-45, T05): sin cifra no se inventa un tope; la precarga va a disco y sigue acotada a
 * `NEXT_CHAPTER_PRELOAD`.
 */
export const READER_IMAGE_BUDGET_MB: number | null = null;

/** Cuántas imágenes decodificadas al tamaño de pantalla caben; `null` si no hay presupuesto. */
export function memoryCap(budgetMB: number | null, width: number, height: number): number | null {
  return budgetMB === null ? null : capFor(budgetMB, width, height);
}

/** Primeras imágenes del siguiente capítulo, sin pasar de lo que cabe junto a lo ya en memoria. */
export function nextChapterPreload<T>(
  images: readonly T[],
  budget: { inMemory: number; cap: number | null },
): T[] {
  const room = budget.cap === null ? NEXT_CHAPTER_PRELOAD : Math.max(0, budget.cap - budget.inMemory);
  return images.slice(0, Math.min(NEXT_CHAPTER_PRELOAD, room));
}

/** ¿Está cerca el final del capítulo? Entonces se pide el siguiente (RF-21). Sin total, no. */
export function shouldPreloadNext(pageIndex: number, pageTotal: number | null): boolean {
  return pageTotal !== null && pageIndex >= pageTotal - 1 - NEXT_CHAPTER_PRELOAD;
}

/** Páginas por delante de la actual dentro de la ventana que declara el núcleo (paginado). */
export function pagedAhead<T>(
  images: readonly T[],
  window: PageWindow | null,
  pageIndex: number,
): T[] {
  if (window === null) return [];
  return images.slice(pageIndex + 1, window.to + 1);
}
