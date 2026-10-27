import {
  spacing,
  touchTarget,
  typography,
  dragonNightColors,
  type TypeStyle,
} from "@ryuunest/ui-tokens";

/**
 * F15 — reglas del selector de módulo (`ModulePicker`), separadas del
 * componente para probarlas sin Metro (patrón de F06). Puras, todo desde
 * `ui-tokens`.
 */

const colors = dragonNightColors;

export interface ModulePickerRowStyleShape {
  minHeight: number;
  gap: number;
  paddingVertical: number;
}

/** Fila de la hoja: nombre + marca de selección; área táctil 48 dp (RNF-7). */
export function modulePickerRowStyle(): ModulePickerRowStyleShape {
  return {
    minHeight: touchTarget.min,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  };
}

/** Tipografía + color de un texto de la hoja (para `textStyle()` en el componente). */
export interface ModulePickerTextStyleShape extends TypeStyle {
  color: string;
}

/** Nombre del módulo en la hoja: `bodyMd` en texto principal. */
export function modulePickerRowTextStyle(): ModulePickerTextStyleShape {
  return { ...typography.bodyMd, color: colors.textPrimary };
}

/** Título de la hoja («Elegir módulo»): `labelMd` en texto secundario. */
export function modulePickerTitleStyle(): ModulePickerTextStyleShape {
  return { ...typography.labelMd, color: colors.textSecondary };
}
