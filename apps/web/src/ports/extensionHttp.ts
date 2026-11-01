import {
  ModuleError,
  type Http,
  type HttpRequest,
  type HttpResponse,
  type ModuleErrorCode,
} from "@ryuunest/core";
import {
  HTTP_METHODS,
  base64ToBytes,
  hostOf,
  parseResponse,
  withEnvelope,
  type ExtensionErrorCode,
  type HttpMethod,
  type HttpResponseMessage,
  type RequestMessage,
  type ResponseMessage,
} from "@ryuunest/extension-protocol";

import type { ExtensionStatusStore } from "./extensionStatus";

/**
 * F27 — puerto `Http` de la web sobre mensajes a la extensión (SPEC §5.3 y §10).
 * Toda la red de la web pasa por aquí: la página no hace peticiones directas. El
 * núcleo no cambia, solo se añade este adaptador. Las peticiones salen del hilo
 * principal (el `ModuleHost` vive aquí; el módulo, en un Web Worker, llega por RPC).
 */

/** Espera del ping que detecta la extensión. Provisional (se ajusta con uso real). */
export const DETECT_TIMEOUT_MS = 1_500;

/** Espera de una respuesta de la extensión: por encima de sus 30 s para que conteste ella antes. */
export const REQUEST_TIMEOUT_MS = 45_000;

export type ExtensionFailure = ExtensionErrorCode | "EXTENSION_MISSING";

const CONTRACT_CODE: Record<ExtensionFailure, ModuleErrorCode> = {
  DOMAIN_NOT_AUTHORIZED: "NETWORK",
  EXTENSION_MISSING: "NETWORK",
  NETWORK: "NETWORK",
  TIMEOUT: "TIMEOUT",
  INTERNAL: "INTERNAL",
  BAD_REQUEST: "INTERNAL",
  ORIGIN_NOT_ALLOWED: "INTERNAL",
};

/**
 * Fallo de la extensión como `ModuleError` (el `ModuleHost` deja pasar los
 * `ModuleError` tal cual). `reason` dice la causa concreta para la interfaz.
 * El mensaje solo lleva el host: la URL completa puede llevar tokens.
 */
export class ExtensionHttpError extends ModuleError {
  readonly reason: ExtensionFailure;
  readonly domain?: string;

  constructor(reason: ExtensionFailure, message: string, domain?: string) {
    super(CONTRACT_CODE[reason], message);
    this.reason = reason;
    if (domain !== undefined) this.domain = domain;
  }
}

/** Canal de mensajes con la extensión (en el navegador, `window.postMessage`). */
export interface ExtensionChannel {
  post(message: RequestMessage): void;
  subscribe(listener: (message: ResponseMessage) => void): () => void;
}

export interface WindowMessageEvent {
  source: unknown;
  origin: string;
  data: unknown;
}

export interface WindowLike {
  location: { origin: string };
  postMessage(message: unknown, targetOrigin: string): void;
  addEventListener(type: "message", listener: (event: WindowMessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: WindowMessageEvent) => void): void;
}

/** Canal sobre una ventana: publica solo en su origen y atiende solo respuestas válidas de sí misma. */
export function createWindowChannel(win: WindowLike): ExtensionChannel {
  const origin = win.location.origin;
  return {
    post: (message) => win.postMessage(message, origin),
    subscribe(listener) {
      const onMessage = (event: WindowMessageEvent): void => {
        if (event.source !== win || event.origin !== origin) return;
        const response = parseResponse(event.data);
        if (response !== null) listener(response);
      };
      win.addEventListener("message", onMessage);
      return () => win.removeEventListener("message", onMessage);
    },
  };
}

/** Canal sobre `window` del navegador; no lo toca hasta que se usa (en Node no hay ventana). */
export function createBrowserChannel(): ExtensionChannel {
  let channel: ExtensionChannel | undefined;
  const resolve = (): ExtensionChannel =>
    (channel ??= createWindowChannel(window as unknown as WindowLike));
  return {
    post: (message) => resolve().post(message),
    subscribe: (listener) => resolve().subscribe(listener),
  };
}

export interface ExtensionHttpOptions {
  channel: ExtensionChannel;
  status: ExtensionStatusStore;
  newId?: () => string;
  detectTimeoutMs?: number;
  requestTimeoutMs?: number;
}

export interface ExtensionHttp extends Http {
  /** Comprueba (con un ping) que la extensión está; actualiza el estado. */
  detect(): Promise<boolean>;
  /** Pide a la extensión abrir su página de opciones (donde se autorizan dominios). */
  openOptions(domain?: string): Promise<void>;
}

function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function toHttpResponse(reply: HttpResponseMessage): HttpResponse {
  const bytes = (): Uint8Array =>
    reply.encoding === "base64" ? base64ToBytes(reply.body) : new TextEncoder().encode(reply.body);
  return {
    status: reply.status,
    headers: { ...reply.headers },
    url: reply.url,
    text: async () => (reply.encoding === "text" ? reply.body : new TextDecoder().decode(bytes())),
    bytes: async () => bytes(),
  };
}

export function createExtensionHttp(options: ExtensionHttpOptions): ExtensionHttp {
  const { channel, status } = options;
  const newId = options.newId ?? randomId;
  const detectTimeoutMs = options.detectTimeoutMs ?? DETECT_TIMEOUT_MS;
  const requestTimeoutMs = options.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;

  /** Manda un mensaje y espera la respuesta con su id; `null` si se acaba el tiempo. */
  function exchange(
    build: (id: string) => RequestMessage,
    timeoutMs: number,
  ): Promise<ResponseMessage | null> {
    const id = newId();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, timeoutMs);
      const unsubscribe = channel.subscribe((message) => {
        if (message.id !== id) return;
        clearTimeout(timer);
        unsubscribe();
        resolve(message);
      });
      channel.post(build(id));
    });
  }

  let detecting: Promise<boolean> | null = null;

  function detect(): Promise<boolean> {
    // Varias peticiones al arrancar comparten un único ping.
    detecting ??= exchange((id) => withEnvelope({ id, type: "ping" as const }), detectTimeoutMs)
      .then((reply) => {
        const ready = reply?.type === "pong";
        status.setState(ready ? "ready" : "missing");
        return ready;
      })
      .finally(() => {
        detecting = null;
      });
    return detecting;
  }

  async function ensureExtension(): Promise<void> {
    if (status.get().state === "ready") return;
    if (!(await detect())) {
      throw new ExtensionHttpError(
        "EXTENSION_MISSING",
        "No se encuentra la extensión de RyuuNest en este navegador.",
      );
    }
  }

  return {
    detect,

    async request(url: string, init?: HttpRequest): Promise<HttpResponse> {
      const method = (init?.method ?? "GET").toUpperCase();
      const host = hostOf(url);
      if (!(HTTP_METHODS as readonly string[]).includes(method)) {
        throw new ModuleError("UNSUPPORTED", `Método no admitido: ${method}`);
      }
      if (host === null) throw new ModuleError("UNSUPPORTED", "Solo se admiten URL http(s)");
      if (init?.body !== undefined && method !== "POST") {
        throw new ModuleError("UNSUPPORTED", "Solo un POST puede llevar cuerpo");
      }

      await ensureExtension();

      const reply = await exchange(
        (id) =>
          withEnvelope({
            id,
            type: "http.request" as const,
            url,
            method: method as HttpMethod,
            headers: { ...init?.headers },
            ...(init?.body === undefined ? {} : { body: init.body }),
          }),
        requestTimeoutMs,
      );

      if (reply === null) {
        // La extensión dejó de contestar (recargada, desinstalada): se vuelve a detectar.
        status.setState("unknown");
        throw new ExtensionHttpError(
          "TIMEOUT",
          `La extensión no contestó a la petición a ${host}.`,
        );
      }
      if (reply.type === "error") {
        const domain = reply.domain ?? host;
        if (reply.code === "DOMAIN_NOT_AUTHORIZED") status.addPendingDomain(domain);
        throw new ExtensionHttpError(
          reply.code,
          `La extensión no pudo pedir ${host} (${reply.code}).`,
          reply.code === "DOMAIN_NOT_AUTHORIZED" ? domain : undefined,
        );
      }
      if (reply.type !== "http.response") {
        throw new ExtensionHttpError(
          "INTERNAL",
          `Respuesta inesperada de la extensión para ${host}.`,
        );
      }

      status.removePendingDomain(host);
      return toHttpResponse(reply);
    },

    async openOptions(domain?: string): Promise<void> {
      await ensureExtension();
      const reply = await exchange(
        (id) =>
          withEnvelope({
            id,
            type: "options.open" as const,
            ...(domain === undefined ? {} : { domain }),
          }),
        requestTimeoutMs,
      );
      if (reply?.type !== "ack") {
        throw new ExtensionHttpError("TIMEOUT", "La extensión no abrió sus opciones.");
      }
    },
  };
}
