import { readFileSync } from "node:fs";
import path from "node:path";

import { dragonNightColors } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

/**
 * F73 — iconos de la app (Android/iPhone) y del cliente web hechos con el logo final (P-197):
 * tamaños correctos, fondo del tema Dragon Night y versión del primer release.
 */

const MOBILE = path.resolve(import.meta.dirname, "..");
const WEB = path.resolve(MOBILE, "..", "web");

/** Ancho, alto y tipo de color de la cabecera IHDR de un PNG (tipo 6 = con alfa, 2 = RGB). */
function pngInfo(file: string): { width: number; height: number; colorType: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(1, 4).toString("latin1"), `${file} no es PNG`).toBe("PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes.readUInt8(25),
  };
}

interface AppJson {
  expo: {
    version: string;
    icon: string;
    android: { adaptiveIcon: Record<string, string> };
    web: { favicon: string };
  };
}

const appJson = JSON.parse(readFileSync(path.join(MOBILE, "app.json"), "utf8")) as AppJson;

describe("iconos de la app (app.json)", () => {
  it("es la versión 1.0.0 del primer release", () => {
    expect(appJson.expo.version).toBe("1.0.0");
  });

  it("el icono principal es 1024 px y opaco (iPhone no admite transparencia)", () => {
    const info = pngInfo(path.join(MOBILE, appJson.expo.icon));
    expect([info.width, info.height]).toEqual([1024, 1024]);
    expect(info.colorType).toBe(2);
  });

  it("el adaptativo usa el fondo del tema y capas de 1024 px", () => {
    const adaptive = appJson.expo.android.adaptiveIcon;
    expect(adaptive.backgroundColor).toBe(dragonNightColors.bg);
    expect(adaptive.backgroundImage).toBeUndefined();
    for (const key of ["foregroundImage", "monochromeImage"]) {
      const file = adaptive[key];
      expect(file, key).toBeDefined();
      const info = pngInfo(path.join(MOBILE, file as string));
      expect([info.width, info.height], key).toEqual([1024, 1024]);
      expect(info.colorType, `${key} necesita transparencia`).toBe(6);
    }
  });

  it("el favicon de la web de Expo es de 48 px", () => {
    const info = pngInfo(path.join(MOBILE, appJson.expo.web.favicon));
    expect([info.width, info.height]).toEqual([48, 48]);
  });
});

describe("iconos del cliente web", () => {
  const html = readFileSync(path.join(WEB, "index.html"), "utf8");

  it("enlaza el favicon SVG, el PNG de respaldo y el icono de iPhone", () => {
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(html).toContain('<link rel="icon" type="image/png" href="/favicon.png" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
  });

  it("los archivos existen con su tamaño", () => {
    const svg = readFileSync(path.join(WEB, "public/favicon.svg"), "utf8");
    expect(svg).toContain('viewBox="0 0 1024 1024"');
    expect(svg).not.toMatch(/<text|<image|url\(/i);
    const png = pngInfo(path.join(WEB, "public/favicon.png"));
    expect([png.width, png.height]).toEqual([48, 48]);
    const touch = pngInfo(path.join(WEB, "public/apple-touch-icon.png"));
    expect([touch.width, touch.height]).toEqual([180, 180]);
    expect(touch.colorType).toBe(2);
  });
});
