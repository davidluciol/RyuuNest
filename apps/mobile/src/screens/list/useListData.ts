import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { openAppDatabase } from "../../data/appDatabase";
import type { HomeProgress } from "../home/homeFixtures";

import type { ListSource } from "./listSources";

/** F82 — carga la lista de una fuente y la relee al recuperar el foco (como `useHomeData`). */
export type ListLoad =
  | { status: "loading" }
  | { status: "ready"; items: HomeProgress[] }
  | { status: "error"; error: unknown };

export function useListData(
  source: ListSource,
  nsfwVisible: boolean,
): ListLoad & { reload: () => void } {
  const [state, setState] = useState<ListLoad>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      openAppDatabase()
        .then((driver) =>
          driver === null ? source.fallback : source.load(driver, { nsfwVisible }),
        )
        .then(
          (items) => {
            if (!cancelled) setState({ status: "ready", items });
          },
          (error: unknown) => {
            if (!cancelled) setState({ status: "error", error });
          },
        );
      return () => {
        cancelled = true;
      };
    }, [source, nsfwVisible, attempt]),
  );

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
