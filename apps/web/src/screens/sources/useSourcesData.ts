import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { t } from "@ryuunest/i18n";
import {
  createSourcesController,
  type SourcesController,
} from "@ryuunest/mobile-src/screens/sources/sourcesController";
import {
  createSourcesService,
  loadSourcesWithOfficialRepo,
  type SourcesData,
  type SourcesService,
} from "@ryuunest/mobile-src/screens/sources/sourcesData";
import { reportSourcesError } from "@ryuunest/mobile-src/screens/sources/sourcesErrors";
import {
  INITIAL_SOURCES_FLOW,
  sourcesFlowReducer,
  type SourcesFlow,
} from "@ryuunest/mobile-src/screens/sources/sourcesFlow";

import { useServices } from "../../services/ServicesContext";

/**
 * F25 — estado de la pantalla Fuentes en web: el servicio real se construye
 * sobre los puertos de `WebServices` (sql.js + IndexedDB, fetch temporal) y la
 * lógica (servicio, flujo de hojas, controlador, errores) se reutiliza de
 * `apps/mobile` vía `@ryuunest/mobile-src` (pura, sin react-native).
 */

export type SourcesViewState =
  | { status: "loading" }
  | { status: "ready"; data: SourcesData }
  | { status: "error" };

export interface SourcesState {
  view: SourcesViewState;
  flow: SourcesFlow;
  notice: string | null;
  controller: SourcesController | null;
  retry: () => void;
}

export function useSourcesData(): SourcesState {
  const services = useServices();
  const [service] = useState<SourcesService>(() =>
    createSourcesService({
      driver: services.driver,
      http: services.http,
      archive: services.archive,
      secureLock: services.secureLock,
      clock: services.clock,
    }),
  );
  const reporter = services.reporter;

  const [view, setView] = useState<SourcesViewState>({ status: "loading" });
  const [flow, dispatch] = useReducer(sourcesFlowReducer, INITIAL_SOURCES_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    loadSourcesWithOfficialRepo(service)
      .then(({ data, officialRepoFailed }) => {
        if (cancelled) return;
        setView({ status: "ready", data });
        if (officialRepoFailed) {
          reportSourcesError(reporter, "load", new Error("official repo failed"));
          setNotice(t("sources.officialRepo.failedNotice"));
        }
      })
      .catch((error: unknown) => {
        reportSourcesError(reporter, "load", error);
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [service, reporter, nonce]);

  const reload = useCallback(async () => {
    setView({ status: "ready", data: await service.load() });
  }, [service]);

  const controller = useMemo(
    () =>
      createSourcesController({
        service,
        getFlow: () => flowRef.current,
        dispatch,
        reload,
        notify: setNotice,
        reporter,
      }),
    [service, reload, reporter],
  );

  const retry = useCallback(() => setNonce((value) => value + 1), []);

  return { view, flow, notice, controller, retry };
}
