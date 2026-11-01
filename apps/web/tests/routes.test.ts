import { describe, expect, it } from "vitest";

import { catalogKeys, t } from "@ryuunest/i18n";

import { DIAGNOSTICS_PATH, readerPath, seriesPath, TAB_ROUTES } from "../src/routes";

describe("tabla de rutas del cliente web (F24)", () => {
  it("cinco pestañas con id único, ruta absoluta y etiqueta traducida", () => {
    expect(TAB_ROUTES.map((route) => route.id)).toEqual([
      "home",
      "library",
      "discover",
      "sources",
      "settings",
    ]);
    const keys = catalogKeys();
    for (const route of TAB_ROUTES) {
      expect(route.path.startsWith("/")).toBe(true);
      expect(keys, `etiqueta sin catálogo: ${route.labelKey}`).toContain(route.labelKey);
      expect(() => t(route.labelKey)).not.toThrow();
    }
  });

  it("los ids opacos de serie/capítulo van codificados en la URL (ADR-0003)", () => {
    expect(seriesPath("zonatmo", "serie/123?x=1")).toBe("/series/zonatmo/serie%2F123%3Fx%3D1");
    expect(readerPath("m440", "s", "c/1", "r=2")).toBe("/reader/m440/s/c%2F1?release=r%3D2");
    expect(readerPath("m440", "s", "c/1")).toBe("/reader/m440/s/c%2F1");
  });

  it("diagnóstico cuelga de una ruta propia fuera de las pestañas", () => {
    expect(DIAGNOSTICS_PATH).toBe("/diagnostics");
  });
});
