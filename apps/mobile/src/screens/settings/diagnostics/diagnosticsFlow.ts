import type { ReportFormat } from "../../../data/diagnosticsReport";
import type { ErrorSeverity } from "../../../components/errorNoticeStyles";

/**
 * F30 — estado de la pantalla Diagnóstico como máquina pura: formato del
 * informe, detalles desplegados, confirmación de borrado y operación en curso.
 * Sin React: el reductor y el controlador se prueban solos.
 */

export interface DiagnosticsFlow {
  format: ReportFormat;
  /** Ids de los eventos con el detalle desplegado. */
  expanded: number[];
  /** La hoja «¿Borrar el registro?» está abierta. */
  confirmClear: boolean;
  /** Una operación (exportar, copiar, borrar) bloquea los controles. */
  busy: boolean;
}

export type DiagnosticsFlowAction =
  | { type: "set-format"; format: ReportFormat }
  | { type: "toggle-detail"; id: number }
  | { type: "ask-clear" }
  | { type: "cancel-clear" }
  | { type: "busy"; busy: boolean };

/** Aviso transitorio (toast): éxito o fallo de la última acción. */
export interface DiagnosticsNotice {
  message: string;
  severity: ErrorSeverity;
}

export const INITIAL_DIAGNOSTICS_FLOW: DiagnosticsFlow = {
  format: "text",
  expanded: [],
  confirmClear: false,
  busy: false,
};

export function diagnosticsFlowReducer(
  flow: DiagnosticsFlow,
  action: DiagnosticsFlowAction,
): DiagnosticsFlow {
  switch (action.type) {
    case "set-format":
      return { ...flow, format: action.format };
    case "toggle-detail":
      return {
        ...flow,
        expanded: flow.expanded.includes(action.id)
          ? flow.expanded.filter((id) => id !== action.id)
          : [...flow.expanded, action.id],
      };
    case "ask-clear":
      return { ...flow, confirmClear: true };
    case "cancel-clear":
      return { ...flow, confirmClear: false };
    case "busy":
      return { ...flow, busy: action.busy };
  }
}
