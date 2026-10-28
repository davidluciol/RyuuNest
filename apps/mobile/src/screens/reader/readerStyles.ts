import { dragonNightColors, spacing, touchTarget, withAlpha } from "@ryuunest/ui-tokens";

/**
 * F18 — apariencia del lector (RF-22, `DESIGN.md` «Reader View Overlays»). Puro, para
 * comprobarlo sin renderizar: nada decorativo sobre el contenido.
 */

const colors = dragonNightColors;

/** Opacidad de las barras sobre el contenido (RF-22: `elevated` al 95 %). */
const BAR_OPACITY = 0.95;

/** Barra superior o inferior: `elevated` al 95 %, borde `border`, sin sombra ni marca. */
export function readerBarStyle() {
  return {
    backgroundColor: withAlpha(colors.elevated, BAR_OPACITY),
    borderColor: colors.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  } as const;
}

/** Lienzo de lectura: el fondo del tema (nivel 0). */
export function readerCanvasStyle() {
  return { flex: 1, backgroundColor: colors.bg } as const;
}

/** Botón de icono de las barras (cerrar, página anterior/siguiente, modo). */
export function readerIconButtonStyle() {
  return {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: touchTarget.min / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  } as const;
}
