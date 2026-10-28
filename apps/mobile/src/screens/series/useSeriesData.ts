import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { toDiscoverError } from "../discover/discoverData";
import type { DiscoverError } from "../discover/discoverFixtures";
import { resolveReadingSource } from "../reader/readingSource";
import type { SeriesViewData } from "./seriesFixtures";

/**
 * F18 — datos de la ficha de serie: `details()` del módulo más el progreso y los capítulos leídos
 * (la misma `ReadingSource` que usa el lector). Al volver del lector la ficha se refresca sola,
 * así «Continuar» y los estados de capítulo reflejan lo último que se leyó (RF-20).
 */

export type SeriesView =
  | { status: "loading" }
  | { status: "error"; error: DiscoverError }
  | { status: "ready"; data: SeriesViewData };

export function useSeriesData(
  moduleId: string,
  seriesId: string,
): { view: SeriesView; retry: () => void } {
  const [view, setView] = useState<SeriesView>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const firstFocus = useRef(true);

  // Cada vez que la ficha recupera el foco (al volver del lector) se vuelve a leer, salvo el primero.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) firstFocus.current = false;
      else setNonce((value) => value + 1);
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    resolveReadingSource()
      .then((source) => source.loadSeries(moduleId, seriesId))
      .then((data) => {
        if (!cancelled) setView({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setView({ status: "error", error: toDiscoverError(error, moduleId) });
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, seriesId, nonce]);

  const retry = useCallback(() => {
    setView({ status: "loading" });
    setNonce((value) => value + 1);
  }, []);

  return { view, retry };
}
