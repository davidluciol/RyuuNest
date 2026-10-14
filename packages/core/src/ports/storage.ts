/**
 * Puerto `Storage` (SPEC §5.3 y §8.1): persistencia local asíncrona.
 *
 * ⚠️ Contrato **mínimo** (T07). El API completo sobre el esquema del SPEC §8.1 se
 * cierra en T21 (`SqliteStorage`/`MemoryStorage` + suite de conformidad). Este
 * subconjunto de clave–valor basta para los adaptadores falsos de prueba.
 */
export interface Storage {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Todas las claves, o solo las que empiezan por `prefix`. */
  keys(prefix?: string): Promise<string[]>;
}
