import type { ReportFormat } from "../../../data/diagnosticsReport";
import { t } from "../../../i18n";
import type { DiagnosticsService } from "./diagnosticsData";
import type {
  DiagnosticsFlow,
  DiagnosticsFlowAction,
  DiagnosticsNotice,
} from "./diagnosticsFlow";

/**
 * F30 — controlador de Diagnóstico. Une el `DiagnosticsService` con la
 * máquina de estados (`diagnosticsFlow`) sin saber de React. Los fallos se
 * avisan con un texto fijo (el mensaje técnico no se enseña: el log ya lo
 * guarda saneado) y siempre liberan los controles.
 */

export interface DiagnosticsControllerDeps {
  service: DiagnosticsService;
  getFlow: () => DiagnosticsFlow;
  dispatch: (action: DiagnosticsFlowAction) => void;
  /** Aviso transitorio; `null` lo descarta. */
  notify: (notice: DiagnosticsNotice | null) => void;
  /** Vuelve a leer la lista tras borrar. */
  reload: () => Promise<void>;
}

export interface DiagnosticsController {
  setFormat(format: ReportFormat): void;
  toggleDetail(id: number): void;
  exportReport(): Promise<void>;
  copyReport(): Promise<void>;
  askClear(): void;
  cancelClear(): void;
  confirmClear(): Promise<void>;
  dismissNotice(): void;
}

export function createDiagnosticsController(deps: DiagnosticsControllerDeps): DiagnosticsController {
  const { service, getFlow, dispatch, notify, reload } = deps;

  async function guarded(work: () => Promise<void>, ok: string, failed: string): Promise<void> {
    dispatch({ type: "busy", busy: true });
    try {
      await work();
      notify({ message: ok, severity: "info" });
    } catch {
      notify({ message: failed, severity: "error" });
    } finally {
      dispatch({ type: "busy", busy: false });
    }
  }

  return {
    setFormat: (format) => dispatch({ type: "set-format", format }),
    toggleDetail: (id) => dispatch({ type: "toggle-detail", id }),

    exportReport: () =>
      guarded(
        () => service.exportReport(getFlow().format),
        t("diagnostics.notice.exported"),
        t("diagnostics.notice.exportFailed"),
      ),

    copyReport: () =>
      guarded(
        () => service.copyReport(getFlow().format),
        t("diagnostics.notice.copied"),
        t("diagnostics.notice.copyFailed"),
      ),

    askClear: () => dispatch({ type: "ask-clear" }),
    cancelClear: () => dispatch({ type: "cancel-clear" }),

    async confirmClear() {
      dispatch({ type: "cancel-clear" });
      await guarded(
        async () => {
          await service.clear();
          await reload();
        },
        t("diagnostics.notice.cleared"),
        t("diagnostics.notice.clearFailed"),
      );
    },

    dismissNotice: () => notify(null),
  };
}
