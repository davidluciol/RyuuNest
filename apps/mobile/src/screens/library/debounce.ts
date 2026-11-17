import { useEffect, useRef, useState } from "react";

/**
 * F55 — espera corta antes de filtrar la biblioteca mientras se escribe. `createDebouncer` es
 * la parte pura (se prueba con relojes falsos); `useDebouncedValue` la usa en la pantalla.
 */
export interface Debouncer<T> {
  /** Programa `emit(value)` tras `delay` ms; un valor nuevo cancela el pendiente. */
  push: (value: T) => void;
  /** Descarta lo pendiente. */
  cancel: () => void;
}

export function createDebouncer<T>(delay: number, emit: (value: T) => void): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    push: (value) => {
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        emit(value);
      }, delay);
    },
    cancel,
  };
}

/** Pausa tras la última pulsación antes de buscar; corta para que se sienta inmediata. */
export const SEARCH_DEBOUNCE_MS = 150;

/** Devuelve `value` con retraso: sigue al valor solo cuando deja de cambiar `delay` ms. */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  const debouncer = useRef<Debouncer<T> | null>(null);
  useEffect(() => {
    debouncer.current = createDebouncer(delay, setDebounced);
    return () => debouncer.current?.cancel();
  }, [delay]);
  useEffect(() => {
    debouncer.current?.push(value);
  }, [value]);
  return debounced;
}
