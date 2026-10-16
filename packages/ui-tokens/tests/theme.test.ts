import { describe, expect, it } from "vitest";

import { defaultTheme, dragonNight, getTheme, themes } from "../src/theme";

/**
 * F01 — estructura de temas (P2-2): la v1 trae solo Dragon Night, pero el sistema
 * de temas debe permitir añadir otros sin cambiar los componentes.
 */
describe("temas (SPEC §11.9)", () => {
  it("Dragon Night existe y reutiliza los 13 colores semánticos", () => {
    expect(dragonNight.id).toBe("dragon-night");
    expect(dragonNight.name).toBe("Dragon Night");
    expect(dragonNight.colors.bg).toBe("#0B0E14");
    expect(Object.keys(dragonNight.colors)).toHaveLength(13);
  });

  it("el registro `themes` expone Dragon Night como único tema de la v1", () => {
    expect(Object.keys(themes)).toEqual(["dragon-night"]);
    expect(themes["dragon-night"]).toBe(dragonNight);
  });

  it("`defaultTheme` es Dragon Night", () => {
    expect(defaultTheme).toBe(dragonNight);
  });

  it("`getTheme` devuelve el tema por id o undefined", () => {
    expect(getTheme("dragon-night")).toBe(dragonNight);
    expect(getTheme("otro-tema")).toBeUndefined();
  });
});
