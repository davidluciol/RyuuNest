import { contentMaxWidth, dragonNightColors, radii } from "@ryuunest/ui-tokens";

/**
 * F34.2 — tarjeta de sección y columna de contenido. Tarjeta: nivel `surface`
 * con borde `border`, esquinas `card` y **sin sombra** (profundidad por
 * superficie, RNF-12); sus filas se separan con una línea `border` de 1 dp.
 * Columna: ocupa todo el ancho en móvil y se centra a 720 dp en escritorio.
 */

const colors = dragonNightColors;

export interface SettingsCardStyleShape {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  overflow: "hidden";
}

export function settingsCardStyle(): SettingsCardStyleShape {
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    overflow: "hidden",
  };
}

export function settingsCardDividerStyle(): { height: number; backgroundColor: string } {
  return { height: 1, backgroundColor: colors.border };
}

export interface ContentColumnStyleShape {
  width: "100%";
  maxWidth: number;
  alignSelf: "center";
}

export function contentColumnStyle(): ContentColumnStyleShape {
  return { width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" };
}
