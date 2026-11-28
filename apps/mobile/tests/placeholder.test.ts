import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F08 — puerta de `assets/placeholder/` (SPEC §12): el dragón (hoy copia del logo final, FA1)
 * y los marcadores van registrados en su README, sin
 * texto (D3), sin obras reales (D2) y sin referencias remotas (RNF-5).
 */

const PLACEHOLDER_DIR = path.resolve(import.meta.dirname, "..", "assets", "placeholder");
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

describe("dragón y marcadores de assets/placeholder", () => {
  const svgPath = path.join(PLACEHOLDER_DIR, "dragon.svg");
  const readmePath = path.join(PLACEHOLDER_DIR, "README.md");

  it("existe dragon.svg y su README de registro", () => {
    expect(existsSync(svgPath), "falta assets/placeholder/dragon.svg").toBe(true);
    expect(existsSync(readmePath), "falta assets/placeholder/README.md").toBe(true);
  });

  it("el SVG es una silueta sin texto ni referencias remotas", () => {
    const svg = readFileSync(svgPath, "utf8").replace(/\sxmlns="[^"]*"/g, "");
    expect(svg).not.toMatch(/https?:\/\//i);
    expect(svg).not.toMatch(/url\(/i);
    expect(svg).not.toMatch(/<text/i);
    expect(svg).not.toMatch(/<image/i);
    expect(svg).not.toMatch(/\shref/i);
  });

  it("el README lo marca TEMPORAL y registra herramienta, fecha e indicaciones", () => {
    const readme = readFileSync(readmePath, "utf8");
    expect(readme).toMatch(/TEMPORAL/i);
    expect(readme).toMatch(/2026-\d{2}-\d{2}/);
    expect(readme).toMatch(/indicacion/i);
  });

  it("está registrado en docs/ASSETS.md como marcador temporal", () => {
    const assets = readFileSync(path.join(REPO_ROOT, "docs/ASSETS.md"), "utf8");
    expect(assets).toMatch(/assets\/placeholder\//);
  });
});
