import type { ImportRejection } from "@ryuunest/core";
import type { ValidationIssue } from "@ryuunest/core";

import type { BackupSuggestions } from "./backupData";

/**
 * F21 — máquina de estados de las hojas del respaldo en Ajustes (sin React).
 * Misma idea que `sourcesFlow.ts` (F16): la pantalla pinta el flujo y el
 * controlador manda acciones; el pegamento se prueba sin montar la app.
 */

/** Hoja abierta, con su estado. */
export type BackupFlow =
  | { sheet: "none" }
  | {
      sheet: "import-mode";
      /** Texto del archivo ya elegido, pendiente de aplicar. */
      text: string;
      busy: boolean;
      error: string | null;
    }
  | {
      sheet: "replace-confirm";
      /** Texto del archivo ya elegido, pendiente de la confirmación destructiva. */
      text: string;
      busy: boolean;
      error: string | null;
    }
  | {
      sheet: "suggestions";
      suggestions: BackupSuggestions;
      /** Repos ya confirmados en esta hoja (deshabilita su botón). */
      confirmedRepos: readonly string[];
      busy: boolean;
      error: string | null;
    }
  | {
      sheet: "import-error";
      /** Mensaje legible del rechazo. */
      error: string;
      /** Código del rechazo (`TOO_LARGE`/`NOT_JSON`/`INVALID`). */
      reason: ImportRejection;
      /** Problemas de validación con su ruta (solo en `INVALID`). */
      issues: readonly ValidationIssue[];
    };

export const INITIAL_BACKUP_FLOW: BackupFlow = { sheet: "none" };

export type BackupFlowAction =
  | { type: "open-import-mode"; text: string }
  | { type: "open-replace-confirm" }
  | { type: "open-suggestions"; suggestions: BackupSuggestions }
  | { type: "open-import-error"; error: string; reason: ImportRejection; issues: readonly ValidationIssue[] }
  | { type: "confirm-repo"; url: string }
  | { type: "submit" }
  | { type: "fail"; message: string }
  | { type: "done" }
  | { type: "close" };

export function backupFlowReducer(
  flow: BackupFlow,
  action: BackupFlowAction,
): BackupFlow {
  switch (action.type) {
    case "open-import-mode":
      return { sheet: "import-mode", text: action.text, busy: false, error: null };
    case "open-replace-confirm":
      if (flow.sheet !== "import-mode") return flow;
      return { sheet: "replace-confirm", text: flow.text, busy: flow.busy, error: flow.error };
    case "open-suggestions":
      return {
        sheet: "suggestions",
        suggestions: action.suggestions,
        confirmedRepos: [],
        busy: false,
        error: null,
      };
    case "open-import-error":
      return {
        sheet: "import-error",
        error: action.error,
        reason: action.reason,
        issues: action.issues,
      };
    case "confirm-repo":
      if (flow.sheet !== "suggestions") return flow;
      if (flow.confirmedRepos.includes(action.url)) return flow;
      return { ...flow, confirmedRepos: [...flow.confirmedRepos, action.url] };
    case "submit":
      if (flow.sheet === "none" || flow.sheet === "import-error") return flow;
      return { ...flow, busy: true, error: null };
    case "fail":
      if (flow.sheet === "none" || flow.sheet === "import-error") return flow;
      return { ...flow, busy: false, error: action.message };
    case "done":
      return { sheet: "none" };
    case "close":
      return { sheet: "none" };
  }
}
