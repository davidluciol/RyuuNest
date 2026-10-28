import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { SqlDriver } from "@ryuunest/core";
import { createFetchHttp } from "../../data/fetchHttp";
import { openAppDatabase } from "../../data/appDatabase";
import { createFflateArchive } from "../../data/fflateArchive";
import { createAppSecureLock } from "../../data/secureLock";
import { t } from "../../i18n";
import { createSampleSourcesService } from "./sampleSourcesService";
import { createSourcesController, type SourcesController } from "./sourcesController";
import {
  createSourcesService,
  loadSourcesWithOfficialRepo,
  type SourcesService,
} from "./sourcesData";
import { INITIAL_SOURCES_FLOW, sourcesFlowReducer, type SourcesFlow } from "./sourcesFlow";
import type { SourcesView } from "./sourcesFixtures";

/**
 * F16 — estado de la pantalla Fuentes: elige el servicio por plataforma (en el
 * dispositivo, el núcleo real sobre SQLite; en web, datos de ejemplo en
 * memoria), carga la lista y entrega el flujo de hojas y el controlador. Misma
 * idea que `useDiscoverData` (F15b): la pantalla no pregunta la plataforma.
 *
 * `appVersion` queda sin pasar a propósito: `app.json` está en 0.0.0 y un
 * módulo con `minAppVersion` mayor se rechazaría entero (ver `MEMORY.md`).
 */

export async function resolveSourcesService(): Promise<SourcesService> {
  const driver = await openAppDatabase();
  return driver === null ? createSampleSourcesService() : createNativeSourcesService(driver);
}

/** El servicio de Fuentes sobre el driver nativo (compartido con el primer uso, F12). */
export function createNativeSourcesService(driver: SqlDriver): SourcesService {
  return createSourcesService({
    driver,
    http: createFetchHttp(),
    archive: createFflateArchive(),
    secureLock: createAppSecureLock(),
    clock: { now: () => Date.now() },
  });
}

export interface SourcesState {
  view: SourcesView;
  flow: SourcesFlow;
  notice: string | null;
  /** `null` mientras carga el servicio. */
  controller: SourcesController | null;
  retry: () => void;
}

export function useSourcesData(): SourcesState {
  const [service, setService] = useState<SourcesService | null>(null);
  const [view, setView] = useState<SourcesView>({ status: "loading" });
  const [flow, dispatch] = useReducer(sourcesFlowReducer, INITIAL_SOURCES_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    resolveSourcesService()
      .then(async (resolved) => {
        // P-85: sin repos, la primera carga prueba el repo oficial.
        const { data, officialRepoFailed } = await loadSourcesWithOfficialRepo(resolved);
        if (cancelled) return;
        setService(resolved);
        setView({ status: "ready", data });
        if (officialRepoFailed) setNotice(t("sources.officialRepo.failedNotice"));
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron abrir las fuentes:", error);
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(async () => {
    if (service === null) return;
    setView({ status: "ready", data: await service.load() });
  }, [service]);

  const controller = useMemo(
    () =>
      service === null
        ? null
        : createSourcesController({
            service,
            getFlow: () => flowRef.current,
            dispatch,
            reload,
            notify: setNotice,
          }),
    [service, reload],
  );

  const retry = useCallback(() => setNonce((value) => value + 1), []);

  return { view, flow, notice, controller, retry };
}
