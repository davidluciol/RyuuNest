import { describe, expect, it } from "vitest";

import { catalogKeys, t } from "@ryuunest/i18n";

import { readFileSync } from "node:fs";
import path from "node:path";

import { ABOUT_PATH, DIAGNOSTICS_PATH, discoverSearchPath, readerPath, seriesPath, TAB_ROUTES } from "../src/routes";

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

  it("Acerca de (AB3) cuelga de una ruta propia y Ajustes la abre", () => {
    expect(ABOUT_PATH).toBe("/about");
    const src = path.resolve(import.meta.dirname, "..", "src");
    expect(readFileSync(path.join(src, "App.tsx"), "utf8")).toContain('path="about"');
    expect(readFileSync(path.join(src, "screens/settings/SettingsScreen.tsx"), "utf8")).toContain("navigate(ABOUT_PATH)");
  });

  it("iconos temáticos de las pestañas (F74): castillo, gema, mapa, puerta y engranaje", () => {
    const shell = readFileSync(path.resolve(import.meta.dirname, "..", "src/shell/AppShell.tsx"), "utf8");
    for (const pair of ["home: Castle", "library: Gem", "compass: MapIcon", "layers: DoorOpen", "settings: SettingsIcon"]) {
      expect(shell).toContain(pair);
    }
  });
});

describe("búsqueda global (F60)", () => {
  it("lleva la consulta recortada y una marca para repetirla; vacía no navega", () => {
    expect(discoverSearchPath("  dragón ", 7)).toBe("/discover?q=drag%C3%B3n&ts=7");
    expect(discoverSearchPath("   ", 1)).toBeNull();
  });
});
