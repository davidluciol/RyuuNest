import type { SqlDriver } from "@ryuunest/core";

/**
 * F14c — base de datos de la app. Esta versión es la de la web y la de Vitest: no hay
 * SQLite local (expo-sqlite en web es alpha y pide wasm y cabeceras COOP/COEP), así que
 * las pantallas usan sus datos de ejemplo. La del dispositivo está en `appDatabase.native.ts`.
 */
export async function openAppDatabase(): Promise<SqlDriver | null> {
  return null;
}
