/**
 * Adaptador de pruebas de `SqlDriver` sobre el SQLite integrado de Node
 * (`node:sqlite`, disponible desde Node 22 y sin bandera en Node 24).
 *
 * Vive en `tests/` a propósito: el núcleo (`src/`) no puede conocer API de Node
 * (P-51 y P-52). En el dispositivo el mismo `SqlDriver` lo implementará
 * `expo-sqlite`, y en la web un SQLite compilado a WASM.
 */
import { DatabaseSync } from "node:sqlite";

import { migrate } from "../../src/storage/migrations.js";
import type { SqlDriver, SqlRunResult, SqlValue } from "../../src/storage/SqlDriver";

/** Fila suelta que devuelve SQLite. */
type Row = Record<string, unknown>;

export class NodeSqliteDriver implements SqlDriver {
  readonly #db: DatabaseSync;
  readonly #sentencias = new Map<string, ReturnType<DatabaseSync["prepare"]>>();

  private constructor(db: DatabaseSync) {
    this.#db = db;
  }

  /** Base de datos en memoria, con las claves foráneas activas. */
  static openInMemory(): NodeSqliteDriver {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    return new NodeSqliteDriver(db);
  }

  /** Cierra la conexión (las pruebas de conformidad lo hacen al terminar). */
  close(): void {
    // Cerrar la base finaliza sus sentencias preparadas; en Node 24 `StatementSync`
    // todavía no tiene un `close()` propio.
    this.#sentencias.clear();
    this.#db.close();
  }

  async exec(sql: string): Promise<void> {
    this.#db.exec(sql);
  }

  async run(sql: string, params: readonly SqlValue[] = []): Promise<SqlRunResult> {
    const result = this.#prepare(sql).run(...params);
    return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
  }

  async all<T = Row>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    return this.#prepare(sql).all(...params) as T[];
  }

  async get<T = Row>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
    return this.#prepare(sql).get(...params) as T | undefined;
  }

  /** Las sentencias preparadas se reutilizan entre llamadas. */
  #prepare(sql: string): ReturnType<DatabaseSync["prepare"]> {
    const cached = this.#sentencias.get(sql);
    if (cached !== undefined) {
      return cached;
    }
    const statement = this.#db.prepare(sql);
    this.#sentencias.set(sql, statement);
    return statement;
  }
}

/** Abre un driver de pruebas ya migrado. */
export async function openMigratedDriver(): Promise<NodeSqliteDriver> {
  const driver = NodeSqliteDriver.openInMemory();
  await migrate(driver);
  return driver;
}
