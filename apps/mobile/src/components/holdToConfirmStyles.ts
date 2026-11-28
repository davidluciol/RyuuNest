import { radii, spacing, touchTarget, activeColors } from "@ryuunest/ui-tokens";

/**
 * F16 — reglas del botón de mantener pulsado (`HoldToConfirm`), separadas del
 * componente para probarlas sin Metro (patrón de F06). Confirmación reforzada
 * de los módulos `script` (SPEC §7.1, paso 3). Puras, todo desde `ui-tokens`.
 */

const colors = activeColors;

/** Cuánto hay que mantener pulsado: lo bastante largo para no ser accidental. */
export const HOLD_DURATION_MS = 1200;

/** Escala (0 a 1) del relleno según el tiempo pulsado; solo `transform` (Regla 4). */
export function holdFillScale(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / HOLD_DURATION_MS));
}

export interface HoldToConfirmStyleShape {
  minHeight: number;
  borderRadius: number;
  paddingHorizontal: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  overflow: "hidden";
}

/**
 * Contenedor: área táctil 48 dp (RNF-7); `overflow` evita que el relleno se salga.
 * F42/V3: es la acción primaria de la hoja, así que va en `accent` (V1, un solo
 * primario por pantalla), igual que en la web.
 */
export function holdToConfirmStyle(): HoldToConfirmStyleShape {
  return {
    minHeight: touchTarget.min,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderWidth: 1,
    overflow: "hidden",
  };
}

export interface HoldTrackStyleShape {
  position: "absolute";
  left: number;
  top: number;
  bottom: number;
  right: number;
  backgroundColor: string;
}

/** Relleno de progreso: `progress` (atención, SPEC §11.9) sobre todo el botón. */
export function holdTrackStyle(): HoldTrackStyleShape {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: colors.progress,
  };
}

/**
 * Color del texto: oscuro (`bg`) siempre, tinta de `accent` en reposo y de
 * `progress` mientras el relleno lo cubre (contraste, SPEC §11.9).
 */
export function holdToConfirmTextColor(): string {
  return colors.bg;
}
