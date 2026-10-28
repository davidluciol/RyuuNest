// single-use: imagen de una página del lector; solo existe dentro de él (F18/F19).
import { useReducer } from "react";
import { View } from "react-native";
import { Image } from "expo-image";

import ErrorState from "../../components/ErrorState";
import { t } from "../../i18n";
import { pageAspect } from "../../reader/readerLayout";
import { INITIAL_PAGE_LOAD, pageImageSource, pageLoadReducer } from "../../reader/pageImage";
import type { ReaderImage } from "./readingSource";

/**
 * F18/F19 — una página del lector. La imagen se pide con las cabeceras que dio el módulo (RF-24)
 * y sin transición de entrada (el lector no anima). Avisa de su relación de aspecto al cargar,
 * que fija la altura real de la página en vertical. Si falla, muestra el motivo y reintenta **solo
 * esa imagen** (RF-23): el resto del capítulo sigue legible.
 */

export interface ReaderPageImageProps {
  image: ReaderImage;
  width: number;
  height: number;
  /** `fill` en vertical (la altura sale de la imagen); `contain` en paginado. */
  fit: "fill" | "contain";
  /** Número de página, base 1, para el texto alternativo y el error. */
  pageNumber: number;
  testID?: string;
  onAspect?: (aspect: number) => void;
}

export default function ReaderPageImage({
  image,
  width,
  height,
  fit,
  pageNumber,
  testID,
  onAspect,
}: ReaderPageImageProps) {
  const [load, dispatch] = useReducer(pageLoadReducer, INITIAL_PAGE_LOAD);
  const label = t("reader.page.label", { number: pageNumber });

  if (load.status === "error") {
    return (
      <View testID={testID === undefined ? undefined : `${testID}-error`} style={{ width, height, justifyContent: "center", overflow: "hidden" }}>
        <ErrorState
          title={t("reader.image.error", { number: pageNumber })}
          message={load.message}
          detail={{ url: image.url }}
          retryLabel={t("actions.retry")}
          onRetry={() => dispatch({ type: "retry" })}
          detailLabel={t("actions.showDetail")}
        />
      </View>
    );
  }

  return (
    <Image
      key={load.attempt}
      testID={testID}
      source={pageImageSource(image)}
      style={{ width, height }}
      contentFit={fit}
      transition={0}
      alt={label}
      accessibilityLabel={label}
      onLoad={(event) => {
        dispatch({ type: "loaded" });
        onAspect?.(pageAspect(event.source.width, event.source.height));
      }}
      onError={(event) => dispatch({ type: "failed", message: event.error })}
    />
  );
}
