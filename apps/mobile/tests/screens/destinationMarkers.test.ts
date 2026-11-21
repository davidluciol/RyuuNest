import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F11b — el convenio anti-pudrición del shell: cada destino de la barra
 * inferior se identifica con un marcador estable que `shell.cjs` espera:
 * `screen-<id>` si la pantalla ya sustituyó al marco de F11, o
 * `destination-<id>` mientras sea el marco (`DestinationFrame`). Sin este
 * guard, el e2e del shell volvió a romperse cada vez que una tarea de
 * pantalla quitó el marco (F13, F14c, F15) sin tocar los scripts.
 */

const SRC = path.resolve(process.cwd(), "src");

/** Destinos de la barra (routes.ts) → archivo de ruta y marcador esperado. */
const DESTINATIONS: Array<{ id: string; route: string }> = [
  { id: "home", route: "app/(tabs)/index.tsx" },
  { id: "library", route: "app/(tabs)/library.tsx" },
  { id: "discover", route: "app/(tabs)/discover.tsx" },
  { id: "sources", route: "app/(tabs)/sources.tsx" },
  { id: "settings", route: "app/(tabs)/settings.tsx" },
];

function readSource(relative: string): string {
  return readFileSync(path.join(SRC, relative), "utf8");
}

describe("marcadores de destino estables (F11b)", () => {
  it("cada ruta usa el marco (`destination-<id>`) o una pantalla con marcador `screen-<id>` en su raíz", () => {
    for (const { id, route } of DESTINATIONS) {
      const routeSource = readSource(route);

      if (routeSource.includes("DestinationFrame")) {
        // El marco de F11 pinta `destination-<id>`: el marcador existe.
        expect(readSource("shell/DestinationFrame.tsx")).toContain("`destination-${destination}`");
        continue;
      }

      // Pantalla real: la ruta importa desde screens/<nombre>/…; esa pantalla
      // debe declarar `testID="screen-<id>"` en alguno de sus árboles raíz.
      const screenImport = routeSource.match(/from "\.\.\/\.\.\/screens\/([^"]+)"/);
      expect(screenImport, `${route} no importa su pantalla`).not.toBeNull();
      const screenSource = readSource(`screens/${screenImport?.[1]}.tsx`);
      expect(screenSource, `screens/${screenImport?.[1]}.tsx sin marcador`).toContain(
        `testID="screen-${id}"`,
      );
    }
  });

  it("los scripts del shell comparten el marcador desde markers.cjs", () => {
    const shell = readFileSync(path.join(SRC, "../tests/e2e/shell.cjs"), "utf8");
    const home = readFileSync(path.join(SRC, "../tests/e2e/home.cjs"), "utf8");
    for (const script of [shell, home]) {
      expect(script).toContain("require(\"./markers.cjs\")");
      expect(script).toContain("destinationMarker(");
    }
  });
});
