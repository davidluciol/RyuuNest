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

  /**
   * «Añadir a favoritos» (F54): pasa la serie a la carpeta del sistema «Favoritos» y la saca de
   * la que tuviera (una sola carpeta, D-12). Si la serie no está guardada, no hace nada.
   */
  async moveToFavorites(moduleId: string, seriesId: string): Promise<void> {
    await this.#driver.run(
      `UPDATE favorite SET updated_at = ?,
         folder_id = (SELECT id FROM folder WHERE system = 'favorites')
       WHERE module_id = ? AND series_id = ?`,
      [this.#clock.now(), moduleId, seriesId],
    );
  }

  /** ¿La serie está en la carpeta del sistema «Favoritos»? (estado del corazón de la ficha, F95) */
  async isHearted(moduleId: string, seriesId: string): Promise<boolean> {
    const fila = await this.#driver.get(
      `SELECT 1 AS ok FROM favorite f JOIN folder d ON d.id = f.folder_id
       WHERE f.module_id = ? AND f.series_id = ? AND d.system = 'favorites'`,
      [moduleId, seriesId],
    );
    return fila !== undefined;
  }

  /**
   * Corazón de la ficha (F95): sin corazón la deja en «Favoritos» (la guarde ya o no); con él, la
   * devuelve a «Gemas» (sin carpeta) sin perder la serie ni su progreso. Devuelve el estado nuevo.
   */
  async toggleHeart(moduleId: string, seriesId: string): Promise<boolean> {
    if (await this.isHearted(moduleId, seriesId)) {
      await this.move(moduleId, seriesId, null);
      return false;
    }
    await this.add(moduleId, seriesId, null);
    await this.moveToFavorites(moduleId, seriesId);
    return true;
  }

  async get(moduleId: string, seriesId: string): Promise<FavoriteRecord | undefined> {
    const fila = await this.#driver.get<FavoriteRow>(
      "SELECT * FROM favorite WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }
}
