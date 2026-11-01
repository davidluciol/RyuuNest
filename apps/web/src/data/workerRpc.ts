/**
 * F25 — códec RPC entre el hilo principal y el Web Worker de un módulo
 * `script` (SPEC §10: los módulos corren en un worker sin DOM).
 *
 * El `Host` y sus respuestas son objetos con métodos: no se pueden clonar con
 * `postMessage`, así que cruzan la frontera como **handles** (`{ __handle }`).
 * Cada lado envuelve el handle en un proxy cuyas llamadas vuelven por RPC y el
 * lado que posee el objeto real las resuelve (y codifica el resultado).
 *
 * Puro y sin dependencias: se prueba en Node con endpoints en bucle; el worker
 * real (`moduleWorker.ts`) solo conecta `self`.
 */

export type PostFn = (message: unknown) => void;

export interface SerializedError {
  message: string;
  name: string;
  code?: string;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return {
      message: error.message,
      name: error.name,
      ...(typeof code === "string" ? { code } : {}),
    };
  }
  return { message: String(error), name: "Error" };
}

export function deserializeError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);
  error.name = serialized.name;
  if (serialized.code !== undefined) {
    (error as { code?: string }).code = serialized.code;
  }
  return error;
}

/** Registro de objetos reales que sobreviven en un lado de la frontera. */
export interface HandleRegistry {
  /** Registra un objeto/función y devuelve su handle. */
  register(value: unknown): string;
  get(handle: string): unknown;
  /** Forma clonable: primitivos tal cual, arrays recursivos, objetos → `{ __handle }`. */
  encode(value: unknown): unknown;
}

export function createHandleRegistry(): HandleRegistry {
  const objects = new Map<string, unknown>();
  let next = 1;

  function encode(value: unknown): unknown {
    if (value === null) return null;
    const type = typeof value;
    if (type !== "object" && type !== "function") return value;
    if (Array.isArray(value)) return value.map(encode);
    const handle = `h${next++}`;
    objects.set(handle, value);
    return { __handle: handle };
  }

  return {
    register(value) {
      const handle = `h${next++}`;
      objects.set(handle, value);
      return handle;
    },
    get: (handle) => objects.get(handle),
    encode,
  };
}

/**
 * Envuelve un valor recibido del otro lado: los `{ __handle }` se convierten en
 * un proxy remoto cuyas propiedades (incluidas las anidadas, p. ej.
 * `host.settings.get`) son llamadas remotas (`invoke`). Los datos planos
 * (resultados de módulos) pasan tal cual.
 */
export function wrapRemote(
  value: unknown,
  invoke: (handle: string, path: string, args: unknown[]) => Promise<unknown>,
): unknown {
  if (Array.isArray(value)) return value.map((item) => wrapRemote(item, invoke));
  if (value !== null && typeof value === "object") {
    const handle = (value as { __handle?: unknown }).__handle;
    if (typeof handle === "string") return remoteRoot(handle, invoke);
  }
  return value;
}

type Invoke = (handle: string, path: string, args: unknown[]) => Promise<unknown>;

function remoteRef(handle: string, path: string, invoke: Invoke): unknown {
  const callable = (...args: unknown[]) =>
    invoke(handle, path, args).then((result) => wrapRemote(result, invoke));
  return new Proxy(callable, {
    get(_target, prop) {
      if (prop === "then" || typeof prop !== "string") return undefined;
      return remoteRef(handle, `${path}.${prop}`, invoke);
    },
  });
}

function remoteRoot(handle: string, invoke: Invoke): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then" || typeof prop !== "string") return undefined;
        return remoteRef(handle, prop, invoke);
      },
    },
  );
}

/**
 * Lado que posee los objetos reales: resuelve una llamada `handle.path(args)`
 * recorriendo los segmentos (los intermedios son objetos; el último, el método)
 * y codifica el resultado para cruzar de vuelta.
 */
export async function dispatchHandleCall(
  registry: HandleRegistry,
  handle: string,
  path: string,
  args: unknown[],
): Promise<unknown> {
  const segments = path.split(".");
  let target: unknown = registry.get(handle);
  for (const segment of segments.slice(0, -1)) {
    if (target === null || typeof target !== "object") {
      throw new Error(`El handle «${handle}» no tiene la ruta «${path}»`);
    }
    target = (target as Record<string, unknown>)[segment];
  }
  const last = segments[segments.length - 1] ?? "";
  const fn = (target as Record<string, unknown> | null)?.[last];
  if (typeof fn !== "function") {
    throw new Error(`El handle «${handle}» no tiene el método «${path}»`);
  }
  return registry.encode(await (fn as (...a: unknown[]) => unknown).apply(target, args));
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

interface WireMessage {
  id: number;
  type: string;
  __req?: boolean;
  ok?: boolean;
  value?: unknown;
  error?: SerializedError;
  [key: string]: unknown;
}

export interface RpcEndpoint {
  /** Envía una petición y espera la respuesta (con id). */
  call(type: string, payload?: Record<string, unknown>): Promise<unknown>;
  /** Atiende mensajes entrantes (respuestas y peticiones). */
  handleMessage(message: unknown): void;
  /** Registra el handler de peticiones entrantes (cada lado atiende las suyas). */
  setRequestHandler(handler: (type: string, payload: Record<string, unknown>) => Promise<unknown>): void;
}

/** Un extremo del canal RPC (vale tanto en el hilo principal como en el worker). */
export function createRpcEndpoint(post: PostFn): RpcEndpoint {
  const pending = new Map<number, Pending>();
  let nextId = 1;
  let onRequest: ((type: string, payload: Record<string, unknown>) => Promise<unknown>) | undefined;

  function call(type: string, payload: Record<string, unknown> = {}): Promise<unknown> {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      post({ id, type, __req: true, ...payload });
    });
  }

  function handleMessage(message: unknown): void {
    const msg = message as WireMessage;
    if (typeof msg?.id !== "number") return;
    if (msg.__req === true) {
      if (typeof msg.type !== "string" || onRequest === undefined) return;
      void onRequest(msg.type, msg)
        .then((value) => post({ id: msg.id, type: "reply", ok: true, value }))
        .catch((error: unknown) =>
          post({ id: msg.id, type: "reply", ok: false, error: serializeError(error) }),
        );
      return;
    }
    const entry = pending.get(msg.id);
    if (entry === undefined) return;
    pending.delete(msg.id);
    if (msg.ok === true) entry.resolve(msg.value);
    else entry.reject(deserializeError(msg.error ?? { message: "Error remoto", name: "Error" }));
  }

  return {
    call,
    handleMessage,
    setRequestHandler(handler) {
      onRequest = handler;
    },
  };
}
