import { describe, expect, it } from "vitest";

import { galleryScreenSource, renderGalleryScreen } from "../src/gallery/renderGallery";

/**
 * F05 — la galería se renderiza en un test sin Metro: un harness ligero que
 * serializa el árbol de la pantalla a un texto plano con jerarquía. Sirve
 * para fijar la estructura (secciones, títulos, estados) sin levantar la app.
 */
describe("renderGalleryScreen (estructura de la galería)", () => {
  it("incluye las 8 secciones con sus títulos visibles", () => {
    const out = renderGalleryScreen();
    for (const title of [
      "Colores",
      "Tipografía",
      "Espaciado",
      "Radios",
      "Layout por ancho",
      "Iconos",
      "Portadas de ejemplo",
      "Componentes",
    ]) {
      expect(out, `falta la sección ${title}`).toContain(title);
    }
  });

  it("los colores van con su valor hexadecimal de los tokens", () => {
    const out = renderGalleryScreen();
    expect(out).toContain("bg");
    expect(out).toContain("#0B0E14");
    expect(out).toContain("accent");
    expect(out).toContain("#35C98A");
  });

  it("la tipografía muestra los estilos con familia y tamaño", () => {
    const out = renderGalleryScreen();
    expect(out).toContain("displayLg");
    expect(out).toContain("Manrope");
    expect(out).toContain("bodyMd");
    expect(out).toContain("Inter");
  });

  it("la sección de componentes anuncia sus 6 estados aunque esté vacía", () => {
    const out = renderGalleryScreen();
    expect(out).toContain("normal");
    expect(out).toContain("presionado");
    expect(out).toContain("foco");
    expect(out).toContain("deshabilitado");
    expect(out).toContain("cargando");
    expect(out).toContain("error");
  });

  it("las portadas de ejemplo salen del conjunto único de fixtures", () => {
    const out = renderGalleryScreen();
    expect(out).toContain("dragon-de-ceniza");
    expect(out).toContain("El dragón de ceniza");
  });

  it("el árbol exportado queda accesible para depuración", () => {
    expect(galleryScreenSource().length).toBeGreaterThan(100);
  });
});
