import { markers, radii, spacing, touchTarget } from "@ryuunest/ui-tokens";

/**
 * Acerca de — medidas de la tarjeta de artista, separadas del componente para
 * probarlas sin Metro (patrón de F06). La foto usa el tamaño del dragón
 * mediano, que la sustituye si falta; cada red es un botón de 48×48 (RNF-7).
 */

export function artistPhotoStyle() {
  return { width: markers.md, height: markers.md, borderRadius: radii.pill };
}

export function artistLinkStyle() {
  return {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    borderRadius: radii.control,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: spacing.xs,
  };
}
