import { useCallback, useEffect, useRef, useState } from "react";

import type { ErrorReporter } from "../../data/errorLogPort";
import {
  resolveDiscoverSource,
  type DiscoverDataSource,
} from "./discoverData";
import { reportDiscoverError } from "./discoverErrors";
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

/**
 * Opcional: en móvil se resuelven solos (fuente de plataforma y reporter del
 * registro); en `apps/web` se inyectan (servicios reales + loader del worker),
 * así este módulo nunca importa `expo-*`/`react-native` (P-115).
 */
export interface DiscoverDataDeps {
  source?: DiscoverDataSource | undefined;
  reporter?: ErrorReporter | null | undefined;
  resolveReporter?: (() => Promise<ErrorReporter | null>) | undefined;
}

export function useDiscoverData(deps: DiscoverDataDeps = {}): { view: DiscoverView } & DiscoverActions {
  const { source, reporter, resolveReporter } = deps;
  const [boot, setBoot] = useState<Boot | null>(null);
  const [nonce, setNonce] = useState(0);
  const [request, setRequest] = useState<Request>(INITIAL_REQUEST);
  const [view, setView] = useState<DiscoverView>({ status: "loading" });
  const bootRef = useRef<Boot | null>(null);
  const reporterRef = useRef<ErrorReporter | null>(null);

  // Arranque: fuente (inyectada en apps/web, de plataforma en móvil) + módulos
  // elegibles + último recordado; el reporter del registro `log` (F31, P-72).
  useEffect(() => {
    let cancelled = false;
    const sourcePromise = source !== undefined ? Promise.resolve(source) : resolveDiscoverSource();
    const reporterPromise =
      reporter !== undefined
        ? Promise.resolve(reporter)
        : resolveReporter !== undefined
          ? resolveReporter()
          : Promise.resolve(null);
    sourcePromise
      .then(async (resolvedSource) => {
        const resolvedReporter = await reporterPromise;
        if (cancelled) return;
        reporterRef.current = resolvedReporter;
        const modules = await resolvedSource.listModules();
        const remembered = await resolvedSource.recallLastModule();
        if (cancelled) return;
        const next: Boot = { source: resolvedSource, modules };
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
        if (!cancelled) {
          setView({
            status: "error",
            error: reportDiscoverError(reporterRef.current, error, ""),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, source, reporter, resolveReporter]);

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
        setView({
          status: "error",
          error: reportDiscoverError(reporterRef.current, error, name, { moduleId }),
        });
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
