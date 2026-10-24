/**
 * Importación del respaldo JSON (SPEC §8.3, RF-38) — T29.
 *
 * Valida el texto (tamaño, JSON y esquema) **antes** de tocar nada y después aplica el respaldo
 * a las tablas de usuario en **una sola transacción**: o entra todo o no entra nada. Dos modos:
 *
 * - `merge`: fusiona por `updated_at` (gana el más reciente; si empatan, se conserva lo
 *   local). Las carpetas se emparejan **por nombre** sin distinguir mayúsculas, porque sus
 *   `id` son locales a cada dispositivo. `read` se une (se conserva el `readAt` más reciente)
 *   y en `settings` **gana lo local**: solo se añaden las claves que faltan. No borra nada.
 * - `replace`: vacía las tablas de usuario y restaura exactamente el respaldo.
 *
 * Los repos y módulos del respaldo **no se instalan ni se registran**: se devuelven como
 * sugerencias para que el usuario las confirme una por una (RF-38, AC-8).
 */
import { normalizeTitle } from "../library/SeriesStore.js";
import { toSqlBoolean, withTransaction, type SqlDriver } from "../storage/SqlDriver.js";
import { describeIssues, type ValidationIssue } from "../validation.js";
import {
  MAX_BACKUP_BYTES,
  utf8ByteLength,
  validateBackup,
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

/** Cómo se aplica el respaldo. */
export type ImportMode = "merge" | "replace";

/** Secciones de usuario que modifica la importación. */
export type ImportSection =
  | "folders"
  | "series"
  | "favorites"
  | "progress"
  | "read"
  | "prefs"
  | "settings";

/**
 * Qué pasó con las filas de una sección. En `replace` todas cuentan como `added`; en `merge`,
 * `kept` son las filas del respaldo que no ganaron (iguales, más viejas o empatadas).
 */
export interface SectionCounts {
  added: number;
  updated: number;
  kept: number;
}

/** Resumen de una importación aplicada. */
export interface ImportSummary {
  mode: ImportMode;
  counts: Record<ImportSection, SectionCounts>;
}

/** Repos y módulos del respaldo, solo para sugerirlos (RF-38). Nada de esto se instala. */
export interface ImportSuggestions {
  repos: BackupRepo[];
  modules: BackupModule[];
}

/** Por qué se rechazó un respaldo. */
export type ImportRejection = "TOO_LARGE" | "NOT_JSON" | "INVALID";

/** Resultado de importar: aplicado, o rechazado **sin haber tocado ningún dato**. */
export type ImportResult =
  | { ok: true; summary: ImportSummary; suggestions: ImportSuggestions }
  | { ok: false; reason: ImportRejection; message: string; issues: ValidationIssue[] };

/** Opciones de la importación. */
export interface ImportBackupOptions {
  driver: SqlDriver;
  mode: ImportMode;
}

type Counts = Record<ImportSection, SectionCounts>;

/**
 * Importa el texto de un respaldo. Un respaldo rechazado devuelve `{ ok: false }`; un fallo
 * al escribir (del driver) se propaga tras revertir la transacción.
 */
export async function importBackup(
  options: ImportBackupOptions,
  text: string,
): Promise<ImportResult> {
  if (utf8ByteLength(text, MAX_BACKUP_BYTES) > MAX_BACKUP_BYTES) {
    return rechazo("TOO_LARGE", "El respaldo supera el tamaño máximo permitido", []);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return rechazo("NOT_JSON", "El archivo no es un JSON válido", []);
  }

  const validation = validateBackup(value);
  if (!validation.ok) {
    return rechazo(
      "INVALID",
      `El respaldo no es válido: ${describeIssues(validation.issues)}`,
      validation.issues,
    );
  }

  const backup = validation.value;
  const counts = emptyCounts();
  await withTransaction(options.driver, () =>
    options.mode === "replace"
      ? reemplazar(options.driver, backup, counts)
      : fusionar(options.driver, backup, counts),
  );

  return {
    ok: true,
    summary: { mode: options.mode, counts },
    suggestions: { repos: backup.repos, modules: backup.modules },
  };
}

function rechazo(
  reason: ImportRejection,
  message: string,
  issues: ValidationIssue[],
): Extract<ImportResult, { ok: false }> {
  return { ok: false, reason, message, issues };
}

function emptyCounts(): Counts {
  const vacio = (): SectionCounts => ({ added: 0, updated: 0, kept: 0 });
  return {
    folders: vacio(),
    series: vacio(),
    favorites: vacio(),
    progress: vacio(),
    read: vacio(),
    prefs: vacio(),
    settings: vacio(),
  };
}

// --- Escrituras compartidas por los dos modos --------------------------------------------

async function insertarSerie(driver: SqlDriver, row: BackupSeries): Promise<void> {
  await driver.run(
    `INSERT INTO series (module_id, series_id, title, title_norm, cover_url, kind, nsfw, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.moduleId,
      row.seriesId,
      row.title,
      normalizeTitle(row.title),
      row.coverUrl,
      row.kind,
      toSqlBoolean(row.nsfw),
      row.status,
      row.updatedAt,
    ],
  );
}

async function actualizarSerie(driver: SqlDriver, row: BackupSeries): Promise<void> {
  await driver.run(
    `UPDATE series SET title = ?, title_norm = ?, cover_url = ?, kind = ?, nsfw = ?, status = ?,
       updated_at = ? WHERE module_id = ? AND series_id = ?`,
    [
      row.title,
      normalizeTitle(row.title),
      row.coverUrl,
      row.kind,
      toSqlBoolean(row.nsfw),
      row.status,
      row.updatedAt,
      row.moduleId,
      row.seriesId,
    ],
  );
}

async function insertarFavorito(
  driver: SqlDriver,
  row: BackupFavorite,
  folderId: number | null,
): Promise<void> {
  await driver.run(
    `INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [row.moduleId, row.seriesId, folderId, row.addedAt, row.updatedAt],
  );
}

async function actualizarFavorito(
  driver: SqlDriver,
  row: BackupFavorite,
  folderId: number | null,
): Promise<void> {
  await driver.run(
    `UPDATE favorite SET folder_id = ?, added_at = MIN(added_at, ?), updated_at = ?
     WHERE module_id = ? AND series_id = ?`,
    [folderId, row.addedAt, row.updatedAt, row.moduleId, row.seriesId],
  );
}

async function insertarProgreso(driver: SqlDriver, row: BackupProgress): Promise<void> {
  await driver.run(
    `INSERT INTO progress (module_id, series_id, chapter_id, release_id, chapter_title, page_index, page_total, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.moduleId,
      row.seriesId,
      row.chapterId,
      row.releaseId,
      row.chapterTitle,
      row.pageIndex,
      row.pageTotal,
      row.updatedAt,
    ],
  );
}

async function actualizarProgreso(driver: SqlDriver, row: BackupProgress): Promise<void> {
  await driver.run(
    `UPDATE progress SET chapter_id = ?, release_id = ?, chapter_title = ?, page_index = ?,
       page_total = ?, updated_at = ? WHERE module_id = ? AND series_id = ?`,
    [
      row.chapterId,
      row.releaseId,
      row.chapterTitle,
      row.pageIndex,
      row.pageTotal,
      row.updatedAt,
      row.moduleId,
      row.seriesId,
    ],
  );
}

async function insertarLeido(driver: SqlDriver, row: BackupRead): Promise<void> {
  await driver.run(
    "INSERT INTO chapter_read (module_id, series_id, chapter_id, read_at) VALUES (?, ?, ?, ?)",
    [row.moduleId, row.seriesId, row.chapterId, row.readAt],
  );
}

async function actualizarLeido(driver: SqlDriver, row: BackupRead): Promise<void> {
  await driver.run(
    "UPDATE chapter_read SET read_at = ? WHERE module_id = ? AND series_id = ? AND chapter_id = ?",
    [row.readAt, row.moduleId, row.seriesId, row.chapterId],
  );
}

async function insertarPref(driver: SqlDriver, row: BackupPref): Promise<void> {
  await driver.run(
    `INSERT INTO series_pref (module_id, series_id, reader_mode, preferred_group, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [row.moduleId, row.seriesId, row.readerMode, row.preferredGroup, row.updatedAt],
  );
}

async function actualizarPref(driver: SqlDriver, row: BackupPref): Promise<void> {
  await driver.run(
    `UPDATE series_pref SET reader_mode = ?, preferred_group = ?, updated_at = ?
     WHERE module_id = ? AND series_id = ?`,
    [row.readerMode, row.preferredGroup, row.updatedAt, row.moduleId, row.seriesId],
  );
}

async function insertarAjuste(driver: SqlDriver, key: string, value: string): Promise<void> {
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", [key, value]);
}

// --- Reemplazo ---------------------------------------------------------------------------

/** Vacía las tablas de usuario y restaura el respaldo tal cual, con los `id` de carpeta. */
async function reemplazar(driver: SqlDriver, backup: Backup, counts: Counts): Promise<void> {
  for (const tabla of [
    "chapter_read",
    "series_pref",
    "progress",
    "favorite",
    "folder",
    "series",
    "setting",
  ]) {
    await driver.run(`DELETE FROM ${tabla}`);
  }

  for (const folder of backup.folders) {
    await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (?, ?, ?, ?)", [
      folder.id,
      folder.name,
      folder.sort,
      folder.updatedAt,
    ]);
  }
  for (const row of backup.series) {
    await insertarSerie(driver, row);
  }
  for (const row of backup.favorites) {
    await insertarFavorito(driver, row, row.folderId);
  }
  for (const row of backup.progress) {
    await insertarProgreso(driver, row);
  }
  for (const row of backup.read) {
    await insertarLeido(driver, row);
  }
  for (const row of backup.prefs) {
    await insertarPref(driver, row);
  }
  for (const [key, value] of Object.entries(backup.settings)) {
    await insertarAjuste(driver, key, value);
  }

  counts.folders.added = backup.folders.length;
  counts.series.added = backup.series.length;
  counts.favorites.added = backup.favorites.length;
  counts.progress.added = backup.progress.length;
  counts.read.added = backup.read.length;
  counts.prefs.added = backup.prefs.length;
  counts.settings.added = Object.keys(backup.settings).length;
}

// --- Fusión ------------------------------------------------------------------------------

interface MergeByDate<T> {
  /** Fecha local de cada fila existente, por clave. */
  local: Map<string, number>;
  keyOf: (row: T) => string;
  dateOf: (row: T) => number;
  insert: (row: T) => Promise<void>;
  update: (row: T) => Promise<void>;
}

/** Inserta lo que falta y actualiza solo si el respaldo es **estrictamente** más reciente. */
async function mergeByDate<T>(
  rows: readonly T[],
  counts: SectionCounts,
  op: MergeByDate<T>,
): Promise<void> {
  for (const row of rows) {
    const key = op.keyOf(row);
    const localDate = op.local.get(key);
    if (localDate === undefined) {
      await op.insert(row);
      op.local.set(key, op.dateOf(row));
      counts.added += 1;
    } else if (op.dateOf(row) > localDate) {
      await op.update(row);
      op.local.set(key, op.dateOf(row));
      counts.updated += 1;
    } else {
      counts.kept += 1;
    }
  }
}

const claveSerie = (row: { moduleId: string; seriesId: string }): string =>
  `${row.moduleId}\u0000${row.seriesId}`;

/** Las carpetas se emparejan por nombre, sin distinguir mayúsculas ni espacios de los bordes. */
const claveCarpeta = (nombre: string): string => nombre.trim().toLowerCase();

interface FolderRow {
  id: number;
  name: string;
  sort: number;
  updated_at: number;
}

/** Fusiona carpetas por nombre y devuelve el mapa `id del respaldo → id local`. */
async function fusionarCarpetas(
  driver: SqlDriver,
  folders: readonly BackupFolder[],
  counts: SectionCounts,
): Promise<Map<number, number>> {
  const locales = new Map<string, FolderRow>();
  for (const fila of await driver.all<FolderRow>("SELECT id, name, sort, updated_at FROM folder")) {
    locales.set(claveCarpeta(fila.name), fila);
  }

  const idLocal = new Map<number, number>();
  for (const folder of folders) {
    const key = claveCarpeta(folder.name);
    const local = locales.get(key);
    if (local === undefined) {
      const { lastInsertRowid } = await driver.run(
        "INSERT INTO folder (name, sort, updated_at) VALUES (?, ?, ?)",
        [folder.name, folder.sort, folder.updatedAt],
      );
      locales.set(key, {
        id: lastInsertRowid,
        name: folder.name,
        sort: folder.sort,
        updated_at: folder.updatedAt,
      });
      idLocal.set(folder.id, lastInsertRowid);
      counts.added += 1;
    } else {
      idLocal.set(folder.id, local.id);
      if (folder.updatedAt > local.updated_at) {
        await driver.run("UPDATE folder SET name = ?, sort = ?, updated_at = ? WHERE id = ?", [
          folder.name,
          folder.sort,
          folder.updatedAt,
          local.id,
        ]);
        local.updated_at = folder.updatedAt;
        counts.updated += 1;
      } else {
        counts.kept += 1;
      }
    }
  }
  return idLocal;
}

interface DatedRow {
  module_id: string;
  series_id: string;
  updated_at: number;
}

interface ReadRow {
  module_id: string;
  series_id: string;
  chapter_id: string;
  read_at: number;
}

async function fechasLocales(driver: SqlDriver, tabla: string): Promise<Map<string, number>> {
  const filas = await driver.all<DatedRow>(`SELECT module_id, series_id, updated_at FROM ${tabla}`);
  return new Map(
    filas.map((fila) => [
      claveSerie({ moduleId: fila.module_id, seriesId: fila.series_id }),
      fila.updated_at,
    ]),
  );
}

/** Fusiona por `updated_at` (gana el más reciente; empate: lo local). No borra nada. */
async function fusionar(driver: SqlDriver, backup: Backup, counts: Counts): Promise<void> {
  const idLocal = await fusionarCarpetas(driver, backup.folders, counts.folders);

  await mergeByDate(backup.series, counts.series, {
    local: await fechasLocales(driver, "series"),
    keyOf: claveSerie,
    dateOf: (row) => row.updatedAt,
    insert: (row) => insertarSerie(driver, row),
    update: (row) => actualizarSerie(driver, row),
  });

  const carpetaLocal = (row: BackupFavorite): number | null =>
    row.folderId === null ? null : (idLocal.get(row.folderId) ?? null);
  await mergeByDate(backup.favorites, counts.favorites, {
    local: await fechasLocales(driver, "favorite"),
    keyOf: claveSerie,
    dateOf: (row) => row.updatedAt,
    insert: (row) => insertarFavorito(driver, row, carpetaLocal(row)),
    update: (row) => actualizarFavorito(driver, row, carpetaLocal(row)),
  });

  await mergeByDate(backup.progress, counts.progress, {
    local: await fechasLocales(driver, "progress"),
    keyOf: claveSerie,
    dateOf: (row) => row.updatedAt,
    insert: (row) => insertarProgreso(driver, row),
    update: (row) => actualizarProgreso(driver, row),
  });

  const claveLeido = (row: { moduleId: string; seriesId: string; chapterId: string }): string =>
    `${claveSerie(row)}\u0000${row.chapterId}`;
  const leidos = await driver.all<ReadRow>(
    "SELECT module_id, series_id, chapter_id, read_at FROM chapter_read",
  );
  await mergeByDate(backup.read, counts.read, {
    local: new Map(
      leidos.map((fila) => [
        claveLeido({
          moduleId: fila.module_id,
          seriesId: fila.series_id,
          chapterId: fila.chapter_id,
        }),
        fila.read_at,
      ]),
    ),
    keyOf: claveLeido,
    dateOf: (row) => row.readAt,
    insert: (row) => insertarLeido(driver, row),
    update: (row) => actualizarLeido(driver, row),
  });

  await mergeByDate(backup.prefs, counts.prefs, {
    local: await fechasLocales(driver, "series_pref"),
    keyOf: claveSerie,
    dateOf: (row) => row.updatedAt,
    insert: (row) => insertarPref(driver, row),
    update: (row) => actualizarPref(driver, row),
  });

  const ajustesLocales = new Set(
    (await driver.all<{ key: string }>("SELECT key FROM setting")).map((fila) => fila.key),
  );
  for (const [key, value] of Object.entries(backup.settings)) {
    if (ajustesLocales.has(key)) {
      counts.settings.kept += 1;
    } else {
      await insertarAjuste(driver, key, value);
      counts.settings.added += 1;
    }
  }
}
