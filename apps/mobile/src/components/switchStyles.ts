import { dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F16b — colores del interruptor (ajustes; sin diseño en Stitch, SPEC §11.5):
 * pista `border` apagada y `accent` encendida; el pulgar va en `bg` (oscuro
 * sobre `accent`, DESIGN_RULES). Puro y testeable sin Metro.
 */

const colors = dragonNightColors;

export interface SwitchColors {
  /** Mapa de `trackColor` de `Switch` según esté apagado o encendido. */
  track: { false: string; true: string };
  thumb: string;
  /** Fondo de la pista en iOS apagado (`ios_backgroundColor`). */
  iosBackground: string;
}

export function switchColors(): SwitchColors {
  return {
    track: { false: colors.border, true: colors.accent },
    thumb: colors.bg,
    iosBackground: colors.surface,
  };
}
