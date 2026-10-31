import type { LogLevel, LogStore } from "@ryuunest/core";

/**
 * F31 — contrato del reporte de errores a pantallas (P-72), sin plataforma:
 * este módulo no importa `react-native` ni `expo-*` para poder probarlo en
 * Vitest (igual que `backupFilesPort.ts`, P-107). La resolución real del
 * `LogStore` vive en `errorLog.ts` / `errorLog.native.ts`.
 */

/** Contrato mínimo que usan las pantallas para reportar. */
export interface ErrorReporter {
  /**
   * Registra un evento. No devuelve promesa: el llamador no espera; si el
   * registro falla, el error se traga (el registro nunca rompe la app).
   */
  report(level: LogLevel, code: string, message: string, context?: unknown): void;
}

/**
 * Reporter sobre el `LogStore` dado. Con `null` (web, galería, pruebas sin
 * driver) es un no-op: la pantalla sigue avisando en pantalla pero no hay
 * registro local.
 */
export function createErrorReporter(logStore: LogStore | null): ErrorReporter {
  return {
    report(level, code, message, context) {
      if (logStore === null) return;
      void logStore.record(level, code, message, context).catch(() => {
        // Intencionadamente vacío: el diagnóstico no puede romper la pantalla.
      });
    },
  };
}
