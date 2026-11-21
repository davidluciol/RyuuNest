import { useSyncExternalStore } from "react";

/**
 * F45/V4 — mientras dura el primer uso la barra inferior no se muestra (no se
 * puede salir a medias). La ruta de Inicio publica aquí el estado y el
 * navegador del shell lo lee.
 */
let active = false;
const listeners = new Set<() => void>();

export function setFirstUseActive(next: boolean): void {
  if (active === next) return;
  active = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFirstUseActive(): boolean {
  return useSyncExternalStore(subscribe, () => active);
}
