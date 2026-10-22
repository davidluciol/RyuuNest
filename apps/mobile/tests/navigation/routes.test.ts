import { describe, expect, it } from "vitest";

import { BOTTOM_NAV_DESTINATIONS } from "../../src/components/shellStyles";
import {
  destinationForPath,
  destinationLabel,
  destinationRoutes,
} from "../../src/navigation/routes";

describe("destinos del shell (F11)", () => {
  it("ofrece los cinco destinos funcionales, con Inicio en la raíz", () => {
    expect(BOTTOM_NAV_DESTINATIONS.map((id) => destinationRoutes[id])).toEqual([
      "/",
      "/library",
      "/discover",
      "/sources",
      "/settings",
    ]);
    expect(BOTTOM_NAV_DESTINATIONS.map(destinationLabel)).toEqual([
      "Inicio",
      "Biblioteca",
      "Descubrir",
      "Fuentes",
      "Ajustes",
    ]);
  });

  it.each(BOTTOM_NAV_DESTINATIONS)("identifica %s desde su URL, sin estado duplicado", (id) => {
    expect(destinationForPath(destinationRoutes[id])).toBe(id);
  });

  it("no selecciona Inicio para rutas ajenas al shell", () => {
    expect(destinationForPath("/_dev/gallery")).toBeNull();
    expect(destinationForPath("/unknown")).toBeNull();
  });
});
