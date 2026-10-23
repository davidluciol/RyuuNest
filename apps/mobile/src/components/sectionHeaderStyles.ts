import { spacing, touchTarget, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F13 — reglas del encabezado de sección (SPEC §11.10, `DESIGN_RULES.md` V1/V4):
 * icono opcional a la izquierda, título en `title-lg`, acción secundaria a la
 * derecha ("Ver todas" en `text-primary` con chevron). El título y la acción
 * **no** usan `accent` (V1: esmeralda solo para acción primaria, selección,
 * foco y destino activo).
 */

const colors = dragonNightColors;

/** Alto mínimo del encabezado cuando hay acción (área táctil, RNF-7). */
export const SECTION_HEADER_MIN_HEIGHT = touchTarget.min;

export interface SectionHeaderStyleShape {
  minHeight: number;
  paddingHorizontal: number;
  gap: number;
}

/** Estilo del contenedor del encabezado de sección. */
export function sectionHeaderStyle(): SectionHeaderStyleShape {
  return {
    minHeight: SECTION_HEADER_MIN_HEIGHT,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  };
}

export interface SectionHeaderColors {
  /** Color del título (Manrope, `title-lg`). */
  title: string;
  /** Color del icono de la izquierda (opcional). */
  icon: string;
  /** Color de la acción secundaria ("Ver todas" con chevron). */
  action: string;
}

/** Paleta del encabezado: neutros, sin `accent` (V1). */
export function sectionHeaderColors(): SectionHeaderColors {
  return {
    title: colors.textPrimary,
    icon: colors.textSecondary,
    action: colors.textPrimary,
  };
}
