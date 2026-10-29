/**
 * Esquema local (SPEC §8.1, T21).
 *
 * Las nueve tablas del SPEC, sus claves y los tres índices, literalmente como están en
 * el documento. Se añade una tabla `kv` para el puerto `Storage` clave-valor que ya usa
 * la instalación de módulos (T12–T15): el SPEC describe las tablas relacionales de la
 * biblioteca, pero no dónde viven las filas JSON de repos y módulos mientras el registro
 * no tenga su propio API. Anotado en `MEMORY.md` (P-55); si esas tablas dejan de
 * necesitarlas, se retira `kv`.
 */

/** Versión del esquema: sube con cada migración nueva (SPEC §8.1). */
export const SCHEMA_VERSION = 2;

/** Tablas, claves y valores por defecto del SPEC §8.1. */
const TABLAS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS repo (
  id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, name TEXT, added_at INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS module (
  id TEXT PRIMARY KEY, version TEXT NOT NULL, repo_id TEXT REFERENCES repo(id),
  runtime TEXT NOT NULL, kinds TEXT NOT NULL, lang TEXT, nsfw INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1, installed_at INTEGER NOT NULL, last_error TEXT
)`,
  `CREATE TABLE IF NOT EXISTS series (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  title TEXT NOT NULL, title_norm TEXT NOT NULL,
  cover_url TEXT, kind TEXT, nsfw INTEGER NOT NULL DEFAULT 0,
  status TEXT, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
)`,
  `CREATE TABLE IF NOT EXISTS folder (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS favorite (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  folder_id INTEGER REFERENCES folder(id) ON DELETE SET NULL,
  added_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
)`,
  `CREATE TABLE IF NOT EXISTS progress (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL, release_id TEXT, chapter_title TEXT,
  page_index INTEGER NOT NULL DEFAULT 0,
  page_total INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
)`,
  `CREATE TABLE IF NOT EXISTS chapter_read (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id, chapter_id)
)`,
  `CREATE TABLE IF NOT EXISTS series_pref (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  reader_mode TEXT, preferred_group TEXT, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
)`,
  `CREATE TABLE IF NOT EXISTS setting (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
];

/** Los tres índices del SPEC §8.1. */
const INDICES: readonly string[] = [
  "CREATE INDEX IF NOT EXISTS idx_series_title ON series(title_norm)",
  "CREATE INDEX IF NOT EXISTS idx_favorite_folder ON favorite(folder_id)",
  "CREATE INDEX IF NOT EXISTS idx_progress_recent ON progress(updated_at DESC)",
];

/** Casa del puerto `Storage` clave-valor (ver la nota de la cabecera). */
const KV: readonly string[] = [
  "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
];

/** Migración 1: el esquema completo del SPEC §8.1. */
export const MIGRATION_1: readonly string[] = [...TABLAS, ...INDICES, ...KV];

/**
 * Migración 2 (T36, P-72): tabla `log` del registro de diagnóstico. Sin
 * secretos: `message` y `context` llegan ya saneados de quien registra.
 */
export const MIGRATION_2: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS log (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   at INTEGER NOT NULL,
   level TEXT NOT NULL,
   code TEXT NOT NULL,
   message TEXT NOT NULL,
   context TEXT,
   app_version TEXT NOT NULL,
   platform TEXT NOT NULL
 )`,
];
