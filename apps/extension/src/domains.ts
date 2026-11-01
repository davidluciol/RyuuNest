/**
 * F26 — modelo de dominios de la extensión: qué hosts están **pendientes** de
 * autorizar (los que una petición pidió sin permiso) y cuáles están **ya
 * autorizados** (permisos de origen concedidos). La unidad es el host exacto
 * (P-117); el permiso lo concede el usuario en la página de opciones.
 */

/** Almacén clave-valor (envoltorio de `storage.local`); inyectable en pruebas. */
export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export const PENDING_KEY = "pendingHosts";

/** Tope de pendientes (provisional): los más antiguos se descartan. */
export const MAX_PENDING_HOSTS = 50;

const HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

/** Un host exacto en minúsculas: sin esquema, puerto, ruta ni comodines. */
export function isValidHost(host: string): boolean {
  if (!HOST.test(host)) return false;
  try {
    return new URL(`https://${host}`).hostname === host;
  } catch {
    return false;
  }
}

export interface PendingHosts {
  add(host: string): Promise<void>;
  list(): Promise<string[]>;
  remove(hosts: readonly string[]): Promise<void>;
}

export function createPendingHosts(store: KeyValueStore): PendingHosts {
  // Leer-modificar-escribir en serie: dos anotaciones simultáneas no se pisan.
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<string[]> {
    const value = await store.get(PENDING_KEY);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (entry): entry is string => typeof entry === "string" && isValidHost(entry),
    );
  }

  function update(change: (hosts: string[]) => string[]): Promise<void> {
    const next = queue.then(async () => {
      await store.set(PENDING_KEY, change(await read()));
    });
    queue = next.catch(() => {});
    return next;
  }

  return {
    add(host) {
      if (!isValidHost(host)) return Promise.resolve();
      return update((hosts) => {
        if (hosts.includes(host)) return hosts;
        return [...hosts, host].slice(-MAX_PENDING_HOSTS);
      });
    },
    list: () => queue.then(read),
    remove(hosts) {
      return update((current) => current.filter((host) => !hosts.includes(host)));
    },
  };
}

const GRANTED_PATTERN = /^(?:\*|https?):\/\/([^/*]+)\/\*$/;

/** Hosts concedidos, a partir de `permissions.getAll().origins`. */
export function authorizedHostsFrom(origins: readonly string[]): string[] {
  const hosts: string[] = [];
  for (const origin of origins) {
    const host = GRANTED_PATTERN.exec(origin)?.[1];
    if (host !== undefined && isValidHost(host) && !hosts.includes(host)) hosts.push(host);
  }
  return hosts;
}
