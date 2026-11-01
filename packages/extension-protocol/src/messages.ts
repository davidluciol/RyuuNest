import { hostOf } from "./url.js";

/**
 * Mensajes web ↔ extensión (SPEC §10). Un mismo formato sirve en los dos
 * tramos: página → content script (`window.postMessage`) y content script →
 * background (`runtime.sendMessage`). La página y la extensión **no se fían**
 * de lo que reciben: todo pasa por `parseRequest`/`parseResponse`.
 */

/** Separa el tráfico de RyuuNest del resto de `postMessage` de la página. */
export const PROTOCOL_CHANNEL = "ryuunest.extension" as const;

/** Cambia cuando el formato deja de ser compatible; un mensaje de otra versión se descarta. */
export const PROTOCOL_VERSION = 1 as const;

/** Métodos que la extensión acepta (mínimo privilegio; ampliar solo con motivo). */
export const HTTP_METHODS = ["GET", "HEAD", "POST"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const EXTENSION_ERROR_CODES = [
  "DOMAIN_NOT_AUTHORIZED",
  "ORIGIN_NOT_ALLOWED",
  "BAD_REQUEST",
  "NETWORK",
  "TIMEOUT",
  "INTERNAL",
] as const;
export type ExtensionErrorCode = (typeof EXTENSION_ERROR_CODES)[number];

export type BodyEncoding = "text" | "base64";

export interface Envelope {
  readonly channel: typeof PROTOCOL_CHANNEL;
  readonly version: typeof PROTOCOL_VERSION;
  readonly id: string;
}

export interface PingRequest extends Envelope {
  readonly type: "ping";
}

export interface HttpRequestMessage extends Envelope {
  readonly type: "http.request";
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}

/** Pide abrir la página de opciones de la extensión (donde se autoriza un dominio). */
export interface OptionsOpenRequest extends Envelope {
  readonly type: "options.open";
  readonly domain?: string;
}

export type RequestMessage = PingRequest | HttpRequestMessage | OptionsOpenRequest;

export interface PongResponse extends Envelope {
  readonly type: "pong";
  readonly extensionVersion: string;
}

export interface AckResponse extends Envelope {
  readonly type: "ack";
}

export interface HttpResponseMessage extends Envelope {
  readonly type: "http.response";
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  /** URL final tras las redirecciones. */
  readonly url: string;
  readonly encoding: BodyEncoding;
  readonly body: string;
}

export interface ErrorResponse extends Envelope {
  readonly type: "error";
  readonly code: ExtensionErrorCode;
  readonly message: string;
  /** Host que falta por autorizar (solo con `DOMAIN_NOT_AUTHORIZED`). */
  readonly domain?: string;
}

export type ResponseMessage = PongResponse | AckResponse | HttpResponseMessage | ErrorResponse;

/** Añade canal y versión a un cuerpo de mensaje. */
export function withEnvelope<T extends { readonly id: string }>(
  body: T,
): T & Pick<Envelope, "channel" | "version"> {
  return { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION, ...body };
}

export function isExtensionErrorCode(value: unknown): value is ExtensionErrorCode {
  return typeof value === "string" && (EXTENSION_ERROR_CODES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEnvelope(value: unknown): { record: Record<string, unknown>; id: string } | null {
  if (!isRecord(value)) return null;
  if (value["channel"] !== PROTOCOL_CHANNEL || value["version"] !== PROTOCOL_VERSION) return null;
  const id = value["id"];
  if (typeof id !== "string" || id === "") return null;
  return { record: value, id };
}

function readStringRecord(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") return null;
    out[key] = entry;
  }
  return out;
}

/** Valida y normaliza un mensaje página → extensión; `null` si no es válido (se descarta). */
export function parseRequest(value: unknown): RequestMessage | null {
  const read = readEnvelope(value);
  if (read === null) return null;
  const { record, id } = read;
  const base = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION, id } as const;

  switch (record["type"]) {
    case "ping":
      return { ...base, type: "ping" };
    case "options.open": {
      const domain = record["domain"];
      if (domain === undefined) return { ...base, type: "options.open" };
      if (typeof domain !== "string") return null;
      return { ...base, type: "options.open", domain };
    }
    case "http.request": {
      const url = record["url"];
      const method = record["method"];
      const body = record["body"];
      if (typeof url !== "string" || hostOf(url) === null) return null;
      if (!(HTTP_METHODS as readonly unknown[]).includes(method)) return null;
      const headers = readStringRecord(record["headers"]);
      if (headers === null) return null;
      const request = {
        ...base,
        type: "http.request",
        url,
        method: method as HttpMethod,
        headers,
      } as const;
      if (body === undefined) return request;
      if (typeof body !== "string" || method !== "POST") return null;
      return { ...request, body };
    }
    default:
      return null;
  }
}

/** Valida y normaliza un mensaje extensión → página; `null` si no es válido (se descarta). */
export function parseResponse(value: unknown): ResponseMessage | null {
  const read = readEnvelope(value);
  if (read === null) return null;
  const { record, id } = read;
  const base = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION, id } as const;

  switch (record["type"]) {
    case "ack":
      return { ...base, type: "ack" };
    case "pong": {
      const extensionVersion = record["extensionVersion"];
      if (typeof extensionVersion !== "string") return null;
      return { ...base, type: "pong", extensionVersion };
    }
    case "http.response": {
      const status = record["status"];
      const url = record["url"];
      const encoding = record["encoding"];
      const body = record["body"];
      const headers = readStringRecord(record["headers"]);
      if (typeof status !== "number" || !Number.isInteger(status) || status < 100 || status > 599)
        return null;
      if (typeof url !== "string" || headers === null || typeof body !== "string") return null;
      if (encoding !== "text" && encoding !== "base64") return null;
      return { ...base, type: "http.response", status, headers, url, encoding, body };
    }
    case "error": {
      const code = record["code"];
      const message = record["message"];
      const domain = record["domain"];
      if (!isExtensionErrorCode(code) || typeof message !== "string") return null;
      if (domain === undefined) return { ...base, type: "error", code, message };
      if (typeof domain !== "string") return null;
      return { ...base, type: "error", code, message, domain };
    }
    default:
      return null;
  }
}
