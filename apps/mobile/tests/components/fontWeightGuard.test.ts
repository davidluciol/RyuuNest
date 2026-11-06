import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F34.1 — cada peso tipográfico es su propio archivo (SPEC §11.3) y
 * `textStyle()` fija `fontWeight: "normal"`. Un `fontWeight: "600"` encima pide
 * negrita sintética sobre un archivo Regular o Medium (se ve borrosa y distinta
 * en web, Android e iOS). El peso se elige con el token (`labelLg` 600,
 * `labelMd` 500…), nunca con un literal.
 *
 * `ImageCapPanel.tsx` es la herramienta de calibración de desarrollo (T05) y no
 * es interfaz del producto.
 */

const SRC = join(__dirname, "..", "..", "src");
const EXEMPT = new Set(["components/textStyle.ts", "ImageCapPanel.tsx"]);

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

describe("pesos tipográficos (F34.1)", () => {
  it("ningún estilo de src fija fontWeight en bruto", () => {
    const offenders = sources(SRC)
      .map((file) => relative(SRC, file).replaceAll("\\", "/"))
      .filter((file) => !EXEMPT.has(file))
      .flatMap((file) =>
        readFileSync(join(SRC, file), "utf8")
          .split(/\r?\n/)
          .flatMap((line, index) =>
            /\bfontWeight\s*:\s*["']/.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [],
          ),
      );
    expect(offenders).toEqual([]);
  });
});
