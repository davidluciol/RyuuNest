import { describe, expect, it } from "vitest";

import { galleryEntries } from "../../src/gallery/registry";
import { renderGalleryScreen } from "../../src/gallery/renderGallery";

/**
 * F07 — los componentes base 2 se añaden a la sección «Componentes» de la
 * galería con sus estados (Regla 3).
 */
describe("galería con componentes base 2 (F07)", () => {
  it("la sección lista los componentes base 1 y base 2", () => {
    const components = galleryEntries.find((entry) => entry.id === "componentes");
    expect(components?.items).toEqual([
      "botón",
      "campo de texto",
      "casilla y radio",
      "chip de filtro",
      "insignia",
      "tarjeta de portada",
      "fila de capítulo",
      "cabecera",
      "barra inferior",
      "fila de ajustes",
      "hoja y diálogo",
    ]);
  });

  it("la galería renderizada nombra los componentes base 2", () => {
    const out = renderGalleryScreen();
    for (const name of [
      "tarjeta de portada",
      "fila de capítulo",
      "cabecera",
      "barra inferior",
      "fila de ajustes",
      "hoja y diálogo",
    ]) {
      expect(out, `falta ${name}`).toContain(name);
    }
  });
});
