import type { ReaderMode } from "@ryuunest/core";

/**
 * F18 — zonas táctiles y porcentaje del lector (RF-19, RF-41). Lógica pura: la
 * pantalla traduce el toque (x, ancho) a una acción y no decide nada más.
 */

export type TapZone = "left" | "center" | "right";
export type ReaderTapAction = "previous" | "next" | "toggleControls" | "none";
export type ReaderSwipeAction = "previous" | "next";

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

/**
 * RF-19: el centro alterna los controles; las laterales se invierten solo en D→I. F51: en
 * webtoon (vertical) un toque nunca pasa de página; solo oculta las barras si están visibles
 * (se muestran manteniendo presionado).
 */
export function tapActionFor(
  zone: TapZone,
  mode: ReaderMode,
  controlsVisible: boolean,
): ReaderTapAction {
  if (mode === "vertical") return controlsVisible ? "toggleControls" : "none";
  if (zone === "center") return "toggleControls";
  const leftIsNext = mode === "paged-rtl";
  if (zone === "left") return leftIsNext ? "next" : "previous";
  return leftIsNext ? "previous" : "next";
}

/** F51 — recorrido horizontal mínimo (px) para que un deslizamiento pase de página. */
export const SWIPE_MIN_DISTANCE = 48;

/**
 * F51 — deslizar en paginado: el dedo hacia la izquierda avanza en I→D y retrocede en D→I.
 * Exige un gesto claramente horizontal; en webtoon no hay deslizar horizontal.
 */
export function swipeActionFor(dx: number, dy: number, mode: ReaderMode): ReaderSwipeAction | null {
  if (mode === "vertical") return null;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) <= 2 * Math.abs(dy)) return null;
  const towardsLeft = dx < 0;
  const leftIsNext = mode === "paged-ltr";
  return towardsLeft === leftIsNext ? "next" : "previous";
}

/** Margen (px) para considerar que el final del contenido está a la vista. */
const SCROLL_END_SLACK = 16;

/** F51 — ¿se ve el final de la lista vertical (donde está la tarjeta de fin)? */
export function isAtScrollEnd(offsetY: number, viewportHeight: number, contentHeight: number): boolean {
  if (viewportHeight <= 0 || contentHeight <= 0) return false;
  return offsetY + viewportHeight >= contentHeight - SCROLL_END_SLACK;
}

/** F51 — las barras se ocultan solas tras este tiempo (provisional, criterio de P-90). */
export const CONTROLS_HIDE_MS = 3000;

/** F51 — espera en la tarjeta de fin antes de abrir el siguiente capítulo (provisional, P-90). */
export const AUTO_NEXT_DELAY_MS = 3000;

/** Página vertical típica (2:3) mientras la imagen real no ha dicho su tamaño. */
export const DEFAULT_PAGE_ASPECT = 2 / 3;

/** Relación ancho / alto de una página; sin tamaño conocido, la típica. */
export function pageAspect(width: number | undefined, height: number | undefined): number {
  if (width === undefined || height === undefined || width <= 0 || height <= 0) {
    return DEFAULT_PAGE_ASPECT;
  }
  return width / height;
}

/**
 * Ancho máximo de la columna de lectura (SPEC §9: «límite de ancho»). Provisional: se ajusta con
 * la medición de P-45; en móvil nunca se alcanza, en la web de escritorio evita estirar la página.
 */
export const READER_MAX_WIDTH = 720;

/** Ancho de la columna de lectura dentro de un contenedor de `containerWidth`. */
export function columnWidth(containerWidth: number): number {
  return Math.min(containerWidth, READER_MAX_WIDTH);
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
