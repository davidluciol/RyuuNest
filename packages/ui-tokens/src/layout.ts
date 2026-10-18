import { breakpoints } from "./density";
import { spacing } from "./spacing";

/**
 * F04 — layout por punto de corte (SPEC §11.9): márgenes, separaciones, riel
 * y columnas según el ancho; base compartida por móvil, web y TV. La
 * separación de tablet (16 px) la eligió el humano: el SPEC fija 12 en móvil
 * y 24 en escritorio, pero nada entre medias (se anota en `MEMORY.md`).
 */

/** Tramo de ancho de pantalla. */
export type BreakpointName = "mobile" | "tablet" | "desktop";

/** Rango de columnas de la rejilla de portadas de un tramo. */
export interface ColumnRange {
  readonly min: number;
  readonly max: number;
}

/** Todo lo que una pantalla necesita saber según su ancho. */
export interface ScreenLayout {
  readonly breakpoint: BreakpointName;
  /** Margen exterior de la página. */
  readonly margin: number;
  /** Separación entre elementos de la rejilla (portadas, tarjetas). */
  readonly gap: number;
  /** Ancho del riel lateral; 0 cuando no hay riel (móvil y tablet). */
  readonly rail: number;
  readonly columns: ColumnRange;
}

const layouts: Record<BreakpointName, ScreenLayout> = {
  mobile: {
    breakpoint: "mobile",
    margin: breakpoints.margin.mobile,
    gap: spacing.sm, // 12 (SPEC §11.9)
    rail: 0,
    columns: { min: 2, max: 3 },
  },
  tablet: {
    breakpoint: "tablet",
    margin: breakpoints.margin.tablet,
    gap: spacing.md, // 16: paso de la rejilla entre los dos valores del SPEC
    rail: 0,
    columns: { min: 4, max: 6 },
  },
  desktop: {
    breakpoint: "desktop",
    margin: breakpoints.margin.desktop,
    gap: spacing.lg, // 24 (SPEC §11.9)
    rail: breakpoints.desktopRail,
    columns: { min: 8, max: 8 },
  },
};

/** El tramo al que corresponde un ancho de pantalla (SPEC §11.9). */
export function breakpointForWidth(width: number): BreakpointName {
  if (width < breakpoints.mobileMax) return "mobile";
  if (width <= breakpoints.tabletMax) return "tablet";
  return "desktop";
}

/** Márgenes, separaciones, riel y columnas para un ancho de pantalla. */
export function layoutForWidth(width: number): ScreenLayout {
  return layouts[breakpointForWidth(width)];
}
