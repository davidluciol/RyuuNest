import { describe, expect, it } from "vitest";

import {
  READER_MAX_WIDTH,
  columnWidth,
  percentOf,
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
  it("el centro siempre muestra u oculta los controles (RF-19)", () => {
    for (const mode of ["vertical", "paged-ltr", "paged-rtl"] as const) {
      expect(tapActionFor("center", mode)).toBe("toggleControls");
    }
  });

  it("paginado I→D: izquierda retrocede y derecha avanza", () => {
    expect(tapActionFor("left", "paged-ltr")).toBe("previous");
    expect(tapActionFor("right", "paged-ltr")).toBe("next");
  });

  it("paginado D→I: las laterales se invierten (RF-19)", () => {
    expect(tapActionFor("left", "paged-rtl")).toBe("next");
    expect(tapActionFor("right", "paged-rtl")).toBe("previous");
  });

  it("vertical continuo: no se invierten, el contenido avanza hacia abajo", () => {
    expect(tapActionFor("left", "vertical")).toBe("previous");
    expect(tapActionFor("right", "vertical")).toBe("next");
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
