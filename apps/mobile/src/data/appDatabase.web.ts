import { Image } from "react-native";
import type { SqlDriver } from "@ryuunest/core";
import { createIdbByteStore, openWebDatabase } from "@ryuunest/web-db";
// El `.wasm` de sql.js es un asset local de Metro (sin CDN, RNF-5): `metro.config.js` lo registra.
import sqlWasm from "sql.js/dist/sql-wasm.wasm";

/**
 * F49 — base de datos de la web de Expo: SQLite real (sql.js, WASM) persistida en IndexedDB,
 * la misma de `apps/web` (`@ryuunest/web-db`). Con ella el núcleo (migraciones, consultas,
 * respaldo) funciona igual que en el teléfono. Se abre una sola vez y se comparte.
 */
let opening: Promise<SqlDriver> | undefined;

export function openAppDatabase(): Promise<SqlDriver | null> {
  opening ??= open();
  return opening;
}

async function open(): Promise<SqlDriver> {
  const { driver } = await openWebDatabase({
    byteStore: createIdbByteStore({
      dbName: "ryuunest-expo-web",
      store: "bytes",
      key: "ryuunest.db",
    }),
    locateFile: () => Image.resolveAssetSource(sqlWasm).uri,
  });
  return driver;
}
