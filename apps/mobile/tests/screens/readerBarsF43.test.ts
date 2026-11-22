import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F43 — barras del lector móvil (decisiones del humano, 2026-11-21):
 * N17: un solo indicador en la barra de abajo («Pág. X / N»; sin «%», queda la barra fina).
 * R11: sin botones ‹ › (repiten el toque lateral y el deslizar).
 * R10: nombres de modo sin flechas: «Derecha a izquierda (manga)» / «Izquierda a derecha (cómic)».
 * Sin Metro: se fija la estructura del código; el render lo verifica Playwright.
 */
const root = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.resolve(root, file), "utf8");
const es = JSON.parse(read("../../packages/i18n/src/es.json")) as Record<string, string>;

describe("barra inferior del lector (F43)", () => {
  const bars = read("src/screens/reader/ReaderBars.tsx");

  it("N17: no pinta el porcentaje junto a «Pág. X / N»", () => {
    expect(bars).toMatch(/reader\.page\.indicator/);
    expect(bars).not.toMatch(/reader\.progress\.percent/);
  });

  it("R11: no tiene botones de página anterior/siguiente", () => {
    expect(bars).not.toMatch(/reader\.page\.previous/);
    expect(bars).not.toMatch(/reader\.page\.next/);
  });
});

describe("nombres de modo (F43 R10)", () => {
  it("sin flechas y con el tipo de obra entre paréntesis", () => {
    expect(es["reader.mode.pagedRtl"]).toBe("Derecha a izquierda (manga)");
    expect(es["reader.mode.pagedLtr"]).toBe("Izquierda a derecha (cómic)");
  });
});
