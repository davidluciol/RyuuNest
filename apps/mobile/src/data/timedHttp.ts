import type { Http } from "@ryuunest/core";

/** Una petición medida: solo el host, nunca la ruta ni la consulta (pueden llevar datos). */
export interface HttpTiming {
  host: string;
  /** 0 si falló la red. */
  status: number;
  startedAt: number;
  ms: number;
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
      try {
        const response = await http.request(url, init);
        status = response.status;
        return response;
      } finally {
        report({ host, status, startedAt, ms: now() - startedAt });
      }
    },
  };
}

/** La `Http` de los módulos: en desarrollo deja cada medida en la consola (Metro/logcat). */
export function moduleHttp(http: Http): Http {
  if (!__DEV__) {
    return http;
  }
  return withTiming(http, (timing) => {
    console.info("[host-timing]", JSON.stringify(timing));
  });
}
