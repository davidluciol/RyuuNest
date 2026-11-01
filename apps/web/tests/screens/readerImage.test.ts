import { StubHttp } from "@ryuunest/core";
import { describe, expect, it } from "vitest";

import { fetchImageBlob } from "../../src/screens/reader/readerImage";

/**
 * F27 — las imágenes del lector que piden cabeceras (RF-24: `Referer` y similares)
 * se descargan por el puerto `Http`, o sea, por la extensión: el `fetch` de la
 * página no puede poner esas cabeceras ni saltarse el CORS.
 */
describe("fetchImageBlob", () => {
  const url = "https://cdn.sitio.org/p/1.jpg";

  it("pide la imagen por el puerto Http con sus cabeceras", async () => {
    const http = new StubHttp({
      [url]: {
        bodyBytes: Uint8Array.of(0xff, 0xd8, 0xff),
        headers: { "content-type": "image/jpeg" },
      },
    });
    await fetchImageBlob(http, { url, headers: { Referer: "https://sitio.org/" } });
    expect(http.requests).toEqual([{ url, init: { headers: { Referer: "https://sitio.org/" } } }]);
  });

  it("devuelve los bytes exactos con el tipo que declara la respuesta", async () => {
    const bytes = Uint8Array.of(0xff, 0xd8, 0xff, 0x00, 0x80);
    const http = new StubHttp({
      [url]: { bodyBytes: bytes, headers: { "content-type": "image/jpeg" } },
    });
    const blob = await fetchImageBlob(http, { url, headers: { Referer: "https://sitio.org/" } });
    expect(blob.type).toBe("image/jpeg");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it("sin content-type el blob queda sin tipo (el navegador lo detecta)", async () => {
    const http = new StubHttp({ [url]: { bodyBytes: Uint8Array.of(1, 2, 3) } });
    const blob = await fetchImageBlob(http, { url, headers: {} });
    expect(blob.type).toBe("");
  });

  it("un estado que no es 2xx es un fallo (la interfaz ofrece reintentar)", async () => {
    const http = new StubHttp({ [url]: { status: 403, bodyBytes: Uint8Array.of(1) } });
    await expect(fetchImageBlob(http, { url, headers: {} })).rejects.toThrow(/403/);
  });

  it("si la red falla, el error sube tal cual", async () => {
    const http = {
      request: async () => {
        throw new Error("sin extensión");
      },
    };
    await expect(fetchImageBlob(http, { url, headers: {} })).rejects.toThrow("sin extensión");
  });

  it("nunca usa el fetch global de la página", async () => {
    const original = globalThis.fetch;
    let direct = 0;
    globalThis.fetch = (async () => {
      direct += 1;
      throw new Error("directo");
    }) as typeof fetch;
    try {
      const http = new StubHttp({ [url]: { bodyBytes: Uint8Array.of(1) } });
      await fetchImageBlob(http, { url, headers: {} });
      expect(direct).toBe(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
