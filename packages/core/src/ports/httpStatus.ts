/**
 * Traducción de estados HTTP a códigos del contrato (SPEC §6.4).
 *
 * La usan el registro de repos (T12) y el instalador de paquetes (T13).
 */
import type { ModuleErrorCode } from "../contract/errors.js";

/** Código del contrato para una respuesta HTTP que no es 2xx. */
export function httpErrorCode(status: number): ModuleErrorCode {
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 429) {
    return "RATE_LIMITED";
  }
  if (status === 401 || status === 403) {
    return "BLOCKED";
  }
  return "NETWORK";
}

/** Mensaje legible para una respuesta HTTP que no es 2xx. `subject` es "Repositorio", "Paquete"… */
export function httpErrorMessage(status: number, subject: string, url: string): string {
  if (status === 404) {
    return `${subject} no encontrado (404): ${url}`;
  }
  return `${subject} respondió ${status}: ${url}`;
}
