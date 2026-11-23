import type { ImageRef } from "@ryuunest/core";

import type { PageLoadState } from "./pageQueue";

/**
 * F19 — carga de una página del lector. Lógica pura; la pantalla solo la pinta.
 *
 * - **Cabeceras (RF-24):** la imagen se pide con las que dio el módulo (`Referer`,
 *   `User-Agent`), porque muchos sitios bloquean los enlaces directos.
 * - **Reintento individual (RF-23, SPEC §9):** una imagen que falla se reintenta sola, sin tocar
 *   las demás ni descartar el capítulo (la cola de `pageQueue` lleva los intentos).
 */

/** Imagen de una página: la del módulo y, en la web de ejemplo, un recurso empaquetado. */
export interface PageImageRef extends ImageRef {
  asset?: number;
}

export type PageImageSource = number | { uri: string; headers?: Record<string, string> };

export function pageImageSource(image: PageImageRef): PageImageSource {
  if (image.asset !== undefined) return image.asset;
  return image.headers === undefined
    ? { uri: image.url }
    : { uri: image.url, headers: image.headers };
}

/** Por qué falló una imagen, en palabras que entiende quien lee (el texto crudo va al registro). */
export type PageErrorKind = "network" | "denied" | "missing" | "unknown";

/** Clave de traducción del mensaje de cada tipo; citadas aquí, la puerta de i18n las ve usadas. */
export const PAGE_ERROR_MESSAGE_KEYS: Record<PageErrorKind, string> = {
  network: "reader.image.error.network",
  denied: "reader.image.error.denied",
  missing: "reader.image.error.missing",
  unknown: "reader.image.error.unknown",
};

/** Clasifica el texto técnico que entrega el motor de imágenes (Android, iOS o web). */
export function pageErrorKind(raw: string): PageErrorKind {
  const text = raw.toLowerCase();
  if (/\b(401|403)\b|forbidden|unauthori[sz]ed/.test(text)) return "denied";
  if (/\b(404|410)\b|not found|\bgone\b/.test(text)) return "missing";
  if (
    /unknownhost|unable to resolve|timeout|timed out|failed to connect|connection (reset|refused)|network|failed to fetch|offline|enotfound|econn/.test(
      text,
    )
  ) {
    return "network";
  }
  return "unknown";
}

/** R2 — lo que pinta una página: su hueco con el estado, la imagen o el error. */
export type PageView =
  | { kind: "placeholder"; status: "idle" | "queued" | "loading" }
  | { kind: "image" }
  | { kind: "error" };

/**
 * `decode`: la página está en la ventana que el núcleo mantiene decodificada. `failure`: el motivo
 * que dio la imagen al fallar. Tras agotar la cola, la imagen se monta una vez más para saber por
 * qué falla (el prefetch no lo dice).
 */
export function pageView(state: PageLoadState, decode: boolean, failure: string | null): PageView {
  if (state.status === "error")
    return decode && failure === null ? { kind: "image" } : { kind: "error" };
  if (state.status === "loaded")
    return decode ? { kind: "image" } : { kind: "placeholder", status: "idle" };
  return { kind: "placeholder", status: state.status };
}
