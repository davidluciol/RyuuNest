/**
 * Carpetas de la biblioteca (SPEC §3.5 RF-29, §8.1, T22).
 *
 * Crear, renombrar, reordenar y borrar. Borrar una carpeta **no** borra sus favoritos:
 * `favorite.folder_id` es una clave foránea con `ON DELETE SET NULL`, así que los deja sin
 * carpeta (decisión D-12: un favorito pertenece a una carpeta o a ninguna).
 */
import type { Clock } from "../ports/clock.js";
import { type SqlDriver, withTransaction } from "../storage/SqlDriver.js";
import { normalizeTitle } from "./normalize.js";
import { readTags, replaceTags } from "./tags.js";

/** Fila de `folder` en forma de dominio. */
export interface FolderRecord {
  id: number;
  name: string;
  sort: number;
  updatedAt: number;
  /** `"favorites"` = carpeta por defecto (F52): no se borra ni se renombra. `null` = del usuario. */
  system: "favorites" | null;
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
  system: string | null;
}

function toRecord(fila: FolderRow): FolderRecord {
  return {
    id: fila.id,
    name: fila.name,
    sort: fila.sort,
    updatedAt: fila.updated_at,
    system: fila.system === "favorites" ? "favorites" : null,
  };
}

/** Nombre de carpeta rechazado: vacío o ya en uso (F53). La pantalla lo traduce por `reason`. */
export class FolderNameError extends Error {
  readonly reason: "EMPTY" | "DUPLICATE";

  constructor(reason: "EMPTY" | "DUPLICATE") {
    super(reason === "EMPTY" ? "El nombre de la carpeta está vacío" : "Ya existe una carpeta con ese nombre");
    this.name = "FolderNameError";
    this.reason = reason;
  }
}

export class Folders {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /**
   * Crea una carpeta y devuelve su `id` autonumérico. `tags` la vuelve **inteligente** (F53):
   * muestra siempre las series que tengan alguna de esas etiquetas. El nombre no puede estar
   * vacío ni repetirse (sin distinguir mayúsculas, acentos ni espacios de los bordes).
   */
  async create(name: string, sort = 0, tags: readonly string[] = []): Promise<number> {
    const limpio = await this.#validName(name);
    return withTransaction(this.#driver, async () => {
      const resultado = await this.#driver.run(
        "INSERT INTO folder (name, sort, updated_at) VALUES (?, ?, ?)",
        [limpio, sort, this.#clock.now()],
      );
      await replaceTags(this.#driver, "folder_tag", [resultado.lastInsertRowid], tags);
      return resultado.lastInsertRowid;
    });
  }

  /** Etiquetas de la carpeta inteligente, por orden. */
  async tags(id: number): Promise<string[]> {
    return readTags(this.#driver, "folder_tag", [id]);
  }

  /** Valida el nombre (recortado) frente a las demás carpetas; `own` excluye la que se renombra. */
  async #validName(name: string, own?: number): Promise<string> {
    const limpio = name.trim();
    if (limpio === "") {
      throw new FolderNameError("EMPTY");
    }
    const clave = normalizeTitle(limpio);
    const otras = await this.list();
    if (otras.some((carpeta) => carpeta.id !== own && normalizeTitle(carpeta.name) === clave)) {
      throw new FolderNameError("DUPLICATE");
    }
    return limpio;
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
    await this.#assertUserFolder(id, "renombrar");
    const limpio = await this.#validName(name, id);
    await this.#driver.run("UPDATE folder SET name = ?, updated_at = ? WHERE id = ?", [
      limpio,
      this.#clock.now(),
      id,
    ]);
  }

  /** Las carpetas del sistema (F52) no se tocan: se rechaza antes de escribir. */
  async #assertUserFolder(id: number, accion: string): Promise<void> {
    const carpeta = await this.get(id);
    if (carpeta !== undefined && carpeta.system !== null) {
      throw new Error(`No se puede ${accion} una carpeta del sistema`);
    }
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
    await this.#assertUserFolder(id, "borrar");
    await this.#driver.run("DELETE FROM folder WHERE id = ?", [id]);
  }
}
