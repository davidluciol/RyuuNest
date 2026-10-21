import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { catalogs, catalogKeys, defaultLocale } from "../src/i18n";

/**
 * F10 — puerta de internacionalización (RF-40): todas las cadenas visibles
 * viven en el catálogo y nada más las escribe. Se comprueba contra las fuentes:
 *
 * 1. Toda clave usada con `t("…")` existe en el catálogo.
 * 2. Toda clave del catálogo se usa (sin entradas muertas).
 * 3. Ninguna cadena del catálogo aparece literal fuera de `src/i18n/`.
 *
 * Los identificadores y valores de API (variant «primary», estado «in-progress»,
 * destino «library»…) **no son copy**: no se traducen; su etiqueta visible sí
 * vive en el catálogo.
 */

const SRC = path.resolve(process.cwd(), "src");
const I18N_DIR = path.join(SRC, "i18n");

function sourceFiles(dir: string = SRC, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== I18N_DIR) sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Claves usadas con `t("clave")` en las fuentes (excluye `src/i18n`). */
function usedKeys(): Set<string> {
  const found = new Set<string>();
  for (const file of sourceFiles()) {
    for (const match of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([^"]+)"/g)) {
      found.add(match[1]);
    }
  }
  return found;
}

/** Claves citadas en las fuentes como literal (registro, mapas de etiquetas…). */
function referencedKeys(): Set<string> {
  const found = new Set<string>();
  for (const file of sourceFiles()) {
    const text = readFileSync(file, "utf8");
    for (const key of catalogKeys()) {
      if (text.includes(`"${key}"`) || text.includes(`'${key}'`)) found.add(key);
    }
  }
  return found;
}

/** Quita comentarios: la puerta juzga el código, no la prosa. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("puerta de i18n (RF-40)", () => {
  it("toda clave usada en las fuentes existe en el catálogo", () => {
    const keys = catalogKeys();
    for (const used of usedKeys()) {
      expect(keys, `clave usada pero no traducida: ${used}`).toContain(used);
    }
  });

  it("toda clave del catálogo se cita en la interfaz (sin entradas muertas)", () => {
    const referenced = referencedKeys();
    for (const key of catalogKeys()) {
      expect(referenced, `clave sin uso en la interfaz: ${key}`).toContain(key);
    }
  });

  it("ninguna cadena del catálogo aparece literal fuera de src/i18n", () => {
    const catalog = catalogs[defaultLocale] ?? {};
    const literals = Object.entries(catalog).filter(([, value]) => !value.includes("{"));
    for (const file of sourceFiles()) {
      const text = stripComments(readFileSync(file, "utf8"));
      for (const [key, value] of literals) {
        expect(
          text.includes(value),
          `la cadena de «${key}» está escrita a mano en ${path.relative(SRC, file)}`,
        ).toBe(false);
      }
    }
  });
});
