import { useCallback, useEffect, useRef, useState } from "react";

import type { ErrorReporter, ReaderMode, ReaderSnapshot } from "@ryuunest/core";
import { reportReaderError } from "@ryuunest/mobile-src/screens/reader/readerErrors";

import { bootReader, type ReaderBoot, type ReaderServices, type ReaderTarget } from "./readerData";

/**
 * F25 — estado del lector web: arranca con `bootReader` (módulo en worker +
 * `ReaderController` sobre la base real), se suscribe a los snapshots y al
 * desmontar cierra el controlador (guarda el progreso pendiente, RF-20).
 */
export interface ReaderReadyView extends ReaderBoot {
  snapshot: ReaderSnapshot;
}

export type ReaderView =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; ready: ReaderReadyView };

export interface ReaderActions {
  goToPage: (index: number) => void;
  next: () => void;
  previous: () => void;
  setMode: (mode: ReaderMode) => void;
  retry: () => void;
}

export function useReader(
  target: ReaderTarget,
  services: ReaderServices & { reporter: ErrorReporter | null },
): { view: ReaderView; actions: ReaderActions } {
  const { moduleId, seriesId, chapterId, releaseId } = target;
  const [view, setView] = useState<ReaderView>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<ReaderBoot | null>(null);

  useEffect(() => {
    let cancelled = false;
    let boot: ReaderBoot | null = null;
    let unsubscribe = () => {};
    setView({ status: "loading" });

    bootReader(services, target)
      .then((resolved) => {
        if (cancelled) return;
        boot = resolved;
        controllerRef.current = resolved;
        const build = (snapshot: ReaderSnapshot): ReaderView => ({
          status: "ready",
          ready: { ...resolved, snapshot },
        });
        unsubscribe = resolved.controller.subscribe((snapshot) => {
          if (!cancelled) setView(build(snapshot));
        });
        setView(build(resolved.controller.snapshot));
      })
      .catch((error: unknown) => {
        reportReaderError(services.reporter, "open", error, { moduleId, seriesId, chapterId });
        if (!cancelled) setView({ status: "error" });
      });

    return () => {
      cancelled = true;
      unsubscribe();
      controllerRef.current = null;
      void boot?.controller.close().catch(() => {});
    };
  }, [services, moduleId, seriesId, chapterId, releaseId, attempt]);

  const goToPage = useCallback((index: number) => {
    const boot = controllerRef.current;
    if (boot !== null && boot.controller.snapshot.pageIndex !== index) {
      void boot.controller.goToPage(index).catch(() => {});
    }
  }, []);
  const next = useCallback(() => void controllerRef.current?.controller.next().catch(() => {}), []);
  const previous = useCallback(() => void controllerRef.current?.controller.previous().catch(() => {}), []);
  const setMode = useCallback(
    (mode: ReaderMode) => void controllerRef.current?.controller.setMode(mode).catch(() => {}),
    [],
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { view, actions: { goToPage, next, previous, setMode, retry } };
}
