import { describe, expect, it } from "vitest";

import {
  READER_MAX_WIDTH,
  SWIPE_MIN_DISTANCE,
  columnWidth,
  isAtScrollEnd,
  percentOf,
  swipeActionFor,
  tapActionFor,
  tapZoneAt,
} from "../../src/reader/readerLayout";

/**
 * F18 — zonas táctiles y porcentaje del lector (RF-19, RF-41). Lógica pura: la
 * pantalla solo traduce el toque (x, ancho) a una acción.
 */

describe("tapZoneAt", () => {
  it("reparte el ancho en izquierda, centro y derecha (3/6/3 de 12 columnas)", () => {
    expect(tapZoneAt(0, 400)).toBe("left");
    expect(tapZoneAt(99, 400)).toBe("left");
    expect(tapZoneAt(100, 400)).toBe("center");
    expect(tapZoneAt(200, 400)).toBe("center");
    expect(tapZoneAt(299, 400)).toBe("center");
    expect(tapZoneAt(300, 400)).toBe("right");
    expect(tapZoneAt(400, 400)).toBe("right");
  });

  it("sin ancho conocido, toda la pantalla es el centro (nunca cambia de página por error)", () => {
    expect(tapZoneAt(10, 0)).toBe("center");
  });
});

describe("tapActionFor", () => {
  it("en paginado el centro siempre muestra u oculta los controles (RF-19)", () => {
    for (const mode of ["paged-ltr", "paged-rtl"] as const) {
      expect(tapActionFor("center", mode, true)).toBe("toggleControls");
      expect(tapActionFor("center", mode, false)).toBe("toggleControls");
    }
  });

  it("paginado I→D: izquierda retrocede y derecha avanza", () => {
    expect(tapActionFor("left", "paged-ltr", false)).toBe("previous");
    expect(tapActionFor("right", "paged-ltr", false)).toBe("next");
  });

  it("paginado D→I: las laterales se invierten (RF-19)", () => {
    expect(tapActionFor("left", "paged-rtl", false)).toBe("next");
    expect(tapActionFor("right", "paged-rtl", false)).toBe("previous");
  });

  it("F51 webtoon: un toque nunca pasa de página; solo oculta las barras visibles", () => {
    for (const zone of ["left", "center", "right"] as const) {
      expect(tapActionFor(zone, "vertical", true)).toBe("toggleControls");
      expect(tapActionFor(zone, "vertical", false)).toBe("none");
    }
  });
});

describe("swipeActionFor (F51)", () => {
  const far = SWIPE_MIN_DISTANCE + 1;

  it("I→D: el dedo hacia la izquierda avanza y hacia la derecha retrocede", () => {
    expect(swipeActionFor(-far, 0, "paged-ltr")).toBe("next");
    expect(swipeActionFor(far, 0, "paged-ltr")).toBe("previous");
  });

  it("D→I: se invierte", () => {
    expect(swipeActionFor(-far, 0, "paged-rtl")).toBe("previous");
    expect(swipeActionFor(far, 0, "paged-rtl")).toBe("next");
  });

  it("ignora movimientos cortos o poco horizontales", () => {
    expect(swipeActionFor(SWIPE_MIN_DISTANCE - 1, 0, "paged-ltr")).toBeNull();
    expect(swipeActionFor(far, far, "paged-ltr")).toBeNull();
  });

  it("en webtoon no hay deslizar horizontal", () => {
    expect(swipeActionFor(-far * 3, 0, "vertical")).toBeNull();
  });
});

describe("isAtScrollEnd (F51)", () => {
  it("es verdadero solo cuando el final del contenido está a la vista", () => {
    expect(isAtScrollEnd(1000, 800, 1800)).toBe(true);
    expect(isAtScrollEnd(990, 800, 1800)).toBe(true);
    expect(isAtScrollEnd(500, 800, 1800)).toBe(false);
  });

  it("sin medidas no hay final", () => {
    expect(isAtScrollEnd(0, 0, 0)).toBe(false);
  });
});

describe("percentOf", () => {
  it("es page_index / page_total sobre 100 (RF-41), redondeado", () => {
    expect(percentOf(0, 10)).toBe(0);
    expect(percentOf(4, 10)).toBe(40);
    expect(percentOf(1, 3)).toBe(33);
  });

  it("la última página cuenta como 100 %: el capítulo está terminado", () => {
    expect(percentOf(9, 10)).toBe(100);
  });

  it("sin total de páginas no hay porcentaje", () => {
    expect(percentOf(3, null)).toBeNull();
    expect(percentOf(3, 0)).toBeNull();
  });
});

describe("columnWidth", () => {
  it("en móvil la página ocupa todo el ancho", () => {
    expect(columnWidth(426)).toBe(426);
  });

  it("en pantallas anchas se limita a una columna de lectura (SPEC §9: límite de ancho)", () => {
    expect(columnWidth(1440)).toBe(READER_MAX_WIDTH);
    expect(READER_MAX_WIDTH).toBeGreaterThan(426);
    expect(READER_MAX_WIDTH).toBeLessThan(1440);
  });
});
