import { breakpointForWidth, dragonNightColors, radii, spacing } from "@ryuunest/ui-tokens";

/**
 * F34.2 — reglas de `ConfirmSheet` (`design/stitch/confirmar_accion_dragon_night`): hoja inferior
 * en móvil y diálogo centrado a partir de tablet (incluye TV y escritorio). Puras, sin React
 * Native, para probarlas sin Metro.
 */

export type ConfirmPresentation = "sheet" | "dialog";

/** Hoja en móvil; diálogo centrado en tablet, TV y escritorio. */
export function confirmPresentation(width: number): ConfirmPresentation {
  return breakpointForWidth(width) === "mobile" ? "sheet" : "dialog";
}

export interface ConfirmActionsLayout {
  direction: "column" | "row";
  /** La acción va antes que «Cancelar» (hoja: arriba; diálogo: «Cancelar» a la izquierda). */
  confirmFirst: boolean;
  fullWidth: boolean;
}

export function confirmActionsLayout(presentation: ConfirmPresentation): ConfirmActionsLayout {
  return presentation === "sheet"
    ? { direction: "column", confirmFirst: true, fullWidth: true }
    : { direction: "row", confirmFirst: false, fullWidth: false };
}

/** Etiqueta con el nombre del elemento afectado (módulo, repositorio, archivo). */
export function confirmSubjectStyle() {
  return {
    alignSelf: "flex-start" as const,
    backgroundColor: dragonNightColors.surface,
    borderColor: dragonNightColors.border,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  };
}
