import { Folders, browseLibrary, type LibraryEntry, type SqlDriver } from "@ryuunest/core";

import { t } from "../../i18n";
import {
  GEMS_FOLDER_ID,
  type LibraryData,
  type LibraryFolder,
  type LibrarySeries,
  type LibrarySource,
} from "./libraryFixtures";

/**
 * F14c — conexión de la pantalla Biblioteca con el núcleo: lee los favoritos con
 * `browseLibrary` (T23) y las carpetas con `Folders` (T22) y los adapta a
 * `LibraryData`. La pantalla filtra y ordena en memoria sobre este conjunto.
 */

/**
 * Entradas por página al recorrer el cursor. Provisional: lo decide la pantalla
 * (el núcleo no pone número por defecto, P-56) y se ajustará con las mediciones de AC-4.
 */
export const LIBRARY_PAGE_SIZE = 500;

export interface LoadLibraryOptions {
  /** Entradas por página del cursor; por defecto `LIBRARY_PAGE_SIZE`. */
  pageSize?: number;
}

/**
 * Datos de la pantalla: de la base del dispositivo si la plataforma la tiene; si no
 * (web, donde Playwright verifica la pantalla), los datos de reserva.
 */
export async function resolveLibraryData(
  open: () => Promise<SqlDriver | null>,
  fallback: LibraryData,
): Promise<LibraryData> {
  const driver = await open();
  return driver === null ? fallback : loadLibraryData(driver);
}

export async function loadLibraryData(
  driver: SqlDriver,
  options: LoadLibraryOptions = {},
): Promise<LibraryData> {
  const entries = await loadAllEntries(driver, options.pageSize ?? LIBRARY_PAGE_SIZE);
  const series = entries.map(toSeries);
  const folders = await loadFolders(driver, series);

  return { series, folders, sources: sourcesOf(series) };
}

/** Recorre el cursor hasta agotarlo; incluye NSFW (la pantalla lo oculta, RF-35). */
async function loadAllEntries(driver: SqlDriver, limit: number): Promise<LibraryEntry[]> {
  const entries: LibraryEntry[] = [];
  let cursor: string | undefined;
  do {
    const page = await browseLibrary(driver, { limit, cursor, nsfwVisible: true, order: "name" });
    entries.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor !== undefined);
  return entries;
}

async function loadFolders(
  driver: SqlDriver,
  series: readonly LibrarySeries[],
): Promise<LibraryFolder[]> {
  const folders = new Folders({ driver, clock: { now: () => Date.now() } });
  const real = (await folders.list()).map((folder): LibraryFolder => {
    const id = String(folder.id);
    const count = series.filter((s) => s.folderId === id).length;
    return folder.system === "favorites"
      ? { id, name: t("library.folder.favorites"), count, kind: "favorites" }
      : { id, name: folder.name, count };
  });
  // «Gemas» (F52) no tiene fila: es la vista de todas las series y va siempre primera.
  return [
    { id: GEMS_FOLDER_ID, name: t("library.folder.gems"), count: series.length, kind: "gems" },
    ...real,
  ];
}

/** El nombre visible del módulo vive en su registro; hasta conectarlo, se muestra su id. */
function sourcesOf(series: readonly LibrarySeries[]): LibrarySource[] {
  const ids = [...new Set(series.map((s) => s.moduleId))].sort();
  return ids.map((id) => ({ id, name: id }));
}

function toSeries(entry: LibraryEntry): LibrarySeries {
  return {
    seriesId: entry.seriesId,
    moduleId: entry.moduleId,
    title: entry.title,
    kind: entry.kind,
    nsfw: entry.nsfw,
    status: entry.status ?? "unknown",
    folderId: entry.folderId === null ? null : String(entry.folderId),
    addedAt: entry.addedAt,
    lastReadAt: entry.progress?.updatedAt ?? entry.addedAt,
    progress:
      entry.progress === null
        ? null
        : {
            chapterId: entry.progress.chapterId,
            chapterTitle: entry.progress.chapterTitle ?? entry.progress.chapterId,
            pageIndex: entry.progress.pageIndex,
            pageTotal: entry.progress.pageTotal ?? 0,
          },
  };
}
