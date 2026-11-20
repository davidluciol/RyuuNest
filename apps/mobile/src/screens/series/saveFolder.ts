import {
  Favorites,
  FolderNameError,
  Folders,
  listLibraryTags,
  SeriesStore,
  type SeriesDetails,
  type SqlDriver,
} from "@ryuunest/core";

import { t } from "../../i18n";
import type { FolderNameProblem } from "../library/libraryFixtures";

/**
 * F96 — datos de la hoja «Guardar» de la ficha. «Gemas» es una vista (sin fila): guardar ahí es
 * dejar la serie sin carpeta (`id` `"gems"`). Una serie vive en una sola carpeta (D-12).
 */

export const GEMS_OPTION_ID = "gems";

const clock = { now: () => Date.now() };

export interface SaveFolderOption {
  id: string;
  name: string;
}

export interface SaveFolderState {
  options: SaveFolderOption[];
  /** Carpeta actual; sin guardar (o en Gemas) es `"gems"`, que es donde se guardaría por defecto. */
  currentId: string;
  saved: boolean;
  /** Id de «Favoritos» (el corazón de la ficha está lleno si la serie está ahí). */
  favoritesId: string | null;
  /** Etiquetas disponibles para «Nueva carpeta». */
  tags: string[];
}

export async function loadSaveOptions(
  driver: SqlDriver,
  moduleId: string,
  seriesId: string,
): Promise<SaveFolderState> {
  const [folders, favorite, tags] = await Promise.all([
    new Folders({ driver, clock }).list(),
    new Favorites({ driver, clock }).get(moduleId, seriesId),
    listLibraryTags(driver),
  ]);
  const options: SaveFolderOption[] = [
    { id: GEMS_OPTION_ID, name: t("library.folder.gems") },
    ...folders.map((f) => ({
      id: String(f.id),
      name: f.system === "favorites" ? t("library.folder.favorites") : f.name,
    })),
  ];
  const folderId = favorite?.folderId ?? null;
  return {
    options,
    currentId: folderId === null ? GEMS_OPTION_ID : String(folderId),
    saved: favorite !== undefined,
    favoritesId: String(folders.find((f) => f.system === "favorites")?.id ?? "") || null,
    tags,
  };
}

/** Guarda la serie en la carpeta (o la mueve si ya estaba guardada). */
export async function saveInFolder(
  driver: SqlDriver,
  moduleId: string,
  seriesId: string,
  details: SeriesDetails,
  optionId: string,
): Promise<void> {
  await new SeriesStore({ driver, clock }).saveFromDetails(moduleId, { ...details, id: seriesId });
  await new Favorites({ driver, clock }).add(
    moduleId,
    seriesId,
    optionId === GEMS_OPTION_ID ? null : Number(optionId),
  );
}

/** Crea la carpeta y guarda la serie en ella; con un nombre rechazado no guarda nada. */
export async function createAndSave(
  driver: SqlDriver,
  moduleId: string,
  seriesId: string,
  details: SeriesDetails,
  name: string,
  tags: string[],
): Promise<FolderNameProblem | null> {
  const folders = new Folders({ driver, clock });
  try {
    const sort = Math.max(0, ...(await folders.list()).map((f) => f.sort)) + 1;
    const id = await folders.create(name, sort, tags);
    await saveInFolder(driver, moduleId, seriesId, details, String(id));
  } catch (error) {
    if (error instanceof FolderNameError) return error.reason;
    throw error;
  }
  return null;
}
