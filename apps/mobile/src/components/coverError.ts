import type { ErrorReporter } from "../data/errorLogPort";

/**
 * T42 — registro de una portada que no carga. Deja la URL sin query y solo los NOMBRES de las
 * cabeceras enviadas (los valores pueden ser cookies de sesión): basta para ver en `log` si las
 * cabeceras llegaron y qué dijo el motor de imágenes (403, formato, red).
 */
export function reportCoverError(
  reporter: ErrorReporter | null,
  source: { uri: string; headers?: Record<string, string> },
  message: string,
): void {
  reporter?.report("error", "cover.load", message, {
    url: source.uri.split("?")[0],
    headerNames: Object.keys(source.headers ?? {}),
  });
}
