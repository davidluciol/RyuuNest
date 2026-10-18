/**
 * Favoritos de la biblioteca (SPEC §3.5 RF-26 y RF-30, §8.1, D-12, T22).
 *
 * Un favorito es la fila `favorite` por `(module_id, series_id)`: **una** carpeta o ninguna.
 * Moverlo reemplaza la carpeta anterior (no se guarda en dos a la vez). Quitar un favorito
 * **no** borra su progreso (RF-30): la fila `progress` es independiente, sin clave foránea
 * que la arrastre.
 */
import type { Clock } from "../ports/clock.js";
import type { SqlDriver, SqlValue } from "../storage/SqlDriver.js";

/** Fila de `favorite` en forma de dominio. */
export interface FavoriteRecord {
  moduleId: string;
  seriesId: string;
  /** `null` = favorito sin carpeta (D-12). */
  folderId: number | null;
  addedAt: number;
  updatedAt: number;
}

interface FavoriteRow {
  module_id: string;
  series_id: string;
  folder_id: number | null;
  added_at: number;
  updated_at: number;
}

function toRecord(fila: FavoriteRow): FavoriteRecord {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    folderId: fila.folder_id,
    addedAt: fila.added_at,
    updatedAt: fila.updated_at,
  };
}

export class Favorites {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /**
   * Da de alta al favorito en una carpeta o en ninguna. Si ya lo estaba, conserva su
   * `added_at` y solo cambia la carpeta y la marca de tiempo.
   */
  async add(moduleId: string, seriesId: string, folderId: number | null): Promise<void> {
    const ahora = this.#clock.now();
    const params: readonly SqlValue[] = [moduleId, seriesId, folderId, ahora, ahora];
    await this.#driver.run(
      `INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         folder_id = excluded.folder_id, updated_at = excluded.updated_at`,
      params,
    );
  }

  async remove(moduleId: string, seriesId: string): Promise<void> {
    await this.#driver.run("DELETE FROM favorite WHERE module_id = ? AND series_id = ?", [
      moduleId,
      seriesId,
    ]);
  }

  /** Cambia de carpeta; `null` lo deja sin carpeta. */
  async move(moduleId: string, seriesId: string, folderId: number | null): Promise<void> {
    await this.#driver.run(
      "UPDATE favorite SET folder_id = ?, updated_at = ? WHERE module_id = ? AND series_id = ?",
      [folderId, this.#clock.now(), moduleId, seriesId],
    );
  }

  async get(moduleId: string, seriesId: string): Promise<FavoriteRecord | undefined> {
    const fila = await this.#driver.get<FavoriteRow>(
      "SELECT * FROM favorite WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }
}
