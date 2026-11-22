import type { Http } from "@ryuunest/core";

/** Una petición medida: solo el host, nunca la ruta ni la consulta (pueden llevar datos). */
export interface HttpTiming {
  host: string;
  /** 0 si falló la red. */
  status: number;
  startedAt: number;
  ms: number;
  /** URL final que informó la plataforma (P-74): igual, otra o ninguna. Nunca se guarda la URL. */
  finalUrl: "same" | "other" | "none";
}

/**
 * G1 (T35) — envuelve la `Http` de los módulos para medir duración por petición y
 * calibrar `HOST_DEFAULTS` con datos del dispositivo. Solo se activa en desarrollo.
 */
export function withTiming(
  http: Http,
  report: (timing: HttpTiming) => void,
  now: () => number = Date.now,
): Http {
  return {
    async request(url, init) {
      const host = new URL(url).hostname.toLowerCase();
      const startedAt = now();
      let status = 0;
      let finalUrl: HttpTiming["finalUrl"] = "none";
      try {
        const response = await http.request(url, init);
        status = response.status;
        finalUrl = response.url === undefined ? "none" : response.url === url ? "same" : "other";
        return response;
      } finally {
        report({ host, status, startedAt, ms: now() - startedAt, finalUrl });
      }
    },
  };
}

/** La `Http` de los módulos: en desarrollo deja cada medida en la consola (Metro/logcat). */
export function moduleHttp(http: Http): Http {
  // `__DEV__` lo define Metro; la web compila este archivo sin esa global.
  if ((globalThis as { __DEV__?: boolean }).__DEV__ !== true) {
    return http;
  }
  return withTiming(http, (timing) => {
    console.info("[host-timing]", JSON.stringify(timing));
  });
}
