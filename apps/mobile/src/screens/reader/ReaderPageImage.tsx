// single-use: imagen de una página del lector; solo existe dentro de él (F18/F19).
import { memo, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { View } from "react-native";
import { Image } from "expo-image";

import ErrorState from "../../components/ErrorState";
import { resolveErrorReporter } from "../../data/errorLog";
import { t } from "../../i18n";
import type { PageLoadState, PageQueue } from "../../reader/pageQueue";
import { pageAspect } from "../../reader/readerLayout";
import {
  PAGE_ERROR_MESSAGE_KEYS,
  pageErrorKind,
  pageImageSource,
  pageView,
} from "../../reader/pageImage";
import ReaderPagePlaceholder from "./ReaderPagePlaceholder";
import type { ReaderImage } from "./readingSource";
import { reportReaderError } from "./readerErrors";

/**
 * F18/F19/R2 — una página del lector. La descarga la ordena la cola (`pageQueue`); esta vista
 * solo pinta su estado:
 *
 * - mientras no está en disco, un placeholder con el número y el estado (sin hueco negro);
 * - en disco y dentro de la ventana que decodifica el núcleo, la imagen, pedida con las cabeceras
 *   del módulo (RF-24) y sin transición (el lector no anima); como ya está en disco, no se baja
 *   dos veces. Avisa de su relación de aspecto, que fija la altura real en vertical;
 * - si la cola agotó sus intentos, la imagen se monta una vez más para saber **por qué** falla
 *   (el prefetch no lo dice) y se muestra el motivo con reintento **solo de esa imagen** (RF-23):
 *   el resto del capítulo sigue legible.
 */

export interface ReaderPageImageProps {
  image: ReaderImage;
  /** Índice base 0 de la página. */
  index: number;
  queue: PageQueue | null;
  /** Dentro de la ventana de memoria del núcleo: solo entonces se decodifica (SPEC §9). */
  decode: boolean;
  width: number;
  height: number;
  /** `fill` en vertical (la altura sale de la imagen); `contain` en paginado. */
  fit: "fill" | "contain";
  testID?: string;
  onAspect?: (index: number, aspect: number) => void;
}

/** Sin cola todavía (el primer cuadro del capítulo), la página espera. */
const WAITING: PageLoadState = { status: "idle", attempt: 0, permanent: false };
const noop = () => undefined;

function ReaderPageImage({
  image,
  index,
  queue,
  decode,
  width,
  height,
  fit,
  testID,
  onAspect,
}: ReaderPageImageProps) {
  const pageNumber = index + 1;
  const subscribe = useCallback(
    (listener: () => void) => queue?.subscribe(index, listener) ?? noop,
    [queue, index],
  );
  const state = useSyncExternalStore(subscribe, () => queue?.getState(index) ?? WAITING);
  /** Texto técnico del motor de imágenes cuando la imagen no se pudo mostrar. */
  const [failure, setFailure] = useState<string | null>(null);
  const label = t("reader.page.label", { number: pageNumber });

  // F31: cada imagen que falla queda registrada en `log` (P-72, RF-23). El registro se resuelve
  // solo al fallar: hay una vista por página y casi nunca hace falta.
  useEffect(() => {
    if (failure === null) return;
    let cancelled = false;
    void resolveErrorReporter().then((reporter) => {
      if (!cancelled) reportReaderError(reporter, "image", new Error(failure), { page: pageNumber });
    });
    return () => {
      cancelled = true;
    };
  }, [failure, pageNumber]);

  const box = { width, height };
  const view = pageView(state, decode, failure);

  if (view.kind === "error") {
    const kind = pageErrorKind(failure ?? "");
    return (
      <View
        testID={testID === undefined ? undefined : `${testID}-error`}
        style={{ ...box, justifyContent: "center", overflow: "hidden" }}
      >
        <ErrorState
          title={t("reader.image.error", { number: pageNumber })}
          message={`${t(PAGE_ERROR_MESSAGE_KEYS[kind])} ${t("reader.image.error.continue")}`}
          detail={{ url: image.url, code: kind.toUpperCase() }}
          retryLabel={t("actions.retry")}
          onRetry={() => {
            setFailure(null);
            queue?.retry(index);
          }}
          detailLabel={t("actions.showDetail")}
        />
      </View>
    );
  }

  if (view.kind === "placeholder") {
    return (
      <ReaderPagePlaceholder
        pageNumber={pageNumber}
        status={view.status}
        width={width}
        height={height}
        testID={testID === undefined ? undefined : `${testID}-${view.status}`}
      />
    );
  }

  return (
    <Image
      testID={testID}
      source={pageImageSource(image)}
      style={box}
      contentFit={fit}
      transition={0}
      alt={label}
      accessibilityLabel={label}
      onLoad={(event) => {
        queue?.markLoaded(index);
        onAspect?.(index, pageAspect(event.source.width, event.source.height));
      }}
      onError={(event) => {
        const kind = pageErrorKind(event.error);
        // 404 o una imagen que no se puede decodificar: reintentar sola no lo arregla.
        queue?.markFailed(index, kind === "missing" || kind === "unknown");
        setFailure(event.error);
      }}
    />
  );
}

export default memo(ReaderPageImage);
