import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../../data/errorLogPort";

/**
 * F31 — reporte de errores del Respaldo al registro `log` (P-72). Cada rechazo
 * o fallo visible (exportar, importar, aplicar, confirmar repo sugerido) deja
 * una entrada `backup.<acción>.<código>` saneada en `log`.
 */

/** Puntos del flujo de respaldo que pueden fallar. */
export type BackupErrorAction = "export" | "import" | "apply" | "repo";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Registra el fallo. Si el contexto trae `rejection` (un rechazo de
 * importación: `TOO_LARGE`/`NOT_JSON`/`INVALID`), el código del log usa ese
 * motivo en vez del código del error.
 */
export function reportBackupError(
  reporter: ErrorReporter | null,
  action: BackupErrorAction,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const code = error instanceof ModuleError ? error.code : "INTERNAL";
  const rejection = typeof context?.rejection === "string" ? context.rejection : null;
  const logCode = `backup.${action}.${(rejection ?? code).toLowerCase()}`;
  reporter?.report("error", logCode, messageOf(error), {
    errorCode: code,
    ...(rejection === null ? {} : { rejection }),
    ...(error instanceof ModuleError && error.details?.url !== undefined
      ? { url: error.details.url }
      : {}),
    ...context,
  });
}
