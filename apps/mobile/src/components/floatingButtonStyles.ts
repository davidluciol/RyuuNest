import { activeColors, radii, spacing } from "@ryuunest/ui-tokens";

/**
 * F53 — botón flotante «+» de Tesoros: círculo de 56 px (≥ 48, RNF-7) fijo abajo, fondo
 * `elevated`, borde y icono en verde `accent`. **Sin sombra** (RNF-12).
 */

const colors = activeColors;

/** Diámetro: 48 de área táctil + un paso de respiro (múltiplo de 4). */
export const FAB_SIZE = spacing["2xl"] + spacing.xs;

/** Tamaño del icono «+». */
export const FAB_ICON_SIZE = spacing.lg;

export interface FloatingButtonStyleShape {
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  elevation: number;
  shadowOpacity: number;
}

export function floatingButtonStyle(): FloatingButtonStyleShape {
  return {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.elevated,
    borderColor: colors.accent,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** El «+» es verde (`accent`). */
export function floatingButtonIconColor(): string {
  return colors.accent;
}
