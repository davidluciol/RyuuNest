import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

/**
 * F25 — el `.wasm` de sql.js se empaqueta como asset local (RNF-5: sin CDN).
 * Este módulo solo lo usa el navegador; las pruebas en Node llaman a
 * `initSqlJs()` sin `locateFile`.
 */
export function locateSqlWasm(_file: string): string {
  return wasmUrl;
}
