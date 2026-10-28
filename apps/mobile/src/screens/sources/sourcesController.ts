import { t } from "../../i18n";
import type { SourcesService } from "./sourcesData";
import type { SourcesFlow, SourcesFlowAction } from "./sourcesFlow";
import { validateRepoUrl } from "./sourcesView";

/**
 * F16 — controlador de Fuentes: une el `SourcesService` con la máquina de
 * estados de las hojas. No sabe de React: recibe cómo leer el flujo, mandar
 * acciones, recargar la lista y avisar. Así el pegamento (qué hoja queda
 * abierta, cuándo se recarga, qué aviso sale) se prueba sin montar la app, y
 * `useSourcesData` solo le da las piezas reales.
 */

export interface SourcesControllerDeps {
  service: SourcesService;
  getFlow: () => SourcesFlow;
  dispatch: (action: SourcesFlowAction) => void;
  /** Vuelve a leer la lista tras un cambio. */
  reload: () => Promise<void>;
  /** Aviso transitorio; `null` lo descarta. */
  notify: (message: string | null) => void;
}

export interface SourcesController {
  openAddRepo(): void;
  submitAddRepo(input: string): Promise<void>;
  openInstall(repoId: string, moduleId: string): Promise<void>;
  confirmInstall(reinforced: boolean): Promise<void>;
  openManage(moduleId: string): void;
  setEnabled(moduleId: string, enabled: boolean): Promise<void>;
  openUpdate(moduleId: string): Promise<void>;
  confirmUpdate(reinforced: boolean): Promise<void>;
  askUninstall(): void;
  confirmUninstall(): Promise<void>;
  syncRepo(repoId: string): Promise<void>;
  askRemoveRepo(repoId: string): void;
  confirmRemoveRepo(): Promise<void>;
  back(): void;
  close(): void;
  dismissNotice(): void;
}

export const URL_ERROR_KEYS = {
  empty: "sources.add.error.empty",
  invalid: "sources.add.error.invalid",
  "not-https": "sources.add.error.notHttps",
} as const;

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createSourcesController(deps: SourcesControllerDeps): SourcesController {
  const { service, getFlow, dispatch, reload, notify } = deps;

  /** Ejecuta un paso de una hoja: ocupada → hecho (cierra) o fallo (queda abierta). */
  async function runSheet(work: () => Promise<void>, submit: SourcesFlowAction): Promise<void> {
    dispatch(submit);
    try {
      await work();
      await reload();
      dispatch({ type: "done" });
    } catch (error) {
      dispatch({ type: "fail", message: messageOf(error) });
    }
  }

  return {
    openAddRepo: () => dispatch({ type: "open-add-repo" }),

    async submitAddRepo(input) {
      const check = validateRepoUrl(input);
      if (!check.ok) {
        dispatch({ type: "fail", message: t(URL_ERROR_KEYS[check.reason]) });
        return;
      }
      await runSheet(() => service.addRepo(check.url), { type: "submit-add-repo" });
    },

    async openInstall(repoId, moduleId) {
      try {
        const preview = await service.previewInstall(repoId, moduleId);
        dispatch({ type: "open-install", preview });
      } catch (error) {
        notify(messageOf(error));
      }
    },

    async confirmInstall(reinforced) {
      const flow = getFlow();
      if (flow.sheet !== "install") return;
      const { preview } = flow;
      await runSheet(
        () => service.install(preview.repoId, preview.id, { confirmed: true, reinforced }),
        { type: "submit-install" },
      );
    },

    openManage: (moduleId) => dispatch({ type: "open-manage", moduleId }),

    async setEnabled(moduleId, enabled) {
      try {
        await service.setEnabled(moduleId, enabled);
        await reload();
      } catch (error) {
        notify(messageOf(error));
      }
    },

    async openUpdate(moduleId) {
      try {
        const preview = await service.previewUpdate(moduleId);
        if (!preview.available) {
          notify(t("sources.update.upToDate"));
          return;
        }
        dispatch({ type: "open-update", moduleId, preview });
      } catch (error) {
        notify(messageOf(error));
      }
    },

    async confirmUpdate(reinforced) {
      const flow = getFlow();
      if (flow.sheet !== "update") return;
      const { moduleId } = flow;
      await runSheet(
        async () => {
          await service.applyUpdate(moduleId, { confirmed: true, reinforced });
        },
        { type: "submit-update" },
      );
    },

    askUninstall: () => dispatch({ type: "ask-uninstall" }),

    async confirmUninstall() {
      const flow = getFlow();
      if (flow.sheet !== "uninstall") return;
      const { moduleId } = flow;
      await runSheet(() => service.uninstall(moduleId), { type: "submit-uninstall" });
    },

    async syncRepo(repoId) {
      try {
        await service.refreshRepo(repoId);
        await reload();
      } catch (error) {
        notify(messageOf(error));
      }
    },

    askRemoveRepo: (repoId) => dispatch({ type: "ask-remove-repo", repoId }),

    async confirmRemoveRepo() {
      const flow = getFlow();
      if (flow.sheet !== "remove-repo") return;
      const { repoId } = flow;
      await runSheet(() => service.removeRepo(repoId), { type: "submit-remove-repo" });
    },

    back: () => dispatch({ type: "back" }),
    close: () => dispatch({ type: "close" }),
    dismissNotice: () => notify(null),
  };
}
