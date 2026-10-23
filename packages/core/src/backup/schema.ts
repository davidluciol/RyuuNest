/**
 * Forma del respaldo JSON (SPEC §8.3, T28).
 *
 * Es el contrato del ida y vuelta: la exportación lo escribe y la importación (T29) lo
 * valida y lo fusiona. Se sigue el ejemplo de SPEC §8.3 con una extensión acordada con el
 * humano (2026-10-21): se añaden las columnas del esquema §8.1 que el borrador omitía y que
 * se perderían al restaurar (AC-7 «sin pérdidas»):
 *
 * - `series.status` (estado de publicación, lo muestra el detalle);
 * - `progress.chapterTitle` (lo usa Inicio para «Continuar»);
 * - `repo.addedAt` / `repo.updatedAt` (fechas del registro de repos);
 * - `module.runtime` / `kinds` / `lang` / `nsfw` (metadata para la sugerencia de RF-38).
 *
 * Fuera del respaldo, a propósito: `module.files`/`manifest`/`permissions` (el código y los
 * permisos del paquete; se re-derivan al reinstalar y el respaldo no lleva secretos) y
 * `series.title_norm` (se recalcula al importar).
 */
import type { MediaKind, SeriesStatus } from "../contract/types.js";
import type { ReaderMode } from "../library/SeriesPrefs.js";
import type { ValidationResult } from "../validation.js";

/** Identificador del formato (SPEC §8.3). */
export const BACKUP_FORMAT = "ryuunest-backup";

/** Versión del formato (SPEC §8.3). */
export const BACKUP_VERSION = 1;

/**
 * Tamaño máximo, en bytes UTF-8, del texto de un respaldo al importarlo (SPEC §7.2: «límites
 * de tamaño»). Lo fijó el humano en T29 (50 MB): se comprueba antes de parsear.
 */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

/** Repositorio registrado en el respaldo. */
export interface BackupRepo {
  url: string;
  name: string;
  addedAt: number;
  updatedAt: number;
}

/**
 * Módulo en el respaldo: solo lo necesario para **sugerirlo** al importar (RF-38), sin su
 * código, manifest ni permisos.
 */
export interface BackupModule {
  id: string;
  version: string;
  repoUrl: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
}

/** Carpeta de la biblioteca. */
export interface BackupFolder {
  id: number;
  name: string;
  sort: number;
  updatedAt: number;
}

/** Serie guardada en la biblioteca. */
export interface BackupSeries {
  moduleId: string;
  seriesId: string;
  title: string;
  coverUrl: string | null;
  kind: MediaKind | null;
  nsfw: boolean;
  status: SeriesStatus | null;
  updatedAt: number;
}

/** Favorito de la biblioteca. */
export interface BackupFavorite {
  moduleId: string;
  seriesId: string;
  folderId: number | null;
  addedAt: number;
  updatedAt: number;
}

/** Progreso de lectura de una serie (SPEC §8.3: incluye `pageTotal`). */
export interface BackupProgress {
  moduleId: string;
  seriesId: string;
  chapterId: string;
  releaseId: string | null;
  chapterTitle: string | null;
  pageIndex: number;
  pageTotal: number | null;
  updatedAt: number;
}

/** Capítulo leído. */
export interface BackupRead {
  moduleId: string;
  seriesId: string;
  chapterId: string;
  readAt: number;
}

/** Preferencia por serie (modo de lectura y release preferida). */
export interface BackupPref {
  moduleId: string;
  seriesId: string;
  readerMode: ReaderMode | null;
  preferredGroup: string | null;
  updatedAt: number;
}

/** El respaldo completo, en el orden de SPEC §8.3. */
export interface Backup {
  format: "ryuunest-backup";
  version: 1;
  createdAt: number;
  repos: BackupRepo[];
  modules: BackupModule[];
  folders: BackupFolder[];
  series: BackupSeries[];
  favorites: BackupFavorite[];
  progress: BackupProgress[];
  read: BackupRead[];
  prefs: BackupPref[];
  /** Ajustes tal cual viven en la tabla `setting` (clave-valor); hoy vacía (F20). */
  settings: Record<string, string>;
}

/**
 * Valida un valor desconocido (el JSON ya parseado) contra el formato del respaldo, de forma
 * estricta: tipos, enumeraciones, URLs HTTPS de repos, claves duplicadas y carpetas
 * referenciadas por los favoritos. Cada problema lleva su ruta (`progress[0].pageIndex`).
 */
export function validateBackup(_value: unknown): ValidationResult<Backup> {
  throw new Error("T29b: validateBackup sin implementar");
}
