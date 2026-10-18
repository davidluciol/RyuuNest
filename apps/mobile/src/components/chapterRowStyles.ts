import { spacing, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F07 — reglas de la fila de capítulo (SPEC §11.10, V8): alto mínimo 56 px,
 * relleno horizontal 16. Tres estados: sin leer (`text-primary`), en curso
 * (marcador y porcentaje en `progress`), completado (atenuado `text-secondary`
 * y marca ✓ en `positive`). **Máximo dos señales por estado (V8): leído se
 * atenúa y lleva ✓, no se tacha.**
 */

const colors = dragonNightColors;

export type ChapterState = "unread" | "in-progress" | "completed";

export const CHAPTER_ROW_MIN_HEIGHT = 56;

export interface ChapterRowStyleShape {
  minHeight: number;
  paddingHorizontal: number;
}

/** Estilo de la fila (igual en los tres estados; lo que cambia es el color). */
export function chapterRowStyle(_state: ChapterState): ChapterRowStyleShape {
  return { minHeight: CHAPTER_ROW_MIN_HEIGHT, paddingHorizontal: spacing.md };
}

export interface ChapterRowColors {
  text: string;
  /** Color de acento del estado (progress en curso, positive en completado). */
  accent?: string;
}

/** Colores del texto y del acento por estado. */
export function chapterRowColors(state: ChapterState): ChapterRowColors {
  if (state === "in-progress") return { text: colors.textPrimary, accent: colors.progress };
  if (state === "completed") return { text: colors.textSecondary, accent: colors.positive };
  return { text: colors.textPrimary };
}

export type ChapterSignal = "marcador" | "porcentaje" | "atenuado" | "marca";

/**
 * Señales visibles por estado (V8: máximo dos; leído atenuado + ✓, no tachado).
 * Devuelve las señales semánticas que el componente debe renderizar.
 */
export function chapterSignals(state: ChapterState): ChapterSignal[] {
  if (state === "in-progress") return ["marcador", "porcentaje"];
  if (state === "completed") return ["atenuado", "marca"];
  return [];
}
