/**
 * R1 — cola de carga de las páginas de un capítulo. Lógica pura; la pantalla le dice qué página
 * se lee (`focus`) y ella decide qué se descarga a disco y en qué orden.
 *
 * - **Prioridad por cercanía:** la actual, luego las siguientes (`ahead`) y después las anteriores
 *   (`behind`). Lo encolado que queda fuera de ese rango vuelve a `idle`: con un scroll rápido no
 *   se descargan páginas por las que ya se pasó.
 * - **Tope de concurrencia** (`maxConcurrent`) y **timeout** por petición: una imagen colgada no
 *   bloquea al resto (antes, una cadena de promesas sí lo hacía).
 * - **Reintentos automáticos** acotados con backoff exponencial y jitter; los errores permanentes
 *   (404, formato inválido) los marca la UI con `markFailed(i, true)` y no se reintentan solos.
 * - **Al volver la red** (`retryFailed`), las páginas en error del rango se piden de nuevo; las
 *   permanentes no.
 * - **Resultados viejos ignorados:** cada petición lleva su ficha; tras un timeout, un
 *   `markLoaded`/`markFailed` o `dispose` (cambio de capítulo, salida) su respuesta ya no cuenta.
 */

export type PageStatus = "idle" | "queued" | "loading" | "loaded" | "error";

export interface PageLoadState {
  status: PageStatus;
  /** Intentos fallidos desde el último reintento manual. */
  attempt: number;
  /** El fallo no se arregla reintentando solo (404, formato inválido). */
  permanent: boolean;
}

export interface PageQueueOptions {
  count: number;
  /** Descarga una página; `true` si quedó disponible. */
  load: (index: number) => Promise<boolean>;
  maxConcurrent: number;
  ahead: number;
  behind: number;
  timeoutMs: number;
  retryBaseMs: number;
  maxAutoRetries: number;
  random?: () => number;
}

export interface PageQueue {
  getState: (index: number) => PageLoadState;
  subscribe: (index: number, listener: () => void) => () => void;
  /** Avisa de cualquier cambio (p. ej. el avance del lote). */
  subscribeAll: (listener: () => void) => () => void;
  focus: (page: number) => void;
  retry: (index: number) => void;
  /** Al volver la red: reintenta las páginas en error que no son permanentes. */
  retryFailed: () => void;
  markLoaded: (index: number) => void;
  markFailed: (index: number, permanent: boolean) => void;
  dispose: () => void;
}

const IDLE: PageLoadState = { status: "idle", attempt: 0, permanent: false };

export function createPageQueue(options: PageQueueOptions): PageQueue {
  const { count, load, maxConcurrent, ahead, behind, timeoutMs, retryBaseMs, maxAutoRetries } =
    options;
  const random = options.random ?? Math.random;
  const states: PageLoadState[] = Array.from({ length: count }, () => IDLE);
  const listeners = new Map<number, Set<() => void>>();
  const allListeners = new Set<() => void>();
  /** Ficha de la petición en curso de cada página; si no coincide, su resultado se ignora. */
  const jobs = new Map<number, { token: number; timer: ReturnType<typeof setTimeout> }>();
  /** Páginas esperando su backoff antes de volver a pedirse. */
  const cooling = new Map<number, ReturnType<typeof setTimeout>>();
  const manual: number[] = [];
  let priority: number[] = [];
  let nextToken = 0;
  let disposed = false;

  const inRange = (index: number) => index >= 0 && index < count;

  function set(index: number, next: PageLoadState): void {
    const current = states[index] as PageLoadState;
    if (
      current.status === next.status &&
      current.attempt === next.attempt &&
      current.permanent === next.permanent
    ) {
      return;
    }
    states[index] = next;
    listeners.get(index)?.forEach((listener) => listener());
    allListeners.forEach((listener) => listener());
  }

  function stopJob(index: number): void {
    const job = jobs.get(index);
    if (job === undefined) return;
    clearTimeout(job.timer);
    jobs.delete(index);
  }

  function stopCooling(index: number): void {
    const timer = cooling.get(index);
    if (timer === undefined) return;
    clearTimeout(timer);
    cooling.delete(index);
  }

  function finish(index: number, token: number, ok: boolean): void {
    if (disposed || jobs.get(index)?.token !== token) return;
    stopJob(index);
    const state = states[index] as PageLoadState;
    if (ok) {
      set(index, { ...state, status: "loaded" });
    } else {
      const attempt = state.attempt + 1;
      if (attempt > maxAutoRetries) {
        set(index, { status: "error", attempt, permanent: false });
      } else {
        // Sigue «en cola» mientras espera: no es un error para quien lee todavía.
        set(index, { status: "queued", attempt, permanent: false });
        // Un reintento manual fuera del rango no está en `priority`: sin esto no volvería a salir.
        if (!priority.includes(index) && !manual.includes(index)) manual.push(index);
        const delay = retryBaseMs * 2 ** (attempt - 1) + random() * retryBaseMs;
        cooling.set(
          index,
          setTimeout(() => {
            cooling.delete(index);
            pump();
          }, delay),
        );
      }
    }
    pump();
  }

  function start(index: number): void {
    const token = (nextToken += 1);
    // shortcut: prefetch no es cancelable; tras el timeout la petición nativa sigue hasta el
    // timeout de OkHttp, pero ya no ocupa hueco. Cambiar si expo-image expone cancelación.
    const timer = setTimeout(() => finish(index, token, false), timeoutMs);
    jobs.set(index, { token, timer });
    set(index, { ...(states[index] as PageLoadState), status: "loading" });
    load(index).then(
      (ok) => finish(index, token, ok),
      () => finish(index, token, false),
    );
  }

  function pump(): void {
    if (disposed) return;
    for (const index of [...manual, ...priority]) {
      // La página que se lee tiene un hueco extra: no espera a peticiones viejas de otra zona.
      const limit = index === priority[0] ? maxConcurrent + 1 : maxConcurrent;
      if (jobs.size >= limit) continue;
      if (states[index]?.status !== "queued" || cooling.has(index)) continue;
      const at = manual.indexOf(index);
      if (at >= 0) manual.splice(at, 1);
      start(index);
    }
  }

  function drop(index: number, next: PageLoadState): void {
    stopJob(index);
    stopCooling(index);
    const at = manual.indexOf(index);
    if (at >= 0) manual.splice(at, 1);
    set(index, next);
  }

  function focus(page: number): void {
    if (disposed) return;
    const order = [page];
    for (let step = 1; step <= ahead; step += 1) order.push(page + step);
    for (let step = 1; step <= behind; step += 1) order.push(page - step);
    priority = order.filter(inRange);
    const wanted = new Set(priority);
    states.forEach((state, index) => {
      if (state.status === "queued" && !wanted.has(index) && !manual.includes(index)) {
        drop(index, IDLE);
      }
    });
    for (const index of priority) {
      if ((states[index] as PageLoadState).status === "idle") {
        set(index, { ...(states[index] as PageLoadState), status: "queued" });
      }
    }
    pump();
  }

  return {
    getState: (index) => states[index] ?? IDLE,
    subscribe(index, listener) {
      const set = listeners.get(index) ?? new Set();
      set.add(listener);
      listeners.set(index, set);
      return () => set.delete(listener);
    },
    subscribeAll(listener) {
      allListeners.add(listener);
      return () => allListeners.delete(listener);
    },
    focus,
    retry(index) {
      if (disposed || !inRange(index)) return;
      drop(index, { status: "queued", attempt: 0, permanent: false });
      manual.push(index);
      pump();
    },
    retryFailed() {
      if (disposed) return;
      states.forEach((state, index) => {
        if (state.status === "error" && !state.permanent) drop(index, IDLE);
      });
      // Volver a enfocar la página actual encola solo las del rango; las lejanas quedan en idle.
      const current = priority[0];
      if (current !== undefined) focus(current);
    },
    markLoaded(index) {
      if (disposed || !inRange(index)) return;
      drop(index, { ...(states[index] as PageLoadState), status: "loaded" });
      pump();
    },
    markFailed(index, permanent) {
      if (disposed || !inRange(index)) return;
      const state = states[index] as PageLoadState;
      drop(index, { status: "error", attempt: Math.max(state.attempt, 1), permanent });
      pump();
    },
    dispose() {
      disposed = true;
      jobs.forEach((job) => clearTimeout(job.timer));
      cooling.forEach((timer) => clearTimeout(timer));
      jobs.clear();
      cooling.clear();
      listeners.clear();
      allListeners.clear();
    },
  };
}
