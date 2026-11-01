import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { catalogKeys } from "@ryuunest/i18n";

/**
 * Puertas de calidad sobre las fuentes de `apps/web/src` (F24):
 * 1. Los CSS escritos a mano no llevan colores ni medidas literales: todo sale
 *    de los tokens generados (AC-13; se admiten 0/1/2 px estructurales).
 * 2. Los iconos solo entran por el punto único `src/icons.ts` (DESIGN_RULES V4).
 * 3. Toda clave usada con `t("…")` existe en el catálogo (RF-40, P-11).
 */

const SRC = path.resolve(process.cwd(), "src");

function sourceFiles(dir: string = SRC, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else out.push(full);
  }
  return out;
}

describe("puertas de apps/web/src", () => {
  it("los CSS no llevan literales de color ni medidas (salvo 0/1/2 px)", () => {
    const cssFiles = sourceFiles().filter((file) => file.endsWith(".css"));
    expect(cssFiles.length).toBeGreaterThan(0);
    for (const file of cssFiles) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file}: color literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/i);
      for (const measure of text.match(/\d+(?:\.\d+)?px/g) ?? []) {
        expect(["0px", "1px", "2px"], `${file}: medida literal ${measure}`).toContain(measure);
      }
    }
  });

  it("ninguna pantalla importa lucide-react a mano (V4)", () => {
    for (const file of sourceFiles().filter((f) => /\.tsx?$/.test(f))) {
      if (file.endsWith(`${path.sep}icons.ts`)) continue;
      expect(
        readFileSync(file, "utf8").includes('from "lucide-react"'),
        `${file}: importa lucide-react directo`,
      ).toBe(false);
    }
  });

  it("toda clave usada con t() existe en el catálogo", () => {
    const keys = new Set(catalogKeys());
    for (const file of sourceFiles().filter((f) => /\.tsx?$/.test(f))) {
      for (const match of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([^"]+)"/g)) {
        expect(keys.has(match[1] ?? ""), `${file}: clave sin traducir «${match[1]}»`).toBe(true);
      }
    }
  });
});
