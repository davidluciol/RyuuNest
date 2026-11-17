import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { openAppDatabase } from "../../data/appDatabase";

import { resolveHomeData } from "./homeData";
import { SAMPLE_HOME_DATA, type HomeData } from "./homeFixtures";

/** F46 — estado de carga de Inicio. */
export type HomeLoad =
  { status: "loading" } | { status: "ready"; data: HomeData } | { status: "error"; error: unknown };

/**
 * Carga Inicio del dispositivo y la relee cada vez que la pestaña recupera el foco
 * (las pestañas siguen montadas: al volver del lector, «Continuar» ya muestra lo nuevo).
 * En web (sin SQLite local) entrega los datos de ejemplo hasta F49.
 */
export function useHomeData(nsfwVisible: boolean): HomeLoad & { reload: () => void } {
  const [state, setState] = useState<HomeLoad>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // Sin volver a «loading»: al refrescar se conserva lo que ya se ve (sin parpadeo).
      resolveHomeData(openAppDatabase, SAMPLE_HOME_DATA, { nsfwVisible }).then(
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
    }, [nsfwVisible, attempt]),
  );

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
