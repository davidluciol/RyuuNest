/**
 * Preferencias por serie (SPEC §8.1 `series_pref`, RF-16 y RF-18) — T24.
 *
 * Dos cosas se recuerdan por `(module_id, series_id)`: el **modo de lectura** elegido para
 * esa serie y la **release preferida** (grupo de publicación). El modo es `vertical`
 * (continuo) o `paged-*` (paginado con dirección): manga D→I, cómic I→D (RF-18).
 *
 * Cuando no hay preferencia guardada se aplica el modo que corresponde al tipo de obra;
 * y si el tipo tampoco se conoce, la función devuelve `null` para que decida el ajuste
 * global de lector (F20), sin inventar un modo.
 */
import { ModuleError } from "../contract/errors.js";
import type { MediaKind } from "../contract/types.js";
import type { Clock } from "../ports/clock.js";
import type { SqlDriver } from "../storage/SqlDriver.js";

/** Modos de lectura (RF-18): vertical continuo, o paginado con dirección. */
export type ReaderMode = "vertical" | "paged-ltr" | "paged-rtl";

const MODOS: readonly ReaderMode[] = ["vertical", "paged-ltr", "paged-rtl"];

/** Preferencia guardada de una serie. `null` en un campo = el lector no lo ha fijado. */
export interface SeriesPreference {
  moduleId: string;
  seriesId: string;
  readerMode: ReaderMode | null;
  preferredGroup: string | null;
  updatedAt: number;
}

interface SeriesPrefRow {
  module_id: string;
  series_id: string;
  reader_mode: string | null;
  preferred_group: string | null;
  updated_at: number;
}

/** El modo que corresponde al tipo de obra (RF-18): manhua y manhwa vertical, manga D→I, cómic I→D. */
export function defaultReaderModeFor(kind: MediaKind): ReaderMode {
  switch (kind) {
    case "manhua":
    case "manhwa":
      return "vertical";
    case "manga":
      return "paged-rtl";
    case "comic":
      return "paged-ltr";
  }
}

/** Comprueba que un modo guardado es uno de los tres del contrato. */
function modoConocido(valor: string | null): ReaderMode | null {
  if (valor === null) {
    return null;
  }
  if (!MODOS.includes(valor as ReaderMode)) {
    throw new ModuleError("PARSE", `Modo de lectura desconocido en la base de datos: ${valor}`);
  }
  return valor as ReaderMode;
}

function toRecord(fila: SeriesPrefRow): SeriesPreference {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    readerMode: modoConocido(fila.reader_mode),
    preferredGroup: fila.preferred_group,
    updatedAt: fila.updated_at,
  };
}

export class SeriesPrefs {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /** Preferencia guardada, o `undefined` si la serie no tiene ninguna. */
  async get(moduleId: string, seriesId: string): Promise<SeriesPreference | undefined> {
    const fila = await this.#driver.get<SeriesPrefRow>(
      "SELECT * FROM series_pref WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }

  /** Recuerda el modo de lectura de la serie (RF-18). */
  async setReaderMode(moduleId: string, seriesId: string, mode: ReaderMode): Promise<void> {
    await this.#driver.run(
      `INSERT INTO series_pref (module_id, series_id, reader_mode, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         reader_mode = excluded.reader_mode, updated_at = excluded.updated_at`,
      [moduleId, seriesId, mode, this.#clock.now()],
    );
  }

  /** Recuerda la release/grupo preferido de la serie (RF-16); `null` lo quita. */
  async setPreferredGroup(moduleId: string, seriesId: string, group: string | null): Promise<void> {
    await this.#driver.run(
      `INSERT INTO series_pref (module_id, series_id, preferred_group, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         preferred_group = excluded.preferred_group, updated_at = excluded.updated_at`,
      [moduleId, seriesId, group, this.#clock.now()],
    );
  }

  /**
   * Modo efectivo de la serie: el preferido si lo hay, si no el del tipo de obra,
   * y `null` si no se puede decidir (sin preferencia y sin tipo conocido).
   */
  async modeFor(
    moduleId: string,
    seriesId: string,
    kind: MediaKind | null,
  ): Promise<ReaderMode | null> {
    const guardado = await this.get(moduleId, seriesId);
    const preferido = guardado?.readerMode ?? null;
    if (preferido !== null) {
      return preferido;
    }
    return kind === null ? null : defaultReaderModeFor(kind);
  }
}
