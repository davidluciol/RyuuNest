import { migrate, type SqlDriver } from "@ryuunest/core";
import { openDatabaseAsync } from "expo-sqlite";

import { createExpoSqlDriver } from "./expoSqlDriver";

/**
 * F14c — base de datos de la app en Android e iOS: `ryuunest.db` de expo-sqlite, con
 * el esquema del SPEC §8.1 migrado. Se abre una sola vez y se comparte.
 */
const DATABASE_NAME = "ryuunest.db";

let opening: Promise<SqlDriver> | undefined;

export function openAppDatabase(): Promise<SqlDriver | null> {
  opening ??= open();
  return opening;
}

async function open(): Promise<SqlDriver> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  const driver = createExpoSqlDriver(db);
  await migrate(driver);
  return driver;
}
