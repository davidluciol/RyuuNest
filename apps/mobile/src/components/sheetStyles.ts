import { radii, spacing, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F07 — reglas de fila de ajustes y de hojas/diálogos (SPEC §11.10, RNF-12).
 * Fila: alto mínimo, relleno horizontal 16. Hoja: nivel `elevated`, esquinas
 * superiores redondeadas, **sin sombra** (profundidad por superficie).
 */

const colors = dragonNightColors;

export const SETTINGS_ROW_MIN_HEIGHT = 56;

export interface SettingsRowStyleShape {
  minHeight: number;
  paddingHorizontal: number;
}

/** Fila de ajustes (etiqueta + control/valor). */
export function settingsRowStyle(): SettingsRowStyleShape {
  return { minHeight: SETTINGS_ROW_MIN_HEIGHT, paddingHorizontal: spacing.md };
}

export interface SheetStyleShape {
  backgroundColor: string;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
  elevation: number;
  shadowOpacity: number;
}

/** Hoja/diálogo: nivel 2, esquinas superiores redondeadas, sin sombra. */
export function sheetStyle(): SheetStyleShape {
  return {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  };
}
