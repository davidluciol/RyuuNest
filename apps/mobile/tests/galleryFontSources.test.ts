import { fontFiles } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { galleryFontSources } from "../src/gallery/fontSources";

/**
 * F05 — el mapa de fuentes para `useFonts` se construye **desde el manifiesto**
 * `fontFiles` (F03): ni archivos inventados ni nombres de familia genéricos —
 * las claves son los nombres PostScript embebidos (las instancias estáticas
 * llevan el peso en la familia).
 */
describe("galleryFontSources (mapa para useFonts)", () => {
  it("cubre exactamente los 5 archivos del manifiesto, con su nombre PostScript", () => {
    expect(Object.keys(galleryFontSources).sort()).toEqual(
      fontFiles.map((file) => file.postScriptName).sort(),
    );
    expect(Object.keys(galleryFontSources)).toHaveLength(5);
  });

  it("cada entrada es un asset require() de Metro (número) del archivo del manifiesto", () => {
    for (const [postScriptName, source] of Object.entries(galleryFontSources)) {
      const entry = fontFiles.find((file) => file.postScriptName === postScriptName);
      expect(entry, `manifiesto tiene ${postScriptName}`).toBeDefined();
      expect(typeof source).toBe("number");
    }
  });
});
