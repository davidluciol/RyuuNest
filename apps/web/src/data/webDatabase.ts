import { migrate, type SqlDriver, type SqlRunResult, type SqlValue } from "@ryuunest/core";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

import type { ByteStore } from "./byteStore";

/**
 * F25 — base de datos del cliente web: SQLite real sobre **sql.js** (WASM,
 * empaquetado local; el `.wasm` sale de `sql.js/dist` vía `?url`, sin CDN) cuyos
 * bytes se persisten en el `ByteStore` (IndexedDB en producción, SPEC §5.3/D-7).
 *
 * Implementa el puerto `SqlDriver` del núcleo, así que `migrate` y todo el
 * dominio (biblioteca, progreso, repos, módulos, ajustes, log) funcionan igual
 * que en el dispositivo. El volcado a bytes es con retraso (debounced) para no
 * escribir en disco en cada sentencia; `flush()` lo fuerza.
 */

export interface WebDatabase {
  readonly driver: SqlDriver;
  /** Vuelca los cambios pendientes al `ByteStore` (al salir, en pruebas…). */
  flush(): Promise<void>;
}

export type InitSqlJsLike = (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>;

export interface OpenWebDatabaseOptions {
  readonly byteStore: ByteStore;
  /** En el navegador se inyecta para apuntar al `.wasm` empaquetado; en Node no hace falta. */
  readonly locateFile?: (file: string) => string;
  readonly initSqlJs?: InitSqlJsLike;
  /** Retraso del volcado diferido, en ms (en pruebas se puede poner alto y usar `flush`). */
  readonly persistDelayMs?: number;
}

function lastInsertRowid(db: Database): number {
  const result = db.exec("SELECT last_insert_rowid() AS id");
  const value = result[0]?.values[0]?.[0];
  return typeof value === "number" ? value : 0;
}

export async function openWebDatabase(options: OpenWebDatabaseOptions): Promise<WebDatabase> {
  const init = options.initSqlJs ?? (initSqlJs as InitSqlJsLike);
  const SQL = await init(options.locateFile === undefined ? {} : { locateFile: options.locateFile });
  const saved = await options.byteStore.load();
  const db = saved === undefined ? new SQL.Database() : new SQL.Database(saved);

  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saving: Promise<void> = Promise.resolve();

  async function flushNow(): Promise<void> {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (!dirty) return;
    dirty = false;
    const bytes = db.export();
    saving = saving.then(() => options.byteStore.save(bytes));
    await saving;
  }

  function markDirty(): void {
    dirty = true;
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        void flushNow();
      }, options.persistDelayMs ?? 250);
    }
  }

  async function all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
    const stmt = db.prepare(sql);
    try {
      if (params.length > 0) stmt.bind(params as unknown as never[]);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  }

  const driver: SqlDriver = {
    async exec(sql: string): Promise<void> {
      db.exec(sql);
      markDirty();
    },
    async run(sql: string, params: readonly SqlValue[] = []): Promise<SqlRunResult> {
      db.run(sql, params as unknown as never[]);
      markDirty();
      return { changes: db.getRowsModified(), lastInsertRowid: lastInsertRowid(db) };
    },
    all,
    async get<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
      const rows = await all<T>(sql, params);
      return rows[0];
    },
  };

  await migrate(driver);
  await flushNow();

  return { driver, flush: flushNow };
}
