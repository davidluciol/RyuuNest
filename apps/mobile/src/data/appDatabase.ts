import type { SqlDriver } from "@ryuunest/core";

/**
 * F14c — base de datos de la app. Esta versión es la de Vitest: sin base, así que las
 * pantallas usan sus datos de ejemplo. La del dispositivo está en `appDatabase.native.ts` y la
 * de la web de Expo (sql.js + IndexedDB, F49) en `appDatabase.web.ts`.
 */
export async function openAppDatabase(): Promise<SqlDriver | null> {
  return null;
}
