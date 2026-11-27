import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Chapter } from "@ryuunest/core";

import { canChooseRelease, releaseLabel } from "../../src/screens/series/seriesLogic";

/**
 * F17 — selector de release en la ficha: el chip de un capítulo con dos o más releases abre una
 * hoja (como `SortSheet`) con un chip por release y la actual marcada; elegir guarda la release
 * para toda la serie (`setPreferredRelease`, por grupo). Con una sola release el chip es etiqueta.
 * Sin Metro: lógica pura + estructura del código; el render real lo verifica Playwright.
 */
const read = (file: string) => readFileSync(path.resolve(import.meta.dirname, "../..", file), "utf8");

const chapter = (releases: Chapter["releases"]): Chapter => ({ id: "c", title: "C", releases });

describe("lógica del selector de release (F17)", () => {
  it("solo hay elección con dos o más releases", () => {
    expect(canChooseRelease(chapter([{ id: "a", group: "A" }]))).toBe(false);
    expect(canChooseRelease(chapter([{ id: "a", group: "A" }, { id: "b", group: "B" }]))).toBe(true);
  });

  it("la etiqueta es el grupo y, sin grupo, el id", () => {
    expect(releaseLabel({ id: "a", group: "Equipo" })).toBe("Equipo");
    expect(releaseLabel({ id: "r-1" })).toBe("r-1");
  });
});

describe("chip de release en la ficha", () => {
  it("con una sola release sin grupo no se pinta (el id crudo no dice nada)", () => {
    const src = read("src/screens/series/SeriesScreen.tsx");
    expect(src).toMatch(/\) : release\?\.group \? \(/);
  });
});

describe("ReleaseSheet (F17)", () => {
  const src = read("src/components/ReleaseSheet.tsx");

  it("es una SheetModal con un Chip por release y la actual marcada", () => {
    expect(src).toMatch(/<SheetModal/);
    expect(src).toMatch(/testID="release-sheet"/);
    expect(src).toMatch(/selected=\{release\.id === currentId\}/);
    expect(src).toMatch(/onPress=\{\(\) => onSelect\(release\)\}/);
  });

  it("está en la galería", () => {
    expect(read("src/gallery/GalleryScreen.tsx")).toMatch(/<ReleaseSheet/);
  });
});

describe("ficha y ruta (F17)", () => {
  it("el chip solo abre la hoja si se puede elegir", () => {
    const screen = read("src/screens/series/SeriesScreen.tsx");
    expect(screen).toMatch(/canChooseRelease\(chapter\)/);
    expect(screen).toMatch(/onReleasePress\?\.\(chapter\.id\)/);
  });

  it("la ruta abre ReleaseSheet y guarda con setPreferredRelease", () => {
    const route = read("src/app/series/[moduleId]/[seriesId].tsx");
    expect(route).toMatch(/<ReleaseSheet/);
    expect(route).toMatch(/setPreferredRelease\(moduleId, seriesId, release\)/);
  });
});
