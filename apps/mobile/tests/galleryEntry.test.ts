import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * F05 — la galería es la pantalla por defecto de la app mientras dura la
 * Fase 6a (sustituirá a la calibración T05 cuando exista el shell, F11).
 * Esta puerta fija que `App.tsx` monta la galería, no el panel de calibración.
 */
describe("App monta la galería (F05)", () => {
  const appSource = readFileSync(fileURLToPath(new URL("../App.tsx", import.meta.url)), "utf8");

  it("App.tsx importa y renderiza GalleryScreen", () => {
    expect(appSource).toContain('import GalleryScreen from "./src/gallery/GalleryScreen"');
    expect(appSource).toContain("<GalleryScreen />");
  });

  it("App.tsx ya no monta el panel de calibración", () => {
    expect(appSource).not.toContain("<ImageCapPanel />");
  });
});
