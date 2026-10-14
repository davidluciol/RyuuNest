/**
 * Errores del contrato de módulos (SPEC §6.4).
 *
 * Un módulo nunca debe tumbar la app: todo fallo llega como `ModuleError` con un
 * `code` que el núcleo sabe interpretar.
 */

/** Códigos de error del contrato (SPEC §6.4). */
export type ModuleErrorCode =
  | "NETWORK"
  | "TIMEOUT"
  | "BLOCKED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PARSE"
  | "UNSUPPORTED"
  | "INTERNAL";

/** Todos los códigos, en el orden del SPEC §6.4. */
export const MODULE_ERROR_CODES = [
  "NETWORK",
  "TIMEOUT",
  "BLOCKED",
  "RATE_LIMITED",
  "NOT_FOUND",
  "PARSE",
  "UNSUPPORTED",
  "INTERNAL",
] as const satisfies readonly ModuleErrorCode[];

/** Contexto técnico del fallo. Opcional; nunca lleva secretos. */
export interface ModuleErrorDetails {
  url?: string;
  status?: number;
  selector?: string;
}

/** Comprueba si un valor es uno de los códigos del contrato. */
export function isModuleErrorCode(value: unknown): value is ModuleErrorCode {
  return typeof value === "string" && (MODULE_ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Error tipado del contrato. `code` permite decidir el tratamiento (reintentar,
 * avisar al usuario, etc.) sin leer el mensaje, y `details` da el contexto técnico.
 */
export class ModuleError extends Error {
  override readonly name = "ModuleError";
  readonly code: ModuleErrorCode;
  readonly details?: ModuleErrorDetails;

  constructor(code: ModuleErrorCode, message: string, details?: ModuleErrorDetails) {
    super(message);
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/** Comprueba si un valor es un `ModuleError`. */
export function isModuleError(value: unknown): value is ModuleError {
  return value instanceof ModuleError;
}
