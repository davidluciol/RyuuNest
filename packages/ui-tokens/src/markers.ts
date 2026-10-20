/**
 * Tamaños del dragón marcador (SPEC §11.12): la tabla solo dice «pequeño»
 * (carga breve) y «mediano» (biblioteca vacía, sin resultados, error de
 * módulo); los píxeles los fijó el humano en la rejilla de 4 px (P-55).
 */
export const markers = {
  /** Dragón pequeño: carga breve. */
  sm: 48,
  /** Dragón mediano: estados vacíos y de error. */
  md: 96,
} as const;

/** Nombres de los tamaños, para el lint de diseño (F09). */
export type MarkerToken = keyof typeof markers;
