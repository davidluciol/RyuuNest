import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F18 — el lector es una ruta a pantalla completa: vive fuera del navegador de destinos del
 * shell (sin barra inferior) y declara el marcador estable que esperan los e2e (F11b).
 */
const src = path.resolve(process.cwd(), "src");

describe("ruta del lector", () => {
  it("vive fuera del navegador de destinos del shell", () => {
    expect(existsSync(path.join(src, "app/reader/[moduleId]/[seriesId]/[chapterId].tsx"))).toBe(true);
    expect(existsSync(path.join(src, "app/(tabs)/reader"))).toBe(false);
  });

  it("la pantalla declara el marcador estable screen-reader", () => {
    const screen = readFileSync(path.join(src, "screens/reader/ReaderScreen.tsx"), "utf8");
    expect(screen).toContain('testID="screen-reader"');
  });
});
