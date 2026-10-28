import type { ReaderMode } from "@ryuunest/core";

/**
 * F18 — zonas táctiles y porcentaje del lector (RF-19, RF-41). Lógica pura: la
 * pantalla traduce el toque (x, ancho) a una acción y no decide nada más.
 */

export type TapZone = "left" | "center" | "right";
export type ReaderTapAction = "previous" | "next" | "toggleControls";

/** Columnas de 12 que ocupa cada lateral; el centro ocupa las 6 restantes (diseño del lector). */
const SIDE_COLUMNS = 3;
const GRID_COLUMNS = 12;

/** Zona tocada. Sin ancho conocido todo es «centro»: un toque raro nunca cambia de página. */
export function tapZoneAt(x: number, width: number): TapZone {
  if (width <= 0) return "center";
  const edge = (width * SIDE_COLUMNS) / GRID_COLUMNS;
  if (x < edge) return "left";
  if (x >= width - edge) return "right";
  return "center";
}

/** RF-19: el centro alterna los controles; las laterales se invierten solo en D→I. */
export function tapActionFor(zone: TapZone, mode: ReaderMode): ReaderTapAction {
  if (zone === "center") return "toggleControls";
  const leftIsNext = mode === "paged-rtl";
  if (zone === "left") return leftIsNext ? "next" : "previous";
  return leftIsNext ? "previous" : "next";
}

/** Página vertical típica (2:3) mientras la imagen real no ha dicho su tamaño. */
export const DEFAULT_PAGE_ASPECT = 2 / 3;

/** Relación ancho / alto de una página; sin tamaño conocido, la típica. */
export function pageAspect(width: number | undefined, height: number | undefined): number {
  if (width === undefined || height === undefined || width <= 0 || height <= 0) {
    return DEFAULT_PAGE_ASPECT;
  }
  return width / height;
}

/** En vertical continuo la página de lectura es la más alta de las visibles (progreso, RF-20). */
export function pageFromViewable(visibleIndices: readonly number[]): number | null {
  return visibleIndices.length === 0 ? null : Math.min(...visibleIndices);
}

/**
 * Porcentaje de lectura de un capítulo: `page_index / page_total` (RF-41, base 0), y 100 en
 * la última página porque ahí el capítulo está terminado. Sin total no hay porcentaje.
 */
export function percentOf(pageIndex: number, pageTotal: number | null): number | null {
  if (pageTotal === null || pageTotal <= 0) return null;
  if (pageIndex >= pageTotal - 1) return 100;
  return Math.round((pageIndex / pageTotal) * 100);
}
