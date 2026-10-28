// single-use: imagen de una página del lector; solo existe dentro de él (F18).
import { Image } from "expo-image";

import { pageAspect } from "../../reader/readerLayout";
import type { ReaderImage } from "./readingSource";

/**
 * F18 — una página del lector. La imagen se pide con las cabeceras que dio el módulo (RF-24) y
 * sin transición de entrada (el lector no anima). Avisa de su relación de aspecto al cargar, que
 * es lo que fija la altura real de la página en el modo vertical.
 */

export interface ReaderPageImageProps {
  image: ReaderImage;
  width: number;
  height: number;
  /** `fill` en vertical (la altura sale de la imagen); `contain` en paginado. */
  fit: "fill" | "contain";
  label: string;
  testID?: string;
  onAspect?: (aspect: number) => void;
}

export default function ReaderPageImage({
  image,
  width,
  height,
  fit,
  label,
  testID,
  onAspect,
}: ReaderPageImageProps) {
  const source =
    image.asset ??
    (image.headers === undefined
      ? { uri: image.url }
      : { uri: image.url, headers: image.headers });
  return (
    <Image
      testID={testID}
      source={source}
      style={{ width, height }}
      contentFit={fit}
      transition={0}
      alt={label}
      accessibilityLabel={label}
      onLoad={(event) => onAspect?.(pageAspect(event.source.width, event.source.height))}
    />
  );
}
