import { useCallback, useEffect, useState } from "react";
import { FolderNameError, Folders } from "@ryuunest/core";

import { openAppDatabase } from "../../data/appDatabase";

import { resolveLibraryData } from "./libraryData";
import {
  SAMPLE_LIBRARY_DATA,
  addSampleFolder,
  type FolderNameProblem,
  type LibraryData,
} from "./libraryFixtures";

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
}

/**
 * Carga la biblioteca del dispositivo al montar y cada vez que se pide `reload`.
 * En web (sin SQLite local) entrega los datos de ejemplo, y las carpetas nuevas viven solo en
 * memoria.
 */
export function useLibraryData(): LibraryLoad & LibraryActions {
  const [state, setState] = useState<LibraryLoad>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
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
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

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
      const folders = new Folders({ driver, clock: { now: () => Date.now() } });
      try {
        const last = Math.max(0, ...(await folders.list()).map((folder) => folder.sort));
        await folders.create(name, last + 1, tags);
      } catch (error) {
        if (error instanceof FolderNameError) return error.reason;
        throw error;
      }
      setState({ status: "ready", data: await resolveLibraryData(openAppDatabase, SAMPLE_LIBRARY_DATA) });
      return null;
    },
    [state],
  );

  return { ...state, reload, createFolder };
}
