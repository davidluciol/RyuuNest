import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  backupFileName,
  type BackupFiles,
  type PickResult,
  type ShareResult,
} from "./backupFilesPort";

/**
 * F21 — implementación nativa del puerto de archivos del respaldo: hoja del
 * sistema con `expo-sharing` y selector con `expo-document-picker`. La web usa
 * `backupFiles.ts` (descarga + `input type="file"`).
 *
 * **No importar de `./backupFiles`:** en el dispositivo Metro lo resuelve a este
 * mismo archivo. Lo compartido vive en `backupFilesPort.ts`.
 *
 * `expo-file-system/legacy`: la API clásica (`cacheDirectory`,
 * `writeAsStringAsync`, `readAsStringAsync`, `makeDirectoryAsync`) vive en el
 * subpath `legacy` desde SDK 54; la API nueva (`File`, `Paths`) es la
 * recomendada a futuro, pero la clásica es la estable en SDK 57 y la que
 * cubre escribir y leer texto plano.
 */
export function createBackupFiles(): BackupFiles {
  return {
    async shareBackup(text): Promise<ShareResult> {
      const directory = FileSystem.cacheDirectory;
      if (directory === null || directory === undefined) {
        throw new Error("Este dispositivo no tiene caché de archivos disponible");
      }
      const folder = `${directory}ryuunest/`;
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const fileUri = `${folder}${backupFileName()}`;
      await FileSystem.writeAsStringAsync(fileUri, text);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Este dispositivo no puede compartir archivos");
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: backupFileName(),
        UTI: "public.json",
      });
      return "shared";
    },

    async pickBackup(): Promise<PickResult> {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) {
        return null;
      }
      const asset = result.assets[0];
      const text = await FileSystem.readAsStringAsync(asset.uri);
      return { text, name: asset.name };
    },

    downloadBackup() {
      // En nativo no se usa: la hoja del sistema cubre la exportación.
    },
  };
}
