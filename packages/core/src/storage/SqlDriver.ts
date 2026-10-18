/**
 * `SqlDriver` (SPEC §8.1, T21): la capa fina sobre el motor SQLite de cada plataforma.
 *
 * El núcleo no habla SQLite directamente: habla con este puerto, que es síncrono en el
 * fondo (SQLite) pero se expone en `Promise` para que el adaptador de `expo-sqlite` del
 * dispositivo y el de la web (SQLite en WASM, o IndexedDB) quepan sin tocar el dominio.
 *
 * Los valores admitidos son los que SQLite entiende de forma nativa: texto, enteros y
 * `null`. Un booleano de dominio se pasa como `0`/`1` (ver `toSqlBoolean`).
 */

/** Valor que se puede enlazar a una sentencia. */
export type SqlValue = string | number | null;

/** Fila suelta devuelta por una consulta. */
export type SqlRow = Record<string, unknown>;

/** Resultado de una sentencia que modifica filas. */
export interface SqlRunResult {
  /** Filas insertadas, actualizadas o borradas. */
  changes: number;
  /** `rowid` de la última inserción (0 si la sentencia no insertó nada). */
  lastInsertRowid: number;
}

export interface SqlDriver {
  /** Varias sentencias de una vez, sin parámetros (esquema, pragmas). */
  exec(sql: string): Promise<void>;
  /** Sentencia que modifica filas (`INSERT`, `UPDATE`, `DELETE`). */
  run(sql: string, params?: readonly SqlValue[]): Promise<SqlRunResult>;
  /** Sentencia que devuelve un conjunto de filas. */
  all<T extends SqlRow = SqlRow>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  /** Primera fila del conjunto, o `undefined` si no hay ninguna. */
  get<T extends SqlRow = SqlRow>(sql: string, params?: readonly SqlValue[]): Promise<T | undefined>;
}

/** Los booleanos del dominio viajan por SQL como `0` y `1`. */
export function toSqlBoolean(value: boolean): number {
  return value ? 1 : 0;
}

/** Y vuelven como booleano, tratando cualquier distinto de cero como verdadero. */
export function fromSqlBoolean(value: unknown): boolean {
  return Number(value) !== 0;
}
