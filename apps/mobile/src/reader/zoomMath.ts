/**
 * F19 — zoom con pellizco (RF-23). Matemática pura. La transformación aplica la traslación y
 * luego la escala con origen en el **centro** del contenedor, así que para que el punto bajo los
 * dedos no se mueva basta con ajustar la traslación.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Zoom {
  scale: number;
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export const NO_ZOOM: Zoom = { scale: 1, x: 0, y: 0 };

/** Escala máxima del pellizco. Provisional: se afina en el dispositivo (P-45). */
export const MAX_ZOOM = 4;

/** Por debajo de esta escala el zoom se considera imperceptible y se deshace al soltar. */
const SETTLE_BELOW = 1.05;

/** Evita `-0`, que `Object.is` distingue de `0`. */
function clean(value: number): number {
  return value + 0;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** La traslación máxima es la mitad del exceso de tamaño: el contenido ampliado no deja huecos. */
export function clampPan(zoom: Zoom, viewport: Viewport): Zoom {
  const maxX = (viewport.width * (zoom.scale - 1)) / 2;
  const maxY = (viewport.height * (zoom.scale - 1)) / 2;
  return {
    scale: zoom.scale,
    x: clean(Math.max(-maxX, Math.min(maxX, zoom.x))),
    y: clean(Math.max(-maxY, Math.min(maxY, zoom.y))),
  };
}

/**
 * Zoom tras mover dos dedos desde `startTouches` hasta `touches`: la escala sale de la razón de
 * separaciones (entre 1 y `MAX_ZOOM`) y la traslación mantiene bajo los dedos el punto que
 * tocaban al empezar, lo que también cubre el desplazamiento con dos dedos.
 */
export function pinchZoom(
  start: Zoom,
  startTouches: readonly [Point, Point],
  touches: readonly [Point, Point],
  viewport: Viewport,
): Zoom {
  const startDistance = distance(startTouches[0], startTouches[1]);
  if (startDistance === 0) return start;

  const scale = Math.max(1, Math.min(MAX_ZOOM, (start.scale * distance(touches[0], touches[1])) / startDistance));
  const center = { x: viewport.width / 2, y: viewport.height / 2 };
  const from = midpoint(startTouches[0], startTouches[1]);
  const to = midpoint(touches[0], touches[1]);
  const ratio = scale / start.scale;

  return clampPan(
    {
      scale,
      x: to.x - center.x - ratio * (from.x - center.x - start.x),
      y: to.y - center.y - ratio * (from.y - center.y - start.y),
    },
    viewport,
  );
}

/** Al soltar los dedos: un zoom casi imperceptible vuelve a 1 y se centra. */
export function settleZoom(zoom: Zoom): Zoom {
  return zoom.scale < SETTLE_BELOW ? NO_ZOOM : zoom;
}
