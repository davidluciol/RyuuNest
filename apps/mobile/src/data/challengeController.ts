import {
  solveChallenge,
  type ChallengeBrowser,
  type ChallengeSolution,
  type ClearanceStore,
} from "@ryuunest/core";

/**
 * F100 — une la hoja de confirmación y el navegador visible (`ChallengeHost`) con
 * `solveChallenge` del núcleo. Lo dispara solo el usuario al reintentar tras un
 * `BLOCKED`; el módulo no puede llamarlo. Sin `react-native`, para Vitest.
 */

export type ChallengeState =
  | { phase: "idle" }
  | { phase: "confirm"; host: string }
  | { phase: "browse"; host: string; url: string; domains: readonly string[] };

export interface ChallengeControllerDeps {
  /** Sin almacén (web) no se verifica nada. */
  store: ClearanceStore | undefined;
  /** `permissions.domains` del módulo instalado, o `undefined` si no existe. */
  lookupDomains: (moduleId: string) => Promise<readonly string[] | undefined>;
  now?: () => number;
}

export interface ChallengeController {
  getState(): ChallengeState;
  subscribe(listener: () => void): () => void;
  /** Respuesta de la hoja de confirmación. */
  answer(accepted: boolean): void;
  /** Resultado del navegador: la solución o `null` si se cerró. */
  finish(solution: ChallengeSolution | null): void;
  /** Pregunta, abre el navegador y guarda la verificación. Devuelve si quedó guardada. */
  verify(moduleId: string, url: string): Promise<boolean>;
}

const IDLE: ChallengeState = { phase: "idle" };

export function createChallengeController(deps: ChallengeControllerDeps): ChallengeController {
  let state: ChallengeState = IDLE;
  let busy = false;
  let pendingAnswer: ((accepted: boolean) => void) | null = null;
  let pendingSolution: ((solution: ChallengeSolution | null) => void) | null = null;
  const listeners = new Set<() => void>();

  const set = (next: ChallengeState) => {
    state = next;
    for (const listener of listeners) listener();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    answer(accepted) {
      const resolve = pendingAnswer;
      pendingAnswer = null;
      if (!accepted) set(IDLE);
      resolve?.(accepted);
    },
    finish(solution) {
      const resolve = pendingSolution;
      pendingSolution = null;
      set(IDLE);
      resolve?.(solution);
    },
    async verify(moduleId, url) {
      const store = deps.store;
      if (busy || store === undefined) return false;
      busy = true;
      try {
        const domains = await deps.lookupDomains(moduleId);
        if (domains === undefined) return false;
        const browser: ChallengeBrowser = {
          solve: (target) =>
            new Promise((resolve) => {
              pendingSolution = resolve;
              set({ phase: "browse", host: new URL(target).hostname, url: target, domains });
            }),
        };
        return await solveChallenge(url, {
          domains,
          browser,
          store,
          clock: { now: deps.now ?? (() => Date.now()) },
          confirm: (host) =>
            new Promise((resolve) => {
              pendingAnswer = resolve;
              set({ phase: "confirm", host });
            }),
        });
      } catch {
        // URL fuera de los dominios del módulo o fallo del almacén: no se verifica.
        return false;
      } finally {
        busy = false;
        if (state.phase !== "idle") set(IDLE);
      }
    },
  };
}
