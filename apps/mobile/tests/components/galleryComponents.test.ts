import { describe, expect, it } from "vitest";

import { galleryEntries } from "../../src/gallery/registry";
import { renderGalleryScreen } from "../../src/gallery/renderGallery";

/**
 * F06 — los componentes base 1 se registran en la galería con todos sus
 * estados (Regla 3). La sección «Componentes» pasa a listarlos.
 */
describe("galería con componentes base 1 (F06)", () => {
  it("la sección de componentes ya no está vacía y lista los 5 componentes base 1", () => {
    const components = galleryEntries.find((entry) => entry.id === "componentes");
    for (const name of [
      "botón",
      "campo de texto",
      "casilla y radio",
      "chip de filtro",
      "insignia",
    ]) {
      expect(components?.items, `falta ${name}`).toContain(name);
    }
  });

  it("la galería renderizada nombra los componentes y sus estados", () => {
    const out = renderGalleryScreen();
    for (const name of [
      "botón",
      "campo de texto",
      "casilla y radio",
      "chip de filtro",
      "insignia",
    ]) {
      expect(out, `falta ${name}`).toContain(name);
    }
    expect(out).toContain("normal");
    expect(out).toContain("presionado");
    expect(out).toContain("deshabilitado");
  });
});
