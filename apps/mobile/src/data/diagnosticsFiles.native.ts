import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  diagnosticsFileName,
  diagnosticsMimeType,
  type DiagnosticsFiles,
} from "./diagnosticsReport";

/**
 * F30 — puerto de archivos del informe en el dispositivo: escribe el archivo en
 * la caché de la app y abre la hoja del sistema (`expo-sharing`), igual que el
 * respaldo (F21; API `legacy` de `expo-file-system`, estable en SDK 57).
 */
export function createDiagnosticsFiles(): DiagnosticsFiles {
  return {
    async shareReport(text, format) {
      const directory = FileSystem.cacheDirectory;
      if (directory === null || directory === undefined) {
        throw new Error("Este dispositivo no tiene caché de archivos disponible");
      }
      const folder = `${directory}ryuunest/`;
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const name = diagnosticsFileName(format);
      const fileUri = `${folder}${name}`;
      await FileSystem.writeAsStringAsync(fileUri, text);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Este dispositivo no puede compartir archivos");
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: diagnosticsMimeType(format),
        dialogTitle: name,
        UTI: format === "json" ? "public.json" : "public.plain-text",
      });
      return "shared";
    },
  };
}
