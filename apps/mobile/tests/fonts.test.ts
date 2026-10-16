import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { fontFiles, fontLicenses } from "@ryuunest/ui-tokens";

import { readTtfNames } from "./ttfNames";

/**
 * F03 — puerta de los assets empaquetados (P2-3, RNF-5): cada peso del manifiesto
 * existe como archivo TTF local, es un TTF real y su nombre PostScript embebido
 * coincide con el manifiesto (así `expo-font` registra la familia esperada sin
 * pesos sintéticos). Las licencias OFL acompañan a las familias.
 */

const FONTS_DIR = path.resolve(process.cwd(), "assets/fonts");

describe("fuentes empaquetadas (apps/mobile/assets/fonts)", () => {
  it.each(fontFiles.map((f) => [f.file, f] as const))("%s existe y es un TTF", (file) => {
    const abs = path.join(FONTS_DIR, file);
    expect(existsSync(abs), `falta ${abs} (F03 copia los archivos aquí)`).toBe(true);
    const data = readFileSync(abs);
    expect(data.length, `${file} está vacío`).toBeGreaterThan(20_000);
    const magic = data.subarray(0, 4).toString("hex");
    expect(["00010000", "4f54544f"], `${file} no es TTF/OTF`).toContain(magic);
  });

  it.each(fontFiles.map((f) => [f.file, f] as const))(
    "%s trae el peso real embebido (sin sintéticos)",
    (_file, entry) => {
      const names = readTtfNames(path.join(FONTS_DIR, entry.file));
      expect(names.postScriptName, "nombre PostScript (nameID 6)").toBe(entry.postScriptName);
      expect(names.weight).toBe(entry.weight);
    },
  );

  it.each(Object.entries(fontLicenses))(
    "licencia OFL de %s registrada junto a las fuentes",
    (family, lic) => {
      const abs = path.join(FONTS_DIR, lic.file);
      expect(existsSync(abs), `falta ${abs}`).toBe(true);
      const text = readFileSync(abs, "utf8");
      expect(text.toUpperCase()).toContain("SIL OPEN FONT LICENSE");
      expect(text).toContain("1.1");
    },
  );

  it("no hay URLs remotas en el cableado de iconos (RNF-5: cero CDN)", () => {
    const src = path.resolve(process.cwd(), "src/icons.ts");
    if (!existsSync(src)) return; // lo crea el propio corte de iconos
    const text = readFileSync(src, "utf8");
    expect(text, "icons.ts no debe enlazar recursos remotos").not.toMatch(
      /https?:\/\/\S+\.(ttf|otf|woff2?|svg|css|js)/i,
    );
    expect(text).not.toMatch(/@import\s+url\(/i);
  });
});
