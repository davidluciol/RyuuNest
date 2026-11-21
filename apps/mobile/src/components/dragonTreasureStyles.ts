import { activeColors, markers } from "@ryuunest/ui-tokens";

/**
 * F56 — ilustración «el dragón sin tesoros» (vacío de búsqueda de Tesoros): el dragón marcador
 * rebuscando entre un montón de gemas con una lupa. SVG propio, sin imágenes externas (RNF-5);
 * solo colores del tema.
 */

const colors = activeColors;

/** Retícula del dibujo (192 × 120): el doble de ancho que el dragón mediano. */
export const DRAGON_TREASURE_WIDTH = markers.md * 2;
export const DRAGON_TREASURE_HEIGHT = markers.md + markers.md / 4;

export interface DragonTreasureColors {
  /** Silueta del dragón y la lupa (atenuados, como el marcador). */
  dragon: string;
  /** Montón de tesoro. */
  pile: string;
  /** Contorno del montón. */
  pileEdge: string;
  /** Gemas. */
  gem: string;
}

export function dragonTreasureColors(): DragonTreasureColors {
  return {
    dragon: colors.textSecondary,
    pile: colors.elevated,
    pileEdge: colors.border,
    gem: colors.accent,
  };
}
