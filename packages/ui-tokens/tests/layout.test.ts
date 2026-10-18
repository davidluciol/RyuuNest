import { describe, expect, it } from "vitest";

import { breakpoints, coverAspectRatio, densities, touchTarget } from "../src/density";
import { type BreakpointName, densityLayout, layoutForWidth } from "../src/layout";
import { radii } from "../src/radii";
import { spacing } from "../src/spacing";
import { typography } from "../src/typography";

/**
 * F01 — espaciado (rejilla de 4 px), radios y densidades de SPEC §11.9.
 * F04 añadió encima la escala tipográfica por factor, el layout por punto de
 * corte y el helper de densidad completo.
 */
describe("espaciado (rejilla de 4 px, SPEC §11.9)", () => {
  it("expone los 7 pasos nombrados con sus valores", () => {
    expect(Object.keys(spacing)).toEqual(["xxs", "xs", "sm", "md", "lg", "xl", "2xl"]);
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 24, 32, 48]);
  });

  it("todo paso es múltiplo de 4", () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
  });
});

describe("radios (SPEC §11.9)", () => {
  it("los radios semánticos coinciden con el diseño", () => {
    expect(radii).toMatchObject({
      checkbox: 4, // casillas
      control: 8, // campos, botones, filas, insignias en línea
      card: 12, // tarjetas
      cover: 12, // portadas
      sheet: 16, // esquinas superiores de hojas y diálogos
      pill: 9999, // chips e insignias de estado
    });
  });
});

describe("densidades y constantes de layout (SPEC §11.9)", () => {
  it("las tres densidades: compacta (web), cómoda (móvil) y TV", () => {
    expect(Object.keys(densities)).toEqual(["compact", "comfortable", "tv"]);
  });

  it("TV multiplica los tamaños por 1,25 y el resto por 1", () => {
    expect(densities.compact.fontScale).toBe(1);
    expect(densities.comfortable.fontScale).toBe(1);
    expect(densities.tv.fontScale).toBe(1.25);
  });

  it("márgenes por punto de corte: <600 → 16, 600–1024 → 24, >1024 → 32", () => {
    expect(breakpoints).toMatchObject({ mobileMax: 600, tabletMax: 1024 });
    expect(breakpoints.margin.mobile).toBe(16);
    expect(breakpoints.margin.tablet).toBe(24);
    expect(breakpoints.margin.desktop).toBe(32);
  });

  it("área táctil mínima de 48 dp y portadas 2:3", () => {
    expect(touchTarget.min).toBe(48);
    expect(coverAspectRatio).toMatchObject({ width: 2, height: 3 });
  });
});

/**
 * F04 — layout por punto de corte (SPEC §11.9): móvil < 600 (margen 16,
 * separación 12, 2–3 columnas), tablet 600–1024 (margen 24, separación 16 —
 * decisión del humano, el SPEC no la fijaba —, 4–6 columnas), escritorio
 * > 1024 (margen 32, separación 24, riel de 240 y 8 columnas).
 */
describe("layoutForWidth (puntos de corte y márgenes, SPEC §11.9)", () => {
  it("móvil: < 600 px da margen 16, separación 12 y 2–3 columnas", () => {
    expect(layoutForWidth(375)).toMatchObject({
      breakpoint: "mobile",
      margin: 16,
      gap: 12,
      rail: 0,
      columns: { min: 2, max: 3 },
    });
  });

  it("tablet: 600–1024 px da margen 24, separación 16 y 4–6 columnas", () => {
    expect(layoutForWidth(600)).toMatchObject({
      breakpoint: "tablet",
      margin: 24,
      gap: 16,
      rail: 0,
      columns: { min: 4, max: 6 },
    });
    expect(layoutForWidth(1024)).toMatchObject({
      breakpoint: "tablet",
      margin: 24,
      gap: 16,
    });
  });

  it("escritorio: > 1024 px da margen 32, separación 24, riel 240 y 8 columnas", () => {
    expect(layoutForWidth(1025)).toMatchObject({
      breakpoint: "desktop",
      margin: 32,
      gap: 24,
      rail: 240,
      columns: { min: 8, max: 8 },
    });
    expect(layoutForWidth(1920)).toMatchObject({ breakpoint: "desktop", margin: 32 });
  });

  it("los límites: móvil hasta 599, tablet 600–1024 inclusive, escritorio desde 1025", () => {
    expect(layoutForWidth(599).breakpoint).toBe<BreakpointName>("mobile");
    expect(layoutForWidth(600).breakpoint).toBe<BreakpointName>("tablet");
    expect(layoutForWidth(1024).breakpoint).toBe<BreakpointName>("tablet");
    expect(layoutForWidth(1025).breakpoint).toBe<BreakpointName>("desktop");
  });

  it("márgenes y separaciones salen de la rejilla de 4 px", () => {
    for (const width of [375, 800, 1440]) {
      const { margin, gap } = layoutForWidth(width);
      expect(margin % 4).toBe(0);
      expect(gap % 4).toBe(0);
    }
  });
});

/**
 * F04 — helper de densidad: expone espaciado, márgenes y escala tipográfica
 * según la densidad elegida (compacta/web, cómoda/móvil, TV) y el ancho.
 * En TV los tamaños de texto se multiplican por 1,25 (SPEC §11.9); el
 * espaciado sigue en la rejilla de 4 px en las tres densidades, porque el
 * factor TV es tipográfico y la rejilla no se rompe.
 */
describe("densityLayout (compacta / cómoda / TV)", () => {
  it("exponen espaciado, márgenes y escala tipográfica", () => {
    const layout = densityLayout("comfortable", 375);
    expect(layout.spacing).toBe(spacing);
    expect(layout.margin).toBe(16);
    expect(Object.keys(layout.typography)).toEqual(Object.keys(typography));
  });

  it("compacta y cómoda usan factor 1: la tipografía es la base de §11.9", () => {
    expect(densityLayout("compact", 1440).fontScale).toBe(1);
    expect(densityLayout("compact", 1440).typography).toEqual(typography);
    expect(densityLayout("comfortable", 375).fontScale).toBe(1);
    expect(densityLayout("comfortable", 375).typography).toEqual(typography);
  });

  it("TV multiplica todos los tamaños por 1,25 sobre la misma rejilla", () => {
    const tv = densityLayout("tv", 375);
    expect(tv.fontScale).toBe(1.25);
    expect(tv.typography.displayLg.fontSize).toBe(50);
    expect(tv.typography.displayLg.lineHeight).toBe(60);
    expect(tv.typography.bodySm.fontSize).toBe(16); // 13 × 1,25 = 16,25 → 16
    // El espaciado NO se escala: la rejilla de 4 px es intocable.
    expect(tv.spacing).toBe(spacing);
  });

  it("los márgenes los manda el ancho también en TV", () => {
    expect(densityLayout("tv", 375).margin).toBe(16);
    expect(densityLayout("tv", 800).margin).toBe(24);
    expect(densityLayout("compact", 1440)).toMatchObject({ margin: 32, gap: 24, rail: 240 });
  });
});
