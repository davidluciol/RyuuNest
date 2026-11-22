import { PAGED_PRELOAD_AHEAD } from "@ryuunest/core";

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
  const room =
    budget.cap === null ? NEXT_CHAPTER_PRELOAD : Math.max(0, budget.cap - budget.inMemory);
  return images.slice(0, Math.min(NEXT_CHAPTER_PRELOAD, room));
}

/** ¿Está cerca el final del capítulo? Entonces se pide el siguiente (RF-21). Sin total, no. */
export function shouldPreloadNext(pageIndex: number, pageTotal: number | null): boolean {
  return pageTotal !== null && pageIndex >= pageTotal - 1 - NEXT_CHAPTER_PRELOAD;
}

/**
 * F51 — páginas por lote de descarga a disco. Se baja el lote de la página actual y el siguiente,
 * uno tras otro: así las primeras 5 llegan pronto y al deslizar la siguiente ya está en disco.
 * Provisional (criterio de P-90).
 */
export const PRELOAD_BATCH = 5;

export function batchOf(pageIndex: number): number {
  return Math.floor(pageIndex / PRELOAD_BATCH);
}

/** Índices de las páginas del lote `batch`, sin pasar de `total`. */
export function batchPages(batch: number, total: number): number[] {
  const from = batch * PRELOAD_BATCH;
  const to = Math.min(total, from + PRELOAD_BATCH);
  return Array.from({ length: Math.max(0, to - from) }, (_value, offset) => from + offset);
}

/** Lotes que deben estar en disco leyendo `pageIndex`: el actual y el siguiente. */
export function batchesToPreload(pageIndex: number, total: number): number[] {
  const current = batchOf(pageIndex);
  return [current, current + 1].filter((batch) => batch * PRELOAD_BATCH < total);
}

/** Avance del lote de la página actual; `null` si ya está completo (no hay nada que avisar). */
export function batchProgress(
  done: ReadonlySet<number>,
  pageIndex: number,
  total: number,
): { loaded: number; size: number } | null {
  const pages = batchPages(batchOf(pageIndex), total);
  const loaded = pages.filter((page) => done.has(page)).length;
  return loaded === pages.length ? null : { loaded, size: pages.length };
}
