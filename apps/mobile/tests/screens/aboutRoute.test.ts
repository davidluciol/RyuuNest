import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Acerca de (AB2) y F74 — la pantalla cuelga de Ajustes con ruta propia fuera
 * de las pestañas (volver siempre lleva a Ajustes), y la barra inferior usa los
 * iconos temáticos: Guarida castillo, Tesoros gema, Aventuras mapa y Portales
 * puerta.
 */
const SRC = path.resolve(import.meta.dirname, "../..", "src");
const read = (relative: string) => readFileSync(path.join(SRC, relative), "utf8");

describe("ruta «Acerca de»", () => {
  it("app/about.tsx vuelve a Ajustes", () => {
    const route = read("app/about.tsx");
    expect(route).toContain("AboutScreen");
    expect(route).toContain('router.dismissTo("/settings")');
  });

  it("Ajustes tiene la fila y la ruta la abre", () => {
    expect(read("screens/settings/SettingsScreen.tsx")).toContain('t("settings.section.about")');
    expect(read("app/(tabs)/settings.tsx")).toContain('onOpenAbout={() => router.push("/about")}');
  });
});

describe("iconos de la barra inferior (F74)", () => {
  it("castillo, gema, mapa, puerta y engranaje", () => {
    const nav = read("components/BottomNav.tsx");
    for (const pair of ["home: Castle", "library: Gem", "discover: Map", "sources: DoorOpen", "settings: Settings"]) {
      expect(nav).toContain(pair);
    }
  });
});
