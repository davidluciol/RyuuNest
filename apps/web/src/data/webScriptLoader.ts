import { ModuleError, type ModuleApi, type ModuleErrorCode, type ScriptFactory, type ScriptLoader } from "@ryuunest/core";

import { buildLoadOrder, rewriteImports } from "./moduleGraph";
import { createHandleRegistry, createRpcEndpoint, dispatchHandleCall, wrapRemote } from "./workerRpc";

/**
 * F25 — `ScriptLoader` de la web (SPEC §10, D1-A): cada paquete de módulo
 * `script` se carga en un **Web Worker sin DOM**: se crea un blob URL por
 * archivo (en orden de dependencias, con los import relativos reescritos, ver
 * `moduleGraph`) y el worker importa la entrada. El `Host` real vive en el
 * hilo principal y el worker lo usa a través de proxies RPC (`workerRpc`).
 *
 * Un worker por módulo (uno por `load`); los módulos montados quedan cacheados
 * por el montador, así que vive lo que la app.
 */
export function createWebScriptLoader(): ScriptLoader {
  return {
    async load(files, entry) {
      const order = buildLoadOrder(files, entry);
      const urls: Record<string, string> = {};
      for (const path of order) {
        const code = rewriteImports(files[path] as string, path, (dep) => urls[dep] as string);
        urls[path] = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      }

      const worker = new Worker(new URL("./moduleWorker.ts", import.meta.url), { type: "module" });
      const registry = createHandleRegistry();
      const endpoint = createRpcEndpoint((message) => worker.postMessage(message));
      worker.onmessage = (event: MessageEvent) => endpoint.handleMessage(event.data);
      endpoint.setRequestHandler(async (type, payload) => {
        if (type !== "host-call") throw new Error(`El worker no puede pedir «${type}» al principal`);
        return dispatchHandleCall(
          registry,
          payload.handle as string,
          payload.prop as string,
          (payload.args as unknown[]) ?? [],
        );
      });

      const callWorker = async (type: string, payload: Record<string, unknown>): Promise<unknown> => {
        try {
          return await endpoint.call(type, payload);
        } catch (error) {
          throw toModuleError(error);
        }
      };

      await callWorker("load", { files: urls, entry });

      const factory: ScriptFactory = (host) => {
        const hostHandle = registry.register(host);
        return callWorker("create", { hostHandle }).then(
          () =>
            wrapRemote({ __handle: "api" }, (_handle, path, args) =>
              callWorker("call", { method: path, args }),
            ) as ModuleApi,
        );
      };
      return factory;
    },
  };
}

/** Un error que cruza la frontera con `code` se reconstruye como `ModuleError`. */
function toModuleError(error: unknown): Error {
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") {
    return new ModuleError(code as ModuleErrorCode, (error as Error).message);
  }
  return error instanceof Error ? error : new Error(String(error));
}
