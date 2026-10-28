import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { openAppDatabase } from "../../data/appDatabase";
import { createSampleSourcesService } from "../sources/sampleSourcesService";
import { EMPTY_SOURCES_DATA, type SourcesView } from "../sources/sourcesFixtures";
import { type SourcesService } from "../sources/sourcesData";
import { createNativeSourcesService } from "../sources/useSourcesData";
import {
  INITIAL_SOURCES_FLOW,
  sourcesFlowReducer,
  type SourcesFlow,
} from "../sources/sourcesFlow";
import { createOnboardingController, type OnboardingController, type OnboardingStep } from "./onboardingController";
import { ONBOARDING_COMPLETED_SETTING, isFirstUseData } from "./onboardingData";

/**
 * F12 — sesión y puerta del primer uso (SPEC §11.8, AC-1).
 *
 * - `useOnboardingSession` monta el flujo sobre cualquier `SourcesService`
 *   (el real en el dispositivo; el de ejemplo en la galería, `OnboardingSample`).
 *   El repo del paso 2 lo añade el usuario con su confirmación (AC-8), sin el
 *   auto-registro de Fuentes (P-85).
 * - `useOnboardingData` decide si Inicio muestra el flujo: primer uso solo si
 *   no se completó y no hay nada añadido (RF-1). En web nunca hay primer uso
 *   (datos de ejemplo, P-79).
 */

export interface OnboardingSession {
  step: OnboardingStep;
  view: SourcesView;
  flow: SourcesFlow;
  notice: string | null;
  controller: OnboardingController | null;
  retry: () => void;
}

export function useOnboardingSession(deps: {
  service: SourcesService;
  complete: () => Promise<void>;
}): OnboardingSession {
  const { service, complete } = deps;
  const [view, setView] = useState<SourcesView>({ status: "loading" });
  const [flow, dispatch] = useReducer(sourcesFlowReducer, INITIAL_SOURCES_FLOW);
  const [notice, setNotice] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [nonce, setNonce] = useState(0);
  const flowRef = useRef(flow);
  flowRef.current = flow;

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });
    service
      .load()
      .then((data) => {
        if (!cancelled) setView({ status: "ready", data });
      })
      .catch((error: unknown) => {
        console.warn("No se pudo preparar el primer uso:", error);
        if (!cancelled) setView({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [service, nonce]);

  const reload = useCallback(async () => {
    setView({ status: "ready", data: await service.load() });
  }, [service]);

  const controller = useMemo(
    () =>
      createOnboardingController({
        service,
        getFlow: () => flowRef.current,
        dispatch,
        reload,
        notify: setNotice,
        setStep,
        complete,
      }),
    [service, reload, complete],
  );

  const retry = useCallback(() => setNonce((value) => value + 1), []);

  return { step, view, flow, notice, controller, retry };
}

export type OnboardingPhase =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "first-use"; session: OnboardingSession }
  | { status: "ready" };

export function useOnboardingData(): OnboardingPhase {
  // Mientras se resuelve, la sesión vive sobre el servicio de ejemplo vacío:
  // no se pinta y no toca nada (web la usa así, P-79).
  const [sessionService, setSessionService] = useState<SourcesService>(() =>
    createSampleSourcesService(EMPTY_SOURCES_DATA),
  );
  const [firstUse, setFirstUse] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const driver = await openAppDatabase();
        if (driver === null) {
          // Web (galería/demo): sin SQLite no hay primer uso (P-79).
          if (!cancelled) setFirstUse(false);
          return;
        }
        const completed = await driver.get<{ value: string }>(
          "SELECT value FROM setting WHERE key = ?",
          [ONBOARDING_COMPLETED_SETTING],
        );
        if (completed?.value === "true") {
          if (!cancelled) setFirstUse(false);
          return;
        }
        const service = createNativeSourcesService(driver);
        if (isFirstUseData(await service.load())) {
          if (cancelled) return;
          setSessionService(service);
          setFirstUse(true);
        } else {
          if (!cancelled) setFirstUse(false);
        }
      } catch (error) {
        console.warn("No se pudo preparar el primer uso:", error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const complete = useCallback(async () => {
    const driver = await openAppDatabase();
    if (driver !== null) {
      await driver.run("INSERT OR REPLACE INTO setting (key, value) VALUES (?, 'true')", [
        ONBOARDING_COMPLETED_SETTING,
      ]);
    }
    setFirstUse(false);
  }, []);

  const session = useOnboardingSession(
    useMemo(() => ({ service: sessionService, complete }), [sessionService, complete]),
  );

  if (failed) return { status: "error", retry: () => setNonce((value) => value + 1) };
  if (firstUse) return { status: "first-use", session };
  return { status: "ready" };
}
