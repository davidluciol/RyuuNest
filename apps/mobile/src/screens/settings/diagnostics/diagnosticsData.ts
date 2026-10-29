import type { LogEntry, LogStore } from "@ryuunest/core";

import type { DiagnosticsFiles, ReportFormat } from "../../../data/diagnosticsReport";

/**
 * F30 — capa de datos de Ajustes → Diagnóstico (P-72). La pantalla no importa
 * el núcleo: habla con `DiagnosticsService` (patrón de F20/F21).
 *
 * El registro ya llega saneado desde el núcleo (T36): aquí solo se lista, se
 * arma el informe (texto o JSON), se comparte/copia y se borra. Nada sale de
 * la app salvo que el usuario elija compartir o copiar el informe.
 */

export interface DiagnosticsService {
  /** Eventos guardados, el más reciente primero. */
  list(): Promise<LogEntry[]>;
  /** Informe completo en el formato pedido. */
  report(format: ReportFormat): Promise<string>;
  /** Comparte (nativo) o descarga (web) el informe. Falla con registro vacío. */
  exportReport(format: ReportFormat): Promise<void>;
  /** Copia el informe al portapapeles. Falla con registro vacío. */
  copyReport(format: ReportFormat): Promise<void>;
  /** Borra todo el registro. */
  clear(): Promise<void>;
}

export interface DiagnosticsServiceDeps {
  logStore: LogStore;
  files: DiagnosticsFiles;
  copyText: (text: string) => Promise<void>;
}

export function createDiagnosticsService(deps: DiagnosticsServiceDeps): DiagnosticsService {
  const { logStore, files, copyText } = deps;

  async function reportOrThrow(format: ReportFormat): Promise<string> {
    if ((await logStore.list({ limit: 1 })).length === 0) {
      throw new Error("No hay eventos que informar");
    }
    return logStore.export(format);
  }

  return {
    list: () => logStore.list(),
    report: (format) => logStore.export(format),

    async exportReport(format) {
      await files.shareReport(await reportOrThrow(format), format);
    },

    async copyReport(format) {
      await copyText(await reportOrThrow(format));
    },

    clear: () => logStore.clear(),
  };
}
