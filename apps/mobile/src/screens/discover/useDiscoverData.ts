import { useCallback, useEffect, useRef, useState } from "react";

import {
  resolveDiscoverSource,
  toDiscoverError,
  type DiscoverDataSource,
} from "./discoverData";
import {
  resolveSelectedModuleId,
  visibleDiscoverModules,
  type DiscoverModule,
  type DiscoverView,
} from "./discoverFixtures";

/**
 * F15/F15b — estado de la pantalla Descubrir: elige el módulo (recuerda el
 * último, RF-9, con persistencia real en el dispositivo vía la tabla
 * `setting`), carga `latest`/`popular` y la página del catálogo que pide la
 * pantalla, y traduce los fallos del módulo al detalle de RF-11.
 *
 * La pantalla no sabe de plataformas: todo pasa por `DiscoverDataSource`
 * (instalados en el dispositivo, `test-site` en web — `discoverData.ts`).
 */

interface Boot {
  source: DiscoverDataSource;
  modules: DiscoverModule[];
}

interface Request {
  moduleId: string | null;
  query: string;
  page: number;
  /** Se incrementa en cada reintento para relanzar la carga. */
  attempt: number;
}

const INITIAL_REQUEST: Request = { moduleId: null, query: "", page: 1, attempt: 0 };

export interface DiscoverActions {
  selectModule: (id: string) => void;
  search: (query: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  retry: () => void;
}

export function useDiscoverData(): { view: DiscoverView } & DiscoverActions {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [nonce, setNonce] = useState(0);
  const [request, setRequest] = useState<Request>(INITIAL_REQUEST);
  const [view, setView] = useState<DiscoverView>({ status: "loading" });
  const bootRef = useRef<Boot | null>(null);

  // Arranque: fuente de la plataforma + módulos elegibles + último recordado.
  useEffect(() => {
    let cancelled = false;
    resolveDiscoverSource()
      .then(async (source) => {
        const modules = await source.listModules();
        const remembered = await source.recallLastModule();
        if (cancelled) return;
        const next: Boot = { source, modules };
        bootRef.current = next;
        setBoot(next);
        setRequest((current) =>
          current.moduleId === null
            ? {
                ...current,
                moduleId: resolveSelectedModuleId(
                  visibleDiscoverModules(modules, false),
                  remembered,
                ),
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) setView({ status: "error", error: toDiscoverError(error, "") });
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  // Carga del módulo elegido (o vacío si no hay ninguno visible).
  useEffect(() => {
    if (boot === null) return;
    const { moduleId, query, page } = request;
    if (moduleId === null) {
      setView({ status: "empty" });
      return;
    }

    let cancelled = false;
    setView({ status: "loading" });
    boot.source
      .load({ moduleId, query, page })
      .then((data) => {
        if (cancelled) return;
        setView({
          status: "ready",
          ready: {
            modules: boot.modules,
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
        const name = boot.modules.find((module) => module.id === moduleId)?.name ?? "";
        setView({ status: "error", error: toDiscoverError(error, name) });
      });

    return () => {
      cancelled = true;
    };
  }, [boot, request]);

  const selectModule = useCallback((id: string) => {
    setRequest((current) => ({ moduleId: id, query: "", page: 1, attempt: current.attempt }));
    // RF-9: el recuerdo es lo último; si la persistencia falla, la pantalla
    // ya cambió de módulo y el fallo queda avisado, no bloqueante.
    void bootRef.current?.source.rememberLastModule(id).catch((error: unknown) => {
      console.warn("No se pudo recordar el módulo:", error);
    });
  }, []);

  const search = useCallback(
    (query: string) => setRequest((current) => ({ ...current, query, page: 1 })),
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

  const retry = useCallback(() => {
    setNonce((value) => value + 1); // reintenta también el arranque (fuente y registro)
    setRequest((current) => ({ ...current, attempt: current.attempt + 1 }));
  }, []);

  return { view, selectModule, search, nextPage, prevPage, retry };
}
