import { spacing, touchTarget, withAlpha, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F07 — reglas de la cabecera y la barra inferior (SPEC §11.10, T1, V5,
 * RNF-12). Una cabecera y una barra inferior iguales en todas las pantallas.
 * **Sin sombras**: la profundidad es por niveles de superficie (`elevated`
 * sobre `bg`). Puras, testeables sin Metro.
 */

const colors = dragonNightColors;

export const HEADER_HEIGHT = 64;

export interface ShellStyleShape {
  backgroundColor: string;
  height?: number;
  minHeight?: number;
  borderTopColor?: string;
  borderTopWidth?: number;
  elevation: number;
  shadowOpacity: number;
}

/** Cabecera única: nivel elevated, sin sombra. */
export function headerStyle(): ShellStyleShape {
  return {
    backgroundColor: colors.elevated,
    height: HEADER_HEIGHT,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Los 5 destinos de la barra inferior, iguales en todas las pantallas (T1). */
export const BOTTOM_NAV_DESTINATIONS = [
  "Inicio",
  "Biblioteca",
  "Descubrir",
  "Fuentes",
  "Ajustes",
] as const;

export type BottomNavDestination = (typeof BOTTOM_NAV_DESTINATIONS)[number];

export const NAV_BAR_HEIGHT = 64;

/** Barra inferior: `elevated` al 95 %, borde superior `border`, sin sombra. */
export function bottomNavStyle(): ShellStyleShape {
  return {
    backgroundColor: withAlpha(colors.elevated, 0.95), // elevated al 95 % (SPEC §11.10)
    minHeight: Math.max(NAV_BAR_HEIGHT, touchTarget.min),
    borderTopColor: colors.border,
    borderTopWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Colores de un destino según activo/inactivo. */
export function navItemColors(active: boolean): { icon: string; text: string } {
  const value = active ? colors.accent : colors.textSecondary;
  return { icon: value, text: value };
}

/** Relleno horizontal de la cabecera y las filas. */
export const SHELL_PADDING = spacing.md;
