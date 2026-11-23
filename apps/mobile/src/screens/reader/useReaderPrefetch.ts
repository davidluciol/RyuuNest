import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import { createPageQueue, type PageQueue } from "../../reader/pageQueue";
import {
  PAGE_QUEUE,
  READER_IMAGE_BUDGET_MB,
  batchOf,
  batchPages,
  memoryCap,
  nextChapterPreload,
  shouldPreloadNext,
} from "../../reader/preloadPlan";
import { resolveReadingSource, type ReaderImage } from "./readingSource";
import type { ReaderReady } from "./useReader";

/**
 * F19/R1 — precarga del lector (SPEC §9, RF-21), siempre a **disco** para no gastar la memoria de
 * imágenes decodificadas:
 *
 * - R1: una cola por capítulo (`pageQueue`) baja primero la página que se lee, luego las cercanas,
 *   con tope de concurrencia, timeout y reintentos acotados; al cambiar de capítulo o salir se
 *   descarta y sus respuestas tardías no cuentan. F51: el avance del lote actual sigue avisando
 *   «Cargando imágenes»;
 * - al acercarse al final, las primeras imágenes del capítulo siguiente, con las cabeceras de su
 *   módulo (RF-24).
 *
 * Es de mejor esfuerzo: un fallo de precarga no molesta al lector, la imagen se pedirá al abrirla.
 */

function prefetchOne(image: ReaderImage): Promise<boolean> {
  // Los recursos empaquetados (web de ejemplo) no se descargan: ya están disponibles.
  if (image.asset !== undefined) return Promise.resolve(true);
  return Image.prefetch(image.url, {
    cachePolicy: "disk",
    ...(image.headers === undefined ? {} : { headers: image.headers }),
  }).catch(() => false);
}

function prefetch(images: readonly ReaderImage[]): void {
  for (const image of images) void prefetchOne(image);
}

/**
 * Páginas del lote que no esperan descarga. Solo cuenta como pendiente lo que la cola tiene en
 * curso o en cola: una página del lote fuera del rango de la cola (p. ej. al retomar en la 9, las
 * 5 y 6) se queda `idle` y no debe dejar el aviso colgado.
 */
function settledIn(queue: PageQueue | null, pages: readonly number[]): number {
  if (queue === null) return 0;
  return pages.filter((page) => {
    const status = queue.getState(page).status;
    return status !== "queued" && status !== "loading";
  }).length;
}

const noop = () => undefined;

/** Avance del lote de la página actual; `null` cuando ya está en disco. */
export type ReaderPreloadProgress = { loaded: number; size: number } | null;

/** R2: el avance para el aviso F51 y la cola, de la que cada página lee su estado. */
export interface ReaderPreload {
  progress: ReaderPreloadProgress;
  queue: PageQueue | null;
}

export function useReaderPrefetch(ready: ReaderReady | null, moduleId: string): ReaderPreload {
  const { width, height } = useWindowDimensions();
  const preloadedChapter = useRef<string | null>(null);
  const snapshot = ready?.snapshot ?? null;
  const images = ready?.images ?? null;
  const next = ready?.next ?? null;
  const pageIndex = snapshot?.pageIndex ?? 0;
  const pageTotal = snapshot?.pageTotal ?? null;
  const window = snapshot?.window ?? null;
  const inMemory = window === null ? 0 : window.to - window.from + 1;

  // R1: una cola por capítulo; se descarta al cambiar de capítulo o desmontar el lector. Se crea
  // en el efecto (no en useMemo) para que el doble montaje de StrictMode no deje una cola muerta.
  // La cola va con sus imágenes: en el render que estrena capítulo, la vieja no se usa.
  const [entry, setEntry] = useState<{ images: readonly ReaderImage[]; queue: PageQueue } | null>(
    null,
  );
  const queue = entry !== null && entry.images === images ? entry.queue : null;
  useEffect(() => {
    if (images === null) {
      setEntry(null);
      return;
    }
    const created = createPageQueue({
      count: images.length,
      load: (index) => prefetchOne(images[index] as ReaderImage),
      ...PAGE_QUEUE,
    });
    setEntry({ images, queue: created });
    return () => created.dispose();
  }, [images]);
  useEffect(() => queue?.focus(pageIndex), [queue, pageIndex]);

  const batch = images === null ? [] : batchPages(batchOf(pageIndex), images.length);
  const subscribe = useCallback(
    (listener: () => void) => queue?.subscribeAll(listener) ?? noop,
    [queue],
  );
  const loaded = useSyncExternalStore(subscribe, () => settledIn(queue, batch));

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

  const progress =
    images === null || loaded === batch.length ? null : { loaded, size: batch.length };
  return { progress, queue };
}
