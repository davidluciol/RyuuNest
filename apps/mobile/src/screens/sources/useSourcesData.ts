import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { SqlDriver } from "@ryuunest/core";
import { createFetchHttp } from "../../data/fetchHttp";
import { openAppDatabase } from "../../data/appDatabase";
import { isNativePlatform } from "../../data/backupFilesPort";
import { resolveErrorReporter, type ErrorReporter } from "../../data/errorLog";
import { createFflateArchive } from "../../data/fflateArchive";
import { createAppSecureLock } from "../../data/secureLock";
import { t } from "../../i18n";
import { consumeOpenUpdatesRequest, setUpdateCount } from "../../navigation/updatesStore";
import { createSampleSourcesService } from "./sampleSourcesService";
import {
  createSourcesController,
  type NoticeKind,
  type SourcesController,
} from "./sourcesController";
import {
  createSourcesService,
  loadSourcesWithOfficialRepo,
  type SourcesService,
} from "./sourcesData";
import { reportSourcesError } from "./sourcesErrors";
import { INITIAL_SOURCES_FLOW, sourcesFlowReducer, type SourcesFlow } from "./sourcesFlow";
import { countUpdates } from "./sourcesView";
import type { RecommendedView, SourcesView } from "./sourcesFixtures";

/**
 * F16 — estado de la pantalla Fuentes: elige el servicio por plataforma (en el
 * dispositivo, el núcleo real sobre SQLite; en web, datos de ejemplo en
 * memoria), carga la lista y entrega el flujo de hojas y el controlador. Misma
 * idea que `useDiscoverData` (F15b): la pantalla no pregunta la plataforma.
 *
 * T38: se pasa la versión real de la app (`app.json`) para que `minAppVersion`
 * oculte lo incompatible antes de descargarlo.
 */

export async function resolveSourcesService(): Promise<SourcesService> {
  const driver = await openAppDatabase();
  // Web (F49b): sin red no hay módulos que instalar; se muestran los portales de ejemplo.
  return driver === null || !isNativePlatform()
    ? createSampleSourcesService()
    : createNativeSourcesService(driver);
}

/** El servicio de Fuentes sobre el driver nativo (compartido con el primer uso, F12). */
export function createNativeSourcesService(driver: SqlDriver): SourcesService {
  return createSourcesService({
    driver,
    http: createFetchHttp(),
    archive: createFflateArchive(),
    secureLock: createAppSecureLock(),
    clock: { now: () => Date.now() },
    ...(Constants.expoConfig?.version === undefined
      ? {}
      : { appVersion: Constants.expoConfig.version }),
  });
}

export interface SourcesState {
  view: SourcesView;
  flow: SourcesFlow;
  notice: string | null;
  noticeKind: NoticeKind;
  /** `null` mientras carga el servicio. */
  controller: SourcesController | null;
  retry: () => void;
  /** F44: sección «Recomendados»; se descarga al abrir Portales y al pedirlo. */
  recommended: RecommendedView;
  refreshRecommended: () => void;
}

export function useSourcesData(): SourcesState {
  const [service, setService] = useState<SourcesService | null>(null);
  const [view, setView] = useState<SourcesView>({ status: "loading" });
  const [flow, dispatch] = useReducer(sourcesFlowReducer, INITIAL_SOURCES_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("error");
  const [nonce, setNonce] = useState(0);
  const [reporter, setReporter] = useState<ErrorReporter | null>(null);
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const reporterRef = useRef<ErrorReporter | null>(null);
  reporterRef.current = reporter;

  // F31: el reporter del registro `log` se resuelve una vez (P-72).
  useEffect(() => {
    let cancelled = false;
    void resolveErrorReporter().then((resolved) => {
      if (!cancelled) setReporter(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (officialRepoFailed) {
          reportSourcesError(reporterRef.current, "load", new Error("official repo failed"));
          setNotice(t("sources.officialRepo.failedNotice"));
        }
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron abrir las fuentes:", error);
        reportSourcesError(reporterRef.current, "load", error);
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
            notify: (message, kind = "error") => {
              setNoticeKind(kind);
              setNotice(message);
            },
            reporter: reporterRef.current,
          }),
    [service, reload, reporter],
  );

  // F99: el aviso del shell sigue a la lista; «Ver» del banner abre la hoja de actualizar.
  useEffect(() => {
    if (view.status !== "ready") return;
    setUpdateCount(countUpdates(view.data.modules));
    if (controller === null || !consumeOpenUpdatesRequest()) return;
    const next = view.data.modules.find((m) => m.status === "installed" && m.updateTo !== undefined);
    if (next !== undefined) void controller.openUpdate(next.id);
  }, [view, controller]);

  const retry = useCallback(() => setNonce((value) => value + 1), []);

  // F44 (RNF-5): solo al abrir Portales (servicio listo) o al pulsar «Actualizar».
  const [recommended, setRecommended] = useState<RecommendedView>({ status: "loading" });
  const refreshRecommended = useCallback(() => {
    if (service === null) return;
    setRecommended({ status: "loading" });
    service.loadRecommended().then(
      (repos) => setRecommended({ status: "ready", repos }),
      (error: unknown) => {
        reportSourcesError(reporterRef.current, "recommended", error);
        setRecommended({ status: "offline" });
      },
    );
  }, [service]);
  useEffect(refreshRecommended, [refreshRecommended]);

  return { view, flow, notice, noticeKind, controller, retry, recommended, refreshRecommended };
}
