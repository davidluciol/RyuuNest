import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { LogEntry } from "@ryuunest/core";

import { createDiagnosticsController, type DiagnosticsController } from "@ryuunest/mobile-src/screens/settings/diagnostics/diagnosticsController";
import { createDiagnosticsService, type DiagnosticsService } from "@ryuunest/mobile-src/screens/settings/diagnostics/diagnosticsData";
import {
  diagnosticsFlowReducer,
  INITIAL_DIAGNOSTICS_FLOW,
  type DiagnosticsFlow,
  type DiagnosticsNotice,
} from "@ryuunest/mobile-src/screens/settings/diagnostics/diagnosticsFlow";

import { copyTextWeb, createWebDiagnosticsFiles } from "../../data/webDiagnostics";
import { useServices } from "../../services/ServicesContext";

/**
 * F25 — estado de Diagnóstico web (P-72): registro real (`log` sobre sql.js +
 * IndexedDB) con la máquina de estados de móvil reutilizada vía
 * `@ryuunest/mobile-src`. El informe se descarga como archivo y «copiar» usa
 * el portapapeles del navegador.
 */
export interface DiagnosticsState {
  view: { status: "loading" } | { status: "error" } | { status: "ready"; events: LogEntry[] };
  flow: DiagnosticsFlow;
  controller: DiagnosticsController | null;
  notice: DiagnosticsNotice | null;
  retry: () => void;
}

export function useDiagnosticsData(): DiagnosticsState {
  const services = useServices();
  const [service] = useState<DiagnosticsService>(() =>
    createDiagnosticsService({
      logStore: services.logStore,
      files: createWebDiagnosticsFiles(),
      copyText: copyTextWeb,
    }),
  );

  const [events, setEvents] = useState<LogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<DiagnosticsNotice | null>(null);
  const [flow, dispatch] = useReducer(diagnosticsFlowReducer, INITIAL_DIAGNOSTICS_FLOW);
  const [nonce, setNonce] = useState(0);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const reload = useCallback(async () => {
    setEvents(await service.list());
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setEvents(null);
    service
      .list()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [service, nonce]);

  const controller = useMemo(
    () =>
      createDiagnosticsController({
        service,
        getFlow: () => flowRef.current,
        dispatch,
        notify: setNotice,
        reload,
      }),
    [service, reload],
  );

  const view: DiagnosticsState["view"] = failed
    ? { status: "error" }
    : events === null
      ? { status: "loading" }
      : { status: "ready", events };

  return { view, flow, controller, notice, retry: () => setNonce((v) => v + 1) };
}
