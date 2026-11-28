import { buildErrorReport, githubIssueUrl, mailtoUrl, type ErrorReport } from "@ryuunest/core";

import { REPORT_EMAIL, REPORT_GITHUB_REPO } from "../about/appInfo";

/**
 * F103 — capa global de «Mandar reporte» (P-198), con el mismo patrón que la
 * verificación de F100: cualquier error la abre con `open`, el usuario revisa el
 * texto ya limpio y lo envía a mano por GitHub o por correo. Nada sale sin
 * pulsar un canal (RNF-5). Sin `react-native`, para Vitest.
 */

/** Lo que aporta la pantalla que falló. */
export interface ReportRequest {
  code: string;
  message: string;
  stack?: string | undefined;
  moduleId?: string | undefined;
  moduleVersion?: string | undefined;
}

export type ReportChannel = "github" | "email";

export type ReportState =
  | { phase: "idle" }
  | {
      phase: "open";
      request: ReportRequest;
      details: string;
      includeLog: boolean;
      log: readonly string[];
      sending: boolean;
      sendFailed: boolean;
    };

export interface ReportControllerDeps {
  appVersion: string;
  /** Plataforma y versión del SO. */
  platform: string;
  /** Fecha ISO del momento del reporte. */
  now: () => string;
  /** Últimas entradas del registro (vacío si no hay registro, p. ej. web). */
  loadLog: () => Promise<readonly string[]>;
  /** Abre la app de GitHub/navegador o la de correo. */
  openUrl: (url: string) => Promise<void>;
}

export interface ReportController {
  getState(): ReportState;
  subscribe(listener: () => void): () => void;
  open(request: ReportRequest): Promise<void>;
  setDetails(details: string): void;
  setIncludeLog(include: boolean): void;
  /** El reporte tal como saldría, o `null` si la hoja está cerrada. */
  preview(): ErrorReport | null;
  send(channel: ReportChannel): Promise<void>;
  close(): void;
}

const IDLE: ReportState = { phase: "idle" };

export function createReportController(deps: ReportControllerDeps): ReportController {
  let state: ReportState = IDLE;
  let date = "";
  const listeners = new Set<() => void>();

  const set = (next: ReportState) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const patch = (changes: Partial<Extract<ReportState, { phase: "open" }>>) => {
    if (state.phase === "open") set({ ...state, ...changes });
  };

  const preview = (): ErrorReport | null => {
    if (state.phase !== "open") return null;
    return buildErrorReport({
      ...state.request,
      appVersion: deps.appVersion,
      platform: deps.platform,
      date,
      details: state.details,
      log: state.includeLog ? state.log : [],
    });
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async open(request) {
      date = deps.now();
      set({
        phase: "open",
        request,
        details: "",
        includeLog: false,
        log: [],
        sending: false,
        sendFailed: false,
      });
      const log = await deps.loadLog().catch(() => []);
      if (state.phase === "open" && state.request === request) patch({ log });
    },
    setDetails: (details) => patch({ details }),
    setIncludeLog: (includeLog) => patch({ includeLog }),
    preview,
    async send(channel) {
      const report = preview();
      if (report === null || (state.phase === "open" && state.sending)) return;
      patch({ sending: true, sendFailed: false });
      const url =
        channel === "github"
          ? githubIssueUrl(REPORT_GITHUB_REPO, report)
          : mailtoUrl(REPORT_EMAIL, report);
      try {
        await deps.openUrl(url);
        set(IDLE);
      } catch {
        patch({ sending: false, sendFailed: true });
      }
    },
    close: () => set(IDLE),
  };
}
