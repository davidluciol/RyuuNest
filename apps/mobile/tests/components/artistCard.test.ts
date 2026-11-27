import { markers, touchTarget } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { artistLinkStyle, artistPhotoStyle } from "../../src/components/artistCardStyles";

/**
 * Acerca de — tarjeta de artista: la foto usa el tamaño mediano del dragón
 * (cae al marcador si falta) y cada red es un botón de al menos 48×48 (RNF-7).
 */
describe("artistCardStyles", () => {
  it("la foto mide lo mismo que el dragón mediano y es redonda", () => {
    const photo = artistPhotoStyle();
    expect(photo.width).toBe(markers.md);
    expect(photo.height).toBe(markers.md);
    expect(photo.borderRadius).toBeGreaterThanOrEqual(markers.md / 2);
  });

  it("cada botón de red cumple el área táctil mínima", () => {
    const link = artistLinkStyle();
    expect(link.minWidth).toBeGreaterThanOrEqual(touchTarget.min);
    expect(link.minHeight).toBeGreaterThanOrEqual(touchTarget.min);
  });
});
