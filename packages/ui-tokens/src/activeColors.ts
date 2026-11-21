import { dragonNightColors, type ThemeColors } from "./colors";
import type { Theme } from "./theme";

/**
 * F90 — colores del tema en uso. Los componentes leen este objeto (no la paleta
 * fija) y `applyTheme` lo reescribe en sitio; quien lo aplica fuerza el re-render.
 */
export const activeColors: { -readonly [K in keyof ThemeColors]: string } = {
  ...dragonNightColors,
};

let version = 0;

/** Cambia a este tema; la versión sube para que las hojas de estilo se recalculen. */
export function applyTheme(theme: Theme): void {
  Object.assign(activeColors, theme.colors);
  version += 1;
}

/** Contador que cambia con cada `applyTheme`. */
export function getThemeVersion(): number {
  return version;
}
