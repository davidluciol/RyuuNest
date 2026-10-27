import type { Http, HttpRequest, HttpResponse } from "@ryuunest/core";

/**
 * F15b — adaptador del puerto `Http` del núcleo (SPEC §5.3) sobre el `fetch`
 * de la plataforma. React Native y web exponen un `fetch` compatible; la red
 * de los módulos pasa toda por aquí (D-2: sin peticiones sueltas).
 *
 * El `fetch` real se inyecta para poder probar el mapeo sin red; el defecto
 * usa el global de la plataforma.
 */

export interface FetchInitLike {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface FetchResponseLike {
  status: number;
  headers: { forEach: (callback: (value: string, key: string) => void) => void };
  url?: string;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export type FetchLike = (url: string, init?: FetchInitLike) => Promise<FetchResponseLike>;

export function createFetchHttp(fetchImpl: FetchLike = defaultFetch): Http {
  return {
    async request(url: string, init?: HttpRequest): Promise<HttpResponse> {
      const response = await fetchImpl(url, init ? { ...init } : undefined);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      return {
        status: response.status,
        headers,
        // La URL final solo se informa si la plataforma la trae (P-74); si
        // falta, el host rellena la pedida.
        ...(response.url ? { url: response.url } : {}),
        text: () => response.text(),
        bytes: async () => new Uint8Array(await response.arrayBuffer()),
      };
    },
  };
}

function defaultFetch(url: string, init?: FetchInitLike): Promise<FetchResponseLike> {
  return globalThis.fetch(url, init) as Promise<FetchResponseLike>;
}
