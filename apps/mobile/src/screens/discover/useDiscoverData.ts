import { useCallback, useEffect, useState } from "react";

import { getDiscoverModules, loadDiscoverData, toDiscoverError } from "./discoverData";
import {
  resolveSelectedModuleId,
  visibleDiscoverModules,
  type DiscoverView,
} from "./discoverFixtures";

/**
 * F15 — estado de la pantalla Descubrir: recuerda el último módulo elegido
 * (RF-9), carga `latest`/`popular` y la página del catálogo que pide la
 * pantalla, y traduce los fallos del módulo al detalle de RF-11.
 *
 * En web, los módulos de ejemplo se montan con el runtime real del núcleo
 * sobre `test-site` (`discoverData.ts`); cuando la instalación tenga su UI
 * (F16), este hook leerá `ModuleRegistry` sin cambiar la pantalla.
 */

/** La lista de módulos es fija en esta capa; alcanza con leerla una vez. */
const MODULES = getDiscoverModules();

/** El último módulo elegido sobrevive a cambiar de pestaña en la sesión. */
let rememberedModuleId: string | null = null;

export interface DiscoverActions {
  selectModule: (id: string) => void;
  search: (query: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  retry: () => void;
}

interface Request {
  moduleId: string | null;
  query: string;
  page: number;
  /** Se incrementa en cada reintento para relanzar la carga. */
  attempt: number;
}

const INITIAL_REQUEST: Request = {
  moduleId: resolveSelectedModuleId(visibleDiscoverModules(MODULES, false), rememberedModuleId),
  query: "",
  page: 1,
  attempt: 0,
};

export function useDiscoverData(): { view: DiscoverView } & DiscoverActions {
  const [request, setRequest] = useState<Request>(INITIAL_REQUEST);
  const [view, setView] = useState<DiscoverView>({ status: "loading" });

  useEffect(() => {
    const { moduleId, query, page } = request;
    if (moduleId === null) {
      setView({ status: "empty" });
      return;
    }

    let cancelled = false;
    setView({ status: "loading" });
    loadDiscoverData({ moduleId, query, page })
      .then((data) => {
        if (cancelled) return;
        setView({
          status: "ready",
          ready: {
            modules: MODULES,
            selectedModuleId: moduleId,
            query,
            latest: data.latest,
            popular: data.popular,
            catalog: data.catalog,
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = MODULES.find((module) => module.id === moduleId)?.name ?? "";
        setView({ status: "error", error: toDiscoverError(error, name) });
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  const selectModule = useCallback((id: string) => {
    rememberedModuleId = id;
    setRequest((current) => ({ moduleId: id, query: "", page: 1, attempt: current.attempt }));
  }, []);

  const search = useCallback(
    (query: string) =>
      setRequest((current) => ({ ...current, query, page: 1 })),
    [],
  );

  const nextPage = useCallback(
    () => setRequest((current) => ({ ...current, page: current.page + 1 })),
    [],
  );

  const prevPage = useCallback(
    () => setRequest((current) => ({ ...current, page: Math.max(1, current.page - 1) })),
    [],
  );

  const retry = useCallback(
    () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 })),
    [],
  );

  return { view, selectModule, search, nextPage, prevPage, retry };
}
