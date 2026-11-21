import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Favorites, FolderNameError, Folders, type SqlDriver } from "@ryuunest/core";

import { openAppDatabase } from "../../data/appDatabase";

import { resolveLibraryData } from "./libraryData";
import {
  SAMPLE_LIBRARY_DATA,
  addSampleFolder,
  moveSampleSeries,
  removeSampleFolder,
  removeSampleSeries,
  updateSampleFolder,
  type FolderNameProblem,
  type LibraryData,
} from "./libraryFixtures";
import type { LibraryFolderActions, LibrarySeriesActions } from "./LibraryScreen";

/** F14c — estado de carga de la pantalla Biblioteca. */
export type LibraryLoad =
  | { status: "loading" }
  | { status: "ready"; data: LibraryData }
  | { status: "error"; error: unknown };

export interface LibraryActions {
  reload: () => void;
  /**
   * F53 — crea una carpeta (con etiquetas = inteligente) y refresca los datos sin parpadeo.
   * Devuelve el problema del nombre (vacío o repetido) o `null` si se creó.
   */
  createFolder: (name: string, tags: string[]) => Promise<FolderNameProblem | null>;
  /** F54 — acciones del menú de cada serie (mover, favoritos, eliminar). */
  seriesActions: LibrarySeriesActions;
  /** F93 — editar y borrar carpetas desde «Gestionar». */
  folderActions: LibraryFolderActions;
}

/**
 * Carga la biblioteca del dispositivo al montar y cada vez que se pide `reload`.
 * En web (sin SQLite local) entrega los datos de ejemplo, y las carpetas nuevas viven solo en
 * memoria.
 */
export function useLibraryData(): LibraryLoad & LibraryActions {
  const [state, setState] = useState<LibraryLoad>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Las pestañas siguen montadas: al volver (p. ej. de la ficha, que guarda la portada) se
  // relee sin volver a «loading», así que no hay parpadeo.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      resolveLibraryData(openAppDatabase, SAMPLE_LIBRARY_DATA).then(
        (data) => {
          if (!cancelled) setState({ status: "ready", data });
        },
        (error: unknown) => {
          if (!cancelled) setState({ status: "error", error });
        },
      );
      return () => {
        cancelled = true;
      };
    }, [attempt]),
  );

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const clock = { now: () => Date.now() };
  /** Posición de una carpeta nueva: después de las que hay. */
  const nextSort = async (folders: Folders): Promise<number> =>
    Math.max(0, ...(await folders.list()).map((folder) => folder.sort)) + 1;
  /** Vuelve a leer la base sin pasar por «cargando» (no se pierden filtros ni scroll). */
  const refresh = async () =>
    setState({
      status: "ready",
      data: await resolveLibraryData(openAppDatabase, SAMPLE_LIBRARY_DATA),
    });
  /** Sin base (web de ejemplo) los cambios viven solo en memoria. */
  const mutateSample = (change: (data: LibraryData) => LibraryData) =>
    setState((prev) =>
      prev.status === "ready" ? { status: "ready", data: change(prev.data) } : prev,
    );

  const createFolder = useCallback(
    async (name: string, tags: string[]): Promise<FolderNameProblem | null> => {
      const driver = await openAppDatabase();
      if (driver === null) {
        if (state.status !== "ready") return null;
        const added = addSampleFolder(state.data, name, tags);
        if (!added.ok) return added.reason;
        setState({ status: "ready", data: added.data });
        return null;
      }
      const folders = new Folders({ driver, clock });
      try {
        await folders.create(name, await nextSort(folders), tags);
      } catch (error) {
        if (error instanceof FolderNameError) return error.reason;
        throw error;
      }
      await refresh();
      return null;
    },
    [state],
  );

  /** Ejecuta `real` con la base o, si no la hay, `sample` sobre los datos de ejemplo. */
  const act = async (
    real: (driver: SqlDriver) => Promise<void>,
    sample: (d: LibraryData) => LibraryData,
  ) => {
    const driver = await openAppDatabase();
    if (driver === null) {
      mutateSample(sample);
      return;
    }
    await real(driver);
    await refresh();
  };

  const seriesActions: LibrarySeriesActions = {
    move: (key, folderId) =>
      act(
        (driver) =>
          new Favorites({ driver, clock }).move(key.moduleId, key.seriesId, Number(folderId)),
        (data) => moveSampleSeries(data, key, folderId),
      ),
    addToFavorites: (key) =>
      act(
        (driver) => new Favorites({ driver, clock }).moveToFavorites(key.moduleId, key.seriesId),
        (data) => {
          const favorites = data.folders.find((folder) => folder.kind === "favorites");
          return favorites === undefined ? data : moveSampleSeries(data, key, favorites.id);
        },
      ),
    // Quitar de Tesoros conserva el progreso (RF-30, P-163): `Favorites.remove`, no la limpieza total.
    remove: (key) =>
      act(
        (driver) => new Favorites({ driver, clock }).remove(key.moduleId, key.seriesId),
        (data) => removeSampleSeries(data, key),
      ),
    moveAndCreate: async (key, name, tags) => {
      const driver = await openAppDatabase();
      if (driver === null) {
        if (state.status !== "ready") return null;
        const added = addSampleFolder(state.data, name, tags, key);
        if (!added.ok) return added.reason;
        setState({ status: "ready", data: added.data });
        return null;
      }
      const folders = new Folders({ driver, clock });
      try {
        await folders.createAndMove(
          name,
          await nextSort(folders),
          tags,
          key.moduleId,
          key.seriesId,
        );
      } catch (error) {
        if (error instanceof FolderNameError) return error.reason;
        throw error;
      }
      await refresh();
      return null;
    },
  };

  // F93 — «Gestionar»: editar (nombre y etiquetas) y borrar una carpeta del usuario.
  const folderActions: LibraryFolderActions = {
    update: async (id, name, tags) => {
      const driver = await openAppDatabase();
      if (driver === null) {
        if (state.status !== "ready") return null;
        const edited = updateSampleFolder(state.data, id, name, tags);
        if (!edited.ok) return edited.reason;
        setState({ status: "ready", data: edited.data });
        return null;
      }
      const folders = new Folders({ driver, clock });
      try {
        await folders.rename(Number(id), name);
        await folders.setTags(Number(id), tags);
      } catch (error) {
        if (error instanceof FolderNameError) return error.reason;
        throw error;
      }
      await refresh();
      return null;
    },
    remove: (id) =>
      act(
        (driver) => new Folders({ driver, clock }).remove(Number(id)),
        (data) => removeSampleFolder(data, id),
      ),
  };

  return { ...state, reload, createFolder, seriesActions, folderActions };
}
