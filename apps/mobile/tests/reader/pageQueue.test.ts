import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPageQueue, type PageQueueOptions } from "../../src/reader/pageQueue";

/**
 * R1 — cola de carga de páginas del lector: prioridad por cercanía, tope de concurrencia,
 * timeout, reintentos con backoff, cancelación de lo pendiente y resultados viejos ignorados.
 */

type Pending = { index: number; resolve: (ok: boolean) => void };

function harness(count: number, options: Partial<PageQueueOptions> = {}) {
  const pending: Pending[] = [];
  const calls: number[] = [];
  const queue = createPageQueue({
    count,
    maxConcurrent: 3,
    ahead: 6,
    behind: 2,
    timeoutMs: 30_000,
    retryBaseMs: 1_000,
    maxAutoRetries: 2,
    random: () => 0.5,
    ...options,
    load: (index) =>
      new Promise<boolean>((resolve) => {
        calls.push(index);
        pending.push({ index, resolve });
      }),
  });
  const settle = async (index: number, ok: boolean) => {
    const at = pending.findIndex((job) => job.index === index);
    if (at < 0) throw new Error(`sin petición para ${index}`);
    const [job] = pending.splice(at, 1);
    job?.resolve(ok);
    await vi.advanceTimersByTimeAsync(0);
  };
  const statuses = () => Array.from({ length: count }, (_v, i) => queue.getState(i).status);
  return { queue, pending, calls, settle, statuses };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createPageQueue", () => {
  it("arranca en idle y no pide nada hasta enfocar", () => {
    const { queue, calls } = harness(30);
    expect(queue.getState(0)).toEqual({ status: "idle", attempt: 0, permanent: false });
    expect(calls).toEqual([]);
  });

  it("prioriza la página actual, luego las siguientes y después las anteriores, con tope 3", async () => {
    const { queue, calls, settle, statuses } = harness(30);
    queue.focus(5);
    expect(calls).toEqual([5, 6, 7]);
    expect(statuses().slice(0, 13)).toEqual([
      "idle", "idle", "idle", "queued", "queued",
      "loading", "loading", "loading",
      "queued", "queued", "queued", "queued",
      "idle",
    ]);
    await settle(5, true);
    expect(queue.getState(5).status).toBe("loaded");
    expect(calls).toEqual([5, 6, 7, 8]);
    for (const page of [6, 7, 8]) await settle(page, true);
    expect(calls).toEqual([5, 6, 7, 8, 9, 10, 11]);
    for (const page of [9, 10, 11]) await settle(page, true);
    // Hacia delante se acabó la ventana: siguen las anteriores, la más cercana primero.
    expect(calls.slice(-2)).toEqual([4, 3]);
  });

  it("respeta el tope aunque el capítulo tenga 100 páginas", () => {
    const { queue, pending } = harness(100);
    queue.focus(50);
    expect(pending).toHaveLength(3);
  });

  it("en un capítulo de 5 páginas no pide índices fuera de rango", async () => {
    const { queue, calls, settle } = harness(5);
    queue.focus(4);
    for (const page of [4, 3, 2]) await settle(page, true);
    expect(calls).toEqual([4, 3, 2]);
    expect(queue.getState(1).status).toBe("idle");
  });

  it("con scroll rápido devuelve a idle lo encolado lejano y atiende primero la nueva zona", async () => {
    const { queue, calls, settle, statuses } = harness(100);
    queue.focus(0);
    expect(calls).toEqual([0, 1, 2]);
    queue.focus(60);
    // Lo encolado de la zona vieja (3…6) se descarta; lo que ya estaba en curso termina.
    expect(statuses().slice(3, 7)).toEqual(["idle", "idle", "idle", "idle"]);
    expect(queue.getState(60).status).toBe("queued");
    await settle(1, true);
    expect(calls.at(-1)).toBe(60);
  });

  it("al volver atrás no repite las páginas ya cargadas", async () => {
    const { queue, calls, settle } = harness(30);
    queue.focus(0);
    for (const page of [0, 1, 2, 3, 4, 5, 6]) await settle(page, true);
    queue.focus(20);
    queue.focus(2);
    expect(calls.filter((page) => page <= 6)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("no pide dos veces la misma página aunque se enfoque varias veces", () => {
    const { queue, calls } = harness(30);
    queue.focus(5);
    queue.focus(5);
    queue.focus(6);
    expect(new Set(calls).size).toBe(calls.length);
  });

  it("un timeout libera el hueco y el resultado tardío se ignora", async () => {
    const { queue, calls, settle } = harness(30, { maxAutoRetries: 0 });
    queue.focus(0);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(queue.getState(0).status).toBe("error");
    expect(calls).toEqual([0, 1, 2, 3, 4, 5]);
    await settle(0, true);
    expect(queue.getState(0).status).toBe("error");
  });

  it("reintenta solo con backoff exponencial y jitter, y se detiene al agotar los intentos", async () => {
    const { queue, calls, settle } = harness(1);
    queue.focus(0);
    await settle(0, false);
    // Esperando turno, no en error: la página sigue «en cola».
    expect(queue.getState(0)).toEqual({ status: "queued", attempt: 1, permanent: false });
    await vi.advanceTimersByTimeAsync(1_499);
    expect(calls).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual([0, 0]);
    await settle(0, false);
    await vi.advanceTimersByTimeAsync(2_499);
    expect(calls).toEqual([0, 0]);
    await vi.advanceTimersByTimeAsync(1);
    await settle(0, false);
    expect(queue.getState(0)).toEqual({ status: "error", attempt: 3, permanent: false });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toEqual([0, 0, 0]);
  });

  it("un error permanente no se reintenta solo", async () => {
    const { queue, calls } = harness(30);
    queue.focus(0);
    queue.markFailed(0, true);
    expect(queue.getState(0).status).toBe("error");
    expect(queue.getState(0).permanent).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls.filter((page) => page === 0)).toEqual([0]);
  });

  it("el reintento manual reinicia los intentos y va antes que lo encolado", async () => {
    const { queue, calls, settle } = harness(30);
    queue.focus(0);
    queue.markFailed(1, true);
    queue.retry(1);
    expect(queue.getState(1)).toEqual({ status: "queued", attempt: 0, permanent: false });
    await settle(0, true);
    expect(calls.at(-1)).toBe(1);
  });

  it("markLoaded cierra la página aunque tuviera una petición en curso", async () => {
    const { queue, calls, settle } = harness(30);
    queue.focus(0);
    queue.markLoaded(0);
    expect(queue.getState(0).status).toBe("loaded");
    expect(calls.at(-1)).toBe(3);
    await settle(0, false);
    expect(queue.getState(0).status).toBe("loaded");
  });

  it("tras dispose (cambio de capítulo o salida) no pide más ni cambia estados", async () => {
    const { queue, calls, settle } = harness(30);
    const listener = vi.fn();
    queue.focus(0);
    queue.subscribe(0, listener);
    queue.dispose();
    await settle(0, true);
    expect(queue.getState(0).status).toBe("loading");
    expect(listener).not.toHaveBeenCalled();
    queue.focus(10);
    queue.retry(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toEqual([0, 1, 2]);
  });

  it("avisa solo a quien escucha la página que cambió, con un estado estable entre cambios", async () => {
    const { queue, settle } = harness(30);
    const page0 = vi.fn();
    const page20 = vi.fn();
    const any = vi.fn();
    queue.subscribe(0, page0);
    queue.subscribe(20, page20);
    queue.subscribeAll(any);
    queue.focus(0);
    const loading = queue.getState(0);
    expect(queue.getState(0)).toBe(loading);
    await settle(0, true);
    // queued → loading → loaded
    expect(page0).toHaveBeenCalledTimes(3);
    expect(page20).not.toHaveBeenCalled();
    expect(any).toHaveBeenCalled();
  });
});
