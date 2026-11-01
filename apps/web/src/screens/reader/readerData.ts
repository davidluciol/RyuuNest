import { ModuleError, type ImageRef, type ReaderSnapshot, type SqlDriver } from "@ryuunest/core";
import { ReaderController } from "@ryuunest/mobile-src/reader/readerController";
import { readerChapters } from "@ryuunest/mobile-src/reader/readingOrder";
import { readingOrder } from "@ryuunest/mobile-src/reader/readingOrder";
import { chapterState } from "@ryuunest/mobile-src/screens/series/seriesLogic";
import type { ChapterState } from "@ryuunest/mobile-src/screens/series/seriesLogic";
import type { ModuleMounter } from "@ryuunest/core";

import { loadSeries } from "../series/seriesData";

/**
 * F25 — arranque del lector web (puro, sin React): monta el módulo (en
 * producción, en el Web Worker), lee `details()` + `pages()` y abre el
 * `ReaderController` del núcleo sobre la base real (sql.js + IndexedDB),
 * reabriendo en la página guardada (RF-20). El render (vertical/paginado) es
 * de la pantalla.
 */

export interface ReaderPageImage {
  url: string;
  headers?: Record<string, string> | undefined;
}

export interface ReaderChapterItem {
  id: string;
  releaseId: string | null;
  number: number | undefined;
  title: string;
  state: ChapterState;
}

export interface ReaderBoot {
  controller: ReaderController;
  seriesTitle: string;
  chapters: ReaderChapterItem[];
  images: ReaderPageImage[];
  snapshot: ReaderSnapshot;
}

export interface ReaderTarget {
  moduleId: string;
  seriesId: string;
  chapterId: string;
  releaseId?: string | undefined;
}

export interface ReaderServices {
  driver: SqlDriver;
  mounter: ModuleMounter;
}

function toImage(image: ImageRef): ReaderPageImage {
  return {
    url: image.url,
    ...(image.headers === undefined ? {} : { headers: image.headers }),
  };
}

export async function bootReader(services: ReaderServices, target: ReaderTarget): Promise<ReaderBoot> {
  const { driver, mounter } = services;
  const clock = { now: () => Date.now() };
  const series = await loadSeries({ driver, mounter }, target.moduleId, target.seriesId);

  const ordered = readingOrder(series.details.chapters);
  const chapter = ordered.find((item) => item.id === target.chapterId);
  if (chapter === undefined) {
    throw new ModuleError("NOT_FOUND", `La serie no tiene el capítulo ${target.chapterId}`);
  }
  const releases = chapter.releases;
  const edition = target.releaseId ?? series.preferredReleaseId ?? releases[0]?.id;
  if (edition === undefined) {
    throw new ModuleError("NOT_FOUND", `El capítulo ${target.chapterId} no tiene ninguna edición`);
  }

  const { handle } = await mounter.mount(target.moduleId);
  const pages = await handle.api.pages(chapter.id, edition);

  const chapters: ReaderChapterItem[] = ordered.map((item) => ({
    id: item.id,
    releaseId: item.releases[0]?.id ?? null,
    number: item.number,
    title: item.title,
    state: chapterState(item.id, series.progress, series.readChapterIds),
  }));

  const controller = new ReaderController({
    driver,
    clock,
    moduleId: target.moduleId,
    seriesId: target.seriesId,
    kind: series.details.kind ?? null,
    defaultMode: "vertical",
    chapters: readerChapters(ordered, series.preferredReleaseId),
    onSaveError: () => {},
  });
  await controller.open({ chapterId: chapter.id, releaseId: edition, pageTotal: pages.images.length });

  return {
    controller,
    seriesTitle: series.details.title,
    chapters,
    images: pages.images.map(toImage),
    snapshot: controller.snapshot,
  };
}
