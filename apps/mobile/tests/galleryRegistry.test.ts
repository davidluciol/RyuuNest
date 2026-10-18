import { describe, expect, it } from "vitest";

import { type GalleryEntry, galleryEntries, type GalleryKind } from "../src/gallery/registry";

/**
 * F05 — registro de la galería: lo que la galería lista (cada sección y los
 * estados que muestra). La sección de componentes nace vacía: F06 (base 1),
 * F07 (base 2) y F08 (estados) la irán llenando.
 */
describe("registro de la galería (F05)", () => {
  it("lista las 8 secciones en su orden de diseño", () => {
    expect(galleryEntries.map((entry) => entry.id)).toEqual([
      "colores",
      "tipografia",
      "espaciado",
      "radios",
      "layout",
      "iconos",
      "portadas",
      "componentes",
    ]);
  });

  it("la sección de componentes muestra los 6 estados de la Regla 3 y nace vacía", () => {
    const components = galleryEntries.find((entry) => entry.id === "componentes");
    expect(components?.kind).toBe<GalleryKind>("componentes");
    expect(components?.states).toEqual([
      "normal",
      "presionado",
      "foco",
      "deshabilitado",
      "cargando",
      "error",
    ]);
    expect(components?.items).toEqual([]);
  });

  it("toda entrada tiene id, título y tipo; la de tipografía muestra los 12 estilos", () => {
    for (const entry of galleryEntries) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(["tokens", "componentes"]).toContain(entry.kind);
    }
    const tipografia = galleryEntries.find((entry) => entry.id === "tipografia");
    expect(tipografia?.items).toHaveLength(12);
  });

  it("los ids son únicos y la colección es de solo lectura", () => {
    const ids = galleryEntries.map((entry: GalleryEntry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.isFrozen(galleryEntries)).toBe(true);
  });
});
