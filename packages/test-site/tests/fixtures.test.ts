import { describe, expect, it } from "vitest";

import {
  FIXTURE_DEFAULTS,
  FIXTURE_SERIES,
  findChapter,
  findSeries,
  normalizeText,
} from "../src/index";

describe("fixtures · conjunto coherente", () => {
  it("trae varias series inventadas con datos completos", () => {
    expect(FIXTURE_SERIES.length).toBeGreaterThanOrEqual(4);

    for (const series of FIXTURE_SERIES) {
      expect(series.id).not.toBe("");
      expect(series.title).not.toBe("");
      expect(series.cover.url).not.toBe("");
      expect(series.genres.length).toBeGreaterThan(0);
      expect(series.chapters.length).toBeGreaterThan(0);
    }
  });

  it("usa identificadores únicos", () => {
    const ids = FIXTURE_SERIES.map((series) => series.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cubre los cuatro tipos de obra y algún NSFW (D-13, RF-35)", () => {
    const kinds = new Set(FIXTURE_SERIES.map((series) => series.kind));
    expect(kinds).toEqual(new Set(["manga", "manhua", "manhwa", "comic"]));
    expect(FIXTURE_SERIES.some((series) => series.nsfw)).toBe(true);
  });

  it("tiene al menos un capítulo con dos releases (T10)", () => {
    const withReleases = FIXTURE_SERIES.flatMap((series) =>
      series.chapters.filter((chapter) => chapter.releases.length >= 2),
    );
    expect(withReleases.length).toBeGreaterThanOrEqual(1);
  });

  it("FIXTURE_DEFAULTS apunta a datos reales", () => {
    const series = findSeries(FIXTURE_DEFAULTS.seriesId);
    expect(series).toBeDefined();

    const chapter = findChapter(FIXTURE_DEFAULTS.seriesId, FIXTURE_DEFAULTS.chapterId);
    expect(chapter).toBeDefined();
    expect(chapter?.releases.length).toBeGreaterThanOrEqual(2);

    for (const releaseId of FIXTURE_DEFAULTS.releaseIds) {
      expect(chapter?.releases.some((release) => release.id === releaseId)).toBe(true);
    }

    expect(FIXTURE_DEFAULTS.searchQuery).not.toBe("");
  });
});

describe("fixtures · normalización", () => {
  it("normaliza mayúsculas y acentos", () => {
    expect(normalizeText("El Dragón de Ceniza")).toBe("el dragon de ceniza");
    expect(normalizeText("ÁÉÍÓÚÜÑ")).toBe("aeiouun");
  });
});
