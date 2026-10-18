/**
 * Series guardadas de la biblioteca (SPEC §3.5, §8.1, T22).
 *
 * Una serie existe por `(module_id, series_id)`: la misma id en otro módulo es otra fila.
 * El título se guarda tal cual y además normalizado (`title_norm`), que es por lo que se
 * busca (SPEC §8.1: minúsculas y sin acentos).
 */
import type { MediaKind, SeriesStatus } from "../contract/types.js";
import type { Clock } from "../ports/clock.js";
import {
  fromSqlBoolean,
  toSqlBoolean,
  type SqlDriver,
  type SqlValue,
} from "../storage/SqlDriver.js";

/** Fila de `series` en forma de dominio. */
export interface SeriesRecord {
  moduleId: string;
  seriesId: string;
  title: string;
  titleNorm: string;
  coverUrl: string | null;
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
  kind: string | null;
  nsfw: number;
  status: string | null;
  updated_at: number;
}

/**
 * Título buscable: minúsculas y sin acentos (SPEC §8.1), con los espacios comprimidos
 * para que «una   serie» y «Una Serie» coincidan.
 */
export function normalizeTitle(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Mn}+/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

function toRecord(fila: SeriesRow): SeriesRecord {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    title: fila.title,
    titleNorm: fila.title_norm,
    coverUrl: fila.cover_url,
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
      entrada.kind ?? null,
      toSqlBoolean(entrada.nsfw ?? false),
      entrada.status ?? null,
      ahora,
    ];

    await this.#driver.run(
      `INSERT INTO series (module_id, series_id, title, title_norm, cover_url, kind, nsfw, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         title = excluded.title, title_norm = excluded.title_norm,
         cover_url = excluded.cover_url, kind = excluded.kind,
         nsfw = excluded.nsfw, status = excluded.status,
         updated_at = excluded.updated_at`,
      params,
    );
  }

  async get(moduleId: string, seriesId: string): Promise<SeriesRecord | undefined> {
    const fila = await this.#driver.get<SeriesRow>(
      "SELECT * FROM series WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }
}
