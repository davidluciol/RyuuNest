import { useCallback, useEffect, useRef, useState } from "react";

import type { ErrorReporter } from "../../data/errorLogPort";
import { resolveDiscoverSource, type DiscoverDataSource } from "./discoverData";
import { createCatalogPager } from "./catalogPaging";
import { reportDiscoverError } from "./discoverErrors";
import {
  countHiddenNsfwModules,
  moduleErrorView,
  reconcileSelectedModuleId,
  sameDiscoverModules,
  type DiscoverFilterValues,
  type DiscoverModule,
  viewWhileReloading,
  withActiveFilters,
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
  /** F59: sección de `home()` abierta con «Ver más» (su catálogo es `list`). */
  section: { id: string; title: string } | null;
  /** F50: etiquetas aplicadas a la búsqueda. */
  filters: DiscoverFilterValues;
  /** Se incrementa en cada reintento para relanzar la carga. */
  attempt: number;
}

const INITIAL_REQUEST: Request = {
  moduleId: null,
  query: "",
  page: 1,
  section: null,
  filters: {},
  attempt: 0,
};

/** F84: estado de «cargar más» del catálogo (el fin de lista sale de `catalog.hasNext`). */
export type DiscoverMoreStatus = "idle" | "loading" | "error";

/** F85: filas que también cargan más páginas. */
export type DiscoverRow = "latest" | "popular";

export interface DiscoverActions {
  /** F85: pide la página siguiente de la fila Reciente o Popular. */
  loadMoreRow: (row: DiscoverRow) => void;
  /** F84: pide la página siguiente del catálogo (scroll infinito); no hace nada si no hay más o ya se pidió. */
  loadMore: () => void;
  selectModule: (id: string) => void;
  search: (query: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  /** F59: abre una sección de `home()` (su `list` paginado). */
  /** F50: aplica las etiquetas del módulo y vuelve a la página 1. */
  applyFilters: (filters: DiscoverFilterValues) => void;
  openSection: (id: string, title: string) => void;
  /** F59: vuelve de la sección a la portada del módulo. */
  closeSection: () => void;
  retry: () => void;
  /** Relee los módulos activos (al volver a la pestaña); recarga solo si cambiaron. */
  refreshModules: () => void;
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
  /** Ajuste global NSFW (RF-35): decide qué módulos se pueden elegir. Apagado por defecto. */
  nsfwVisible?: boolean | undefined;
}

export function useDiscoverData(deps: DiscoverDataDeps = {}): {
  view: DiscoverView;
  more: DiscoverMoreStatus;
  rowMore: Record<DiscoverRow, DiscoverMoreStatus>;
} & DiscoverActions {
  const { source, reporter, resolveReporter, nsfwVisible = false } = deps;
  const [boot, setBoot] = useState<Boot | null>(null);
  const [nonce, setNonce] = useState(0);
  const [request, setRequest] = useState<Request>(INITIAL_REQUEST);
  const [view, setView] = useState<DiscoverView>({ status: "loading" });
  const [more, setMore] = useState<DiscoverMoreStatus>("idle");
  const [rowMore, setRowMore] = useState<Record<DiscoverRow, DiscoverMoreStatus>>({
    latest: "idle",
    popular: "idle",
  });
  const viewRef = useRef(view);
  viewRef.current = view;
  // Cada carga nueva (módulo, búsqueda, filtros) invalida lo que «cargar más» tenía en vuelo.
  const loadTokenRef = useRef(0);
  const bootRef = useRef<Boot | null>(null);
  const reporterRef = useRef<ErrorReporter | null>(null);
  const rememberedRef = useRef<string | null>(null);
  // F50: el próximo reload es por cambio de filtros, así que no se vacía la pantalla.
  const keepOnReloadRef = useRef(false);

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
        rememberedRef.current = remembered;
        setBoot(next);
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

  // Selección (RF-9/RF-35): sigue a los módulos instalados y al ajuste NSFW; con
  // solo módulos NSFW y el filtro apagado no hay selección hasta encenderlo.
  useEffect(() => {
    if (boot === null) return;
    setRequest((current) => {
      const moduleId = reconcileSelectedModuleId(
        boot.modules,
        nsfwVisible,
        current.moduleId,
        rememberedRef.current,
      );
      return moduleId === current.moduleId ? current : { ...current, moduleId };
    });
  }, [boot, nsfwVisible]);

  // Carga del módulo elegido (o vacío si no hay ninguno visible).
  useEffect(() => {
    if (boot === null) return;
    const { moduleId, query, page, section, filters } = request;
    if (moduleId === null) {
      setView({
        status: "empty",
        hiddenByNsfw: countHiddenNsfwModules(boot.modules, nsfwVisible),
      });
      return;
    }

    let cancelled = false;
    loadTokenRef.current += 1;
    setMore("idle");
    setRowMore({ latest: "idle", popular: "idle" });
    const keep = keepOnReloadRef.current;
    keepOnReloadRef.current = false;
    // Solo se conserva la pantalla del mismo módulo: nunca se mezclan series de otro.
    setView((current) =>
      viewWhileReloading(
        current,
        keep && current.status === "ready" && current.ready.selectedModuleId === moduleId,
      ),
    );
    boot.source
      .load({ moduleId, query, page, sectionId: section?.id, filters })
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
            latestMore: { page: 1, hasNext: data.latestHasNext },
            popularMore: { page: 1, hasNext: data.popularHasNext },
            sections: data.sections,
            filters: data.filters,
            activeFilters: filters,
            ...(section === null ? {} : { section }),
            catalog: data.catalog,
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = boot.modules.find((module) => module.id === moduleId)?.name ?? "";
        setView(
          moduleErrorView(
            reportDiscoverError(reporterRef.current, error, name, { moduleId }),
            boot.modules,
            moduleId,
          ),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [boot, request, nsfwVisible]);

  const selectModule = useCallback((id: string) => {
    setRequest((current) => ({
      moduleId: id,
      query: "",
      page: 1,
      section: null,
      filters: {},
      attempt: current.attempt,
    }));
    // RF-9: el recuerdo es lo último; si la persistencia falla, la pantalla
    // ya cambió de módulo y el fallo queda avisado, no bloqueante.
    void bootRef.current?.source.rememberLastModule(id).catch((error: unknown) => {
      console.warn("No se pudo recordar el módulo:", error);
    });
  }, []);

  const search = useCallback(
    (query: string) => setRequest((current) => ({ ...current, query, page: 1, section: null })),
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

  const pagerRef = useRef<{ key: number; run: ReturnType<typeof createCatalogPager> } | null>(null);

  const loadMore = useCallback(() => {
    const current = viewRef.current;
    const currentBoot = bootRef.current;
    if (current.status !== "ready" || currentBoot === null) return;
    const { selectedModuleId, query, section, activeFilters, catalog } = current.ready;
    const token = loadTokenRef.current;
    if (pagerRef.current?.key !== token) {
      pagerRef.current = {
        key: token,
        run: createCatalogPager(async (page) => {
          const data = await currentBoot.source.load({
            moduleId: selectedModuleId,
            query,
            page,
            sectionId: section?.id,
            filters: activeFilters,
            catalogOnly: true,
          });
          return data.catalog;
        }),
      };
    }
    const run = pagerRef.current.run;
    setMore("loading");
    run(catalog)
      .then((next) => {
        if (loadTokenRef.current !== token) return;
        if (next === null) {
          setMore((status) => (status === "loading" ? "idle" : status));
          return;
        }
        setView((latest) =>
          latest.status === "ready"
            ? { status: "ready", ready: { ...latest.ready, catalog: next } }
            : latest,
        );
        setMore("idle");
      })
      .catch((error: unknown) => {
        if (loadTokenRef.current !== token) return;
        const name =
          currentBoot.modules.find((module) => module.id === selectedModuleId)?.name ?? "";
        reportDiscoverError(reporterRef.current, error, name, { moduleId: selectedModuleId });
        setMore("error");
      });
  }, []);

  const rowPagersRef = useRef<{
    key: number;
    run: Record<DiscoverRow, ReturnType<typeof createCatalogPager>>;
  } | null>(null);

  const loadMoreRow = useCallback((row: DiscoverRow) => {
    const current = viewRef.current;
    const currentBoot = bootRef.current;
    if (current.status !== "ready" || currentBoot === null) return;
    const { selectedModuleId, query, activeFilters } = current.ready;
    const token = loadTokenRef.current;
    if (rowPagersRef.current?.key !== token) {
      const make = (kind: DiscoverRow) =>
        createCatalogPager(async (page) => {
          const data = await currentBoot.source.load({
            moduleId: selectedModuleId,
            query,
            page,
            filters: activeFilters,
            catalogOnly: true,
            row: kind,
          });
          return data.catalog;
        });
      rowPagersRef.current = {
        key: token,
        run: { latest: make("latest"), popular: make("popular") },
      };
    }
    const more = row === "latest" ? current.ready.latestMore : current.ready.popularMore;
    const entries = row === "latest" ? current.ready.latest : current.ready.popular;
    const page = { page: more?.page ?? 1, hasNext: more?.hasNext ?? false, entries: [...entries] };
    setRowMore((state) => ({ ...state, [row]: "loading" }));
    rowPagersRef.current.run[row](page)
      .then((next) => {
        if (loadTokenRef.current !== token) return;
        if (next !== null) {
          setView((latest) =>
            latest.status === "ready"
              ? {
                  status: "ready",
                  ready: {
                    ...latest.ready,
                    [row]: next.entries,
                    [row === "latest" ? "latestMore" : "popularMore"]: {
                      page: next.page,
                      hasNext: next.hasNext,
                    },
                  },
                }
              : latest,
          );
        }
        setRowMore((state) => ({ ...state, [row]: "idle" }));
      })
      .catch((error: unknown) => {
        if (loadTokenRef.current !== token) return;
        const name =
          currentBoot.modules.find((module) => module.id === selectedModuleId)?.name ?? "";
        reportDiscoverError(reporterRef.current, error, name, { moduleId: selectedModuleId, row });
        setRowMore((state) => ({ ...state, [row]: "error" }));
      });
  }, []);

  const applyFilters = useCallback((filters: DiscoverFilterValues) => {
    keepOnReloadRef.current = true;
    setView((current) => withActiveFilters(current, filters));
    setRequest((current) => ({ ...current, filters, page: 1, section: null }));
  }, []);

  const openSection = useCallback(
    (id: string, title: string) =>
      setRequest((current) => ({ ...current, query: "", page: 1, section: { id, title } })),
    [],
  );

  const closeSection = useCallback(
    () => setRequest((current) => ({ ...current, page: 1, section: null })),
    [],
  );

  const refreshModules = useCallback(() => {
    const current = bootRef.current;
    if (current === null) return;
    void current.source
      .listModules()
      .then((modules) => {
        const latest = bootRef.current;
        if (latest === null || sameDiscoverModules(latest.modules, modules)) return;
        const next: Boot = { source: latest.source, modules };
        bootRef.current = next;
        setBoot(next);
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron releer los módulos:", error);
      });
  }, []);

  const retry = useCallback(() => {
    setNonce((value) => value + 1); // reintenta también el arranque (fuente y registro)
    setRequest((current) => ({ ...current, attempt: current.attempt + 1 }));
  }, []);

  return {
    view,
    more,
    rowMore,
    loadMoreRow,
    loadMore,
    selectModule,
    search,
    nextPage,
    prevPage,
    applyFilters,
    openSection,
    closeSection,
    retry,
    refreshModules,
  };
}
