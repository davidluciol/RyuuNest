import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../data/errorLogPort";

/**
 * F31 — reporte de errores de Fuentes al registro `log` (P-72). Cada fallo
 * visible (carga inicial de la pantalla o una acción del controlador) deja
 * una entrada `sources.<acción>.<código>` saneada en `log`.
 */

/** Acciones de Fuentes que pueden fallar y quedan registradas. */
export type SourcesErrorAction =
  | "load"
  | "add-repo"
  | "install"
  | "update"
  | "uninstall"
  | "sync"
  | "remove-repo"
  | "set-enabled";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Registra el fallo como `sources.<acción>.<código-del-contrato>`. Con
 * `reporter === null` (web sin SQLite) no hace nada: la pantalla ya avisa
 * con su propio patrón (hoja con error o aviso transitorio).
 */
export function reportSourcesError(
  reporter: ErrorReporter | null,
  action: SourcesErrorAction,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const code = error instanceof ModuleError ? error.code : "INTERNAL";
  reporter?.report("error", `sources.${action}.${code.toLowerCase()}`, messageOf(error), {
    errorCode: code,
    ...(error instanceof ModuleError && error.details?.url !== undefined
      ? { url: error.details.url }
      : {}),
    ...context,
  });
}
