import type { LogLevel, LogStore } from "./LogStore.js";

/**
 * F31/F24 — contrato del reporte de errores de pantallas (P-72), compartido por
 * móvil y web. La resolución real del `LogStore` vive en cada app
 * (`apps/mobile/src/data/errorLog.ts`, `apps/web/src/data/…`).
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
 * Reporter sobre el `LogStore` dado. Con `null` (pruebas sin base) es un no-op:
 * la pantalla sigue avisando en pantalla pero no hay registro local.
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
