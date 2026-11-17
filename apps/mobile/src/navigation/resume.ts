/** Lo mínimo para reanudar una lectura (lo comparten Continuar, Recientes y «Ver todo»). */
export interface ResumeTarget {
  moduleId: string;
  seriesId: string;
  chapterId: string;
}

export interface ResumeRoute {
  pathname: "/series/[moduleId]/[seriesId]" | "/reader/[moduleId]/[seriesId]/[chapterId]";
  params: Record<string, string>;
}

/**
 * P-155: en web, directo al lector; en móvil, Detalles y encima el lector, así «atrás»
 * vuelve a Detalles. El lector restaura la página guardada por sí mismo. Puro (sin
 * `expo-router`) para probarlo con Vitest; quien navega hace `router.push` de cada ruta.
 */
export function resumeRoutes(
  { moduleId, seriesId, chapterId }: ResumeTarget,
  platform: string,
): ResumeRoute[] {
  const reader: ResumeRoute = {
    pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
    params: { moduleId, seriesId, chapterId },
  };
  if (platform === "web") return [reader];
  return [{ pathname: "/series/[moduleId]/[seriesId]", params: { moduleId, seriesId } }, reader];
}
