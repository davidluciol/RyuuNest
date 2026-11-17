import { t } from "../../i18n";

/**
 * Lo que el progreso guarda como título del capítulo (lo muestra Inicio): su numeración
 * («Capítulo 41»); el subtítulo que dé el módulo solo si no hay número.
 */
export function savedChapterLabel(chapter: { number: number | undefined; title: string }): string {
  return chapter.number === undefined
    ? chapter.title
    : t("series.chapter", { number: chapter.number });
}
