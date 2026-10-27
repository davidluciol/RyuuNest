import { radii, spacing, touchTarget, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F16 — reglas de la fila de módulo (`ModuleRow`), separadas del componente
 * para probarlas sin Metro. Plana, con área táctil de 48 dp mínimo (RNF-7).
 * Todo desde `ui-tokens`.
 */

const colors = dragonNightColors;

export interface ModuleRowStyleShape {
  backgroundColor: string;
  borderRadius: number;
  minHeight: number;
  padding: number;
  gap: number;
  elevation: number;
  shadowOpacity: number;
}

export function moduleRowStyle(): ModuleRowStyleShape {
  return {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    minHeight: touchTarget.min,
    padding: spacing.sm,
    gap: spacing.xs,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Nombre en principal, metadatos en secundario y el último error en `error`. */
export function moduleRowTextColors(): { name: string; meta: string; error: string } {
  return { name: colors.textPrimary, meta: colors.textSecondary, error: colors.error };
}
