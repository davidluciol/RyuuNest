import type { Http } from "@ryuunest/core";

import type { ReaderPageImage } from "./readerData";

/**
 * F27 — descarga de una imagen del lector que pide cabeceras (RF-24). Va por el
 * puerto `Http` (la extensión, SPEC §10): el `fetch` de la página no puede poner
 * `Referer` ni saltarse el CORS. Las imágenes sin cabeceras no pasan por aquí:
 * se cargan con `<img>` directo. Un estado que no es 2xx es un fallo (el lector
 * ofrece reintentar, RF-23).
 */
export async function fetchImageBlob(http: Http, image: ReaderPageImage): Promise<Blob> {
  const response = await http.request(
    image.url,
    image.headers === undefined ? undefined : { headers: image.headers },
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }
  const bytes = await response.bytes();
  return new Blob([bytes as BlobPart], { type: response.headers["content-type"] ?? "" });
}
