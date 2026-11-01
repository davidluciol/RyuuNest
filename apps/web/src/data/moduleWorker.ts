/**
 * F25 — Web Worker de un módulo `script` (SPEC §10: sin DOM). Recibe el
 * paquete como blob URLs ya reescritas, importa la entrada, ejecuta
 * `create(host)` con un host proxy (RPC a través de `workerRpc`) y expone la
 * `ModuleApi` resultante por RPC. `host.settings` es local del worker (en
 * memoria; ADR-0003: sin garantía de persistencia) para conservar la firma
 * síncrona del contrato.
 *
 * Este archivo solo corre en el navegador; Vite lo empaqueta como worker de
 * módulo (`new Worker(new URL("./moduleWorker.ts", import.meta.url), …)`).
 */
import { createRpcEndpoint, wrapRemote } from "./workerRpc";

interface WorkerPayload {
  files?: Record<string, string>;
  entry?: string;
  hostHandle?: string;
  method?: string;
  args?: unknown[];
  [key: string]: unknown;
}

const endpoint = createRpcEndpoint((message) => {
  (self as unknown as { postMessage(msg: unknown): void }).postMessage(message);
});

let factory: ((host: unknown) => unknown) | undefined;
let api: Record<string, (...args: unknown[]) => unknown> | undefined;

endpoint.setRequestHandler(async (type: string, payload: Record<string, unknown>) => {
  const p = payload as WorkerPayload;
  if (type === "load") {
    const files = p.files ?? {};
    const entry = p.entry ?? "";
    const url = files[entry];
    if (url === undefined) throw new Error(`El paquete no trae la entrada «${entry}»`);
    const mod = (await import(/* @vite-ignore */ url)) as { default: (host: unknown) => unknown };
    factory = mod.default;
    return;
  }
  if (type === "create") {
    if (factory === undefined) throw new Error("Hay que cargar el módulo antes de crearlo");
    const settingsLocal: Record<string, string> = {};
    const remote = wrapRemote({ __handle: p.hostHandle ?? "" }, (handle, path, args) =>
      endpoint.call("host-call", { handle, prop: path, args }),
    ) as Record<string, unknown>;
    const host = new Proxy(remote, {
      get(target, prop) {
        if (prop === "settings") {
          return {
            get: (key: string) => settingsLocal[key],
            set: (key: string, value: string) => {
              settingsLocal[key] = value;
            },
          };
        }
        if (prop === "log") {
          return (level: string, message: string, data?: unknown) => {
            void endpoint.call("host-call", { handle: p.hostHandle, prop: "log", args: [level, message, data] }).catch(() => {});
          };
        }
        return target[prop as string];
      },
    });
    api = (await factory(host)) as Record<string, (...args: unknown[]) => unknown>;
    return;
  }
  if (type === "call") {
    if (api === undefined) throw new Error("El módulo no está creado todavía");
    const fn = api[p.method ?? ""];
    if (typeof fn !== "function") throw new Error(`El módulo no implementa «${String(p.method)}»`);
    return await fn(...(p.args ?? []));
  }
  throw new Error(`Mensaje desconocido para el worker: ${type}`);
});

(self as unknown as { onmessage: ((event: { data: unknown }) => void) | null }).onmessage = (event) => {
  endpoint.handleMessage(event.data);
};
