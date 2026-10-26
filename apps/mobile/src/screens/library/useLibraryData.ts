import { useCallback, useEffect, useState } from "react";

import { openAppDatabase } from "../../data/appDatabase";

import { resolveLibraryData } from "./libraryData";
import { SAMPLE_LIBRARY_DATA, type LibraryData } from "./libraryFixtures";

/** F14c — estado de carga de la pantalla Biblioteca. */
export type LibraryLoad =
  | { status: "loading" }
  | { status: "ready"; data: LibraryData }
  | { status: "error"; error: unknown };

/**
 * Carga la biblioteca del dispositivo al montar y cada vez que se pide `reload`.
 * En web (sin SQLite local) entrega los datos de ejemplo.
 */
export function useLibraryData(): LibraryLoad & { reload: () => void } {
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
  return { ...state, reload };
}
