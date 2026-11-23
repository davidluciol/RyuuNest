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
 * F51 — páginas por lote del aviso «Cargando imágenes x / y»: el lote de la página actual.
 * La descarga en sí la ordena la cola (`PAGE_QUEUE`). Provisional (criterio de P-90).
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

/**
 * R1 — parámetros de la cola de carga (`pageQueue`). Provisionales (P-90) hasta medirlos en el
 * teléfono (P-45):
 * - 3 descargas a la vez: el ancho de banda va a la página que se lee, por debajo de los hilos de
 *   red de Glide, sin amontonar peticiones a un sitio que limita el ritmo (m440, G6);
 * - a disco, 6 por delante y 2 por detrás de la actual (la ventana decodificada la fija el núcleo);
 * - 30 s de tope por imagen y hasta 2 reintentos automáticos con backoff desde 1 s.
 */
export const PAGE_QUEUE = {
  maxConcurrent: 3,
  ahead: 6,
  behind: 2,
  timeoutMs: 30_000,
  retryBaseMs: 1_000,
  maxAutoRetries: 2,
} as const;
