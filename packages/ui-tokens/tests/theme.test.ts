import { describe, expect, it } from "vitest";

import { THEME_SCHEMA_VERSION, validateTheme } from "../src/themeSchema";
import { defaultTheme, dragonNight, getTheme, themes } from "../src/theme";

/**
 * F01 — estructura de temas (P2-2): la v1 trae solo Dragon Night, pero el sistema
 * de temas debe permitir añadir otros sin cambiar los componentes.
 */
describe("temas (SPEC §11.9)", () => {
  it("Dragon Night existe y reutiliza los 14 colores semánticos", () => {
    expect(dragonNight.id).toBe("dragon-night");
    expect(dragonNight.name).toBe("Dragon Night");
    expect(dragonNight.colors.bg).toBe("#0B0E14");
    expect(Object.keys(dragonNight.colors)).toHaveLength(14);
  });

  it("el registro `themes` trae Dragon Night primero y los temas integrados", () => {
    expect(Object.keys(themes)).toEqual(["dragon-night", "medianoche", "brasa", "amatista"]);
    expect(themes["dragon-night"]).toBe(dragonNight);
  });

  it("todos los temas integrados cumplen el esquema (contraste AA incluido)", () => {
    for (const theme of Object.values(themes)) {
      const result = validateTheme({ schemaVersion: THEME_SCHEMA_VERSION, ...theme });
      expect(result.ok, `${theme.id}: ${result.ok ? "" : result.errors.join("; ")}`).toBe(true);
    }
  });

  it("`defaultTheme` es Dragon Night", () => {
    expect(defaultTheme).toBe(dragonNight);
  });

  it("`getTheme` devuelve el tema por id o undefined", () => {
    expect(getTheme("dragon-night")).toBe(dragonNight);
    expect(getTheme("otro-tema")).toBeUndefined();
  });
});
