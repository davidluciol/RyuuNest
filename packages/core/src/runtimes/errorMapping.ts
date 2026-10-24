/**
 * Mapeo centralizado de fallos a los códigos del contrato (SPEC §6.4, T20).
 *
 * Lo usan los dos runtimes —declarativo y script— en vez de repetir la tabla: así un
 * fallo de red, un estado HTTP inesperado o una excepción suelta del módulo se traducen
 * siempre al mismo `ModuleErrorCode`, y un módulo roto nunca tumba la app (RNF-8).
 */
import {
  isModuleErrorCode,
  ModuleError,
  type ModuleErrorCode,
  type ModuleErrorDetails,
} from "../contract/errors.js";

/** Texto legible de cualquier valor lanzado. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Copia solo los detalles conocidos y con el tipo correcto. */
function readDetails(raw: unknown): ModuleErrorDetails | undefined {
  if (raw === null || typeof raw !== "object") {
    return undefined;
  }
  const source = raw as Record<string, unknown>;
  const details: ModuleErrorDetails = {};
  if (typeof source["url"] === "string") {
    details.url = source["url"];
  }
  if (typeof source["status"] === "number") {
    details.status = source["status"];
  }
  if (typeof source["selector"] === "string") {
    details.selector = source["selector"];
  }
  return Object.keys(details).length === 0 ? undefined : details;
}

/**
 * Reconoce el error tipado de un módulo script: un módulo `.js` suelto no puede importar
 * `ModuleError`, así que lanza un `Error` con `name === "ModuleError"` y un `code` del
 * contrato (y, opcional, `details`). Se exige la forma completa para no confiar en
 * cualquier error con un `code` (por ejemplo los de la plataforma).
 */
function fromShape(error: unknown): ModuleError | undefined {
  if (!(error instanceof Error) || error.name !== "ModuleError") {
    return undefined;
  }
  const { code, details } = error as Error & { code?: unknown; details?: unknown };
  return isModuleErrorCode(code)
    ? new ModuleError(code, error.message, readDetails(details))
    : undefined;
}

/**
 * Convierte cualquier fallo en un `ModuleError` del contrato.
 *
 * Un `ModuleError` se conserva tal cual (el módulo elige su código, SPEC §6.4) y un error
 * con su forma (`fromShape`) se reconstruye; cualquier otra cosa es un fallo interno del
 * módulo: `INTERNAL`.
 */
export function toModuleError(error: unknown): ModuleError {
  if (error instanceof ModuleError) {
    return error;
  }
  return fromShape(error) ?? new ModuleError("INTERNAL", describeError(error));
}

/**
 * Traduce el estado de una respuesta que no es 2xx al código del contrato.
 *
 * `404` no encontrado, `429` límite de peticiones y `401`/`403` protección del sitio
 * (`BLOCKED`, que en la v1 se informa y no se intenta resolver); el resto se trata como
 * fallo de red.
 */
export function moduleErrorFromStatus(url: string, status: number): ModuleError {
  const code: ModuleErrorCode =
    status === 404
      ? "NOT_FOUND"
      : status === 429
        ? "RATE_LIMITED"
        : status === 401 || status === 403
          ? "BLOCKED"
          : "NETWORK";
  return new ModuleError(code, `El sitio respondió ${status} a ${url}`, { url, status });
}
