import { describe, expect, it } from "vitest";

import { markers } from "../src/markers";

/**
 * F08 — tamaños del dragón marcador (SPEC §11.12 solo dice «pequeño» y
 * «mediano»; el humano fijó 48/96 en la rejilla de 4 px, decisión P-55).
 */
describe("tokens de marcador (dragón)", () => {
  it("pequeño (carga breve) son 48 px y mediano (vacío/error) 96 px", () => {
    expect(markers.sm).toBe(48);
    expect(markers.md).toBe(96);
  });

  it("ambos tamaños caen en la rejilla de 4 px", () => {
    expect(markers.sm % 4).toBe(0);
    expect(markers.md % 4).toBe(0);
  });
});
