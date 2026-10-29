import { formatLogEntries, type LogEntry } from "@ryuunest/core";

import type { DiagnosticsFiles } from "../../../data/diagnosticsReport";
import type { DiagnosticsService } from "./diagnosticsData";

/**
 * F30 — `DiagnosticsService` de ejemplo para la web y la galería (sin SQLite,
 * P-79). Cuatro eventos inventados (D1/D2: sin sitios ni obras reales), el
 * informe con el mismo formato que el núcleo (`formatLogEntries`) y un puerto
 * de archivos/portapapeles inyectable (la web usa la descarga y el
 * portapapeles reales; las pruebas, nada).
 */

export interface SampleDiagnosticsOptions {
  files?: DiagnosticsFiles;
  copyText?: (text: string) => Promise<void>;
  /** Reloj para anclar los eventos de ejemplo (por defecto, ahora). */
  now?: () => number;
}

function at(base: number, daysAgo: number, hours: number, minutes: number): number {
  const date = new Date(base);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysAgo,
    hours,
    minutes,
  ).getTime();
}

function sampleEvents(base: number): LogEntry[] {
  const env = { appVersion: "0.1.0", platform: "android" };
  return [
    {
      id: 4,
      at: at(base, 0, 14, 32),
      level: "error",
      code: "module.timeout",
      message: "El módulo m-ejemplo-a tardó demasiado en responder al pedir el listado.",
      context: { módulo: "m-ejemplo-a", código: "TIMEOUT" },
      ...env,
    },
    {
      id: 3,
      at: at(base, 0, 14, 20),
      level: "warn",
      code: "reader.image.retry",
      message: "Una página del capítulo no cargó y se reintentó.",
      context: { página: 3, intentos: 2 },
      ...env,
    },
    {
      id: 2,
      at: at(base, 1, 21, 5),
      level: "error",
      code: "backup.import.rejected",
      message: "El archivo de respaldo no es un JSON válido.",
      context: { motivo: "NOT_JSON" },
      ...env,
    },
    {
      id: 1,
      at: at(base, 2, 9, 48),
      level: "info",
      code: "install.completed",
      message: "Se instaló el módulo m-ejemplo-a.",
      ...env,
    },
  ];
}

const NO_FILES: DiagnosticsFiles = { shareReport: async () => "shared" };

export function createSampleDiagnosticsService(
  options: SampleDiagnosticsOptions = {},
): DiagnosticsService {
  const files = options.files ?? NO_FILES;
  const copyText = options.copyText ?? (async () => {});
  let events = sampleEvents((options.now ?? Date.now)());

  function nonEmpty(): LogEntry[] {
    if (events.length === 0) throw new Error("No hay eventos que informar");
    return events;
  }

  return {
    list: async () => [...events],
    report: async (format) => formatLogEntries(events, format),
    exportReport: async (format) => {
      await files.shareReport(formatLogEntries(nonEmpty(), format), format);
    },
    copyReport: async (format) => {
      await copyText(formatLogEntries(nonEmpty(), format));
    },
    clear: async () => {
      events = [];
    },
  };
}
