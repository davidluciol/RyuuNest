/**
 * Mapeo centralizado de fallos a los códigos del contrato (SPEC §6.4, T20).
 *
 * Lo usan los dos runtimes —declarativo y script— en vez de repetir la tabla: así un
 * fallo de red, un estado HTTP inesperado o una excepción suelta del módulo se traducen
 * siempre al mismo `ModuleErrorCode`, y un módulo roto nunca tumba la app (RNF-8).
 */
import { ModuleError, type ModuleErrorCode } from "../contract/errors.js";

/** Texto legible de cualquier valor lanzado. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Convierte cualquier fallo en un `ModuleError` del contrato.
 *
 * Un `ModuleError` se conserva tal cual (el módulo elige su código, SPEC §6.4); cualquier
 * otra cosa es un fallo interno del módulo: `INTERNAL`.
 */
export function toModuleError(error: unknown): ModuleError {
  return error instanceof ModuleError ? error : new ModuleError("INTERNAL", describeError(error));
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
