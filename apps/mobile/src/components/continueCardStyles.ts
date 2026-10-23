import { coverAspectRatio, radii, spacing, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F13 — reglas de la tarjeta hero "Continuar la Aventura" (SPEC §11.10,
 * RF-14, RF-41, V1): portada grande a la izquierda con badge de tipo y barra
 * de progreso de 3 px, contenido a la derecha con metadatos, título, capítulo,
 * progreso lineal y botón primario. Fondo `surface`, radio 12, borde `border`,
 * **sin sombra** (RNF-12: profundidad por niveles de superficie).
 */

const colors = dragonNightColors;

/** Ancho fijo de la portada en la tarjeta hero (2:3 → 96×144 px). */
export const CONTINUE_CARD_COVER_WIDTH = 96;

export interface ContinueCardStyleShape {
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  gap: number;
  elevation: number;
  shadowOpacity: number;
}

/** Estilo del contenedor de la tarjeta hero. */
export function continueCardStyle(): ContinueCardStyleShape {
  return {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 0,
    shadowOpacity: 0,
  };
}

export interface ContinueCardColors {
  /** Título de la serie (Manrope, `headline-sm`). */
  title: string;
  /** Metadatos (fuente · estado, capítulo · página). */
  meta: string;
  /** Capítulo en curso y barra de progreso (RF-41, V1). */
  progress: string;
  /** Botón primario: fondo `accent`, texto `bg` (inversión). */
  buttonBg: string;
  buttonText: string;
}

/** Paleta de la tarjeta hero. */
export function continueCardColors(): ContinueCardColors {
  return {
    title: colors.textPrimary,
    meta: colors.textSecondary,
    progress: colors.progress,
    buttonBg: colors.accent,
    buttonText: colors.bg,
  };
}

/** Alto de la portada según la relación de aspecto 2:3. */
export function continueCardCoverHeight(): number {
  return Math.round(
    (CONTINUE_CARD_COVER_WIDTH * coverAspectRatio.height) / coverAspectRatio.width,
  );
}
