import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { ModuleError, type ReaderMode, type ReaderSnapshot } from "@ryuunest/core";

import { ReaderController } from "../../reader/readerController";
import { readingOrder } from "../../reader/readingOrder";
import { toDiscoverError } from "../discover/discoverData";
import type { DiscoverError } from "../discover/discoverFixtures";
import { chapterState, type ChapterState } from "../series/seriesFixtures";
import { resolveReadingSource, type ReaderImage } from "./readingSource";
import { resolveSettingsService } from "../settings/useSettingsData";
import { useReaderPrefetch } from "./useReaderPrefetch";

/**
 * F18 — estado de la pantalla del lector: carga la ficha (capítulos y tipo de obra) y las páginas
 * del capítulo, abre el `ReaderController` (progreso con retraso, modo por serie) y entrega a la
 * pantalla una vista lista. La pantalla no sabe de módulos ni de SQLite.
 */

export interface ReaderChapterItem {
  id: string;
  releaseId: string | null;
  number: number | undefined;
  title: string;
  state: ChapterState;
}

export interface ReaderReady {
  seriesTitle: string;
  chapter: { id: string; number: number | undefined; title: string };
  /** Capítulos en orden de lectura, para el selector. */
  chapters: ReaderChapterItem[];
  images: ReaderImage[];
  snapshot: ReaderSnapshot;
  next: { id: string; releaseId: string | null; number: number | undefined } | null;
}

export type ReaderView =
  | { status: "loading" }
  | { status: "error"; error: DiscoverError }
  | { status: "ready"; ready: ReaderReady };

export interface ReaderActions {
  goToPage: (index: number) => void;
  next: () => void;
  previous: () => void;
  setMode: (mode: ReaderMode) => void;
  retry: () => void;
}

export interface ReaderTarget {
  moduleId: string;
  seriesId: string;
  chapterId: string;
  /** Edición a leer; sin ella, la primera del capítulo. */
  releaseId?: string | undefined;
}

function report(error: unknown): void {
  console.warn("El lector no pudo completar la acción:", error);
}

export function useReader(target: ReaderTarget): { view: ReaderView; actions: ReaderActions } {
  const { moduleId, seriesId, chapterId, releaseId } = target;
  const [view, setView] = useState<ReaderView>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<ReaderController | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: ReaderController | null = null;
    let unsubscribe = () => {};
    setView({ status: "loading" });

    (async () => {
      const source = await resolveReadingSource();
      const [series, settings] = await Promise.all([
        source.loadSeries(moduleId, seriesId),
        resolveSettingsService().then((service) => service.load()),
      ]);
      const ordered = readingOrder(series.details.chapters);
      const chapter = ordered.find((item) => item.id === chapterId);
      if (chapter === undefined) {
        throw new ModuleError("NOT_FOUND", `La serie no tiene el capítulo ${chapterId}`);
      }
      const edition = releaseId ?? chapter.releases[0]?.id;
      if (edition === undefined) {
        throw new ModuleError("NOT_FOUND", `El capítulo ${chapterId} no tiene ninguna edición`);
      }
      const pages = await source.loadPages(moduleId, chapterId, edition);
      if (cancelled) return;

      const items: ReaderChapterItem[] = ordered.map((item) => ({
        id: item.id,
        releaseId: item.releases[0]?.id ?? null,
        number: item.number,
        title: item.title,
        state: chapterState(item.id, series.progress, series.readChapterIds),
      }));
      controller = new ReaderController({
        driver: source.driver,
        clock: { now: () => Date.now() },
        moduleId,
        seriesId,
        kind: series.details.kind ?? null,
        defaultMode: settings.defaultReaderMode,
        chapters: items.map((item) => ({
          chapterId: item.id,
          title: item.title,
          releaseId: item.releaseId,
          pageTotal: null,
        })),
        onSaveError: report,
      });
      await controller.open({
        chapterId,
        releaseId: edition,
        pageTotal: pages.images.length,
      });
      if (cancelled) {
        await controller.close();
        return;
      }

      const build = (snapshot: ReaderSnapshot): ReaderView => {
        const next = snapshot.nextChapter;
        return {
          status: "ready",
          ready: {
            seriesTitle: series.details.title,
            chapter: { id: chapter.id, number: chapter.number, title: chapter.title },
            chapters: items,
            images: pages.images,
            snapshot,
            next:
              next === null
                ? null
                : {
                    id: next.chapterId,
                    releaseId: next.releaseId ?? null,
                    number: items.find((item) => item.id === next.chapterId)?.number,
                  },
          },
        };
      };
      controllerRef.current = controller;
      unsubscribe = controller.subscribe((snapshot) => setView(build(snapshot)));
      setView(build(controller.snapshot));
    })().catch((error: unknown) => {
      if (!cancelled) setView({ status: "error", error: toDiscoverError(error, moduleId) });
    });

    return () => {
      cancelled = true;
      unsubscribe();
      controllerRef.current = null;
      void controller?.close().catch(report);
    };
  }, [moduleId, seriesId, chapterId, releaseId, attempt]);

  // RF-20: al salir de la app (segundo plano) se guarda lo pendiente.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") void controllerRef.current?.close().catch(report);
    });
    return () => subscription.remove();
  }, []);

  const goToPage = useCallback((index: number) => {
    const controller = controllerRef.current;
    if (controller !== null && controller.snapshot.pageIndex !== index) {
      void controller.goToPage(index).catch(report);
    }
  }, []);
  const next = useCallback(() => void controllerRef.current?.next().catch(report), []);
  const previous = useCallback(() => void controllerRef.current?.previous().catch(report), []);
  const setMode = useCallback(
    (mode: ReaderMode) => void controllerRef.current?.setMode(mode).catch(report),
    [],
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useReaderPrefetch(view.status === "ready" ? view.ready : null, moduleId);

  return { view, actions: { goToPage, next, previous, setMode, retry } };
}
