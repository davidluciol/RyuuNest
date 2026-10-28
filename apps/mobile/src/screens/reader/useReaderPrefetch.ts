import { useEffect, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { Image } from "expo-image";

import {
  READER_IMAGE_BUDGET_MB,
  memoryCap,
  nextChapterPreload,
  pagedAhead,
  shouldPreloadNext,
} from "../../reader/preloadPlan";
import { FALLBACK_READER_MODE } from "./readerModes";
import { resolveReadingSource, type ReaderImage } from "./readingSource";
import type { ReaderReady } from "./useReader";

/**
 * F19 — precarga del lector (SPEC §9, RF-21). Dos cosas, ambas a **disco** y acotadas por
 * `preloadPlan` para no gastar la memoria de imágenes decodificadas:
 *
 * - en paginado, las páginas que el núcleo declara por delante de la actual;
 * - al acercarse al final, las primeras imágenes del capítulo siguiente, con las cabeceras de su
 *   módulo (RF-24).
 *
 * Es de mejor esfuerzo: un fallo de precarga no molesta al lector, la imagen se pedirá al abrirla.
 */

function prefetch(images: readonly ReaderImage[]): void {
  for (const image of images) {
    // Los recursos empaquetados (web de ejemplo) no se descargan: no hay nada que precargar.
    if (image.asset !== undefined) continue;
    void Image.prefetch(image.url, {
      cachePolicy: "disk",
      ...(image.headers === undefined ? {} : { headers: image.headers }),
    }).catch(() => undefined);
  }
}

export function useReaderPrefetch(ready: ReaderReady | null, moduleId: string): void {
  const { width, height } = useWindowDimensions();
  const preloadedChapter = useRef<string | null>(null);
  const snapshot = ready?.snapshot ?? null;
  const images = ready?.images ?? null;
  const next = ready?.next ?? null;
  const mode = snapshot?.mode ?? FALLBACK_READER_MODE;
  const pageIndex = snapshot?.pageIndex ?? 0;
  const pageTotal = snapshot?.pageTotal ?? null;
  const window = snapshot?.window ?? null;
  const inMemory = window === null ? 0 : window.to - window.from + 1;

  // Dentro del capítulo, solo en paginado: en vertical las imágenes de la ventana ya se montan.
  useEffect(() => {
    if (images === null || mode === "vertical") return;
    prefetch(pagedAhead(images, window, pageIndex));
  }, [images, mode, window, pageIndex]);

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
}
