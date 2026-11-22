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

/**
 * `preferred` es lo guardado en `series_pref.preferred_group`: el grupo de la release (vale en
 * cualquier capítulo) o, si no tiene grupo, su id. La web antigua guardaba el id (F17).
 */
export function preferredRelease(
  releases: readonly Release[],
  preferred: string | null,
): Release | undefined {
  return (
    releases.find((release) => release.id === preferred || release.group === preferred) ??
    releases[0]
  );
}

/** F17: el chip de release solo abre la hoja si hay algo que elegir. */
export function canChooseRelease(chapter: Chapter): boolean {
  return chapter.releases.length > 1;
}

export function releaseLabel(release: Release): string {
  return release.group ?? release.id;
}

export function chapterProgress(
  chapter: Chapter,
  progress: SeriesProgress | null,
): number | undefined {
  if (progress?.chapterId !== chapter.id || progress.pageTotal <= 0) return undefined;
  return Math.round((progress.pageIndex / progress.pageTotal) * 100);
}
