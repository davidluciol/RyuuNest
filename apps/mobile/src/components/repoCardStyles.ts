import { radii, spacing, touchTarget, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F16 — reglas de la tarjeta de repositorio (`RepoCard`), separadas del
 * componente para probarlas sin Metro (patrón de F06). Plana: la profundidad
 * sale del nivel de superficie, sin sombra (V11). Todo desde `ui-tokens`.
 */

const colors = dragonNightColors;

export interface RepoCardStyleShape {
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  gap: number;
  elevation: number;
  shadowOpacity: number;
}

export function repoCardStyle(): RepoCardStyleShape {
  return {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: spacing.xs,
    elevation: 0,
    shadowOpacity: 0,
  };
}

export interface RepoSyncButtonStyleShape {
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
}

/** Botón de sincronizar: cuadrado de 48 dp, área táctil mínima (RNF-7). */
export function repoSyncButtonStyle(): RepoSyncButtonStyleShape {
  return {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radii.control,
    backgroundColor: colors.elevated,
  };
}

/** Nombre en texto principal y URL en secundario. */
export function repoCardTextColors(): { name: string; url: string } {
  return { name: colors.textPrimary, url: colors.textSecondary };
}
