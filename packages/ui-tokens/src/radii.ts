/**
 * Radios semánticos (SPEC §11.9, corroborado con los `code.html` de `design/stitch`
 * y sus pantallas: `rounded` 4, `rounded-lg` 8, `rounded-xl` 12, esquinas de hoja
 * `rounded-t-2xl` 16). `pill` se usa para chips e insignias de estado (radio
 * completo).
 */
export const radii = {
  /** Casillas. */
  checkbox: 4,
  /** Campos, botones, filas, insignias en línea. */
  control: 8,
  /** Tarjetas. */
  card: 12,
  /** Portadas (2:3). */
  cover: 12,
  /** Esquinas superiores de hojas y diálogos (rango 16–24; el diseño usa 16). */
  sheet: 16,
  /** Chips e insignias de estado. */
  pill: 9999,
} as const;

/** Nombres de los radios, para el lint de diseño (F09). */
export type RadiusToken = keyof typeof radii;
