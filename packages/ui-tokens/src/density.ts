/**
 * Densidades y constantes de layout (SPEC §11.9). Sobre estos tokens base,
 * `scale.ts` y `layout.ts` (F04) construyen la escala tipográfica por
 * densidad y los helpers por punto de corte.
 */

/** Escala tipográfica de cada densidad (TV multiplica por 1,25; SPEC §11.9). */
export interface Density {
  readonly fontScale: number;
}

export const densities = {
  /** Web: elementos compactos. */
  compact: { fontScale: 1 },
  /** Móvil: densidad céntrica de la v1. */
  comfortable: { fontScale: 1 },
  /** Android TV: elementos grandes, márgenes seguros y foco marcado. */
  tv: { fontScale: 1.25 },
} as const satisfies Record<string, Density>;

export type DensityName = keyof typeof densities;

/** Puntos de corte y márgenes por rango (SPEC §11.9). */
export const breakpoints = {
  /** móvil < 600 px. */
  mobileMax: 600,
  /** tablet 600–1024 px; escritorio > 1024 px. */
  tabletMax: 1024,
  margin: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
  },
  /** Riel de la barra lateral en escritorio (F24). */
  desktopRail: 240,
} as const;

/** Área táctil mínima de todo elemento interactivo (RNF-7); se amplía con hitSlop. */
export const touchTarget = { min: 48 } as const;

/** Relación de aspecto de las portadas. */
export const coverAspectRatio = { width: 2, height: 3 } as const;
