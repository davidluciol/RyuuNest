import { backupFileName, type BackupFiles } from "./backupFilesPort";

/**
 * F21 — puerto de archivos del respaldo en web (galería, Playwright, cliente web
 * futuro): no hay hoja del sistema ni selector nativo. Exportar descarga el JSON
 * con un enlace; importar usa un `input type="file"` oculto. El dispositivo usa
 * `backupFiles.native.ts`; Metro elige por plataforma, así que quien lo necesita
 * importa `createBackupFiles` de aquí sin preguntar dónde corre. Los tipos, el
 * nombre del archivo y `isNativePlatform` viven en `backupFilesPort.ts`.
 */
export function createBackupFiles(): BackupFiles {
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
