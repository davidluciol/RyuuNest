import { describe, expect, it } from "vitest";

import { galleryStyleLiterals } from "../src/gallery/styleAudit";

/**
 * F05 — «sin valores literales; todo sale de `ui-tokens`»: la hoja de estilos
 * de la galería no puede traer hexadecimales ni píxeles escritos a mano. Esta
 * puerta escanea el StyleSheet y solo permite valores que vengan de tokens.
 */
describe("estilos de la galería sin literales (AC-13)", () => {
  it("ningún color hexadecimal escrito a mano", () => {
    expect(galleryStyleLiterals().hexColors).toEqual([]);
  });

  it("ningún tamaño en píxeles escrito a mano fuera de los tokens", () => {
    expect(galleryStyleLiterals().pixelSizes).toEqual([]);
  });
});
