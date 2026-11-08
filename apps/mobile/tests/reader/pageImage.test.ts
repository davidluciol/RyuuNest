import { describe, expect, it } from "vitest";

import {
  INITIAL_PAGE_LOAD,
  pageImageSource,
  pageLoadReducer,
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

describe("pageLoadReducer", () => {
  it("arranca cargando, en el primer intento", () => {
    expect(INITIAL_PAGE_LOAD).toEqual({ status: "loading", attempt: 0 });
  });

  it("al cargar pasa a cargada", () => {
    expect(pageLoadReducer(INITIAL_PAGE_LOAD, { type: "loaded" })).toEqual({
      status: "loaded",
      attempt: 0,
    });
  });

  it("un fallo guarda el motivo para mostrarlo como detalle técnico", () => {
    expect(pageLoadReducer(INITIAL_PAGE_LOAD, { type: "failed", message: "HTTP 403" })).toEqual({
      status: "error",
      attempt: 0,
      message: "HTTP 403",
    });
  });

  it("reintentar vuelve a cargar y cuenta el intento, que cambia la clave de la imagen", () => {
    const failed = pageLoadReducer(INITIAL_PAGE_LOAD, { type: "failed", message: "HTTP 403" });

    const retried = pageLoadReducer(failed, { type: "retry" });

    expect(retried).toEqual({ status: "loading", attempt: 1 });
    expect(pageLoadReducer(pageLoadReducer(retried, { type: "failed", message: "x" }), { type: "retry" }).attempt).toBe(2);
  });

  it("reintentar solo tiene efecto si la imagen falló", () => {
    expect(pageLoadReducer(INITIAL_PAGE_LOAD, { type: "retry" })).toBe(INITIAL_PAGE_LOAD);
    const loaded = pageLoadReducer(INITIAL_PAGE_LOAD, { type: "loaded" });
    expect(pageLoadReducer(loaded, { type: "retry" })).toBe(loaded);
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
