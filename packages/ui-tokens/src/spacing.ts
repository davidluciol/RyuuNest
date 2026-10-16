/**
 * Espaciado: rejilla de 4 px (SPEC §11.9). Toda distancia y relleno de la
 * interfaz es múltiplo de 4 y sale de aquí; ningún componente escribe literales
 * (AC-13, P2-4, `DESIGN_RULES.md` V2).
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

/** Nombres de los pasos, para el lint de diseño (F09). */
export type SpacingToken = keyof typeof spacing;
