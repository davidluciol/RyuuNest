import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * FB1 — `docs/screen-blueprint.md` es el plano que leen F12, F15, F17, F20, F21 y F25
 * en vez de explorar el repo. Este guardia lo mantiene honesto: cabe en una página, trae
 * las secciones que pide la tarea y solo cita rutas que existen.
 */
const root = resolve(__dirname, "../../../..");
const blueprint = resolve(root, "docs/screen-blueprint.md");
const MAX_LINES = 80;

function read(): string {
  return existsSync(blueprint) ? readFileSync(blueprint, "utf8") : "";
}

describe("docs/screen-blueprint.md (FB1)", () => {
  it("existe", () => {
    expect(existsSync(blueprint)).toBe(true);
  });

  it("cabe en una página", () => {
    expect(read().trim().split("\n").length).toBeLessThanOrEqual(MAX_LINES);
  });

  it.each([
    "Estructura de una pantalla",
    "Patrón",
    "Textos y tokens",
    "Datos reales",
    "Verificación con Playwright",
  ])("tiene la sección «%s»", (titulo) => {
    expect(read()).toMatch(new RegExp(`^## ${titulo}`, "m"));
  });

  it("explica el ejemplo con fixtures (F13) y el de datos reales (F14)", () => {
    const text = read();
    expect(text).toContain("homeFixtures.ts");
    expect(text).toContain("libraryData.ts");
    expect(text).toContain("appDatabase.native.ts");
  });

  it("solo cita rutas del repo que existen", () => {
    const cited = [...read().matchAll(/`((?:apps|packages|docs|design|tasks)\/[^`\s]+)`/g)].map(
      (m) => m[1] as string,
    );
    const paths = cited.filter((path) => !path.includes("<"));
    expect(paths.length).toBeGreaterThan(5);
    for (const path of paths) {
      expect(existsSync(resolve(root, path)), `no existe ${path}`).toBe(true);
    }
  });
});
