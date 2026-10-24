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
import type { ValidationIssue, ValidationResult } from "../validation.js";

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


const MEDIA_KINDS: readonly MediaKind[] = ["manga", "manhua", "manhwa", "comic"];
const SERIES_STATUSES: readonly SeriesStatus[] = [
  "ongoing",
  "completed",
  "hiatus",
  "cancelled",
  "unknown",
];
const READER_MODES: readonly ReaderMode[] = ["vertical", "paged-ltr", "paged-rtl"];
const RUNTIMES: readonly BackupModule["runtime"][] = ["declarative", "script"];

type Row = Record<string, unknown>;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function esHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Lector de campos de una fila: cada método comprueba el tipo, anota el problema con su
 * ruta (`progress[0].pageIndex`) y devuelve un valor neutro para que la lectura siga y se
 * reporten todos los problemas de una vez.
 */
class RowReader {
  constructor(
    private readonly row: Row,
    private readonly path: string,
    private readonly issues: ValidationIssue[],
  ) {}

  private fail(key: string, message: string): void {
    this.issues.push({ path: this.path === "" ? key : `${this.path}.${key}`, message });
  }

  text(key: string, options: { nonEmpty?: boolean } = {}): string {
    const value = this.row[key];
    if (typeof value !== "string") {
      this.fail(key, "debe ser texto");
      return "";
    }
    if (options.nonEmpty === true && value.trim() === "") {
      this.fail(key, "no puede estar vacío");
    }
    return value;
  }

  textOrNull(key: string): string | null {
    const value = this.row[key];
    if (value === null) {
      return null;
    }
    if (typeof value !== "string") {
      this.fail(key, "debe ser texto o null");
      return null;
    }
    return value;
  }

  integer(key: string, minimum = 0): number {
    const value = this.row[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
      this.fail(key, `debe ser un entero mayor o igual que ${minimum}`);
      return minimum;
    }
    return value;
  }

  integerOrNull(key: string, minimum = 0): number | null {
    return this.row[key] === null ? null : this.integer(key, minimum);
  }

  boolean(key: string): boolean {
    const value = this.row[key];
    if (typeof value !== "boolean") {
      this.fail(key, "debe ser verdadero o falso");
      return false;
    }
    return value;
  }

  oneOf<T extends string>(key: string, allowed: readonly T[]): T {
    const value = this.row[key];
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      this.fail(key, `debe ser uno de: ${allowed.join(", ")}`);
      return allowed[0] as T;
    }
    return value as T;
  }

  oneOfOrNull<T extends string>(key: string, allowed: readonly T[]): T | null {
    return this.row[key] === null ? null : this.oneOf(key, allowed);
  }

  httpsUrl(key: string): string {
    const value = this.text(key, { nonEmpty: true });
    if (value !== "" && !esHttps(value)) {
      this.fail(key, "debe ser una URL HTTPS");
    }
    return value;
  }

  kinds(key: string): MediaKind[] {
    const value = this.row[key];
    if (!Array.isArray(value)) {
      this.fail(key, "debe ser una lista");
      return [];
    }
    return value.map((item: unknown, index) => {
      if (typeof item !== "string" || !MEDIA_KINDS.includes(item as MediaKind)) {
        this.fail(`${key}[${index}]`, `debe ser uno de: ${MEDIA_KINDS.join(", ")}`);
        return MEDIA_KINDS[0] as MediaKind;
      }
      return item as MediaKind;
    });
  }
}

function claveSerie(row: { moduleId: string; seriesId: string }): string {
  return `${row.moduleId}\u0000${row.seriesId}`;
}

function readSettings(raw: unknown, issues: ValidationIssue[]): Record<string, string> {
  if (!isRecord(raw)) {
    issues.push({ path: "settings", message: "debe ser un objeto" });
    return {};
  }
  const entries: [string, string][] = [];
  for (const [key, item] of Object.entries(raw)) {
    if (typeof item === "string") {
      entries.push([key, item]);
    } else {
      issues.push({ path: `settings.${key}`, message: "debe ser texto" });
    }
  }
  // `fromEntries` define propiedades propias: una clave `__proto__` no toca el prototipo.
  return Object.fromEntries(entries);
}

/**
 * Valida un valor desconocido (el JSON ya parseado) contra el formato del respaldo, de forma
 * estricta: tipos, enumeraciones, URLs HTTPS de repos, claves duplicadas y carpetas
 * referenciadas por los favoritos. Cada problema lleva su ruta (`progress[0].pageIndex`).
 * Devuelve una copia **solo con los campos conocidos**: lo que sobra en el JSON se descarta.
 */
export function validateBackup(value: unknown): ValidationResult<Backup> {
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: "", message: "el respaldo debe ser un objeto" }] };
  }

  const root = value;
  const issues: ValidationIssue[] = [];

  if (value["format"] !== BACKUP_FORMAT) {
    issues.push({ path: "format", message: `debe ser "${BACKUP_FORMAT}"` });
  }
  if (value["version"] !== BACKUP_VERSION) {
    issues.push({
      path: "version",
      message: `versión no compatible (esta app lee la versión ${BACKUP_VERSION})`,
    });
  }
  const createdAt = new RowReader(value, "", issues).integer("createdAt");

  /** Lee una sección: valida cada fila y avisa de las claves repetidas. */
  function section<T>(
    name: string,
    keyOf: (row: T) => string,
    readRow: (reader: RowReader) => T,
    duplicatePath: (index: number) => string = (index) => `${name}[${index}]`,
  ): T[] {
    const raw = root[name];
    if (!Array.isArray(raw)) {
      issues.push({ path: name, message: "debe ser una lista" });
      return [];
    }
    const seen = new Set<string>();
    const rows: T[] = [];
    raw.forEach((item: unknown, index: number) => {
      const path = `${name}[${index}]`;
      if (!isRecord(item)) {
        issues.push({ path, message: "debe ser un objeto" });
        return;
      }
      const row = readRow(new RowReader(item, path, issues));
      const key = keyOf(row);
      if (seen.has(key)) {
        issues.push({ path: duplicatePath(index), message: "clave repetida en el respaldo" });
      }
      seen.add(key);
      rows.push(row);
    });
    return rows;
  }

  const repos = section<BackupRepo>(
    "repos",
    (row) => row.url,
    (r) => ({
      url: r.httpsUrl("url"),
      name: r.text("name"),
      addedAt: r.integer("addedAt"),
      updatedAt: r.integer("updatedAt"),
    }),
    (index) => `repos[${index}].url`,
  );

  const modules = section<BackupModule>(
    "modules",
    (row) => row.id,
    (r) => ({
      id: r.text("id", { nonEmpty: true }),
      version: r.text("version", { nonEmpty: true }),
      repoUrl: r.httpsUrl("repoUrl"),
      runtime: r.oneOf("runtime", RUNTIMES),
      kinds: r.kinds("kinds"),
      lang: r.text("lang"),
      nsfw: r.boolean("nsfw"),
    }),
    (index) => `modules[${index}].id`,
  );

  const folders = section<BackupFolder>(
    "folders",
    (row) => String(row.id),
    (r) => ({
      id: r.integer("id", 1),
      name: r.text("name", { nonEmpty: true }),
      sort: r.integer("sort"),
      updatedAt: r.integer("updatedAt"),
    }),
    (index) => `folders[${index}].id`,
  );

  const series = section<BackupSeries>("series", claveSerie, (r) => ({
    moduleId: r.text("moduleId", { nonEmpty: true }),
    seriesId: r.text("seriesId", { nonEmpty: true }),
    title: r.text("title", { nonEmpty: true }),
    coverUrl: r.textOrNull("coverUrl"),
    kind: r.oneOfOrNull("kind", MEDIA_KINDS),
    nsfw: r.boolean("nsfw"),
    status: r.oneOfOrNull("status", SERIES_STATUSES),
    updatedAt: r.integer("updatedAt"),
  }));

  const favorites = section<BackupFavorite>("favorites", claveSerie, (r) => ({
    moduleId: r.text("moduleId", { nonEmpty: true }),
    seriesId: r.text("seriesId", { nonEmpty: true }),
    folderId: r.integerOrNull("folderId", 1),
    addedAt: r.integer("addedAt"),
    updatedAt: r.integer("updatedAt"),
  }));
  const folderIds = new Set(folders.map((folder) => folder.id));
  favorites.forEach((favorite, index) => {
    if (favorite.folderId !== null && !folderIds.has(favorite.folderId)) {
      issues.push({
        path: `favorites[${index}].folderId`,
        message: `la carpeta ${favorite.folderId} no está en el respaldo`,
      });
    }
  });

  const progress = section<BackupProgress>("progress", claveSerie, (r) => ({
    moduleId: r.text("moduleId", { nonEmpty: true }),
    seriesId: r.text("seriesId", { nonEmpty: true }),
    chapterId: r.text("chapterId", { nonEmpty: true }),
    releaseId: r.textOrNull("releaseId"),
    chapterTitle: r.textOrNull("chapterTitle"),
    pageIndex: r.integer("pageIndex"),
    pageTotal: r.integerOrNull("pageTotal"),
    updatedAt: r.integer("updatedAt"),
  }));

  const read = section<BackupRead>(
    "read",
    (row) => `${claveSerie(row)}\u0000${row.chapterId}`,
    (r) => ({
      moduleId: r.text("moduleId", { nonEmpty: true }),
      seriesId: r.text("seriesId", { nonEmpty: true }),
      chapterId: r.text("chapterId", { nonEmpty: true }),
      readAt: r.integer("readAt"),
    }),
  );

  const prefs = section<BackupPref>("prefs", claveSerie, (r) => ({
    moduleId: r.text("moduleId", { nonEmpty: true }),
    seriesId: r.text("seriesId", { nonEmpty: true }),
    readerMode: r.oneOfOrNull("readerMode", READER_MODES),
    preferredGroup: r.textOrNull("preferredGroup"),
    updatedAt: r.integer("updatedAt"),
  }));

  const settings = readSettings(value["settings"], issues);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt,
      repos,
      modules,
      folders,
      series,
      favorites,
      progress,
      read,
      prefs,
      settings,
    },
  };
}

/** Bytes que ocupa el texto en UTF-8; corta en cuanto supera `limite`. */
export function utf8ByteLength(texto: string, limite = Infinity): number {
  let bytes = 0;
  for (let i = 0; i < texto.length && bytes <= limite; i += 1) {
    const code = texto.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < texto.length) {
      const next = texto.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
