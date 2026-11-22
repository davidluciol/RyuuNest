import { spacing } from "@ryuunest/ui-tokens";

/**
 * F22 — densidad TV del shell. Puro (sin `react-native`) para Vitest: quien
 * llama pasa `Platform.isTV` y el `userAgent`.
 */

/** TV nativa (`Platform.isTV`, Android `uiMode`) o navegador de TV por `userAgent` (P-99). */
export function isTvDevice(
  platformIsTv: boolean | undefined,
  userAgent: string | undefined,
): boolean {
  return platformIsTv === true || /\bTV\b|SmartTV|SMART-TV/i.test(userAgent ?? "");
}

/**
 * Siguiente destino del riel vertical con flechas (D-pad en web). Sin vuelta:
 * se detiene en los extremos como la búsqueda de foco nativa de Android.
 */
export function nextRailIndex(current: number, key: string, count: number): number | null {
  if (current < 0) return null;
  if (key === "ArrowDown") return Math.min(current + 1, count - 1);
  if (key === "ArrowUp") return Math.max(current - 1, 0);
  return null;
}

/**
 * Márgenes seguros de TV (overscan). shortcut: tokens de la rejilla más cercanos a la guía de
 * Android TV (48 × 27 dp); se ajustan al medir en la MiBox 4.
 */
export const TV_SAFE_MARGINS = {
  paddingHorizontal: spacing["2xl"],
  paddingVertical: spacing.xl,
} as const;
