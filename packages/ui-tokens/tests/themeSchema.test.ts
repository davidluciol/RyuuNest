import { describe, expect, it } from "vitest";

import { dragonNightColors } from "../src/colors";
import { THEME_COLOR_KEYS, THEME_SCHEMA_VERSION, validateTheme } from "../src/themeSchema";
import { dragonNight } from "../src/theme";

/** F89 — un tema es un JSON de tokens (sin código); se valida antes de aceptarlo. */
const valid = () => ({
  schemaVersion: THEME_SCHEMA_VERSION,
  id: "mi-tema",
  name: "Mi tema",
  colors: { ...dragonNightColors },
});

function errorsOf(input: unknown): string[] {
  const result = validateTheme(input);
  if (result.ok) throw new Error("se esperaba un tema inválido");
  return result.errors;
}

describe("validateTheme (F89)", () => {
  it("acepta un tema válido y devuelve id, nombre y colores", () => {
    const result = validateTheme(valid());
    expect(result).toEqual({
      ok: true,
      theme: { id: "mi-tema", name: "Mi tema", colors: dragonNightColors },
    });
  });

  it("Dragon Night (integrado) cumple el esquema", () => {
    const result = validateTheme({ schemaVersion: THEME_SCHEMA_VERSION, ...dragonNight });
    expect(result.ok).toBe(true);
  });

  it("expone los 14 colores semánticos", () => {
    expect(THEME_COLOR_KEYS).toHaveLength(14);
  });

  it("rechaza lo que no es un objeto", () => {
    for (const input of [null, 3, "x", []]) expect(errorsOf(input).length).toBeGreaterThan(0);
  });

  it("rechaza otra versión de esquema", () => {
    expect(errorsOf({ ...valid(), schemaVersion: 2 })[0]).toMatch(/schemaVersion/);
  });

  it("rechaza id que no es kebab-case y nombre vacío o larguísimo", () => {
    expect(errorsOf({ ...valid(), id: "Mi Tema" })[0]).toMatch(/id/);
    expect(errorsOf({ ...valid(), name: "  " })[0]).toMatch(/name/);
    expect(errorsOf({ ...valid(), name: "x".repeat(41) })[0]).toMatch(/name/);
  });

  it("rechaza claves desconocidas, también dentro de colors (nada de código)", () => {
    expect(errorsOf({ ...valid(), script: "alert(1)" })[0]).toMatch(/script/);
    const colors = { ...dragonNightColors, extra: "#ffffff" };
    expect(errorsOf({ ...valid(), colors })[0]).toMatch(/extra/);
  });

  it("rechaza colores ausentes o con formato inválido", () => {
    const { bg: _bg, ...sinBg } = dragonNightColors;
    expect(errorsOf({ ...valid(), colors: sinBg })[0]).toMatch(/bg/);
    expect(errorsOf({ ...valid(), colors: { ...dragonNightColors, bg: "red" } })[0]).toMatch(/bg/);
    expect(errorsOf({ ...valid(), colors: { ...dragonNightColors, bg: "#fff" } })[0]).toMatch(/bg/);
  });

  it("rechaza contraste insuficiente (WCAG AA) nombrando el par", () => {
    const colors = { ...dragonNightColors, textPrimary: "#1B2230" };
    const errors = errorsOf({ ...valid(), colors });
    expect(errors.some((e) => /textPrimary/.test(e) && /4[.,]5/.test(e))).toBe(true);
  });

  it("acumula todos los errores en vez de parar en el primero", () => {
    const errors = errorsOf({ ...valid(), id: "X", name: "" });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
