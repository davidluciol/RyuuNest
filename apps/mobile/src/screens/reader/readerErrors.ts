import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../data/errorLogPort";

/**
 * F31 — reporte de errores del lector al registro `log` (P-72). El lector
 * muestra un banner estático (sin animación, Regla 4) y cada fallo visible
 * deja entrada: al abrir el capítulo (`reader.open.<código>`) y por cada
 * imagen que falla (RF-23, `reader.image.<código>`).
 */

/** Puntos del lector que pueden fallar. */
export type ReaderErrorAction = "open" | "image";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function reportReaderError(
  reporter: ErrorReporter | null,
  action: ReaderErrorAction,
  error: unknown,
  context: Record<string, unknown>,
): void {
  const code = error instanceof ModuleError ? error.code : "INTERNAL";
  reporter?.report("error", `reader.${action}.${code.toLowerCase()}`, messageOf(error), {
    errorCode: code,
    ...(error instanceof ModuleError && error.details?.url !== undefined
      ? { url: error.details.url }
      : {}),
    ...context,
  });
}
