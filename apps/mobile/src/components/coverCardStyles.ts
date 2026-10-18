import { coverAspectRatio, radii, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F07 — reglas de la tarjeta de portada (SPEC §11.10, RF-41): 2:3, radio 12,
 * borde `border`, barra de progreso de 3 px cuando hay avance. **Sin contador
 * de no leídos en la v1** (SPEC §11.10, V8). Puras, testeables sin Metro.
 */

const colors = dragonNightColors;

export interface CoverCardStyleShape {
  aspectRatio: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
}

/** Estilo de la tarjeta (único en la v1). */
export function coverCardStyle(): CoverCardStyleShape {
  return {
    aspectRatio: coverAspectRatio.width / coverAspectRatio.height,
    borderRadius: radii.cover,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };
}

/** Alto de la barra de progreso (RF-41). */
export const PROGRESS_BAR_HEIGHT = 3;

export interface ProgressBarStyleShape {
  height: number;
  backgroundColor: string;
  width: `${number}%`;
}

/** Barra de progreso inferior; `progress` de 0 a 1. */
export function progressBarStyle(progress: number): ProgressBarStyleShape {
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: colors.progress,
    width: `${Math.round(clamped * 100)}%`,
  };
}
