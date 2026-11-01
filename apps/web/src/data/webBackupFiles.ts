import type { BackupFiles, PickResult } from "@ryuunest/mobile-src/data/backupFilesPort";

/**
 * F25 — `BackupFiles` de la web (P-94): sin hoja del sistema. Exportar descarga
 * el JSON (Blob + ancla `download`, dentro del gesto del clic) e importar usa
 * un `<input type="file">` oculto.
 */

function downloadText(text: string, fileName: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createWebBackupFiles(): BackupFiles {
  return {
    async shareBackup(text) {
      downloadText(text, `ryuunest-respaldo-${new Date().toISOString().slice(0, 10)}.json`);
      return "shared";
    },
    downloadBackup: downloadText,
    pickBackup(): Promise<PickResult> {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.onchange = () => {
          const file = input.files?.[0];
          if (file === undefined) {
            resolve(null);
            return;
          }
          void file.text().then((text) => resolve({ text, name: file.name }));
        };
        // Si el usuario cancela, no hay evento fiable en todos los navegadores:
        // se resuelve como «no elegido» al cerrarse el foco.
        window.addEventListener("focus", () => resolve(null), { once: true });
        input.click();
      });
    },
  };
}
