import { markers, radii, spacing, typography, dragonNightColors, type TypeStyle } from "@ryuunest/ui-tokens";

/**
 * F08 — reglas de los estados vacío, error y carga (SPEC §11.12): cada estado
 * lleva el dragón marcador (pequeño en carga breve, mediano en vacío/error),
 * título en Manrope, una acción siguiente y, en el error, el detalle técnico
 * desplegable (módulo, URL, código, selector). Sin tarjetas-mascota (T4) y sin
 * sombras (RNF-12: profundidad por niveles de superficie).
 */

const colors = dragonNightColors;

/** Escala del dragón según el estado (§11.12): pequeño o mediano. */
export type StateScale = "sm" | "md";

export interface StateStyleShape {
  /** Tamaño del dragón marcador (tokens `markers`). */
  dragonSize: number;
  /** Separación entre dragón, título, mensaje y acción. */
  gap: number;
  /** Relleno del bloque centrado. */
  padding: number;
}

/** Estilo del bloque de estado según la escala del dragón. */
export function stateStyle(scale: StateScale): StateStyleShape {
  return {
    dragonSize: markers[scale],
    gap: spacing.md,
    padding: spacing.xl,
  };
}

/** Paleta del estado: dragon atenuado, título principal, acción accent. */
export function stateColors(): {
  dragon: string;
  title: string;
  message: string;
  action: string;
  error: string;
} {
  return {
    dragon: colors.textSecondary,
    title: colors.textPrimary,
    message: colors.textSecondary,
    action: colors.accent,
    error: colors.error,
  };
}

/** Título del estado, en Manrope (AC de F08). */
export function titleStyle(): TypeStyle {
  return typography.headlineSm;
}

/** Mensaje secundario del estado, en Inter. */
export function messageStyle(): TypeStyle {
  return typography.bodyMd;
}

/** Campos técnicos del error que muestra el detalle desplegable. */
export interface ErrorDetail {
  module?: string;
  url?: string;
  code?: string;
  selector?: string;
}

/** Líneas del detalle desplegable: solo los campos presentes, en orden fijo. */
export function detailLines(detail: ErrorDetail): string[] {
  const lines: string[] = [];
  if (detail.module !== undefined) lines.push(`módulo: ${detail.module}`);
  if (detail.url !== undefined) lines.push(`URL: ${detail.url}`);
  if (detail.code !== undefined) lines.push(`código: ${detail.code}`);
  if (detail.selector !== undefined) lines.push(`selector: ${detail.selector}`);
  return lines;
}

/** Caja del detalle desplegable: nivel `surface` con borde, sin sombra. */
export function detailBoxStyle(): {
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  backgroundColor: string;
  padding: number;
  shadowOpacity: 0;
  elevation: 0;
} {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    shadowOpacity: 0,
    elevation: 0,
  };
}

/** Texto de cada línea del detalle, en Inter pequeño. */
export function detailTextStyle(): TypeStyle {
  return typography.labelMd;
}
