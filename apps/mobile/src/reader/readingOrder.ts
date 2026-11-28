import type { Chapter, ReaderChapter } from "@ryuunest/core";

import { preferredRelease, type ChapterState } from "../screens/series/seriesLogic";

/**
 * F18 — capítulos en orden de lectura (del primero al último), como pide `ReaderState`.
 * Con número en todos se ordena por número; si falta alguno no hay forma fiable de comparar y
 * se invierte la lista, porque el contrato la entrega «más nuevo primero» (SPEC §6.2).
 */
export function readingOrder(chapters: readonly Chapter[]): Chapter[] {
  const numbered = chapters.every((chapter) => chapter.number !== undefined);
  if (numbered) {
    return [...chapters].sort((a, b) => (a.number as number) - (b.number as number));
  }
  return [...chapters].reverse();
}

/** Capítulos para el lector, cada uno con su edición preferida (o la primera). */
export function readerChapters(
  chapters: readonly Chapter[],
  preferredReleaseId: string | null,
): ReaderChapter[] {
  return readingOrder(chapters).map((chapter) => ({
    chapterId: chapter.id,
    title: chapter.title,
    releaseId: preferredRelease(chapter.releases, preferredReleaseId)?.id ?? null,
    pageTotal: null,
  }));
}

/** Capítulos anteriores al actual (en orden de lectura) que no están terminados (#181). */
export function previousUnread(
  items: readonly { id: string; state: ChapterState }[],
  currentId: string,
): string[] {
  const index = items.findIndex((item) => item.id === currentId);
  return items
    .slice(0, Math.max(index, 0))
    .filter((item) => item.state !== "completed")
    .map((item) => item.id);
}
