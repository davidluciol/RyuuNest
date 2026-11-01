import type { Chapter, Release } from "@ryuunest/core";

/**
 * F25 — lógica pura de la ficha de serie, compartida con `apps/web`
 * (`@ryuunest/mobile-src`, P-115): sin `react-native`, sin fixtures. La parte
 * con tipos de RN (`SeriesViewData.coverSource`) y los datos de ejemplo
 * quedan en `seriesFixtures.ts`.
 */

export type ChapterState = "unread" | "in-progress" | "completed";

export interface SeriesProgress {
  chapterId: string;
  pageIndex: number;
  pageTotal: number;
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
  return releases.find((release) => release.id === preferredReleaseId) ?? releases[0];
}

export function chapterProgress(
  chapter: Chapter,
  progress: SeriesProgress | null,
): number | undefined {
  if (progress?.chapterId !== chapter.id || progress.pageTotal <= 0) return undefined;
  return Math.round((progress.pageIndex / progress.pageTotal) * 100);
}
