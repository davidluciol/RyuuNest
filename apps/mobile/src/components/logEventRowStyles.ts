import { dragonNightColors, radii, spacing } from "@ryuunest/ui-tokens";

/**
 * F30 — reglas de la fila de evento del registro de diagnóstico (FB2, P-72).
 * Lógica de color y forma sin React Native, para probarla sin Metro.
 */

const colors = dragonNightColors;

/** Tono semántico del evento (error / aviso / neutro). */
export type LogEventTone = "error" | "warning" | "neutral";

/** Tamaño del icono de nivel (tamaño estándar de icono, 24 px). */
export const LOG_EVENT_ICON_SIZE = 24;

/** Color del icono y de la etiqueta de nivel; el nivel siempre lleva también texto. */
export function logEventToneColor(tone: LogEventTone): string {
  if (tone === "error") return colors.error;
  if (tone === "warning") return colors.warning;
  return colors.textSecondary;
}

export interface LogEventRowShape {
  paddingHorizontal: number;
  paddingVertical: number;
  gap: number;
}

/** Fila: relleno 16 × 12 y separación de 12 entre icono y texto. */
export function logEventRowStyle(): LogEventRowShape {
  return {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  };
}

export interface LogEventDetailBoxShape {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  gap: number;
}

/** Caja del detalle: nivel 0 con borde (igual que el detalle de errores). */
export function logEventDetailBoxStyle(): LogEventDetailBoxShape {
  return {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.control,
    padding: spacing.sm,
    gap: spacing.xxs,
  };
}
