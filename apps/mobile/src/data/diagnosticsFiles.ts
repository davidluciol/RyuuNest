import {
  diagnosticsFileName,
  diagnosticsMimeType,
  type DiagnosticsFiles,
} from "./diagnosticsReport";

/**
 * F30 — puerto de archivos del informe en web (galería, Playwright, cliente
 * web): no hay hoja del sistema, así que compartir es **descargar** el archivo.
 * La descarga es síncrona dentro del gesto del clic (P-94). El dispositivo usa
 * `diagnosticsFiles.native.ts`.
 */
export function createDiagnosticsFiles(): DiagnosticsFiles {
  return {
    shareReport(text, format) {
      const blob = new Blob([text], { type: diagnosticsMimeType(format) });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = diagnosticsFileName(format);
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        anchor.remove();
        URL.revokeObjectURL(url);
      }, 0);
      return Promise.resolve("shared");
    },
  };
}
