import type { InstallPreview, UpdatePreview } from "@ryuunest/core";

/**
 * F16 — flujo de hojas de Fuentes como máquina de estados pura: qué hoja está
 * abierta y en qué paso. La pantalla solo dibuja el estado y manda acciones;
 * el servicio (`SourcesService`) hace el trabajo. Sin React ni red.
 *
 * Reglas: una hoja ocupada (`busy`) no se cierra a medias; un fallo deja la
 * hoja abierta con su mensaje para reintentar; las acciones fuera de contexto
 * se ignoran para no crear estados imposibles.
 */

export type SourcesFlow =
  | { sheet: "none" }
  | { sheet: "add-repo"; error: string | null }
  | { sheet: "install"; preview: InstallPreview; busy: boolean; error: string | null }
  | { sheet: "manage"; moduleId: string; busy: boolean; error: string | null }
  | {
      sheet: "update";
      moduleId: string;
      preview: UpdatePreview;
      busy: boolean;
      error: string | null;
    }
  | { sheet: "uninstall"; moduleId: string; busy: boolean; error: string | null };

export type SourcesFlowAction =
  | { type: "open-add-repo" }
  | { type: "submit-add-repo" }
  | { type: "open-install"; preview: InstallPreview }
  | { type: "submit-install" }
  | { type: "open-manage"; moduleId: string }
  | { type: "open-update"; moduleId: string; preview: UpdatePreview }
  | { type: "submit-update" }
  | { type: "ask-uninstall" }
  | { type: "submit-uninstall" }
  | { type: "back" }
  | { type: "fail"; message: string }
  | { type: "done" }
  | { type: "close" };

export const INITIAL_SOURCES_FLOW: SourcesFlow = { sheet: "none" };

export function sourcesFlowReducer(state: SourcesFlow, action: SourcesFlowAction): SourcesFlow {
  switch (action.type) {
    case "open-add-repo":
      return { sheet: "add-repo", error: null };

    case "open-install":
      return { sheet: "install", preview: action.preview, busy: false, error: null };

    case "open-manage":
      return { sheet: "manage", moduleId: action.moduleId, busy: false, error: null };

    case "open-update":
      return {
        sheet: "update",
        moduleId: action.moduleId,
        preview: action.preview,
        busy: false,
        error: null,
      };

    case "ask-uninstall":
      return state.sheet === "manage"
        ? { sheet: "uninstall", moduleId: state.moduleId, busy: false, error: null }
        : state;

    case "submit-add-repo":
      return state.sheet === "add-repo" ? { ...state, error: null } : state;

    case "submit-install":
    case "submit-update":
    case "submit-uninstall":
      return state.sheet === "install" || state.sheet === "update" || state.sheet === "uninstall"
        ? { ...state, busy: true, error: null }
        : state;

    case "fail":
      if (state.sheet === "none") return state;
      return state.sheet === "add-repo"
        ? { ...state, error: action.message }
        : { ...state, busy: false, error: action.message };

    case "back":
      return state.sheet === "uninstall" || state.sheet === "update"
        ? { sheet: "manage", moduleId: state.moduleId, busy: false, error: null }
        : state;

    case "done":
      return INITIAL_SOURCES_FLOW;

    case "close":
      return "busy" in state && state.busy ? state : INITIAL_SOURCES_FLOW;
  }
}

/**
 * ¿Se puede confirmar la instalación? Un módulo `script` exige la confirmación
 * reforzada (mantener pulsado, SPEC §7.1 paso 3); el resto, un toque.
 */
export function canConfirmInstall(
  preview: Pick<InstallPreview, "reinforced">,
  confirmation: { reinforced: boolean },
): boolean {
  return !preview.reinforced || confirmation.reinforced;
}
