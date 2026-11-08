import { describe, expect, it } from "vitest";

import { BOTTOM_NAV_DESTINATIONS } from "../../src/components/shellStyles";
import {
  destinationForPath,
  destinationLabel,
  destinationRoutes,
  shellDestination,
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
      "Guarida",
      "Tesoros",
      "Aventuras",
      "Portales",
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

describe("shellDestination · «atrás» vuelve a la pestaña de origen (F32)", () => {
  it("en una pestaña devuelve esa pestaña", () => {
    expect(shellDestination("/discover", "home")).toBe("discover");
  });

  it("fuera de las pestañas (ficha, lector) conserva la última", () => {
    expect(shellDestination("/series/zonatmo/abc", "discover")).toBe("discover");
    expect(shellDestination("/reader/m440/a/b", "library")).toBe("library");
  });

  it("sin pestaña previa y fuera de las pestañas no hay destino", () => {
    expect(shellDestination("/series/zonatmo/abc", null)).toBeNull();
  });
});
