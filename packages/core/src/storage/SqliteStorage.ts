/**
 * `SqliteStorage` (SPEC §5.3 y §8.1, T21): el puerto `Storage` sobre SQLite.
 *
 * Es el almacén real de la aplicación: `SqlDriver` lo pone cada plataforma
 * (`expo-sqlite` en el dispositivo, SQLite en WASM en la web) y aquí solo hay SQL del
 * esquema §8.1. Las filas de la biblioteca (series, carpetas, favoritos, progreso) se
 * leen y escriben con sentencias sobre ese mismo esquema; este adaptador expone la parte
 * clave-valor que usan el instalador y los registros (T12–T15), con las claves sobre las
 * tablas del SPEC (G2): `repo:<id>` → `repo.data`, `repoIndex:<id>` → `repo.index_json` y
 * `module:<id>` → `module.data`. No hay más espacios de claves: escribir otro es un error.
 */
import type { Storage } from "../ports/storage.js";
import { migrate } from "./migrations.js";
import { upsertModule, upsertRepo } from "./schema.js";
import type { SqlDriver } from "./SqlDriver.js";

/** La fila que se escribe, con la forma que esperan `upsertRepo`/`upsertModule`. */
const PARAM_ROW = "(SELECT ? AS key, ? AS value)";

type Namespace = "repo" | "repoIndex" | "module";

function parseKey(key: string): { ns: Namespace; id: string } | undefined {
  const sep = key.indexOf(":");
  const ns = key.slice(0, sep);
  return ns === "repo" || ns === "repoIndex" || ns === "module"
    ? { ns, id: key.slice(sep + 1) }
    : undefined;
}

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
    const parsed = parseKey(key);
    if (parsed === undefined) return undefined;
    const sql = {
      repo: "SELECT data AS v FROM repo WHERE id = ?",
      repoIndex: "SELECT index_json AS v FROM repo WHERE id = ?",
      module: "SELECT data AS v FROM module WHERE id = ?",
    }[parsed.ns];
    const fila = await this.#driver.get<{ v: string | null }>(sql, [parsed.id]);
    return fila?.v ?? undefined;
  }

  async set(key: string, value: string): Promise<void> {
    const parsed = parseKey(key);
    let changes = 0;
    if (parsed?.ns === "repo") {
      changes = (await this.#driver.run(upsertRepo(PARAM_ROW), [key, value])).changes;
      // Los módulos instalados antes de registrar su repo quedan enlazados.
      await this.#driver.run(
        "UPDATE module SET repo_id = ? WHERE repo_id IS NULL AND json_extract(data, '$.repoUrl') = ?",
        [parsed.id, parsed.id],
      );
    } else if (parsed?.ns === "module") {
      changes = (await this.#driver.run(upsertModule(PARAM_ROW), [key, value])).changes;
    } else if (parsed?.ns === "repoIndex") {
      changes = (
        await this.#driver.run("UPDATE repo SET index_json = ? WHERE id = ?", [value, parsed.id])
      ).changes;
    }
    // Sin fila escrita (clave desconocida, JSON inválido o índice sin repo) el dato se perdería.
    if (changes === 0) {
      throw new Error(`SqliteStorage no puede guardar la clave ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    const parsed = parseKey(key);
    if (parsed?.ns === "repo") {
      // Borrar un repo no toca sus módulos (RF-8): solo pierden el enlace.
      await this.#driver.run("UPDATE module SET repo_id = NULL WHERE repo_id = ?", [parsed.id]);
      await this.#driver.run("DELETE FROM repo WHERE id = ?", [parsed.id]);
    } else if (parsed?.ns === "repoIndex") {
      await this.#driver.run("UPDATE repo SET index_json = NULL WHERE id = ?", [parsed.id]);
    } else if (parsed?.ns === "module") {
      await this.#driver.run("DELETE FROM module WHERE id = ?", [parsed.id]);
    }
  }

  async keys(prefix?: string): Promise<string[]> {
    const filas = await this.#driver.all<{ key: string }>(
      `SELECT 'repo:' || id AS key FROM repo WHERE data IS NOT NULL
       UNION ALL SELECT 'repoIndex:' || id FROM repo WHERE index_json IS NOT NULL
       UNION ALL SELECT 'module:' || id FROM module WHERE data IS NOT NULL`,
    );
    return filas.map((fila) => fila.key).filter((key) => key.startsWith(prefix ?? ""));
  }
}
