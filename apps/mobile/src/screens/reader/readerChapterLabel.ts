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

/** El módulo ya numeró el título («Capítulo 103.00», «Capitulo 7», «Cap. 5: …», «Chapter 2»). */
const NUMBERED_TITLE = /^(cap|ch)\S*\s*\d/i;

/** Título de la fila de capítulo: «Capítulo N: subtítulo», sin repetir la numeración del módulo. */
export function chapterRowTitle(chapter: { number?: number | undefined; title: string }): string {
  const title = chapter.title.trim();
  if (chapter.number === undefined) return title;
  const numbering = t("series.chapter", { number: chapter.number });
  if (title === "") return numbering;
  return NUMBERED_TITLE.test(title) ? title : `${numbering}: ${title}`;
}
