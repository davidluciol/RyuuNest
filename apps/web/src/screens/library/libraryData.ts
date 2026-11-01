import {
  Folders,
  browseLibrary,
  type LibraryEntry,
  type SqlDriver,
} from "@ryuunest/core";

/**
 * F25 — Biblioteca e Inicio web sobre la base real (sql.js + IndexedDB), sin
 * datos de ejemplo: `browseLibrary` (cursor keyset) para los favoritos y
 * `Folders` para las carpetas. La pantalla filtra NSFW (RF-35) y ordena.
 */

export interface LibraryWebData {
  entries: LibraryEntry[];
  folders: { id: string; name: string; count: number }[];
}

const PAGE_SIZE = 500;

export async function loadLibraryWeb(driver: SqlDriver): Promise<LibraryWebData> {
  const entries: LibraryEntry[] = [];
  let cursor: string | undefined;
  do {
    // NSFW incluido: la pantalla lo oculta si el ajuste está apagado (RF-35).
    const page = await browseLibrary(driver, {
      limit: PAGE_SIZE,
      cursor,
      nsfwVisible: true,
      order: "name",
    });
    entries.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor !== undefined);

  const folders = await new Folders({ driver, clock: { now: () => Date.now() } }).list();
  return {
    entries,
    folders: folders.map((folder) => ({
      id: String(folder.id),
      name: folder.name,
      count: entries.filter((e) => e.folderId !== null && String(e.folderId) === String(folder.id))
        .length,
    })),
  };
}

export interface HomeWebData {
  /** «Continuar la Aventura»: series con progreso, por último leído (máx. 4, V6). */
  continueReading: LibraryEntry[];
  /** «Lecturas Recientes»: favoritos recientes (V6). */
  recent: LibraryEntry[];
  folders: LibraryWebData["folders"];
  isEmpty: boolean;
}

export async function loadHomeWeb(driver: SqlDriver): Promise<HomeWebData> {
  const reading = await browseLibrary(driver, {
    limit: 4,
    reading: true,
    nsfwVisible: true,
    order: "lastRead",
  });
  const recentPage = await browseLibrary(driver, {
    limit: 8,
    nsfwVisible: true,
    order: "lastRead",
  });
  const { folders } = await loadLibraryWeb(driver);
  const all = await browseLibrary(driver, { limit: PAGE_SIZE, nsfwVisible: true, order: "name" });
  return {
    continueReading: reading.items,
    recent: recentPage.items,
    folders,
    isEmpty: all.items.length === 0,
  };
}
