import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * T7 — la ficha muestra el título completo (y los títulos alternativos): sin
 * `numberOfLines`, el texto crece en lugar de acabar en «…». La portada se
 * pide con las cabeceras del módulo (anti-hotlink).
 */
const source = readFileSync(resolve(__dirname, "../../src/screens/series/SeriesScreen.tsx"), "utf8");

describe("ficha de serie · título sin recortes (T7)", () => {
  it("el título no se trunca", () => {
    expect(source).not.toMatch(/styles\.title[^>]*numberOfLines/);
  });

  it("los títulos alternativos no se truncan", () => {
    expect(source).not.toMatch(/styles\.meta[^>]*numberOfLines/);
  });

  it("la portada lleva las cabeceras del módulo", () => {
    expect(source).toMatch(/headers:\s*details\.cover\.headers/);
  });
});
