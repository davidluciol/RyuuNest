import type { DiagnosticsFiles, ReportFormat } from "@ryuunest/mobile-src/data/diagnosticsReport";

/**
 * F25 — diagnóstico en web: el informe se descarga como archivo local (sin
 * hoja del sistema) y «copiar» usa `navigator.clipboard`.
 */

function download(text: string, format: ReportFormat): void {
  const mime = format === "json" ? "application/json" : "text/plain";
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ryuunest-diagnostico-${new Date().toISOString().slice(0, 10)}.${format === "json" ? "json" : "txt"}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createWebDiagnosticsFiles(): DiagnosticsFiles {
  return {
    async shareReport(text, format) {
      download(text, format);
      return "shared";
    },
  };
}

export async function copyTextWeb(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
