import { dragonNightColors, withAlpha } from "@ryuunest/ui-tokens";

/**
 * F34.3 — lógica pura de la pista de desplazamiento de las filas de chips
 * (Fuentes, Biblioteca): se pinta un degradado en el borde que aún tiene
 * contenido oculto, y nunca si todo cabe.
 */

/** Holgura para el redondeo de medidas de layout (medio píxel). */
const EDGE_TOLERANCE = 1;

export interface ScrollMeasure {
  offset: number;
  contentWidth: number;
  viewportWidth: number;
}

export interface ScrollFade {
  start: boolean;
  end: boolean;
}

export function scrollFadeState({
  offset,
  contentWidth,
  viewportWidth,
}: ScrollMeasure): ScrollFade {
  const overflow = contentWidth - viewportWidth;
  if (viewportWidth <= 0 || overflow <= EDGE_TOLERANCE) {
    return { start: false, end: false };
  }
  return {
    start: offset > EDGE_TOLERANCE,
    end: offset < overflow - EDGE_TOLERANCE,
  };
}

/** Del fondo opaco al mismo fondo transparente (sin gris intermedio). */
export function fadeColors(): readonly [string, string] {
  return [withAlpha(dragonNightColors.bg, 1), withAlpha(dragonNightColors.bg, 0)];
}
