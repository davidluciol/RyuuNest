import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

/**
 * F26 — el build produce una extensión cargable: todo archivo que el manifiesto
 * nombra existe en `dist`, y el fondo y el content script son scripts clásicos
 * (sin import/export), porque un content script no puede ser un módulo ES.
 *
 * Es `.mjs` para usar `node:*` sin añadir `@types/node` a la extensión.
 */
const root = fileURLToPath(new URL("..", import.meta.url));
const dist = (file) => fileURLToPath(new URL(`../dist/${file}`, import.meta.url));

function referencedFiles(manifest) {
  return [
    manifest.background?.service_worker,
    ...(manifest.background?.scripts ?? []),
    ...(manifest.content_scripts ?? []).flatMap((script) => script.js ?? []),
    manifest.options_ui?.page,
  ].filter((file) => typeof file === "string");
}

describe("build de la extensión", () => {
  beforeAll(() => {
    execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root, stdio: "pipe" });
  }, 120_000);

  it("copia el manifiesto a dist", () => {
    expect(existsSync(dist("manifest.json"))).toBe(true);
  });

  it("todo archivo que el manifiesto nombra existe en dist", () => {
    const manifest = JSON.parse(readFileSync(dist("manifest.json"), "utf8"));
    const files = referencedFiles(manifest);
    expect(files.length).toBeGreaterThanOrEqual(3);
    for (const file of files) {
      expect(existsSync(dist(file)), `falta dist/${file}`).toBe(true);
    }
  });

  it.each(["background.js", "content.js"])(
    "%s es un script clásico, sin import ni export",
    (file) => {
      const code = readFileSync(dist(file), "utf8");
      expect(code.length).toBeGreaterThan(0);
      expect(code).not.toMatch(/^\s*(import|export)\s/m);
    },
  );

  it("el content script no arrastra la lógica privilegiada del fondo", () => {
    const code = readFileSync(dist("content.js"), "utf8");
    expect(code).not.toContain("declarativeNetRequest");
    expect(code).not.toContain("permissions.contains");
  });
});
