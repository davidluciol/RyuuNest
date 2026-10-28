import { describe, expect, it } from "vitest";

import {
  chapterState,
  preferredRelease,
  type SeriesProgress,
} from "../../src/screens/series/seriesFixtures";

describe("series detail fixture helpers", () => {
  it("derives the three chapter states from progress and read ids", () => {
    const progress: SeriesProgress = {
      chapterId: "ch-2",
      pageIndex: 4,
      pageTotal: 10,
    };

    expect(chapterState("ch-1", progress, new Set(["ch-1"]))).toBe("completed");
    expect(chapterState("ch-2", progress, new Set())).toBe("in-progress");
    expect(chapterState("ch-3", progress, new Set())).toBe("unread");
  });

  it("keeps the preferred release when a chapter offers it", () => {
    const releases = [
      { id: "r-oficial", group: "Equipo Ryuu" },
      { id: "r-alt", group: "Escuadrón Noche" },
    ];

    expect(preferredRelease(releases, "r-alt")).toEqual(releases[1]);
    expect(preferredRelease(releases, "missing")).toEqual(releases[0]);
  });
});
