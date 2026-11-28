import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DRAGON_PATH, DRAGON_VIEWBOX } from "../src/components/dragonPath";

/**
 * FA1 — el dragón de la app es el logo final (paquete con pupila de `design/`), no el marcador
 * temporal: mismo trazo que el SVG fuente y registrado como arte de «Artista» (CC BY-NC-ND 4.0).
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SOURCE_SVG = path.join(
  REPO_ROOT,
  "design/RyuuNest-Logo-Pack-Con-Pupila/ryuunest-adaptive.svg",
);

describe("logo de RyuuNest (DragonMarker)", () => {
  const svg = readFileSync(SOURCE_SVG, "utf8");

  it("usa exactamente el trazo del SVG con pupila", () => {
    const d = /\sd="([^"]+)"/.exec(svg)?.[1];
    expect(d).toBeDefined();
    expect(DRAGON_PATH).toBe(d);
  });

  it("comparte la retícula del SVG fuente", () => {
    expect(svg).toContain(`viewBox="0 0 ${DRAGON_VIEWBOX} ${DRAGON_VIEWBOX}"`);
  });

  it("docs/ASSETS.md registra el logo como arte de Artista con CC BY-NC-ND 4.0", () => {
    const assets = readFileSync(path.join(REPO_ROOT, "docs/ASSETS.md"), "utf8");
    const row = assets.split("\n").find((line) => line.includes("RyuuNest-Logo-Pack-Con-Pupila"));
    expect(row, "falta la fila del logo en docs/ASSETS.md").toBeDefined();
    expect(row).toMatch(/Artista/);
    expect(row).toMatch(/CC BY-NC-ND 4\.0/);
  });
});
