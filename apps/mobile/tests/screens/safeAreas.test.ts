import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SAFE_SCREEN_EDGES } from "../../src/components/safeScreenStyles";

/**
 * F34.2 — zonas seguras: las rutas que viven fuera de las pestañas (Diagnóstico
 * y ficha de serie) no pintan su cabecera bajo la muesca ni la barra de estado
 * ni tras el gesto inferior; las pestañas ya van dentro del `SafeAreaView` del
 * shell y el lector aplica los insets a sus barras. La verificación en el
 * dispositivo (POCO, S25) la hace el humano.
 */
const SRC = path.resolve(process.cwd(), "src");
const read = (relative: string) => readFileSync(path.join(SRC, relative), "utf8");

describe("zonas seguras", () => {
  it("SafeScreen respeta los cuatro bordes", () => {
    expect([...SAFE_SCREEN_EDGES].sort()).toEqual(["bottom", "left", "right", "top"]);
  });

  it("las rutas fuera de pestañas se envuelven en SafeScreen", () => {
    expect(read("app/diagnostics.tsx")).toContain("<SafeScreen");
    expect(read("app/series/[moduleId]/[seriesId].tsx")).toContain("<SafeScreen");
  });

  it("el título de la ficha es un encabezado accesible", () => {
    expect(read("screens/series/SeriesScreen.tsx")).toContain('accessibilityRole="header"');
  });
});
