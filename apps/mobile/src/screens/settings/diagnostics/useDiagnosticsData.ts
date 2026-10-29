import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { createLogStore, type LogEntry } from "@ryuunest/core";

import { copyText } from "../../../data/clipboard";
import { createDiagnosticsFiles } from "../../../data/diagnosticsFiles";
import { openAppDatabase } from "../../../data/appDatabase";
import { createDiagnosticsController, type DiagnosticsController } from "./diagnosticsController";
import { createDiagnosticsService, type DiagnosticsService } from "./diagnosticsData";
import {
  diagnosticsFlowReducer,
  INITIAL_DIAGNOSTICS_FLOW,
  type DiagnosticsFlow,
  type DiagnosticsNotice,
} from "./diagnosticsFlow";
import { createSampleDiagnosticsService } from "./sampleDiagnosticsService";
import type { DiagnosticsView } from "./DiagnosticsScreen";

/**
 * F30 — estado de Ajustes → Diagnóstico. En el dispositivo, el registro real
 * (`createLogStore` sobre SQLite) con la hoja del sistema y el portapapeles
 * nativos; en web y la galería, el servicio de ejemplo sobre la descarga y el
 * portapapeles del navegador (P-79). La pantalla no pregunta la plataforma.
 */

let resolvedService: Promise<DiagnosticsService> | undefined;

export function resolveDiagnosticsService(): Promise<DiagnosticsService> {
  resolvedService ??= openAppDatabase().then((driver) => {
    const files = createDiagnosticsFiles();
    if (driver === null) return createSampleDiagnosticsService({ files, copyText });
    return createDiagnosticsService({
      logStore: createLogStore({
        driver,
        clock: { now: () => Date.now() },
        appVersion: Constants.expoConfig?.version ?? "0.0.0",
        platform: Platform.OS,
      }),
      files,
      copyText,
    });
  });
  return resolvedService;
}

export interface DiagnosticsState {
  view: DiagnosticsView;
  flow: DiagnosticsFlow;
  controller: DiagnosticsController | null;
  notice: DiagnosticsNotice | null;
  retry: () => void;
}

export function useDiagnosticsData(): DiagnosticsState {
  const [service, setService] = useState<DiagnosticsService | null>(null);
  const [events, setEvents] = useState<LogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<DiagnosticsNotice | null>(null);
  const [flow, dispatch] = useReducer(diagnosticsFlowReducer, INITIAL_DIAGNOSTICS_FLOW);
  const [nonce, setNonce] = useState(0);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    resolveDiagnosticsService()
      .then(async (resolved) => {
        const list = await resolved.list();
        if (cancelled) return;
        setService(resolved);
        setEvents(list);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo abrir el registro local:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(async () => {
    if (service !== null) setEvents(await service.list());
  }, [service]);

  const controller = useMemo(() => {
    if (service === null) return null;
    return createDiagnosticsController({
      service,
      getFlow: () => flowRef.current,
      dispatch,
      notify: setNotice,
      reload,
    });
  }, [service, reload]);

  const view: DiagnosticsView = failed
    ? { status: "error" }
    : events === null
      ? { status: "loading" }
      : { status: "ready", events };

  return { view, flow, controller, notice, retry: () => setNonce((value) => value + 1) };
}
