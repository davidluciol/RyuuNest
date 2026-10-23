import { describe, expect, it } from "vitest";

import { galleryEntries } from "../../src/gallery/registry";
import { renderGalleryScreen } from "../../src/gallery/renderGallery";

/**
 * F07 — los componentes base 2 se añaden a la sección «Componentes» de la
 * galería con sus estados (Regla 3).
 */
describe("galería con componentes base 2 (F07)", () => {
  it("la sección lista los componentes base 1, base 2 y los estados de F08 (claves de F10)", () => {
    const components = galleryEntries.find((entry) => entry.id === "componentes");
    expect(components?.items).toEqual([
      "gallery.component.button",
      "gallery.component.textField",
      "gallery.component.checkbox",
      "gallery.component.chip",
      "gallery.component.badge",
      "gallery.component.coverCard",
      "gallery.component.chapterRow",
      "gallery.component.header",
      "gallery.component.bottomNav",
      "gallery.component.settingsRow",
      "gallery.component.sheet",
      "gallery.component.emptyState",
      "gallery.component.errorState",
      "gallery.component.loadingState",
      "gallery.component.appShell",
      "gallery.component.destinationFrame",
      "gallery.component.sectionHeader",
      "gallery.component.continueCard",
      "gallery.component.recentCard",
      "gallery.component.folderCard",
      "gallery.component.homeScreen",
      "gallery.component.libraryCard",
      "gallery.component.libraryScreen",
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

  it("la galería renderizada nombra los estados de F08", () => {
    const out = renderGalleryScreen();
    for (const name of ["estado vacío", "error de módulo", "carga breve"]) {
      expect(out, `falta ${name}`).toContain(name);
    }
  });

  it("incluye la estructura compartida y los marcos pendientes de F11", () => {
    const out = renderGalleryScreen();
    expect(out).toContain("estructura compartida");
    expect(out).toContain("marco de destino");
  });

  it("F13: la galería nombra los componentes de la pantalla Inicio", () => {
    const out = renderGalleryScreen();
    for (const name of [
      "encabezado de sección",
      "tarjeta hero (continuar)",
      "tarjeta de recientes",
      "tarjeta de carpeta",
      "pantalla Inicio",
    ]) {
      expect(out, `falta ${name}`).toContain(name);
    }
  });
});
