/**
 * Carpetas de la biblioteca (SPEC §3.5 RF-29, §8.1, T22).
 *
 * Crear, renombrar, reordenar y borrar. Borrar una carpeta **no** borra sus favoritos:
 * `favorite.folder_id` es una clave foránea con `ON DELETE SET NULL`, así que los deja sin
 * carpeta (decisión D-12: un favorito pertenece a una carpeta o a ninguna).
 */
import type { Clock } from "../ports/clock.js";
import { type SqlDriver, withTransaction } from "../storage/SqlDriver.js";

/** Fila de `folder` en forma de dominio. */
export interface FolderRecord {
  id: number;
  name: string;
  sort: number;
  updatedAt: number;
}

/** Nueva posición de una carpeta en el reorden. */
export interface FolderOrder {
  id: number;
  sort: number;
}

interface FolderRow {
  id: number;
  name: string;
  sort: number;
  updated_at: number;
}

function toRecord(fila: FolderRow): FolderRecord {
  return { id: fila.id, name: fila.name, sort: fila.sort, updatedAt: fila.updated_at };
}

export class Folders {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /** Crea una carpeta y devuelve su `id` autonumérico. */
  async create(name: string, sort = 0): Promise<number> {
    const resultado = await this.#driver.run(
      "INSERT INTO folder (name, sort, updated_at) VALUES (?, ?, ?)",
      [name, sort, this.#clock.now()],
    );
    return resultado.lastInsertRowid;
  }

  /** Lista por orden manual (`sort`); a igualdad de `sort`, por `id` para que sea decisivo. */
  async list(): Promise<FolderRecord[]> {
    const filas = await this.#driver.all<FolderRow>("SELECT * FROM folder ORDER BY sort, id");
    return filas.map(toRecord);
  }

  async get(id: number): Promise<FolderRecord | undefined> {
    const fila = await this.#driver.get<FolderRow>("SELECT * FROM folder WHERE id = ?", [id]);
    return fila === undefined ? undefined : toRecord(fila);
  }

  async rename(id: number, name: string): Promise<void> {
    await this.#driver.run("UPDATE folder SET name = ?, updated_at = ? WHERE id = ?", [
      name,
      this.#clock.now(),
      id,
    ]);
  }

  /** Reordena de golpe: todas las posiciones se escriben en una sola transacción. */
  async setOrder(ordenes: readonly FolderOrder[]): Promise<void> {
    const ahora = this.#clock.now();
    await withTransaction(this.#driver, async () => {
      for (const orden of ordenes) {
        await this.#driver.run("UPDATE folder SET sort = ?, updated_at = ? WHERE id = ?", [
          orden.sort,
          ahora,
          orden.id,
        ]);
      }
    });
  }

  /** Borra la carpeta. Sus favoritos quedan, pero sin carpeta (`ON DELETE SET NULL`). */
  async remove(id: number): Promise<void> {
    await this.#driver.run("DELETE FROM folder WHERE id = ?", [id]);
  }
}
