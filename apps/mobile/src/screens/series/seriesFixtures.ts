import type { ImageSourcePropType } from "react-native";
import type { Chapter, Release, SeriesDetails } from "@ryuunest/core";
import { findSeries } from "@ryuunest/test-site";

import dragonMarker from "../../../assets/placeholder/dragon.svg";

export type ChapterState = "unread" | "in-progress" | "completed";

export interface SeriesProgress {
  chapterId: string;
  pageIndex: number;
  pageTotal: number;
}

export interface SeriesViewData {
  details: SeriesDetails;
  /** Portada local para la galería/web; los datos reales usan `details.cover`. */
  coverSource?: ImageSourcePropType;
  moduleName: string;
  progress: SeriesProgress | null;
  readChapterIds: ReadonlySet<string>;
  preferredReleaseId: string | null;
}

export function chapterState(
  chapterId: string,
  progress: SeriesProgress | null,
  readChapterIds: ReadonlySet<string>,
): ChapterState {
  if (readChapterIds.has(chapterId)) return "completed";
  if (progress?.chapterId === chapterId) return "in-progress";
  return "unread";
}

export function preferredRelease(
  releases: readonly Release[],
  preferredReleaseId: string | null,
): Release | undefined {
  return (
    releases.find((release) => release.id === preferredReleaseId) ??
    releases[0]
  );
}

export function chapterProgress(
  chapter: Chapter,
  progress: SeriesProgress | null,
): number | undefined {
  if (progress?.chapterId !== chapter.id || progress.pageTotal <= 0) return undefined;
  return Math.round((progress.pageIndex / progress.pageTotal) * 100);
}

export function sampleSeriesView(seriesId = "dragon-de-ceniza"): SeriesViewData {
  const fixture = findSeries(seriesId) ?? findSeries("dragon-de-ceniza");
  if (fixture === undefined) throw new Error("No hay fixture de serie");
  const details: SeriesDetails = {
    id: fixture.id,
    title: fixture.title,
    cover: fixture.cover,
    kind: fixture.kind,
    nsfw: fixture.nsfw,
    badges: fixture.badges,
    hint: fixture.hint,
    description: fixture.description,
    genres: fixture.genres,
    status: fixture.status,
    altTitles: fixture.altTitles,
    extra: {},
    chapters: fixture.chapters,
  };
  return {
    details,
    coverSource: dragonMarker,
    moduleName: "Módulo de ejemplo A",
    progress: { chapterId: "ch-2", pageIndex: 4, pageTotal: 10 },
    readChapterIds: new Set(["ch-1"]),
    preferredReleaseId: null,
  };
}
