import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F08 — puerta del dragón marcador (SPEC §11.12 y §12): una silueta sencilla
 * y **original** en `assets/placeholder/`, registrada como temporal, sin
 * texto (D3), sin obras reales (D2) y sin referencias remotas (RNF-5).
 */

const PLACEHOLDER_DIR = path.resolve(process.cwd(), "assets", "placeholder");
const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

describe("marcador de dragón (assets/placeholder)", () => {
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

  it("está registrado en ASSETS.md como marcador temporal", () => {
    const assets = readFileSync(path.join(REPO_ROOT, "ASSETS.md"), "utf8");
    expect(assets).toMatch(/assets\/placeholder\//);
  });
});
