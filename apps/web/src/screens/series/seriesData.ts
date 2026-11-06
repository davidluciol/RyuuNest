import {
  ChapterReadStore,
  Favorites,
  ProgressStore,
  SeriesPrefs,
  SeriesStore,
  type ModuleMounter,
  type SeriesDetails,
  type SqlDriver,
} from "@ryuunest/core";

/**
 * F25 — capa de datos de la ficha de serie en web (pura, sin React): une
 * `details()` del módulo montado (worker) con progreso, leídos, release
 * preferida y favorito sobre la base real (sql.js + IndexedDB). Sin datos de
 * ejemplo: si el módulo falla, el error contenido llega a la pantalla (RF-11).
 */

export interface SeriesProgressView {
  chapterId: string;
  pageIndex: number;
  pageTotal: number;
}

export interface WebSeriesData {
  details: SeriesDetails;
  moduleName: string;
  progress: SeriesProgressView | null;
  readChapterIds: ReadonlySet<string>;
  preferredReleaseId: string | null;
  favorite: boolean;
}

/** Servicios mínimos que la ficha necesita (los da `WebServices`). */
export interface SeriesServices {
  driver: SqlDriver;
  mounter: ModuleMounter;
}

export type ChapterStateView = "unread" | "in-progress" | "completed";

export function chapterStateOf(
  chapterId: string,
  data: Pick<WebSeriesData, "progress" | "readChapterIds">,
): ChapterStateView {
  if (data.readChapterIds.has(chapterId)) return "completed";
  if (data.progress?.chapterId === chapterId) return "in-progress";
  return "unread";
}

export async function loadSeries(
  services: SeriesServices,
  moduleId: string,
  seriesId: string,
): Promise<WebSeriesData> {
  const { driver, mounter } = services;
  const clock = { now: () => Date.now() };
  const { handle, manifest } = await mounter.mount(moduleId);
  const details = await handle.api.details(seriesId);

  const progress = new ProgressStore({ driver, clock });
  const chaptersRead = new ChapterReadStore({ driver, clock });
  const prefs = new SeriesPrefs({ driver, clock });
  const favorites = new Favorites({ driver, clock });

  const [saved, read, pref, favorite] = await Promise.all([
    progress.get(moduleId, seriesId),
    chaptersRead.readIn(moduleId, seriesId),
    prefs.get(moduleId, seriesId),
    favorites.get(moduleId, seriesId),
  ]);

  return {
    details,
    moduleName: manifest.name,
    progress:
      saved === undefined
        ? null
        : {
            chapterId: saved.chapterId,
            pageIndex: saved.pageIndex,
            pageTotal: saved.pageTotal ?? 0,
          },
    readChapterIds: read,
    preferredReleaseId: pref?.preferredGroup ?? null,
    favorite: favorite !== undefined,
  };
}

/**
 * Un toque: añade o quita de favoritos (persistente en la base web). Al añadir guarda antes la
 * serie en `series`: la biblioteca une `favorite` con `series` y sin esa fila el favorito no se
 * listaría (P-126).
 */
export async function toggleFavorite(
  services: SeriesServices,
  moduleId: string,
  seriesId: string,
  details: SeriesDetails,
): Promise<boolean> {
  const clock = { now: () => Date.now() };
  const favorites = new Favorites({ driver: services.driver, clock });
  const current = await favorites.get(moduleId, seriesId);
  if (current === undefined) {
    await new SeriesStore({ driver: services.driver, clock }).saveFromDetails(moduleId, { ...details, id: seriesId });
    await favorites.add(moduleId, seriesId, null);
    return true;
  }
  await favorites.remove(moduleId, seriesId);
  return false;
}

export async function setPreferredRelease(
  services: SeriesServices,
  moduleId: string,
  seriesId: string,
  releaseId: string | null,
): Promise<void> {
  await new SeriesPrefs({ driver: services.driver, clock: { now: () => Date.now() } }).setPreferredGroup(
    moduleId,
    seriesId,
    releaseId,
  );
}
