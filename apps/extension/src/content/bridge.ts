import {
  parseRequest,
  parseResponse,
  withEnvelope,
  type ResponseMessage,
} from "@ryuunest/extension-protocol";

/**
 * F26 — puente del content script (SPEC §10): recibe por `window.postMessage`
 * las peticiones de la página, las reenvía al fondo y devuelve la respuesta
 * **solo al origen de la app**. Cross-browser: no usa `externally_connectable`
 * (Firefox no lo soporta).
 *
 * El content script solo se inyecta en los orígenes de la app (manifiesto) y aquí
 * se vuelve a comprobar; ignora todo lo que no venga de la propia ventana y del
 * propio origen, y reenvía únicamente los campos del protocolo.
 */

export interface BridgeEvent {
  source: unknown;
  origin: string;
  data: unknown;
}

export interface BridgeWindow {
  location: { origin: string };
  addEventListener(type: "message", listener: (event: BridgeEvent) => void): void;
  removeEventListener(type: "message", listener: (event: BridgeEvent) => void): void;
  postMessage(message: unknown, targetOrigin: string): void;
}

export interface BridgeRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

export interface BridgeOptions {
  window: BridgeWindow;
  runtime: BridgeRuntime;
  appOrigins: readonly string[];
}

/** Empieza a escuchar; devuelve la función que deja de hacerlo. */
export function startBridge({ window, runtime, appOrigins }: BridgeOptions): () => void {
  const origin = window.location.origin;
  if (!appOrigins.includes(origin)) return () => {};

  function reply(message: ResponseMessage): void {
    window.postMessage(message, origin);
  }

  function internalError(id: string): ResponseMessage {
    return withEnvelope({
      id,
      type: "error" as const,
      code: "INTERNAL" as const,
      message: "La extensión no pudo atender la petición.",
    });
  }

  const listener = (event: BridgeEvent): void => {
    if (event.source !== window || event.origin !== origin) return;
    const request = parseRequest(event.data);
    if (request === null) return;

    void runtime.sendMessage(request).then(
      (raw) => {
        const response = parseResponse(raw);
        reply(
          response !== null && response.id === request.id ? response : internalError(request.id),
        );
      },
      () => reply(internalError(request.id)),
    );
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
