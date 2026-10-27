import { dragonNightColors, withAlpha } from "@ryuunest/ui-tokens";

/**
 * F16 — velo de la hoja modal (`SheetModal`): oscurece el contenido y deja la
 * hoja anclada abajo. Mismo velo que el selector de módulo (F15), ahora
 * compartido por todas las hojas de Fuentes.
 */

const colors = dragonNightColors;

export interface SheetBackdropStyleShape {
  flex: number;
  backgroundColor: string;
  justifyContent: "flex-end";
}

export function sheetBackdropStyle(): SheetBackdropStyleShape {
  return {
    flex: 1,
    backgroundColor: withAlpha(colors.bg, 0.64),
    justifyContent: "flex-end",
  };
}
