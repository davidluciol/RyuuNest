import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { catalogKeys, catalogs, defaultLocale } from "../../../packages/i18n/src/index.ts";

/**
 * F26 — puertas de calidad sobre `apps/extension/src` (mismas que `apps/web`):
 * 1. Los CSS no llevan colores ni medidas literales: todo sale de los tokens (AC-13).
 * 2. Toda clave usada con `t("…")` existe en el catálogo (RF-40).
 * 3. Ninguna cadena del catálogo está escrita a mano en el código (P-11).
 *
 * Es `.mjs` para usar `node:*` sin añadir `@types/node` a la extensión.
 */
const SRC = fileURLToPath(new URL("../src", import.meta.url));

function sourceFiles(dir = SRC, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else out.push(full);
  }
  return out;
}

/** Quita comentarios: la puerta juzga el código, no la prosa. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("puertas de apps/extension/src", () => {
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

  it("toda clave usada con t() existe en el catálogo", () => {
    const keys = new Set(catalogKeys());
    const used = new Set();
    for (const file of sourceFiles().filter((f) => /\.tsx?$/.test(f))) {
      for (const match of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([^"]+)"/g)) {
        used.add(match[1]);
        expect(keys.has(match[1]), `${file}: clave sin traducir «${match[1]}»`).toBe(true);
      }
    }
    expect(used.size).toBeGreaterThan(0);
  });

  // Solo el código de interfaz (.tsx): los mensajes del fondo son diagnósticos del
  // protocolo, no texto de pantalla, y la comparación por subcadena los confundiría
  // (p. ej. «cabecera» del catálogo dentro de «las cabeceras de la petición»).
  it("ninguna cadena del catálogo está escrita a mano en la interfaz", () => {
    const catalog = catalogs[defaultLocale] ?? {};
    const literals = Object.entries(catalog).filter(([, value]) => !value.includes("{"));
    for (const file of sourceFiles().filter((f) => f.endsWith(".tsx"))) {
      const text = stripComments(readFileSync(file, "utf8"));
      for (const [key, value] of literals) {
        // F34.2: solo cuenta un literal entero entre comillas o texto JSX (`>valor<`),
        // igual que la puerta de apps/mobile (`isWrittenAsCopy`).
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const asCopy = new RegExp(`(["'\`])${escaped}\\1|>\\s*${escaped}\\s*<`).test(text);
        expect(asCopy, `la cadena de «${key}» está escrita a mano en ${file}`).toBe(false);
      }
    }
  });
});
