/**
 * F27 — estado observable de la extensión de navegador (SPEC §10), para que la
 * interfaz avise de lo accionable: que falta la extensión, o que hay dominios
 * por autorizar. Lo escribe el adaptador `Http` (`extensionHttp`) y lo lee la
 * interfaz con `useSyncExternalStore`: `get()` devuelve la misma instantánea
 * mientras nada cambie.
 */
export type ExtensionState = "unknown" | "ready" | "missing";

export interface ExtensionStatus {
  readonly state: ExtensionState;
  /** Hosts que una petición pidió y el usuario aún no autorizó en la extensión. */
  readonly pendingDomains: readonly string[];
}

export interface ExtensionStatusStore {
  get(): ExtensionStatus;
  subscribe(listener: () => void): () => void;
  setState(state: ExtensionState): void;
  addPendingDomain(host: string): void;
  removePendingDomain(host: string): void;
  clearPendingDomains(): void;
}

export function createExtensionStatus(): ExtensionStatusStore {
  let snapshot: ExtensionStatus = { state: "unknown", pendingDomains: [] };
  const listeners = new Set<() => void>();

  function update(next: ExtensionStatus): void {
    snapshot = next;
    for (const listener of [...listeners]) listener();
  }

  return {
    get: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setState(state) {
      if (state !== snapshot.state) update({ ...snapshot, state });
    },
    addPendingDomain(host) {
      if (!snapshot.pendingDomains.includes(host)) {
        update({ ...snapshot, pendingDomains: [...snapshot.pendingDomains, host] });
      }
    },
    removePendingDomain(host) {
      if (snapshot.pendingDomains.includes(host)) {
        update({ ...snapshot, pendingDomains: snapshot.pendingDomains.filter((d) => d !== host) });
      }
    },
    clearPendingDomains() {
      if (snapshot.pendingDomains.length > 0) update({ ...snapshot, pendingDomains: [] });
    },
  };
}
