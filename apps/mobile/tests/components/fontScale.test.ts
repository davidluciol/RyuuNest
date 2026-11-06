import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { NAV_LABEL_MAX_FONT_SCALE } from "../../src/components/shellStyles";

/**
 * F34.3 — texto del sistema al 200 % (S25 Ultra): la cabecera no recorta su
 * título, los textos de explicación no acaban en «…» y las etiquetas de la
 * barra inferior no se parten a mitad de palabra.
 */
const read = (file: string) => readFileSync(join(__dirname, "../../src/components", file), "utf8");

describe("escala de texto del sistema al 200 %", () => {
  it("la cabecera crece con el texto en lugar de recortarlo", () => {
    expect(read("Header.tsx")).toMatch(/height:\s*"auto"/);
  });

  it("el mensaje del estado vacío no se trunca", () => {
    expect(read("EmptyState.tsx")).not.toMatch(/styles\.message[^>]*numberOfLines/);
  });

  it("la URL del repositorio no se trunca", () => {
    expect(read("RepoCard.tsx")).not.toMatch(/styles\.url[^>]*numberOfLines/);
  });

  it("las etiquetas de la barra inferior topan su escala para seguir en una línea", () => {
    expect(NAV_LABEL_MAX_FONT_SCALE).toBeGreaterThan(1);
    expect(NAV_LABEL_MAX_FONT_SCALE).toBeLessThanOrEqual(1.5);
    expect(read("BottomNav.tsx")).toMatch(/maxFontSizeMultiplier=\{NAV_LABEL_MAX_FONT_SCALE\}/);
  });
});
