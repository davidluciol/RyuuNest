import {
  hostOf,
  withEnvelope,
  type ErrorResponse,
  type ExtensionErrorCode,
  type HttpRequestMessage,
  type RequestMessage,
  type ResponseMessage,
} from "@ryuunest/extension-protocol";

import { encodeBody } from "./body";
import { classifyHeaders, type HeaderRules } from "./headers";

/**
 * F26 — lógica del fondo (SPEC §10), sin APIs de navegador: todo entra por
 * `HandlerDeps`, así que se prueba en Node. El cableado real está en
 * `background/index.ts`.
 *
 * Invariantes (SPEC §7.2): solo responde a los orígenes de la app, y sin permiso
 * del navegador para el host **no hay petición** (ni siquiera se instala una
 * regla de cabeceras).
 */

export interface FetchInit {
  method: string;
  headers: Record<string, string>;
  body?: string;
  /** Sin cookies: la extensión no envía ni guarda credenciales. */
  credentials: "omit";
  redirect: "follow";
  signal: AbortSignal;
}

export interface FetchResponseLike {
  status: number;
  url: string;
  headers: {
    forEach(callback: (value: string, key: string) => void): void;
    get(name: string): string | null;
  };
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type FetchFn = (url: string, init: FetchInit) => Promise<FetchResponseLike>;

export interface HandlerDeps {
  appOrigins: readonly string[];
  extensionVersion: string;
  fetch: FetchFn;
  /** `permissions.contains` del host exacto. */
  hasHostPermission(host: string): Promise<boolean>;
  /** Anota el host que faltó por autorizar (lo lista la página de opciones). */
  rememberPendingHost(host: string): Promise<void>;
  headerRules: HeaderRules;
  openOptions(domain?: string): Promise<void>;
  /** Tiempo límite de cada petición (provisional, ver MEMORY). */
  timeoutMs: number;
}

export interface Sender {
  origin: string | undefined;
}

function failure(
  id: string,
  code: ExtensionErrorCode,
  message: string,
  domain?: string,
): ErrorResponse {
  return withEnvelope({
    id,
    type: "error" as const,
    code,
    message,
    ...(domain === undefined ? {} : { domain }),
  });
}

export async function handleMessage(
  request: RequestMessage,
  sender: Sender,
  deps: HandlerDeps,
): Promise<ResponseMessage> {
  if (sender.origin === undefined || !deps.appOrigins.includes(sender.origin)) {
    return failure(request.id, "ORIGIN_NOT_ALLOWED", "Este origen no puede usar la extensión.");
  }

  switch (request.type) {
    case "ping":
      return withEnvelope({
        id: request.id,
        type: "pong" as const,
        extensionVersion: deps.extensionVersion,
      });
    case "options.open":
      await deps.openOptions(request.domain);
      return withEnvelope({ id: request.id, type: "ack" as const });
    case "http.request":
      return handleHttp(request, deps);
  }
}

async function handleHttp(
  request: HttpRequestMessage,
  deps: HandlerDeps,
): Promise<ResponseMessage> {
  const host = hostOf(request.url);
  if (host === null) return failure(request.id, "BAD_REQUEST", "URL no válida.");

  if (!(await deps.hasHostPermission(host))) {
    try {
      await deps.rememberPendingHost(host);
    } catch {
      // Anotarlo es una ayuda para la página de opciones: no cambia la respuesta.
    }
    return failure(
      request.id,
      "DOMAIN_NOT_AUTHORIZED",
      `Falta autorizar «${host}» en la extensión.`,
      host,
    );
  }

  const { fetchHeaders, ruleHeaders } = classifyHeaders(request.headers);
  let release: (() => Promise<void>) | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs);

  try {
    try {
      release = await deps.headerRules.apply(request.url, ruleHeaders);
    } catch {
      return failure(
        request.id,
        "INTERNAL",
        "No se pudieron aplicar las cabeceras de la petición.",
      );
    }

    const response = await deps.fetch(request.url, {
      method: request.method,
      headers: fetchHeaders,
      ...(request.body === undefined ? {} : { body: request.body }),
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal,
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      const name = key.toLowerCase();
      if (name !== "set-cookie") headers[name] = value;
    });

    return withEnvelope({
      id: request.id,
      type: "http.response" as const,
      status: response.status,
      headers,
      url: response.url === "" ? request.url : response.url,
      ...encodeBody(bytes, response.headers.get("content-type")),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return failure(request.id, "TIMEOUT", `Tiempo agotado al pedir ${host}.`);
    }
    if (error instanceof TypeError) {
      return failure(request.id, "NETWORK", `No se pudo completar la petición a ${host}.`);
    }
    return failure(request.id, "INTERNAL", "Error interno de la extensión.");
  } finally {
    clearTimeout(timer);
    await release?.();
  }
}
