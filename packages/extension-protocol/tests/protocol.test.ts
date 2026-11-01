import { describe, expect, it } from "vitest";

import {
  PROTOCOL_CHANNEL,
  PROTOCOL_VERSION,
  base64ToBytes,
  bytesToBase64,
  hostOf,
  isExtensionErrorCode,
  originPatternFor,
  parseRequest,
  parseResponse,
  withEnvelope,
} from "../src/index";

const valid = {
  channel: PROTOCOL_CHANNEL,
  version: PROTOCOL_VERSION,
  id: "r1",
  type: "http.request",
  url: "https://ejemplo.org/a?b=1",
  method: "GET",
  headers: { accept: "text/html" },
};

describe("parseRequest (página → extensión)", () => {
  it("acepta una petición HTTP bien formada", () => {
    expect(parseRequest(valid)).toEqual(valid);
  });

  it("acepta body de texto en un POST", () => {
    const post = { ...valid, method: "POST", body: '{"q":"dragón"}' };
    expect(parseRequest(post)).toEqual(post);
  });

  it("acepta ping y options.open", () => {
    const base = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION, id: "p1" };
    expect(parseRequest({ ...base, type: "ping" })).toEqual({ ...base, type: "ping" });
    expect(parseRequest({ ...base, type: "options.open", domain: "cdn.ejemplo.org" })).toEqual({
      ...base,
      type: "options.open",
      domain: "cdn.ejemplo.org",
    });
    expect(parseRequest({ ...base, type: "options.open" })).toEqual({
      ...base,
      type: "options.open",
    });
  });

  it.each([
    ["no es un objeto", "texto"],
    ["es null", null],
    ["canal ajeno", { ...valid, channel: "otra-cosa" }],
    ["versión de protocolo distinta", { ...valid, version: PROTOCOL_VERSION + 1 }],
    ["sin id", { ...valid, id: undefined }],
    ["id vacío", { ...valid, id: "" }],
    ["tipo desconocido", { ...valid, type: "http.cancel" }],
    ["url no es texto", { ...valid, url: 42 }],
    ["url relativa", { ...valid, url: "/solo/ruta" }],
    ["protocolo file:", { ...valid, url: "file:///etc/passwd" }],
    ["protocolo chrome-extension:", { ...valid, url: "chrome-extension://abc/x" }],
    ["método no permitido", { ...valid, method: "DELETE" }],
    ["método en minúsculas", { ...valid, method: "get" }],
    ["headers no es un objeto", { ...valid, headers: "x" }],
    ["header con valor no textual", { ...valid, headers: { accept: 1 } }],
    ["body no textual", { ...valid, method: "POST", body: { a: 1 } }],
    ["body en un GET", { ...valid, body: "x" }],
    ["domain no textual en options.open", { ...valid, type: "options.open", domain: 5 }],
  ])("rechaza: %s", (_motivo, value) => {
    expect(parseRequest(value)).toBeNull();
  });

  it("no deja pasar campos desconocidos", () => {
    const parsed = parseRequest({ ...valid, credentials: "include" });
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty("credentials");
  });
});

describe("parseResponse (extensión → página)", () => {
  const base = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION, id: "r1" };

  it("acepta pong, ack, http.response y error", () => {
    const pong = { ...base, type: "pong", extensionVersion: "0.0.1" };
    const ack = { ...base, type: "ack" };
    const http = {
      ...base,
      type: "http.response",
      status: 200,
      headers: { "content-type": "text/html" },
      url: "https://ejemplo.org/",
      encoding: "text",
      body: "<p>hola</p>",
    };
    const error = {
      ...base,
      type: "error",
      code: "DOMAIN_NOT_AUTHORIZED",
      message: "Falta autorizar cdn.ejemplo.org",
      domain: "cdn.ejemplo.org",
    };
    expect(parseResponse(pong)).toEqual(pong);
    expect(parseResponse(ack)).toEqual(ack);
    expect(parseResponse(http)).toEqual(http);
    expect(parseResponse(error)).toEqual(error);
  });

  it.each([
    ["canal ajeno", { channel: "x", version: PROTOCOL_VERSION, id: "1", type: "ack" }],
    [
      "estado fuera de rango",
      {
        ...base,
        type: "http.response",
        status: 99,
        headers: {},
        url: "https://a.b/",
        encoding: "text",
        body: "",
      },
    ],
    [
      "codificación desconocida",
      {
        ...base,
        type: "http.response",
        status: 200,
        headers: {},
        url: "https://a.b/",
        encoding: "hex",
        body: "",
      },
    ],
    [
      "body no textual",
      {
        ...base,
        type: "http.response",
        status: 200,
        headers: {},
        url: "https://a.b/",
        encoding: "text",
        body: 3,
      },
    ],
    ["código de error desconocido", { ...base, type: "error", code: "BOOM", message: "x" }],
    ["error sin mensaje", { ...base, type: "error", code: "NETWORK" }],
    ["pong sin versión de extensión", { ...base, type: "pong" }],
  ])("rechaza: %s", (_motivo, value) => {
    expect(parseResponse(value)).toBeNull();
  });
});

describe("withEnvelope", () => {
  it("añade canal y versión sin tocar el resto", () => {
    expect(withEnvelope({ id: "a", type: "ping" as const })).toEqual({
      channel: PROTOCOL_CHANNEL,
      version: PROTOCOL_VERSION,
      id: "a",
      type: "ping",
    });
  });
});

describe("isExtensionErrorCode", () => {
  it("distingue códigos propios del protocolo", () => {
    expect(isExtensionErrorCode("DOMAIN_NOT_AUTHORIZED")).toBe(true);
    expect(isExtensionErrorCode("NETWORK")).toBe(true);
    expect(isExtensionErrorCode("OTRA")).toBe(false);
    expect(isExtensionErrorCode(7)).toBe(false);
  });
});

describe("base64", () => {
  it("ida y vuelta con los 256 valores de byte", () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(base64ToBytes(bytesToBase64(all))).toEqual(all);
  });

  it("ida y vuelta con un cuerpo grande (más de un trozo interno)", () => {
    const big = Uint8Array.from({ length: 200_001 }, (_, i) => (i * 31) % 256);
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big);
  });

  it("vacío es vacío", () => {
    expect(bytesToBase64(new Uint8Array())).toBe("");
    expect(base64ToBytes("")).toEqual(new Uint8Array());
  });

  it("coincide con la codificación estándar", () => {
    expect(bytesToBase64(new TextEncoder().encode("RyuuNest"))).toBe("Unl1dU5lc3Q=");
  });
});

describe("hostOf y originPatternFor", () => {
  it("extrae el host en minúsculas de URL http(s)", () => {
    expect(hostOf("https://CDN.Ejemplo.org:8443/a/b?c=1")).toBe("cdn.ejemplo.org");
    expect(hostOf("http://127.0.0.1:5173/")).toBe("127.0.0.1");
  });

  it("devuelve null si no es una URL http(s)", () => {
    expect(hostOf("ftp://ejemplo.org/")).toBeNull();
    expect(hostOf("no es una url")).toBeNull();
    expect(hostOf("/ruta")).toBeNull();
  });

  it("el patrón de origen autoriza exactamente un host, en http y https", () => {
    expect(originPatternFor("cdn.ejemplo.org")).toBe("*://cdn.ejemplo.org/*");
  });
});
