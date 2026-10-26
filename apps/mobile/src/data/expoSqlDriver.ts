import type { SqlDriver, SqlRow, SqlRunResult, SqlValue } from "@ryuunest/core";

/**
 * F14c — adaptador de `SqlDriver` (SPEC §8.1) sobre `expo-sqlite`. Pide solo la parte
 * de `SQLiteDatabase` que usa, para que Vitest lo pruebe sin el módulo nativo.
 */
export interface ExpoDatabaseLike {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    params: SqlValue[],
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
}

export function createExpoSqlDriver(db: ExpoDatabaseLike): SqlDriver {
  return {
    exec: (sql) => db.execAsync(sql),
    async run(sql, params = []): Promise<SqlRunResult> {
      const result = await db.runAsync(sql, [...params]);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowId };
    },
    all: <T = SqlRow>(sql: string, params: readonly SqlValue[] = []) =>
      db.getAllAsync<T>(sql, [...params]),
    async get<T = SqlRow>(sql: string, params: readonly SqlValue[] = []) {
      return (await db.getFirstAsync<T>(sql, [...params])) ?? undefined;
    },
  };
}
