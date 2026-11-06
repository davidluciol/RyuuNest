import { dragonNightColors, radii, spacing, touchTarget } from "@ryuunest/ui-tokens";

/**
 * F34.2 — estilo del interruptor propio (sustituye al `Switch` nativo de F16b,
 * que no admite borde y dejaba la pista apagada casi invisible). Apagado:
 * relleno `elevated`, borde `textSecondary` (≥ 3:1 sobre `bg` y `surface`) y
 * pulgar `textSecondary`; encendido: `accent` con pulgar `bg` (oscuro sobre
 * `accent`, DESIGN_RULES). El estado no depende solo del color: junto al
 * control va el texto «Sí»/«No» (`switchLabelKey`). Puro y testeable sin Metro.
 */

const colors = dragonNightColors;

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const BORDER_WIDTH = 2;
const THUMB_SIZE = 20;
const DISABLED_OPACITY = 0.4;

export interface SwitchStyleShape {
  track: {
    width: number;
    height: number;
    borderRadius: number;
    borderWidth: number;
    backgroundColor: string;
    borderColor: string;
  };
  thumb: {
    size: number;
    backgroundColor: string;
    /** Desplazamiento horizontal dentro del borde de la pista. */
    left: number;
  };
  /** Margen táctil extra arriba y abajo para llegar a 48 dp. */
  hitSlop: number;
  /** Alto total del área pulsable. */
  hitHeight: number;
  opacity: number;
}

export function switchStyle(value: boolean, disabled = false): SwitchStyleShape {
  const inner = TRACK_WIDTH - BORDER_WIDTH * 2;
  const inset = spacing.xxs;
  const hitSlop = Math.max(0, (touchTarget.min - TRACK_HEIGHT) / 2);
  return {
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: radii.pill,
      borderWidth: BORDER_WIDTH,
      backgroundColor: value ? colors.accent : colors.elevated,
      borderColor: value ? colors.accent : colors.textSecondary,
    },
    thumb: {
      size: THUMB_SIZE,
      backgroundColor: value ? colors.bg : colors.textSecondary,
      left: value ? inner - THUMB_SIZE - inset : inset,
    },
    hitSlop,
    hitHeight: TRACK_HEIGHT + hitSlop * 2,
    opacity: disabled ? DISABLED_OPACITY : 1,
  };
}

/** Clave del catálogo para el texto de estado junto al interruptor. */
export function switchLabelKey(value: boolean): "switch.on" | "switch.off" {
  return value ? "switch.on" : "switch.off";
}
