import { describe, expect, it } from "vitest";

import { breakpoints, coverAspectRatio, densities, touchTarget } from "../src/density";
import { type BreakpointName, layoutForWidth } from "../src/layout";
import { radii } from "../src/radii";
import { spacing } from "../src/spacing";

/**
 * F01 — espaciado (rejilla de 4 px), radios y densidades de SPEC §11.9.
 * La escala por punto de corte y el helper de densidad completos llegan en F04;
 * aquí solo viven los tokens base.
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
