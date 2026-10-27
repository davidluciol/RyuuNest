import { radii, spacing, touchTarget, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F16 — reglas del botón de mantener pulsado (`HoldToConfirm`), separadas del
 * componente para probarlas sin Metro (patrón de F06). Confirmación reforzada
 * de los módulos `script` (SPEC §7.1, paso 3). Puras, todo desde `ui-tokens`.
 */

const colors = dragonNightColors;

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

/** Contenedor: área táctil 48 dp (RNF-7); `overflow` evita que el relleno se salga. */
export function holdToConfirmStyle(): HoldToConfirmStyleShape {
  return {
    minHeight: touchTarget.min,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.elevated,
    borderColor: colors.border,
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
 * Color del texto: oscuro (`bg`) mientras el relleno de `progress` lo cubre
 * (contraste, SPEC §11.9) y principal en reposo sobre `elevated`.
 */
export function holdToConfirmTextColor(holding: boolean): string {
  return holding ? colors.bg : colors.textPrimary;
}
