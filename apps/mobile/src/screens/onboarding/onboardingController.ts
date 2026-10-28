import { t } from "../../i18n";
import type { SourcesService } from "../sources/sourcesData";
import { createSourcesController, messageOf, URL_ERROR_KEYS } from "../sources/sourcesController";
import type { SourcesFlow, SourcesFlowAction } from "../sources/sourcesFlow";
import { validateRepoUrl } from "../sources/sourcesView";

/**
 * F12 — controlador del primer uso (SPEC §11.8). Tres pasos: bienvenida,
 * añadir repositorio (con la URL del repo oficial ya puesta, P-85) e instalar
 * un módulo. Instalar reutiliza el controlador de Fuentes: la hoja de
 * confirmación y el mantener pulsado de los `script` son los mismos (AC-8).
 * Sin React: la sesión (`useOnboardingSession`) le da servicio, flujo,
 * recarga, paso y la marca de completado.
 */

/** Pasos del primer uso (SPEC §11.8). */
export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingControllerDeps {
  service: SourcesService;
  getFlow: () => SourcesFlow;
  dispatch: (action: SourcesFlowAction) => void;
  /** Vuelve a leer la lista tras un cambio. */
  reload: () => Promise<void>;
  /** Aviso transitorio; `null` lo descarta. */
  notify: (message: string | null) => void;
  /** Cambia el paso cuando una acción lo completa. */
  setStep: (step: OnboardingStep) => void;
  /** Marca el primer uso como completado («Saltar» o «Ir a leer»). */
  complete: () => Promise<void>;
}

export interface OnboardingController {
  /** «Empezar»: del paso 1 al 2, con el flujo listo para los errores de la URL. */
  start(): void;
  /** Añade el repo del paso 2; al lograrlo pasa al paso 3. */
  submitRepo(input: string): Promise<void>;
  openInstall(repoId: string, moduleId: string): Promise<void>;
  confirmInstall(reinforced: boolean): Promise<void>;
  close(): void;
  /** «Saltar»: completa el primer uso sin instalar nada. */
  skip(): Promise<void>;
  /** «Ir a leer»: completa el primer uso tras el paso 3. */
  finish(): Promise<void>;
  dismissNotice(): void;
}

export function createOnboardingController(deps: OnboardingControllerDeps): OnboardingController {
  const { service, setStep, complete } = deps;

  // La confirmación de instalación es la de Fuentes (AC-8): misma hoja, mismos
  // avisos y mismo mantener pulsado para los módulos con código propio.
  const sources = createSourcesController({
    service,
    getFlow: deps.getFlow,
    dispatch: deps.dispatch,
    reload: deps.reload,
    notify: deps.notify,
  });

  return {
    start: () => {
      // El flujo queda «add-repo» para que los errores de la URL del paso 2
      // caigan donde la hoja de Fuentes los espera.
      deps.dispatch({ type: "open-add-repo" });
      setStep(2);
    },

    async submitRepo(input) {
      const check = validateRepoUrl(input);
      if (!check.ok) {
        deps.dispatch({ type: "fail", message: t(URL_ERROR_KEYS[check.reason]) });
        return;
      }
      deps.dispatch({ type: "submit-add-repo" });
      try {
        await service.addRepo(check.url);
        await deps.reload();
        deps.dispatch({ type: "done" });
        setStep(3);
      } catch (error) {
        deps.dispatch({ type: "fail", message: messageOf(error) });
      }
    },

    openInstall: (repoId, moduleId) => sources.openInstall(repoId, moduleId),
    confirmInstall: (reinforced) => sources.confirmInstall(reinforced),
    close: () => sources.close(),

    skip: () => complete(),
    finish: () => complete(),

    dismissNotice: () => deps.notify(null),
  };
}
