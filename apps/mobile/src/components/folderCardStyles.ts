import { radii, spacing, touchTarget, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F13 — reglas de la tarjeta de carpeta ("Tesoros Guardados", SPEC §11.10,
 * V1/V4/V6): fondo `surface`, radio 12, borde `border`, icono monocromo
 * `text-secondary` en cuadrado de 36 px (V4: un icono por significado, sin
 * color distinto por carpeta), contador de obras en pill `elevated`, nombre
 * en `text-primary` y descripción en `text-secondary`. Área táctil mínima
 * de 48 dp (RNF-7). Un solo acceso a carpetas por pantalla (V6).
 * **Sin sombra** (RNF-12).
 */

const colors = dragonNightColors;

/** Tamaño del cuadrado del icono de carpeta (36 px, múltiplo de 4). */
export const FOLDER_CARD_ICON_SIZE = 36;

export interface FolderCardStyleShape {
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  gap: number;
  minHeight: number;
  iconBorderRadius: number;
  elevation: number;
  shadowOpacity: number;
}

/** Estilo del contenedor de la tarjeta de carpeta. */
export function folderCardStyle(): FolderCardStyleShape {
  return {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: touchTarget.min,
    iconBorderRadius: radii.control,
    elevation: 0,
    shadowOpacity: 0,
  };
}

export interface FolderCardColors {
  /** Nombre de la carpeta (Manrope, `title-lg`). */
  name: string;
  /** Descripción/subtítulo (Inter, `body-sm`). */
  description: string;
  /** Icono de carpeta (V4: monocromo, mismo color siempre). */
  icon: string;
  /** Fondo del cuadrado del icono. */
  iconBackground: string;
  /** Fondo del contador de obras (pill). */
  countBackground: string;
  /** Texto del contador de obras. */
  countText: string;
}

/** Paleta de la tarjeta de carpeta (neutros, V1/V4). */
export function folderCardColors(): FolderCardColors {
  return {
    name: colors.textPrimary,
    description: colors.textSecondary,
    icon: colors.textSecondary,
    iconBackground: colors.elevated,
    countBackground: colors.elevated,
    countText: colors.textSecondary,
  };
}
