import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * T7 — ningún título acaba en «…»: el texto crece en lugar de recortarse.
 * Guarda de fuente (mismo estilo que `fontScale.test.ts`).
 */
const src = (path: string) => readFileSync(resolve(__dirname, "../../src", path), "utf8");

describe("títulos sin «…» (T7)", () => {
  it("ContinueCard: título y meta sin tope de líneas", () => {
    const code = src("components/ContinueCard.tsx");
    expect(code).not.toMatch(/styles\.title[^>]*numberOfLines/);
    expect(code).not.toMatch(/styles\.meta[^>]*numberOfLines/);
  });

  it("ChapterRow: título y pista sin tope de líneas", () => {
    const code = src("components/ChapterRow.tsx");
    expect(code).not.toMatch(/styles\.title[^>]*numberOfLines/);
    expect(code).not.toMatch(/styles\.hint[^>]*numberOfLines/);
  });

  it("ReaderBars: el título del lector sin tope de líneas", () => {
    expect(src("screens/reader/ReaderBars.tsx")).not.toMatch(/styles\.title[^>]*numberOfLines/);
  });
});
