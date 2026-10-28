import type { PageWindow } from "@ryuunest/core";

import { pageAspect } from "./readerLayout";

/**
 * F18 — geometría del modo vertical continuo (SPEC §9). Lógica pura: la pantalla solo pinta lo
 * que decide este módulo y lo que declara `ReaderState.window` (T27).
 */

/** Altura de cada página al ancho dado; las no medidas usan la relación típica 2:3. */
export function pageHeights(
  width: number,
  count: number,
  aspects: Readonly<Record<number, number>>,
): number[] {
  return Array.from({ length: count }, (_value, index) =>
    width <= 0 ? 0 : width / (aspects[index] ?? pageAspect(undefined, undefined)),
  );
}

/** Desplazamiento vertical del borde superior de una página. */
export function pageOffset(heights: readonly number[], index: number): number {
  let offset = 0;
  for (let i = 0; i < index && i < heights.length; i += 1) offset += heights[i] as number;
  return offset;
}

/** Página que cubre el borde superior en `offset`; la última si se pasa del final. */
export function pageAtOffset(heights: readonly number[], offset: number): number | null {
  if (heights.length === 0) return null;
  let top = 0;
  for (let index = 0; index < heights.length; index += 1) {
    top += heights[index] as number;
    if (offset < top) return index;
  }
  return heights.length - 1;
}

/** ¿Se mantiene decodificada esta imagen? Solo dentro de la ventana del núcleo (SPEC §9). */
export function shouldMountImage(index: number, window: PageWindow | null): boolean {
  return window !== null && index >= window.from && index <= window.to;
}

/**
 * Cuánto hay que mover el desplazamiento cuando una página **por encima** de la visible cambia de
 * alto al terminar de cargar, para que lo que se está leyendo no se mueva.
 */
export function anchorDelta(change: {
  changedIndex: number;
  currentPage: number;
  previousHeight: number;
  nextHeight: number;
}): number {
  return change.changedIndex < change.currentPage ? change.nextHeight - change.previousHeight : 0;
}
