/**
 * Historial «último leído» (F78): una entrada por serie —su última lectura—, la más
 * reciente primero. Sale de `progress` (una fila por serie, T25) unida a `series`, así que
 * cuenta también lo leído sin guardar en favoritos. Sin tabla propia: `progress` ya es el
 * registro y el respaldo ya lo incluye.
 */
import type { MediaKind, SeriesStatus } from "../contract/types.js";
import { parseCoverHeaders } from "../library/SeriesStore.js";
import { fromSqlBoolean, type SqlDriver } from "../storage/SqlDriver.js";

export interface LastReadEntry {
  moduleId: string;
  seriesId: string;
  /** Título de la serie; si aún no hay fila en `series`, su id (no se inventa otro). */
  title: string;
  coverUrl: string | null;
  /** Cabeceras que exige la portada; `null` si no pide ninguna (F47). */
  coverHeaders: Record<string, string> | null;
  kind: MediaKind | null;
  status: SeriesStatus | null;
  nsfw: boolean;
  /** Capítulo, edición y página exacta con los que se reanuda sin pasar por la ficha. */
  chapterId: string;
  releaseId: string | null;
  chapterTitle: string | null;
  pageIndex: number;
  pageTotal: number | null;
  /** Páginas por leer tras la actual; `null` si no se conoce el total. */
  pagesLeft: number | null;
  readAt: number;
}

export interface LastReadOptions {
  /** Entradas máximas; por defecto todas. */
  limit?: number;
  /** Con `true` se ven también las series NSFW (RF-35: por defecto no). */
  nsfwVisible?: boolean;
}

interface Row {
  module_id: string;
  series_id: string;
  title: string | null;
  cover_url: string | null;
  cover_headers: string | null;
  kind: MediaKind | null;
  status: SeriesStatus | null;
  nsfw: number | null;
  chapter_id: string;
  release_id: string | null;
  chapter_title: string | null;
  page_index: number;
  page_total: number | null;
  updated_at: number;
}

export async function listLastRead(
  driver: SqlDriver,
  options: LastReadOptions = {},
): Promise<LastReadEntry[]> {
  const rows = await driver.all<Row>(
    `SELECT p.module_id, p.series_id, s.title, s.cover_url, s.cover_headers, s.kind, s.status, s.nsfw,
            p.chapter_id, p.release_id, p.chapter_title, p.page_index, p.page_total, p.updated_at
       FROM progress p
       LEFT JOIN series s ON s.module_id = p.module_id AND s.series_id = p.series_id
      WHERE ? = 1 OR COALESCE(s.nsfw, 0) = 0
      ORDER BY p.updated_at DESC, p.module_id, p.series_id
      LIMIT ?`,
    [options.nsfwVisible === true ? 1 : 0, options.limit ?? -1],
  );
  return rows.map((row) => ({
    moduleId: row.module_id,
    seriesId: row.series_id,
    title: row.title ?? row.series_id,
    coverUrl: row.cover_url,
    coverHeaders: parseCoverHeaders(row.cover_headers),
    kind: row.kind,
    status: row.status,
    nsfw: row.nsfw === null ? false : fromSqlBoolean(row.nsfw),
    chapterId: row.chapter_id,
    releaseId: row.release_id,
    chapterTitle: row.chapter_title,
    pageIndex: row.page_index,
    pageTotal: row.page_total,
    pagesLeft: row.page_total === null ? null : Math.max(0, row.page_total - row.page_index - 1),
    readAt: row.updated_at,
  }));
}

/** La lectura más reciente de todas, o `undefined` si no se ha leído nada. */
export async function getLastRead(
  driver: SqlDriver,
  options: Omit<LastReadOptions, "limit"> = {},
): Promise<LastReadEntry | undefined> {
  return (await listLastRead(driver, { ...options, limit: 1 }))[0];
}
