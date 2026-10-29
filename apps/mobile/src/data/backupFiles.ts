/**
 * F21 — puerto de archivos del respaldo (RF-37/RF-38), solo de plataforma.
 *
 * El núcleo exporta e importa **texto** (`exportBackup`/`importBackup`); aquí
 * vive cómo ese texto llega a un archivo y vuelve de él:
 *
 * - Nativo (Android/iOS): escribe en la caché de la app con `expo-file-system`
 *   y abre la hoja del sistema con `expo-sharing` (F21a); para importar, el
 *   selector del sistema (`expo-document-picker`) entrega una URI que se lee
 *   de vuelta a texto (F21b).
 * - Web (galería, Playwright, cliente web futuro): no hay hoja del sistema ni
 *   selector nativo. Exportar descarga el JSON con un enlace; importar usa un
 *   `input type="file"` oculto.
 *
 * Nada de esto lo sabe la pantalla: le entran y salen textos.
 */

/** Resultado de compartir: se abrió la hoja, o el usuario la descartó. */
export type ShareResult = "shared" | "dismissed";

/** Resultado de elegir un archivo: el texto leído, o `null` si se canceló. */
export type PickResult = { text: string; name: string } | null;

/** Puerto de archivos del respaldo. */
export interface BackupFiles {
  /** Escribe el texto como `ryuunest-respaldo-<fecha>.json` y abre la hoja del sistema. */
  shareBackup(text: string): Promise<ShareResult>;
  /** Abre el selector del sistema y devuelve el texto del archivo elegido. */
  pickBackup(): Promise<PickResult>;
  /** Descarga el texto como archivo (web: la alternativa a la hoja del sistema). */
  downloadBackup(text: string, fileName: string): void;
}

/** Nombre de archivo del respaldo: `ryuunest-respaldo-2026-10-28.json`. */
export function backupFileName(now: Date = new Date()): string {
  const fecha = now.toISOString().slice(0, 10);
  return `ryuunest-respaldo-${fecha}.json`;
}

/** Implementación de web: descarga por enlace e `input type="file"`. */
export function createWebBackupFiles(): BackupFiles {
  const files: BackupFiles = {
    shareBackup(text) {
      // En web no hay hoja del sistema: compartir es descargar el archivo.
      // **Síncrono**: la descarga es un gesto del usuario (el clic del botón)
      // y algunos navegadores la bloquean si media un `await`.
      files.downloadBackup(text, backupFileName());
      return Promise.resolve("shared");
    },

    pickBackup() {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.style.display = "none";
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          if (file === undefined) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            resolve({ text: String(reader.result ?? ""), name: file.name });
          });
          reader.addEventListener("error", () => resolve(null));
          reader.readAsText(file);
        });
        // Sin `change` (el usuario cerró el diálogo) no se resuelve: la promesa
        // queda pendiente, igual que un selector nativo cancelado.
        document.body.appendChild(input);
        input.click();
        input.remove();
      });
    },

    downloadBackup(text, fileName) {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      // Atributos que algunos navegadores exigen para tratar el clic como
      // descarga iniciada por el usuario (y no como popup bloqueado).
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      // El blob vive lo que dure la descarga; se revoca en el siguiente tick.
      setTimeout(() => {
        anchor.remove();
        URL.revokeObjectURL(url);
      }, 0);
    },
  };
  return files;
}

/** En web no hay hoja del sistema: la UI de respaldo usa la descarga directa. */
export function isNativePlatform(): boolean {
  // Sin importar `react-native` aquí: este módulo lo usan pruebas sin Metro
  // (MEMORY §5: Vitest no parsea el `index.js` de RN). La variante `.native`
  // se resuelve sola en el bundle de la app.
  return typeof document === "undefined";
}
