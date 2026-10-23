import {
  coverAspectRatio,
  layoutForWidth,
  radii,
  spacing,
  typography,
  dragonNightColors,
} from "@ryuunest/ui-tokens";

import { BADGE_HEIGHT } from "./badgeStyles";

/**
 * F14a — reglas de la tarjeta de serie de la cuadrícula de Biblioteca
 * (SPEC §11.10, RF-41, V7, T7): portada 2:3, radio 12, borde `border`,
 * título a 2 líneas sin «…», insignia de tipo neutra sobre la portada,
 * barra de progreso de 3 px cuando hay avance. Sin contador de no leídos
 * (RF-42, v2). Puras, testeables sin Metro.
 */

const colors = dragonNightColors;

/** Título a 2 líneas sin «…» (T7). */
export const LIBRARY_CARD_TITLE_LINES = 2;

/** Alto de la barra de progreso (RF-41). */
export const LIBRARY_CARD_PROGRESS_HEIGHT = 3;

export interface LibraryCardStyleShape {
  aspectRatio: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
}

/** Estilo de la portada de la tarjeta (2:3, radio 12, borde `border`). */
export function libraryCardStyle(): LibraryCardStyleShape {
  return {
    aspectRatio: coverAspectRatio.width / coverAspectRatio.height,
    borderRadius: radii.cover,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };
}

export interface LibraryCardTitleStyleShape {
  numberOfLines: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
}

/** Estilo del título: 2 líneas, Manrope 600, texto principal (T7). */
export function libraryCardTitleStyle(): LibraryCardTitleStyleShape {
  return {
    numberOfLines: LIBRARY_CARD_TITLE_LINES,
    fontFamily: typography.labelLg.fontFamily,
    fontSize: typography.labelLg.fontSize,
    lineHeight: typography.labelLg.lineHeight,
    color: colors.textPrimary,
  };
}

export interface LibraryCardBadgeStyleShape {
  position: "absolute";
  top: number;
  left: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
}

/** Insignia de tipo sobre la portada: neutra, esquina superior izquierda (V1, V7). */
export function libraryCardBadgeStyle(): LibraryCardBadgeStyleShape {
  return {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    height: BADGE_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.elevated,
  };
}

export interface LibraryCardProgressStyleShape {
  height: number;
  backgroundColor: string;
  width: `${number}%`;
}

/** Barra de progreso inferior; `progress` de 0 a 1 (RF-41). */
export function libraryCardProgressStyle(progress: number): LibraryCardProgressStyleShape {
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    height: LIBRARY_CARD_PROGRESS_HEIGHT,
    backgroundColor: colors.progress,
    width: `${Math.round(clamped * 100)}%`,
  };
}

/**
 * Columnas de la cuadrícula según el ancho (SPEC §11.9, layout.ts):
 * móvil 2–3, tablet 4–6, escritorio 8. Se elige el máximo del tramo.
 */
export function libraryCardGridColumns(width: number): number {
  const layout = layoutForWidth(width);
  return layout.columns.max;
}
