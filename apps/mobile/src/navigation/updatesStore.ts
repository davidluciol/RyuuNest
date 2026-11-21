import { useSyncExternalStore } from "react";

/**
 * F99 — cuántos módulos instalados tienen versión nueva en el índice ya guardado
 * (sin red: solo lo que dejó el último sync, RNF-5) y la petición «Ver» del banner
 * de abrir la hoja de actualizar al entrar en Portales. Mismo patrón que `firstUseStore`.
 */
let count = 0;
let openRequested = false;
const listeners = new Set<() => void>();

export function setUpdateCount(next: number): void {
  if (count === next) return;
  count = next;
  for (const listener of listeners) listener();
}

let requestTick = 0;

export function requestOpenUpdates(): void {
  openRequested = true;
  // Portales ya puede estar montada y lista: avisa para que su efecto vuelva a correr.
  requestTick += 1;
  for (const listener of listeners) listener();
}

/** Cambia con cada petición «Ver»; entra en las dependencias del efecto que la consume. */
export function useOpenUpdatesTick(): number {
  return useSyncExternalStore(subscribe, () => requestTick);
}

/** Devuelve la petición pendiente una sola vez. */
export function consumeOpenUpdatesRequest(): boolean {
  const pending = openRequested;
  openRequested = false;
  return pending;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUpdateCount(): number {
  return useSyncExternalStore(subscribe, () => count);
}
