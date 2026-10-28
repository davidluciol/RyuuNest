import { describe, expect, it } from "vitest";

import {
  MAX_ZOOM,
  NO_ZOOM,
  clampPan,
  distance,
  midpoint,
  pinchZoom,
  settleZoom,
} from "../../src/reader/zoomMath";

/**
 * F19 — zoom con pellizco (RF-23). Matemática pura con ejemplos calculados a mano: el origen de
 * la transformación es el centro del contenedor, así que el punto bajo los dedos se mantiene
 * fijo moviendo la traslación.
 */

const VIEWPORT = { width: 400, height: 600 };

describe("distance / midpoint", () => {
  it("miden la separación y el punto medio de dos dedos", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(midpoint({ x: 100, y: 200 }, { x: 300, y: 400 })).toEqual({ x: 200, y: 300 });
  });
});

describe("pinchZoom", () => {
  it("al doble de separación, el doble de escala; centrado no hay traslación", () => {
    const zoom = pinchZoom(
      NO_ZOOM,
      [{ x: 200, y: 250 }, { x: 200, y: 350 }],
      [{ x: 200, y: 200 }, { x: 200, y: 400 }],
      VIEWPORT,
    );

    expect(zoom).toEqual({ scale: 2, x: 0, y: 0 });
  });

  it("el punto bajo los dedos se queda donde estaba (zoom anclado, no al centro)", () => {
    const zoom = pinchZoom(
      NO_ZOOM,
      [{ x: 300, y: 250 }, { x: 300, y: 350 }],
      [{ x: 300, y: 200 }, { x: 300, y: 400 }],
      VIEWPORT,
    );

    // Dedos a +100 del centro (200, 300): al ×2 el contenido se corre -100 para seguirlos.
    expect(zoom).toEqual({ scale: 2, x: -100, y: 0 });
  });

  it("no pasa del zoom máximo", () => {
    const zoom = pinchZoom(
      NO_ZOOM,
      [{ x: 195, y: 300 }, { x: 205, y: 300 }],
      [{ x: 0, y: 300 }, { x: 400, y: 300 }],
      VIEWPORT,
    );

    expect(zoom.scale).toBe(MAX_ZOOM);
  });

  it("no baja de la escala 1 al juntar los dedos sin zoom previo", () => {
    const zoom = pinchZoom(
      NO_ZOOM,
      [{ x: 100, y: 300 }, { x: 300, y: 300 }],
      [{ x: 190, y: 300 }, { x: 210, y: 300 }],
      VIEWPORT,
    );

    expect(zoom).toEqual(NO_ZOOM);
  });

  it("mover los dos dedos sin cambiar la separación desplaza el contenido ampliado", () => {
    const start = { scale: 2, x: 0, y: 0 };

    const zoom = pinchZoom(
      start,
      [{ x: 150, y: 300 }, { x: 250, y: 300 }],
      [{ x: 200, y: 300 }, { x: 300, y: 300 }],
      VIEWPORT,
    );

    expect(zoom).toEqual({ scale: 2, x: 50, y: 0 });
  });

  it("con los dedos en el mismo punto no hay forma de medir el pellizco: no cambia nada", () => {
    const start = { scale: 1.5, x: 10, y: -10 };

    expect(
      pinchZoom(start, [{ x: 100, y: 100 }, { x: 100, y: 100 }], [{ x: 50, y: 50 }, { x: 300, y: 300 }], VIEWPORT),
    ).toEqual(start);
  });
});

describe("clampPan", () => {
  it("el contenido ampliado no deja huecos: la traslación se limita al exceso de tamaño", () => {
    expect(clampPan({ scale: 2, x: -999, y: 999 }, VIEWPORT)).toEqual({ scale: 2, x: -200, y: 300 });
    expect(clampPan({ scale: 2, x: 50, y: -50 }, VIEWPORT)).toEqual({ scale: 2, x: 50, y: -50 });
  });

  it("sin zoom no hay traslación posible", () => {
    expect(clampPan({ scale: 1, x: 40, y: -40 }, VIEWPORT)).toEqual(NO_ZOOM);
  });
});

describe("settleZoom", () => {
  it("al soltar, un zoom casi imperceptible vuelve a 1 y se centra", () => {
    expect(settleZoom({ scale: 1.03, x: 5, y: 5 })).toEqual(NO_ZOOM);
  });

  it("un zoom real se queda como está", () => {
    const zoom = { scale: 1.5, x: 20, y: -10 };

    expect(settleZoom(zoom)).toEqual(zoom);
  });
});
