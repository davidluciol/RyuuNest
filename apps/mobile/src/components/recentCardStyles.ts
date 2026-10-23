import { coverAspectRatio, radii, spacing, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F13 — reglas de la tarjeta de portada para la fila horizontal "Lecturas
 * Recientes" (SPEC §11.10, RF-41, T7): ancho fijo para carrusel, portada 2:3
 * con badge de tipo y barra de progreso de 3 px, título a **dos líneas** (sin
 * «…», T7) y metadatos de capítulo debajo. **Sin contador de no leídos**
 * (RF-42, v2). Sin sombra (RNF-12).
 */

const colors = dragonNightColors;

/** Ancho fijo de la tarjeta en el carrusel horizontal (128 px). */
export const RECENT_CARD_WIDTH = 128;

export interface RecentCardStyleShape {
  width: number;
  coverAspectRatio: number;
  coverBorderRadius: number;
  coverBorderWidth: number;
  coverBorderColor: string;
  coverBackgroundColor: string;
  gapCoverText: number;
  gapTextMeta: number;
  titleMaxLines: number;
}

/** Estilo de la tarjeta de recientes. */
export function recentCardStyle(): RecentCardStyleShape {
  return {
    width: RECENT_CARD_WIDTH,
    coverAspectRatio: coverAspectRatio.width / coverAspectRatio.height,
    coverBorderRadius: radii.cover,
    coverBorderWidth: 1,
    coverBorderColor: colors.border,
    coverBackgroundColor: colors.surface,
    gapCoverText: spacing.xs,
    gapTextMeta: spacing.xxs,
    titleMaxLines: 2,
  };
}

export interface RecentCardColors {
  /** Título de la serie (Inter, `label-lg`). */
  title: string;
  /** Metadatos (capítulo, página, porcentaje). */
  meta: string;
  /** Capítulo en curso (RF-41, V1: ámbar solo para avance). */
  chapterInProgress: string;
  /** Barra de progreso inferior (RF-41). */
  progressBar: string;
}

/** Paleta de la tarjeta de recientes. */
export function recentCardColors(): RecentCardColors {
  return {
    title: colors.textPrimary,
    meta: colors.textSecondary,
    chapterInProgress: colors.progress,
    progressBar: colors.progress,
  };
}
