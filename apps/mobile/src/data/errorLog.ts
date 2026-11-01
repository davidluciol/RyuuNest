import Constants from "expo-constants";
import { Platform } from "react-native";

import { createLogStore, type LogStore } from "@ryuunest/core";

import { openAppDatabase } from "./appDatabase";
import { createErrorReporter, type ErrorReporter } from "./errorLogPort";

export type { ErrorReporter } from "./errorLogPort";
export { createErrorReporter } from "./errorLogPort";

/**
 * F31 — registro de errores visibles (P-72): cada pantalla que muestre un
 * error al usuario (Descubrir, Fuentes, Respaldo, Lector) deja aquí una
 * entrada saneada en la tabla `log` (T36). En web no hay SQLite
 * (`openAppDatabase` devuelve `null`, P-79): el reporter es un no-op.
 *
 * La lógica pura vive en `errorLogPort.ts` (sin `react-native`) para Vitest;
 * este módulo solo resuelve el `LogStore` real de la plataforma.
 */

let resolvedLog: Promise<LogStore | null> | undefined;

/**
 * El `LogStore` de la app, compartido con Diagnóstico (F30). Se resuelve una
 * sola vez sobre el driver real del dispositivo; en web devuelve `null`.
 */
export function resolveErrorLog(): Promise<LogStore | null> {
  resolvedLog ??= openAppDatabase().then((driver) => {
    if (driver === null) return null;
    return createLogStore({
      driver,
      clock: { now: () => Date.now() },
      appVersion: Constants.expoConfig?.version ?? "0.0.0",
      platform: Platform.OS,
    });
  });
  return resolvedLog;
}

/** El reporter listo para usar en una pantalla. */
export async function resolveErrorReporter(): Promise<ErrorReporter> {
  return createErrorReporter(await resolveErrorLog());
}
