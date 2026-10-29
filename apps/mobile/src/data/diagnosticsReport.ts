import type { LogExportFormat } from "@ryuunest/core";

/**
 * F30 — tipos y nombres del informe de diagnóstico (P-72). Sin plataforma:
 * los comparten el puerto web (`diagnosticsFiles.ts`), el nativo
 * (`diagnosticsFiles.native.ts`), el servicio y las pruebas.
 *
 * El módulo se llama distinto de los puertos a propósito: Metro resuelve
 * `./x` a `x.native.ts` en el dispositivo, así que un archivo `.native` que
 * importe de su hermano `.ts` se importaría a sí mismo.
 */

/** Formato del informe: el mismo que exporta el registro del núcleo. */
export type ReportFormat = LogExportFormat;

/** Resultado de compartir: se abrió la hoja o la descarga arrancó. */
export type ReportShareResult = "shared" | "dismissed";

/** Puerto de archivos del informe, solo de plataforma. */
export interface DiagnosticsFiles {
  /** Guarda el informe como archivo y lo comparte (nativo) o lo descarga (web). */
  shareReport(text: string, format: ReportFormat): Promise<ReportShareResult>;
}

const EXTENSIONS: Record<ReportFormat, string> = { text: "txt", json: "json" };
const MIME_TYPES: Record<ReportFormat, string> = { text: "text/plain", json: "application/json" };

/** Nombre del archivo: `ryuunest-diagnostico-2026-10-29.txt`. */
export function diagnosticsFileName(format: ReportFormat, now: Date = new Date()): string {
  return `ryuunest-diagnostico-${now.toISOString().slice(0, 10)}.${EXTENSIONS[format]}`;
}

export function diagnosticsMimeType(format: ReportFormat): string {
  return MIME_TYPES[format];
}
