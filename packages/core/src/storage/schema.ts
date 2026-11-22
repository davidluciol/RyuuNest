/**
 * Esquema local (SPEC §8.1, T21).
 *
 * Las nueve tablas del SPEC, sus claves y los tres índices, literalmente como están en
 * el documento. Se añade una tabla `kv` para el puerto `Storage` clave-valor que ya usa
 * la instalación de módulos (T12–T15): el SPEC describe las tablas relacionales de la
 * biblioteca, pero no dónde viven las filas JSON de repos y módulos mientras el registro
 * no tenga su propio API. Anotado en `MEMORY.md` (P-55). La migración 6 (G2) las pasa a
 * `repo`/`module` y retira `kv`.
 */

/** Versión del esquema: sube con cada migración nueva (SPEC §8.1). */
export const SCHEMA_VERSION = 6;

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

/** Casa del puerto `Storage` clave-valor (ver la nota de la cabecera); la retira la migración 6. */
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

/**
 * Carpeta por defecto «Favoritos» (F52). Idempotente: adopta la carpeta del usuario que ya se
 * llame así (sin perder sus series) o la crea; si ya hay una marcada, no hace nada. La reusan
 * la migración 3 y el reemplazo de respaldo, que vacía `folder`. «Gemas» no tiene fila: es la
 * vista de todas las series.
 */
export const ENSURE_DEFAULT_FOLDERS: readonly string[] = [
  `UPDATE folder SET system = 'favorites', name = 'Favoritos'
   WHERE id = (SELECT MIN(id) FROM folder WHERE lower(name) = 'favoritos')
     AND NOT EXISTS (SELECT 1 FROM folder WHERE system = 'favorites')`,
  `INSERT INTO folder (name, sort, updated_at, system)
   SELECT 'Favoritos', 0, CAST(strftime('%s', 'now') AS INTEGER) * 1000, 'favorites'
   WHERE NOT EXISTS (SELECT 1 FROM folder WHERE system = 'favorites')`,
];

/** Migración 3 (F52): marca de carpeta del sistema y siembra de «Favoritos». Aditiva. */
export const MIGRATION_3: readonly string[] = [
  "ALTER TABLE folder ADD COLUMN system TEXT",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_folder_system ON folder(system) WHERE system IS NOT NULL",
  ...ENSURE_DEFAULT_FOLDERS,
];

/**
 * Migración 4 (F53, P-162): etiquetas. `series_tag` guarda los géneros de cada serie (de
 * `SeriesDetails.genres`) y `folder_tag` las de una carpeta inteligente. `tag_norm` es la
 * clave de comparación (minúsculas, sin acentos); `tag`, el texto que se muestra. Aditiva.
 */
/** F47 — cabeceras de la portada (JSON), aditiva: las filas anteriores quedan en `NULL`. */
export const MIGRATION_5: readonly string[] = ["ALTER TABLE series ADD COLUMN cover_headers TEXT"];

export const MIGRATION_4: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS series_tag (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL, tag TEXT NOT NULL, tag_norm TEXT NOT NULL,
  PRIMARY KEY (module_id, series_id, tag_norm),
  FOREIGN KEY (module_id, series_id) REFERENCES series(module_id, series_id) ON DELETE CASCADE
)`,
  "CREATE INDEX IF NOT EXISTS idx_series_tag_norm ON series_tag(tag_norm)",
  `CREATE TABLE IF NOT EXISTS folder_tag (
  folder_id INTEGER NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
  tag TEXT NOT NULL, tag_norm TEXT NOT NULL,
  PRIMARY KEY (folder_id, tag_norm)
)`,
];

/**
 * Copia (upsert) las filas JSON de repos y módulos de `source` —una tabla o subconsulta con
 * columnas `key` y `value` con la forma de las filas de `kv`— a `repo`/`module` (G2). La
 * comparten la migración 6 (`FROM kv`) y `SqliteStorage` (`FROM (SELECT ? AS key, ? AS value)`),
 * así que una fila migrada y una escrita hoy quedan igual. `data` guarda el JSON tal cual
 * (es lo que leen los registros); las columnas del SPEC son su proyección. `repo_id` solo se
 * enlaza si el repo existe: un módulo sobrevive a que se borre su repo (RF-8).
 */
export function upsertRepo(source: string): string {
  return `INSERT INTO repo (id, url, name, added_at, data)
  SELECT substr(key, 6), COALESCE(json_extract(value, '$.url'), substr(key, 6)),
    json_extract(value, '$.name'), COALESCE(json_extract(value, '$.addedAt'), 0), value
  FROM ${source} WHERE substr(key, 1, 5) = 'repo:' AND json_valid(value)
  ON CONFLICT (id) DO UPDATE SET url = excluded.url, name = excluded.name,
    added_at = excluded.added_at, data = excluded.data`;
}

/** Ver `upsertRepo`. */
export function upsertModule(source: string): string {
  return `INSERT INTO module (id, version, repo_id, runtime, kinds, lang, nsfw, enabled, installed_at, last_error, data)
  SELECT substr(key, 8), COALESCE(json_extract(value, '$.version'), ''),
    (SELECT r.id FROM repo r WHERE r.id = json_extract(value, '$.repoUrl')),
    COALESCE(json_extract(value, '$.runtime'), ''), COALESCE(json_extract(value, '$.kinds'), '[]'),
    json_extract(value, '$.lang'), COALESCE(json_extract(value, '$.nsfw'), 0),
    COALESCE(json_extract(value, '$.enabled'), 1), COALESCE(json_extract(value, '$.installedAt'), 0),
    json_extract(value, '$.lastError'), value
  FROM ${source} WHERE substr(key, 1, 7) = 'module:' AND json_valid(value)
  ON CONFLICT (id) DO UPDATE SET version = excluded.version, repo_id = excluded.repo_id,
    runtime = excluded.runtime, kinds = excluded.kinds, lang = excluded.lang, nsfw = excluded.nsfw,
    enabled = excluded.enabled, installed_at = excluded.installed_at,
    last_error = excluded.last_error, data = excluded.data`;
}

/**
 * Migración 6 (G2): las filas JSON de repos y módulos pasan de `kv` a las tablas `repo` y
 * `module` del SPEC §8.1, que ya existían vacías. Se añaden `data` (el JSON completo) y
 * `repo.index_json` (el `index.json` tal cual llegó, T38) y se retira `kv`. Va en una sola
 * transacción (`migrate`): si una fila no cabe, no se borra nada. Se descartan solo filas que
 * los registros ya no podían leer (JSON inválido) y un índice sin su repo.
 */
export const MIGRATION_6: readonly string[] = [
  "ALTER TABLE repo ADD COLUMN data TEXT",
  "ALTER TABLE repo ADD COLUMN index_json TEXT",
  "ALTER TABLE module ADD COLUMN data TEXT",
  upsertRepo("kv"),
  `UPDATE repo SET index_json = (SELECT value FROM kv WHERE key = 'repoIndex:' || repo.id)
   WHERE EXISTS (SELECT 1 FROM kv WHERE key = 'repoIndex:' || repo.id)`,
  upsertModule("kv"),
  "DROP TABLE kv",
];
