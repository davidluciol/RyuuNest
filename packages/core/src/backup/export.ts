/**
 * Exportación del respaldo JSON (SPEC §8.3, RF-37) — T28.
 *
 * Lee todo el estado local (repos, módulos y las tablas de usuario) y lo vuelca en un
 * `Backup` con la forma de `schema.ts`. Es una **lectura**: no modifica nada y no incluye
 * secretos — de cada módulo solo sale la metadata para sugerirlo (RF-38), nunca su código
 * (`files`), su manifest ni sus permisos.
 *
 * Los repos y módulos viven en el puerto `Storage` clave-valor (los registran `RepoRegistry`
 * y `ModuleRegistry`); las filas de usuario viven en las tablas SQL del esquema §8.1. Por
 * eso la exportación recibe las dos piezas, más el reloj para `createdAt`.
 */
import type { InstalledPackage } from "../install/PackageInstaller.js";
import type { MediaKind, SeriesStatus } from "../contract/types.js";
import type { ReaderMode } from "../library/SeriesPrefs.js";
import type { Clock } from "../ports/clock.js";
import type { Storage } from "../ports/storage.js";
import type { RepoRecord } from "../repo/RepoRegistry.js";
import { fromSqlBoolean, type SqlDriver } from "../storage/SqlDriver.js";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type Backup,
  type BackupFavorite,
  type BackupFolder,
  type BackupModule,
  type BackupPref,
  type BackupProgress,
  type BackupRead,
  type BackupRepo,
  type BackupSeries,
} from "./schema.js";

/** Opciones de la exportación. */
export interface ExportBackupOptions {
  driver: SqlDriver;
  storage: Storage;
  clock: Clock;
}

/** Prefijo de las claves de repos, igual que `RepoRegistry` (no exporta el prefijo). */
const REPO_PREFIX = "repo:";
/** Prefijo de las claves de módulos, igual que `ModuleRegistry`. */
const MODULE_PREFIX = "module:";

interface FolderRow {
  id: number;
  name: string;
  sort: number;
  updated_at: number;
}

interface SeriesRow {
  module_id: string;
  series_id: string;
  title: string;
  cover_url: string | null;
  kind: string | null;
  nsfw: number;
  status: string | null;
  updated_at: number;
}

interface FavoriteRow {
  module_id: string;
  series_id: string;
  folder_id: number | null;
  added_at: number;
  updated_at: number;
}

interface ProgressRow {
  module_id: string;
  series_id: string;
  chapter_id: string;
  release_id: string | null;
  chapter_title: string | null;
  page_index: number;
  page_total: number | null;
  updated_at: number;
}

interface ReadRow {
  module_id: string;
  series_id: string;
  chapter_id: string;
  read_at: number;
}

interface PrefRow {
  module_id: string;
  series_id: string;
  reader_mode: string | null;
  preferred_group: string | null;
  updated_at: number;
}

interface SettingRow {
  key: string;
  value: string;
}

/** Vuelca todo el estado local en un `Backup`. */
export async function exportBackup(options: ExportBackupOptions): Promise<Backup> {
  const { driver, storage, clock } = options;

  const [repos, modules, folders, series, favorites, progress, read, prefs, settings] =
    await Promise.all([
      readRepos(storage),
      readModules(storage),
      readFolders(driver),
      readSeries(driver),
      readFavorites(driver),
      readProgress(driver),
      readRead(driver),
      readPrefs(driver),
      readSettings(driver),
    ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: clock.now(),
    repos,
    modules,
    folders,
    series,
    favorites,
    progress,
    read,
    prefs,
    settings,
  };
}

async function readRepos(storage: Storage): Promise<BackupRepo[]> {
  const repos: BackupRepo[] = [];
  for (const key of await storage.keys(REPO_PREFIX)) {
    const raw = await storage.get(key);
    if (raw === undefined) {
      continue;
    }
    const record = JSON.parse(raw) as RepoRecord;
    repos.push({
      url: record.url,
      name: record.name,
      addedAt: record.addedAt,
      updatedAt: record.updatedAt,
    });
  }
  return repos.sort((a, b) => a.addedAt - b.addedAt || a.url.localeCompare(b.url));
}

async function readModules(storage: Storage): Promise<BackupModule[]> {
  const modules: BackupModule[] = [];
  for (const key of await storage.keys(MODULE_PREFIX)) {
    const raw = await storage.get(key);
    if (raw === undefined) {
      continue;
    }
    const pkg = JSON.parse(raw) as InstalledPackage;
    modules.push({
      id: pkg.id,
      version: pkg.version,
      repoUrl: pkg.repoUrl,
      runtime: pkg.runtime,
      kinds: pkg.kinds,
      lang: pkg.lang,
      nsfw: pkg.nsfw,
    });
  }
  return modules.sort((a, b) => a.id.localeCompare(b.id));
}

async function readFolders(driver: SqlDriver): Promise<BackupFolder[]> {
  const filas = await driver.all<FolderRow>("SELECT id, name, sort, updated_at FROM folder ORDER BY sort, id");
  return filas.map((fila) => ({
    id: fila.id,
    name: fila.name,
    sort: fila.sort,
    updatedAt: fila.updated_at,
  }));
}

async function readSeries(driver: SqlDriver): Promise<BackupSeries[]> {
  const filas = await driver.all<SeriesRow>(
    "SELECT module_id, series_id, title, cover_url, kind, nsfw, status, updated_at FROM series ORDER BY module_id, series_id",
  );
  return filas.map((fila) => ({
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    title: fila.title,
    coverUrl: fila.cover_url,
    kind: fila.kind as MediaKind | null,
    nsfw: fromSqlBoolean(fila.nsfw),
    status: fila.status as SeriesStatus | null,
    updatedAt: fila.updated_at,
  }));
}

async function readFavorites(driver: SqlDriver): Promise<BackupFavorite[]> {
  const filas = await driver.all<FavoriteRow>(
    "SELECT module_id, series_id, folder_id, added_at, updated_at FROM favorite ORDER BY module_id, series_id",
  );
  return filas.map((fila) => ({
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    folderId: fila.folder_id,
    addedAt: fila.added_at,
    updatedAt: fila.updated_at,
  }));
}

async function readProgress(driver: SqlDriver): Promise<BackupProgress[]> {
  const filas = await driver.all<ProgressRow>(
    "SELECT module_id, series_id, chapter_id, release_id, chapter_title, page_index, page_total, updated_at FROM progress ORDER BY module_id, series_id",
  );
  return filas.map((fila) => ({
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    chapterId: fila.chapter_id,
    releaseId: fila.release_id,
    chapterTitle: fila.chapter_title,
    pageIndex: fila.page_index,
    pageTotal: fila.page_total,
    updatedAt: fila.updated_at,
  }));
}

async function readRead(driver: SqlDriver): Promise<BackupRead[]> {
  const filas = await driver.all<ReadRow>(
    "SELECT module_id, series_id, chapter_id, read_at FROM chapter_read ORDER BY module_id, series_id, chapter_id",
  );
  return filas.map((fila) => ({
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    chapterId: fila.chapter_id,
    readAt: fila.read_at,
  }));
}

async function readPrefs(driver: SqlDriver): Promise<BackupPref[]> {
  const filas = await driver.all<PrefRow>(
    "SELECT module_id, series_id, reader_mode, preferred_group, updated_at FROM series_pref ORDER BY module_id, series_id",
  );
  return filas.map((fila) => ({
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    readerMode: fila.reader_mode as ReaderMode | null,
    preferredGroup: fila.preferred_group,
    updatedAt: fila.updated_at,
  }));
}

async function readSettings(driver: SqlDriver): Promise<Record<string, string>> {
  const filas = await driver.all<SettingRow>("SELECT key, value FROM setting ORDER BY key");
  const settings: Record<string, string> = {};
  for (const fila of filas) {
    settings[fila.key] = fila.value;
  }
  return settings;
}
