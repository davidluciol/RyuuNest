import type { ImageRef } from "@ryuunest/core";

/**
 * F19 — carga de una página del lector. Lógica pura; la pantalla solo la pinta.
 *
 * - **Cabeceras (RF-24):** la imagen se pide con las que dio el módulo (`Referer`,
 *   `User-Agent`), porque muchos sitios bloquean los enlaces directos.
 * - **Reintento individual (RF-23, SPEC §9):** una imagen que falla se reintenta sola, sin tocar
 *   las demás ni descartar el capítulo.
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

export type PageLoad =
  | { status: "loading"; attempt: number }
  | { status: "loaded"; attempt: number }
  | { status: "error"; attempt: number; message: string };

export type PageLoadEvent =
  | { type: "loaded" }
  | { type: "failed"; message: string }
  | { type: "retry" };

export const INITIAL_PAGE_LOAD: PageLoad = { status: "loading", attempt: 0 };

/** `attempt` cuenta los reintentos y la pantalla lo usa de clave para volver a montar la imagen. */
export function pageLoadReducer(state: PageLoad, event: PageLoadEvent): PageLoad {
  switch (event.type) {
    case "loaded":
      return { status: "loaded", attempt: state.attempt };
    case "failed":
      return { status: "error", attempt: state.attempt, message: event.message };
    case "retry":
      return state.status === "error" ? { status: "loading", attempt: state.attempt + 1 } : state;
  }
}
