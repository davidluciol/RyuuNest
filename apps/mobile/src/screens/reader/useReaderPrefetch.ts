import { useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import {
  READER_IMAGE_BUDGET_MB,
  batchPages,
  batchProgress,
  batchesToPreload,
  memoryCap,
  nextChapterPreload,
  shouldPreloadNext,
} from "../../reader/preloadPlan";
import { resolveReadingSource, type ReaderImage } from "./readingSource";
import type { ReaderReady } from "./useReader";

/**
 * F19 — precarga del lector (SPEC §9, RF-21). Dos cosas, ambas a **disco** y acotadas por
 * `preloadPlan` para no gastar la memoria de imágenes decodificadas:
 *
 * - F51: en los dos modos, el capítulo por lotes de 5 (el de la página actual y el siguiente,
 *   uno tras otro) y el avance del lote actual para avisar «Cargando imágenes»;
 * - al acercarse al final, las primeras imágenes del capítulo siguiente, con las cabeceras de su
 *   módulo (RF-24).
 *
 * Es de mejor esfuerzo: un fallo de precarga no molesta al lector, la imagen se pedirá al abrirla.
 */

function prefetchOne(image: ReaderImage): Promise<unknown> {
  // Los recursos empaquetados (web de ejemplo) no se descargan: no hay nada que precargar.
  if (image.asset !== undefined) return Promise.resolve();
  return Image.prefetch(image.url, {
    cachePolicy: "disk",
    ...(image.headers === undefined ? {} : { headers: image.headers }),
  }).catch(() => undefined);
}

function prefetch(images: readonly ReaderImage[]): void {
  for (const image of images) void prefetchOne(image);
}

/** Avance del lote de la página actual; `null` cuando ya está en disco. */
export type ReaderPreloadProgress = { loaded: number; size: number } | null;

export function useReaderPrefetch(
  ready: ReaderReady | null,
  moduleId: string,
): ReaderPreloadProgress {
  const { width, height } = useWindowDimensions();
  const preloadedChapter = useRef<string | null>(null);
  const snapshot = ready?.snapshot ?? null;
  const images = ready?.images ?? null;
  const next = ready?.next ?? null;
  const pageIndex = snapshot?.pageIndex ?? 0;
  const pageTotal = snapshot?.pageTotal ?? null;
  const window = snapshot?.window ?? null;
  const inMemory = window === null ? 0 : window.to - window.from + 1;

  // F51: lotes del capítulo en cola (uno tras otro); un fallo cuenta como hecho, la imagen se
  // reintentará al montarse.
  const done = useRef(new Set<number>());
  const started = useRef(new Set<number>());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [, setDoneCount] = useState(0);
  useEffect(() => {
    done.current = new Set();
    started.current = new Set();
    queue.current = Promise.resolve();
    setDoneCount(0);
  }, [images]);
  useEffect(() => {
    if (images === null) return;
    const chapterImages = images;
    const doneSet = done.current;
    for (const batch of batchesToPreload(pageIndex, chapterImages.length)) {
      if (started.current.has(batch)) continue;
      started.current.add(batch);
      queue.current = queue.current.then(() =>
        Promise.all(
          batchPages(batch, chapterImages.length).map((page) =>
            prefetchOne(chapterImages[page] as ReaderImage).then(() => {
              doneSet.add(page);
              if (done.current === doneSet) setDoneCount(doneSet.size);
            }),
          ),
        ),
      );
    }
  }, [images, pageIndex]);

  // Al acercarse al final, las primeras del siguiente capítulo (una sola vez por capítulo).
  useEffect(() => {
    if (next === null || next.releaseId === null) return;
    if (preloadedChapter.current === next.id || !shouldPreloadNext(pageIndex, pageTotal)) return;
    preloadedChapter.current = next.id;
    const releaseId = next.releaseId;
    resolveReadingSource()
      .then((source) => source.loadPages(moduleId, next.id, releaseId))
      .then((pages) =>
        prefetch(
          nextChapterPreload(pages.images, {
            inMemory,
            cap: memoryCap(READER_IMAGE_BUDGET_MB, width, height),
          }),
        ),
      )
      .catch(() => undefined);
  }, [next, pageIndex, pageTotal, inMemory, moduleId, width, height]);

  return images === null ? null : batchProgress(done.current, pageIndex, images.length);
}
