import { Asset } from "expo-asset";
import type { SqlDriver } from "@ryuunest/core";
import { createIdbByteStore, openWebDatabase } from "@ryuunest/web-db";
import sqlWasm from "sql.js/dist/sql-wasm.wasm";

/** Clave de la base en IndexedDB; los e2e la siembran con estos mismos nombres. */
const WEB_DB_NAME = "ryuunest-expo-web";

let opening: Promise<SqlDriver> | undefined;

/** Web (F49b): SQLite real (sql.js) persistida en IndexedDB, un único driver por página. */
export function openAppDatabase(): Promise<SqlDriver | null> {
  opening ??= open();
  return opening;
}

async function open(): Promise<SqlDriver> {
  const { driver } = await openWebDatabase({
    byteStore: createIdbByteStore({ dbName: WEB_DB_NAME, store: "bytes", key: "ryuunest.db" }),
    locateFile: () => Asset.fromModule(sqlWasm).uri,
  });
  return driver;
}
