/**
 * Series guardadas de la biblioteca (SPEC §3.5, §8.1, T22).
 *
 * Una serie existe por `(module_id, series_id)`: la misma id en otro módulo es otra fila.
 * El título se guarda tal cual y además normalizado (`title_norm`), que es por lo que se
 * busca (SPEC §8.1: minúsculas y sin acentos).
 */
import type { MediaKind, SeriesDetails, SeriesStatus } from "../contract/types.js";
import type { Clock } from "../ports/clock.js";
import {
  fromSqlBoolean,
  toSqlBoolean,
  withTransaction,
  type SqlDriver,
  type SqlValue,
} from "../storage/SqlDriver.js";
import { normalizeTitle } from "./normalize.js";
import { readTags, replaceTags } from "./tags.js";

/** Fila de `series` en forma de dominio. */
export interface SeriesRecord {
  moduleId: string;
  seriesId: string;
  title: string;
  titleNorm: string;
  coverUrl: string | null;
  /** Cabeceras que exige la portada (M440, YupManga); `null` si no pide ninguna (F47). */
  coverHeaders: Record<string, string> | null;
  kind: MediaKind | null;
  nsfw: boolean;
  status: SeriesStatus | null;
  updatedAt: number;
}

/** Datos con los que se da de alta o se actualiza una serie. */
export interface SeriesInput {
  moduleId: string;
  seriesId: string;
  title: string;
  coverUrl?: string | undefined;
  coverHeaders?: Record<string, string> | undefined;
  kind?: MediaKind | undefined;
  nsfw?: boolean;
  status?: SeriesStatus | undefined;
}

interface SeriesRow {
  module_id: string;
  series_id: string;
  title: string;
  title_norm: string;
  cover_url: string | null;
  cover_headers: string | null;
  kind: string | null;
  nsfw: number;
  status: string | null;
  updated_at: number;
}

/** Lee las cabeceras guardadas (JSON); un valor ilegible o vacío es «sin cabeceras». */
export function parseCoverHeaders(raw: string | null): Record<string, string> | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === "object" && Object.keys(value).length > 0
      ? (value as Record<string, string>)
      : null;
  } catch {
    return null;
  }
}

/** Texto que se guarda en `cover_headers`: `null` si no hay cabeceras. */
export function serializeCoverHeaders(
  headers: Record<string, string> | null | undefined,
): string | null {
  return headers === undefined || headers === null || Object.keys(headers).length === 0
    ? null
    : JSON.stringify(headers);
}

export { normalizeTitle } from "./normalize.js";

function toRecord(fila: SeriesRow): SeriesRecord {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    title: fila.title,
    titleNorm: fila.title_norm,
    coverUrl: fila.cover_url,
    coverHeaders: parseCoverHeaders(fila.cover_headers),
    kind: fila.kind as MediaKind | null,
    nsfw: fromSqlBoolean(fila.nsfw),
    status: fila.status as SeriesStatus | null,
    updatedAt: fila.updated_at,
  };
}

export class SeriesStore {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /** Alta o actualización por `(module_id, series_id)`: una sola escritura, nunca duplica. */
  async upsert(entrada: SeriesInput): Promise<void> {
    const ahora = this.#clock.now();
    const params: readonly SqlValue[] = [
      entrada.moduleId,
      entrada.seriesId,
      entrada.title,
      normalizeTitle(entrada.title),
      entrada.coverUrl ?? null,
      serializeCoverHeaders(entrada.coverHeaders),
      entrada.kind ?? null,
      toSqlBoolean(entrada.nsfw ?? false),
      entrada.status ?? null,
      ahora,
    ];

    await this.#driver.run(
      `INSERT INTO series (module_id, series_id, title, title_norm, cover_url, cover_headers, kind, nsfw, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         title = excluded.title, title_norm = excluded.title_norm,
         cover_url = excluded.cover_url, cover_headers = excluded.cover_headers, kind = excluded.kind,
         nsfw = excluded.nsfw, status = excluded.status,
         updated_at = excluded.updated_at`,
      params,
    );
  }

  /**
   * Guarda la serie tal como la describe `details()` del módulo. Es lo que debe ocurrir antes
   * de marcarla como favorita: la biblioteca une `favorite` con `series` por título y portada,
   * y un favorito sin fila en `series` no se lista (P-126).
   */
  async saveFromDetails(moduleId: string, detalles: SeriesDetails): Promise<void> {
    await this.upsert({
      moduleId,
      seriesId: detalles.id,
      title: detalles.title,
      coverUrl: detalles.cover?.url,
      coverHeaders: detalles.cover?.headers,
      kind: detalles.kind,
      nsfw: detalles.nsfw ?? false,
      status: detalles.status,
    });
    await this.setTags(moduleId, detalles.id, detalles.genres);
  }

  /** Reemplaza las etiquetas de la serie (F53). La serie ya debe existir en `series`. */
  async setTags(moduleId: string, seriesId: string, tags: readonly string[]): Promise<void> {
    await withTransaction(this.#driver, () =>
      replaceTags(this.#driver, "series_tag", [moduleId, seriesId], tags),
    );
  }

  /** Etiquetas de la serie, por orden. */
  async tags(moduleId: string, seriesId: string): Promise<string[]> {
    return readTags(this.#driver, "series_tag", [moduleId, seriesId]);
  }

  async get(moduleId: string, seriesId: string): Promise<SeriesRecord | undefined> {
    const fila = await this.#driver.get<SeriesRow>(
      "SELECT * FROM series WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }
}
