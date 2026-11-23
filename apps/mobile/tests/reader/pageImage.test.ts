import { describe, expect, it } from "vitest";

import type { PageStatus } from "../../src/reader/pageQueue";
import {
  pageImageSource,
  pageView,
  PAGE_ERROR_MESSAGE_KEYS,
  pageErrorKind,
} from "../../src/reader/pageImage";

/**
 * F19 — cada página se pide con las cabeceras del módulo (RF-24) y, si falla, ofrece reintentar
 * esa imagen sin descartar el capítulo (RF-23). Lógica pura: la pantalla solo pinta el estado.
 */

describe("pageImageSource", () => {
  it("pide la imagen con las cabeceras que indica el módulo (RF-24)", () => {
    const headers = { Referer: "https://sitio.test/lector", "User-Agent": "RyuuNest/0.0" };

    expect(pageImageSource({ url: "https://sitio.test/1.jpg", headers })).toEqual({
      uri: "https://sitio.test/1.jpg",
      headers,
    });
  });

  it("sin cabeceras no inventa ninguna", () => {
    const source = pageImageSource({ url: "https://sitio.test/2.jpg" });

    expect(source).toEqual({ uri: "https://sitio.test/2.jpg" });
    expect(source).not.toHaveProperty("headers");
  });

  it("un recurso empaquetado (marcadores de la web) tiene prioridad sobre la URL", () => {
    expect(pageImageSource({ url: "https://sitio.test/3.jpg", asset: 42 })).toBe(42);
  });
});

describe("pageView · qué pinta una página según su estado en la cola (R2)", () => {
  const at = (status: PageStatus) => ({ status, attempt: 0, permanent: false });

  it("mientras no está en disco, el hueco con su estado", () => {
    expect(pageView(at("idle"), true, null)).toEqual({ kind: "placeholder", status: "idle" });
    expect(pageView(at("queued"), true, null)).toEqual({ kind: "placeholder", status: "queued" });
    expect(pageView(at("loading"), true, null)).toEqual({ kind: "placeholder", status: "loading" });
  });

  it("en disco, la imagen solo dentro de la ventana que decodifica el núcleo", () => {
    expect(pageView(at("loaded"), true, null)).toEqual({ kind: "image" });
    expect(pageView(at("loaded"), false, null)).toEqual({ kind: "placeholder", status: "idle" });
  });

  it("si la cola agotó los intentos, monta la imagen una vez para conocer el motivo", () => {
    expect(pageView(at("error"), true, null)).toEqual({ kind: "image" });
  });

  it("con el motivo, o fuera de la ventana, muestra el error", () => {
    expect(pageView(at("error"), true, "HTTP 404")).toEqual({ kind: "error" });
    expect(pageView(at("error"), false, null)).toEqual({ kind: "error" });
  });
});

describe("pageErrorKind · mensaje comprensible para el error de una imagen (F32)", () => {
  it("sin red o sitio caído (texto crudo de Android/iOS/fetch)", () => {
    expect(
      pageErrorKind(
        "Failed to load resource there was 1 root cause: java.net.UnknownHostException(Unable to resolve host x.org)"),
    ).toBe("network");
    expect(pageErrorKind("java.net.SocketTimeoutException: timeout")).toBe("network");
    expect(pageErrorKind("Network request failed")).toBe("network");
    expect(pageErrorKind("Failed to connect to /1.2.3.4:443")).toBe("network");
  });

  it("el sitio rechaza la imagen (401/403)", () => {
    expect(pageErrorKind("HTTP 403")).toBe("denied");
    expect(pageErrorKind("Server returned HTTP response code: 401")).toBe("denied");
    expect(pageErrorKind("Forbidden")).toBe("denied");
  });

  it("la imagen ya no existe (404/410)", () => {
    expect(pageErrorKind("HTTP 404")).toBe("missing");
    expect(pageErrorKind("Not Found")).toBe("missing");
  });

  it("no confunde números o palabras parecidas", () => {
    expect(pageErrorKind("ongoing request 14031")).toBe("unknown");
  });

  it("cualquier otro fallo cae en un mensaje general", () => {
    expect(pageErrorKind("algo raro")).toBe("unknown");
    expect(pageErrorKind("")).toBe("unknown");
  });

  it("cada tipo tiene su clave de traducción", () => {
    expect(Object.keys(PAGE_ERROR_MESSAGE_KEYS).sort()).toEqual(["denied", "missing", "network", "unknown"]);
  });
});
