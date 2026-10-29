import type { ImportMode } from "@ryuunest/core";

import { t } from "../../../i18n";
import type { BackupService } from "./backupData";
import type { BackupFlow, BackupFlowAction } from "./backupFlow";

/**
 * F21 — controlador del respaldo en Ajustes (RF-37/RF-38). Une el
 * `BackupService` con la máquina de estados de las hojas (`backupFlow`).
 * No sabe de React: recibe cómo leer el flujo, mandar acciones, recargar y
 * avisar. Así el pegamento (qué hoja queda abierta, cuándo se avisa, cuándo
 * se muestran las sugerencias) se prueba sin montar la app.
 */

export interface BackupControllerDeps {
  service: BackupService;
  getFlow: () => BackupFlow;
  dispatch: (action: BackupFlowAction) => void;
  /** Aviso transitorio en la pantalla; `null` lo descarta. */
  notify: (message: string | null) => void;
  /** Navega a Fuentes (para instalar un módulo sugerido). */
  goToSources: () => void;
  /** Se llamó tras aplicar una importación (recarga las pantallas). */
  onApplied?: () => void;
}

export interface BackupController {
  /** «Exportar respaldo»: vuelca el estado y lo comparte/descarga. */
  exportBackup(): Promise<void>;
  /** «Importar respaldo»: abre el selector y, con el archivo, la hoja de modo. */
  importBackup(): Promise<void>;
  /** Aplica el texto pendiente con el modo elegido (merge o replace). */
  applyImport(mode: ImportMode): Promise<void>;
  /** Pide la confirmación explícita antes de reemplazar (destructivo). */
  askReplace(): void;
  /** Confirma un repo sugerido (lo registra; nada se instala solo, AC-8). */
  confirmRepo(url: string): Promise<void>;
  /** Un módulo sugerido se instala desde Fuentes. */
  goToSources(): void;
  close(): void;
  dismissNotice(): void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createBackupController(deps: BackupControllerDeps): BackupController {
  const { service, getFlow, dispatch, notify } = deps;

  return {
    async exportBackup() {
      try {
        const text = await service.exportText();
        // La descarga/compartir es un gesto del usuario: se lanza **antes**
        // de cualquier `await` posterior para que el navegador la acepte.
        const share = service.shareText(text);
        notify(t("settings.backup.exported"));
        await share;
      } catch (error) {
        notify(`${t("settings.backup.exportFailed")}: ${messageOf(error)}`);
      }
    },

    async importBackup() {
      let picked: { text: string; name: string } | null;
      try {
        picked = await service.pickText();
      } catch (error) {
        notify(`${t("settings.backup.importFailed")}: ${messageOf(error)}`);
        return;
      }
      if (picked === null) {
        notify(t("settings.backup.pickCancelled"));
        return;
      }
      dispatch({ type: "open-import-mode", text: picked.text });
    },

    async applyImport(mode) {
      const flow = getFlow();
      if (flow.sheet !== "import-mode" && flow.sheet !== "replace-confirm") return;
      dispatch({ type: "submit" });
      let result: Awaited<ReturnType<BackupService["applyText"]>>;
      try {
        result = await service.applyText(flow.text, mode);
      } catch (error) {
        dispatch({ type: "fail", message: messageOf(error) });
        return;
      }
      if (!result.ok) {
        // Un rechazo no toca datos: se muestra como diálogo con el motivo y
        // la hoja de modo queda cerrada (el flujo pasa a `import-error`).
        dispatch({
          type: "open-import-error",
          error: result.message,
          reason: result.reason,
          issues: result.issues,
        });
        return;
      }
      const [repos, modules] = await Promise.all([
        service.pendingRepos(result.suggestions.repos),
        service.pendingModules(result.suggestions.modules),
      ]);
      deps.onApplied?.();
      notify(t("settings.backup.imported"));
      dispatch({ type: "open-suggestions", suggestions: { repos, modules } });
    },

    askReplace() {
      dispatch({ type: "open-replace-confirm" });
    },

    async confirmRepo(url) {
      // La hoja de sugerencias sigue abierta: el botón pasa a «Añadido».
      dispatch({ type: "submit" });
      try {
        await service.confirmRepo(url);
        dispatch({ type: "confirm-repo", url });
      } catch {
        // El fallo del repo (índice caído, URL inválida) se avisa con la clave
        // fija: el mensaje del núcleo puede traer la URL completa.
        dispatch({ type: "fail", message: "" });
      }
    },

    goToSources() {
      deps.goToSources();
      dispatch({ type: "close" });
    },

    close: () => dispatch({ type: "close" }),
    dismissNotice: () => notify(null),
  };
}
