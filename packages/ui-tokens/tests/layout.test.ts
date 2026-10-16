import { describe, expect, it } from "vitest";

import { breakpoints, coverAspectRatio, densities, touchTarget } from "../src/density";
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
