/**
 * Validación de la forma mínima del contrato en ejecución (T37, R4 del ADR-0003).
 *
 * El runtime `script` devuelve lo que entrega el módulo sin comprobarlo (`as R`): una
 * forma incorrecta rompía pantallas en vez de llegar como `PARSE`. `guardApi` usa estas
 * funciones para exigir solo lo que el contrato declara obligatorio (SPEC §6.2) con
 * tipos básicos, y **tolera todo lo demás**: campos extra (`related` de zonatmo y
 * yupmanga), claves ausentes porque el sitio no las trae y valores opcionales con
 * cualquier contenido. Endurecer esto después rompería módulos ya publicados, así que
 * cada regla nueva necesita su regresión con los módulos de `RyuuNest-Models`.
 *
 * Decisiones de forma (ADR-0003):
 * - `Page.items` puede estar vacía (m440 y yupmanga paginan a una sola página y
 *   devuelven `items: []` tras la primera).
 * - `SeriesDetails.chapters` puede estar vacía: una serie sin capítulos es contenido,
 *   no forma rota (T39, L2).
 * - `ChapterPages.images` no puede: un capítulo sin imágenes no se puede leer y la app
 *   ya lo trataba como `PARSE` en su capa (ReadingSource).
 * - Los ids son cadenas opacas (SPEC §6.2): se exige «no vacía», nada más (`?`, `=`,
 *   `/`… yupmanga los usa).
 */

/** Objeto plano (no `null`, no lista): lo que devuelve un módulo por cada método. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Cadena no vacía: lo mínimo que exige el contrato de ids y títulos. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/**
 * Forma mínima de `Page<SeriesSummary>` (popular, latest, search). Devuelve el
 * problema si la viola, o `undefined` si la tolera.
 */
export function pageShapeViolation(value: unknown): string | undefined {
  if (!isPlainObject(value)) {
    return "debe ser un objeto";
  }
  if (!Array.isArray(value.items)) {
    return "«items» debe ser una lista";
  }
  if (typeof value.hasNext !== "boolean") {
    return "«hasNext» debe ser un booleano";
  }
  for (const [index, item] of value.items.entries()) {
    if (!isPlainObject(item)) {
      return `«items[${index}]» debe ser un objeto`;
    }
    if (!isNonEmptyString(item.id)) {
      return `«items[${index}].id» debe ser una cadena no vacía`;
    }
    if (!isNonEmptyString(item.title)) {
      return `«items[${index}].title» debe ser una cadena no vacía`;
    }
  }
  return undefined;
}

/**
 * Forma mínima de `SeriesDetails` (details). Devuelve el problema si la viola, o
 * `undefined` si la tolera (campos extra incluidos).
 */
export function detailsShapeViolation(value: unknown): string | undefined {
  if (!isPlainObject(value)) {
    return "debe ser un objeto";
  }
  if (!isNonEmptyString(value.id)) {
    return "«id» debe ser una cadena no vacía";
  }
  if (!isNonEmptyString(value.title)) {
    return "«title» debe ser una cadena no vacía";
  }
  if (!Array.isArray(value.genres)) {
    return "«genres» debe ser una lista";
  }
  if (typeof value.status !== "string") {
    return "«status» debe ser una cadena";
  }
  if (!Array.isArray(value.altTitles)) {
    return "«altTitles» debe ser una lista";
  }
  if (!isPlainObject(value.extra)) {
    return "«extra» debe ser un objeto";
  }
  if (!Array.isArray(value.chapters)) {
    return "«chapters» debe ser una lista";
  }
  for (const [index, chapter] of value.chapters.entries()) {
    if (!isPlainObject(chapter)) {
      return `«chapters[${index}]» debe ser un objeto`;
    }
    if (!isNonEmptyString(chapter.id)) {
      return `«chapters[${index}].id» debe ser una cadena no vacía`;
    }
    if (!isNonEmptyString(chapter.title)) {
      return `«chapters[${index}].title» debe ser una cadena no vacía`;
    }
    if (!Array.isArray(chapter.releases) || chapter.releases.length === 0) {
      return `«chapters[${index}].releases» debe ser una lista con al menos una edición`;
    }
    for (const [releaseIndex, release] of chapter.releases.entries()) {
      if (!isPlainObject(release)) {
        return `«chapters[${index}].releases[${releaseIndex}]» debe ser un objeto`;
      }
      if (!isNonEmptyString(release.id)) {
        return `«chapters[${index}].releases[${releaseIndex}].id» debe ser una cadena no vacía`;
      }
    }
  }
  return undefined;
}

/**
 * Forma mínima de `ChapterPages` (pages). Devuelve el problema si la viola, o
 * `undefined` si la tolera.
 */
export function pagesShapeViolation(value: unknown): string | undefined {
  if (!isPlainObject(value)) {
    return "debe ser un objeto";
  }
  if (!Array.isArray(value.images) || value.images.length === 0) {
    return "«images» debe ser una lista con al menos una imagen";
  }
  for (const [index, image] of value.images.entries()) {
    if (!isPlainObject(image)) {
      return `«images[${index}]» debe ser un objeto`;
    }
    if (!isNonEmptyString(image.url)) {
      return `«images[${index}].url» debe ser una cadena no vacía`;
    }
  }
  return undefined;
}
