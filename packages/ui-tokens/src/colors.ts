/**
 * Colores semánticos del tema Dragon Night (SPEC §11.9).
 *
 * Única fuente: la tabla de SPEC §11.9. Los tokens genéricos del front-matter de
 * `DESIGN.md` (`surface-dim`, `primary-container`, `background`, `error: #ffb4ab`, …)
 * se contradicen entre sí y **no** se implementan (P2-1).
 */

/** Los 13 colores semánticos que consumen los componentes. */
export interface ThemeColors {
  /** Nivel 0: fondo, lector y tinta sobre acentos. */
  readonly bg: string;
  /** Nivel 1: tarjetas, filas, campos. */
  readonly surface: string;
  /** Nivel 2: hojas, diálogos, barra inferior, barras del lector. */
  readonly elevated: string;
  /** Contorno fantasma de 1 px. */
  readonly border: string;
  /** Texto principal. */
  readonly textPrimary: string;
  /** Texto secundario; solo sobre `bg`, `surface` o `elevated`. */
  readonly textSecondary: string;
  /** Acción principal, foco y selección. */
  readonly accent: string;
  /** Avance y capítulo en curso; nada más (`DESIGN_RULES.md` V1). */
  readonly progress: string;
  /** Descubrimiento y taxonomía alterna. No se usa en la v1 (P-31). */
  readonly accentAlt: string;
  /** Fondo del chip seleccionado. */
  readonly badgeBg: string;
  /** Éxito y capítulo completado. */
  readonly positive: string;
  /** Advertencia. */
  readonly warning: string;
  /** Error y acciones destructivas. */
  readonly error: string;
}

/** Paleta Dragon Night, el único tema de la v1 (P-29). */
export const dragonNightColors: ThemeColors = {
  bg: "#0B0E14",
  surface: "#141923",
  elevated: "#1B2230",
  border: "#263147",
  textPrimary: "#F2F0EA",
  textSecondary: "#9BA5B5",
  accent: "#35C98A",
  progress: "#FF9F43",
  accentAlt: "#9B7BFF",
  badgeBg: "#1C2E29",
  positive: "#4DD599",
  warning: "#F5C451",
  error: "#F06A6A",
};
