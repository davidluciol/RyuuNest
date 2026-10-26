import { describe, expect, it } from "vitest";

import { createExpoSqlDriver, type ExpoDatabaseLike } from "../../src/data/expoSqlDriver";

/**
 * F14c — adaptador de `SqlDriver` sobre `expo-sqlite`. Se prueba contra un doble
 * mínimo de la base de Expo (los módulos nativos no corren en Vitest); el camino SQL
 * real lo cubre `libraryData.test.ts` y el POCO F5 Pro.
 */
interface Call {
  method: string;
  sql: string;
  params?: unknown;
}

function fakeDatabase(overrides: Partial<ExpoDatabaseLike> = {}): {
  db: ExpoDatabaseLike;
  calls: Call[];
} {
  const calls: Call[] = [];
  const db: ExpoDatabaseLike = {
    async execAsync(sql) {
      calls.push({ method: "exec", sql });
    },
    async runAsync(sql, params) {
      calls.push({ method: "run", sql, params });
      return { lastInsertRowId: 42, changes: 3 };
    },
    async getAllAsync(sql, params) {
      calls.push({ method: "all", sql, params });
      return [{ a: 1 }, { a: 2 }] as never;
    },
    async getFirstAsync(sql, params) {
      calls.push({ method: "get", sql, params });
      return { a: 1 } as never;
    },
    ...overrides,
  };
  return { db, calls };
}

describe("createExpoSqlDriver (F14c)", () => {
  it("exec delega las sentencias sin parámetros", async () => {
    const { db, calls } = fakeDatabase();

    await createExpoSqlDriver(db).exec("PRAGMA foreign_keys = ON");

    expect(calls).toEqual([{ method: "exec", sql: "PRAGMA foreign_keys = ON" }]);
  });

  it("run enlaza los parámetros y traduce lastInsertRowId a lastInsertRowid", async () => {
    const { db, calls } = fakeDatabase();

    const result = await createExpoSqlDriver(db).run("INSERT INTO t VALUES (?, ?)", ["x", 2]);

    expect(result).toEqual({ changes: 3, lastInsertRowid: 42 });
    expect(calls).toEqual([
      { method: "run", sql: "INSERT INTO t VALUES (?, ?)", params: ["x", 2] },
    ]);
  });

  it("sin parámetros se enlaza una lista vacía", async () => {
    const { db, calls } = fakeDatabase();

    await createExpoSqlDriver(db).all("SELECT 1");

    expect(calls[0]).toMatchObject({ method: "all", params: [] });
  });

  it("all devuelve todas las filas", async () => {
    const { db } = fakeDatabase();

    expect(await createExpoSqlDriver(db).all("SELECT a FROM t", [])).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("get devuelve la primera fila, y undefined (no null) cuando no hay ninguna", async () => {
    const found = fakeDatabase();
    expect(await createExpoSqlDriver(found.db).get("SELECT a FROM t")).toEqual({ a: 1 });

    const empty = fakeDatabase({ getFirstAsync: async () => null });
    expect(await createExpoSqlDriver(empty.db).get("SELECT a FROM t")).toBeUndefined();
  });
});
