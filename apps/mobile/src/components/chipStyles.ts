import { radii, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F06 — reglas del chip de filtro (SPEC §11.10): pill de 36 px; inactivo
 * `surface`/`border`/`text-secondary`, seleccionado `badge-bg`/borde y texto
 * `accent`. La altura visible es 36 px; el área táctil llega a 48 dp con
 * `hitSlop` (RNF-7), que aplica el componente.
 */

export const CHIP_HEIGHT = 36;

const colors = dragonNightColors;

export interface ChipStyleShape {
  height: number;
  borderRadius: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

/** Estilo del chip según selección. */
export function chipStyle(selected: boolean): ChipStyleShape {
  return {
    height: CHIP_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: selected ? colors.badgeBg : colors.surface,
    borderColor: selected ? colors.accent : colors.border,
    borderWidth: 1,
  };
}

/** Colores de texto/borde para la puerta de contraste. */
export function chipColors(selected: boolean): { bg: string; text: string; border: string } {
  return {
    bg: selected ? colors.badgeBg : colors.surface,
    text: selected ? colors.accent : colors.textSecondary,
    border: selected ? colors.accent : colors.border,
  };
}
