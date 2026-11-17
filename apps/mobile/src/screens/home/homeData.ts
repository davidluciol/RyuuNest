import { Folders, listLastRead, type LastReadEntry, type SqlDriver } from "@ryuunest/core";

import { t } from "../../i18n";

import type { HomeData, HomeFolder, HomeProgress } from "./homeFixtures";

/**
 * F46 — conexión de Inicio con el núcleo: «Continuar» y recientes salen del progreso
 * guardado (`browseLibrary` ordenado por último leído, T23) y las carpetas de `Folders`
 * (T22). Mismo patrón que `libraryData.ts` (Tesoros).
 */

/** Lecturas recientes en el carrusel (HomeData.recent). */
const RECENT_LIMIT = 6;
/** F82 — «Ver todas» de Lecturas recientes: como máximo 9 series. */
export const RECENT_LIST_LIMIT = 9;
/** «Tesoros guardados»: solo las 3 carpetas con más series (F81). */
const FOLDER_LIMIT = 3;

export interface LoadHomeOptions {
  /** Con `true` se ven también las series NSFW (RF-35: por defecto no). */
  nsfwVisible?: boolean;
}

/** Datos de la pantalla: de la base del dispositivo si la hay; si no (web), la reserva. */
export async function resolveHomeData(
  open: () => Promise<SqlDriver | null>,
  fallback: HomeData,
  options: LoadHomeOptions = {},
): Promise<HomeData> {
  const driver = await open();
  return driver === null ? fallback : loadHomeData(driver, options);
}

export async function loadHomeData(
  driver: SqlDriver,
  options: LoadHomeOptions = {},
): Promise<HomeData> {
  const nsfwVisible = options.nsfwVisible === true;
  const recent = (await listLastRead(driver, { limit: RECENT_LIMIT, nsfwVisible })).map(toProgress);

  return {
    continueReading: recent[0] ?? null,
    recent,
    folders: await loadFolders(driver, nsfwVisible),
  };
}

/** F82 — historial completo de «Ver todas» (una entrada por serie, la más reciente primero). */
export async function loadRecentList(
  driver: SqlDriver,
  options: LoadHomeOptions = {},
): Promise<HomeProgress[]> {
  const entries = await listLastRead(driver, {
    limit: RECENT_LIST_LIMIT,
    nsfwVisible: options.nsfwVisible === true,
  });
  return entries.map(toProgress);
}

async function loadFolders(driver: SqlDriver, nsfwVisible: boolean): Promise<HomeFolder[]> {
  // Más series primero; empate → la que recibió una serie más recientemente. Las vacías no salen.
  const rows = await driver.all<{ folder_id: number; n: number }>(
    `SELECT f.folder_id AS folder_id, COUNT(*) AS n
       FROM favorite f JOIN series s ON s.module_id = f.module_id AND s.series_id = f.series_id
      WHERE f.folder_id IS NOT NULL AND (? = 1 OR s.nsfw = 0)
      GROUP BY f.folder_id
      ORDER BY n DESC, MAX(f.added_at) DESC, f.folder_id
      LIMIT ?`,
    [nsfwVisible ? 1 : 0, FOLDER_LIMIT],
  );
  const folders = new Folders({ driver, clock: { now: () => Date.now() } });
  const names = new Map((await folders.list()).map((folder) => [folder.id, folder.name]));
  return rows.flatMap((row) => {
    const name = names.get(row.folder_id);
    return name === undefined ? [] : [{ id: String(row.folder_id), name, count: row.n }];
  });
}

function toProgress(entry: LastReadEntry): HomeProgress {
  // Sin título de capítulo no se muestra su id (suele ser una ruta del módulo).
  const label = entry.chapterTitle ?? t("home.chapter.saved");
  return {
    moduleId: entry.moduleId,
    seriesId: entry.seriesId,
    chapterId: entry.chapterId,
    title: entry.title,
    kind: entry.kind,
    chapterLabel: label,
    chapterNumber: chapterNumberOf(label),
    pageIndex: entry.pageIndex,
    pageTotal: entry.pageTotal ?? 0,
    // El nombre visible del módulo vive en su registro; hasta conectarlo, su id (como Tesoros).
    meta: `${entry.moduleId} · ${t(`series.status.${entry.status ?? "unknown"}`)}`,
  };
}

/** Primer número del título del capítulo («Capítulo 41» → 41); 0 si no hay. */
function chapterNumberOf(label: string): number {
  const match = /\d+(?:\.\d+)?/.exec(label);
  return match === null ? 0 : Number(match[0]);
}
