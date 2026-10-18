/**
 * `SqliteStorage` (SPEC §5.3 y §8.1, T21): el puerto `Storage` sobre SQLite.
 *
 * Es el almacén real de la aplicación: `SqlDriver` lo pone cada plataforma
 * (`expo-sqlite` en el dispositivo, SQLite en WASM en la web) y aquí solo hay SQL del
 * esquema §8.1. Las filas de la biblioteca (series, carpetas, favoritos, progreso) se
 * leen y escriben con sentencias sobre ese mismo esquema; este adaptador expone la parte
 * clave-valor que ya usan el instalador y los registros (T12–T15), guardada en la tabla
 * `kv`.
 */
import type { Storage } from "../ports/storage.js";
import { migrate } from "./migrations.js";
import { escapeLike, type SqlDriver } from "./SqlDriver.js";

export class SqliteStorage implements Storage {
  readonly #driver: SqlDriver;

  constructor(driver: SqlDriver) {
    this.#driver = driver;
  }

  /** Abre un almacén sobre un conductor ya migrado (aplica las migraciones si faltan). */
  static async migrated(driver: SqlDriver): Promise<SqliteStorage> {
    await migrate(driver);
    return new SqliteStorage(driver);
  }

  async get(key: string): Promise<string | undefined> {
    const fila = await this.#driver.get<{ value: string }>("SELECT value FROM kv WHERE key = ?", [
      key,
    ]);
    return fila?.value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.#driver.run(
      "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
  }

  async delete(key: string): Promise<void> {
    await this.#driver.run("DELETE FROM kv WHERE key = ?", [key]);
  }

  async keys(prefix?: string): Promise<string[]> {
    if (prefix === undefined || prefix === "") {
      const filas = await this.#driver.all<{ key: string }>("SELECT key FROM kv");
      return filas.map((fila) => fila.key);
    }

    const filas = await this.#driver.all<{ key: string }>(
      "SELECT key FROM kv WHERE key LIKE ? ESCAPE '\\'",
      [`${escapeLike(prefix)}%`],
    );
    return filas.map((fila) => fila.key);
  }
}
