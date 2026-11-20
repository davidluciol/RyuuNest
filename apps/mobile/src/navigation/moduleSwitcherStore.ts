/**
 * F88 — el selector de módulo vive en la cabecera solo en Aventuras. La
 * pantalla publica aquí sus módulos visibles, el elegido y la acción; la
 * cabecera (`ShellNavigator`) los lee. Fuera de Aventuras no hay nada publicado.
 */
export interface ModuleSwitcherState {
  modules: readonly { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

let state: ModuleSwitcherState | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function getModuleSwitcher(): ModuleSwitcherState | null {
  return state;
}

export function publishModuleSwitcher(next: ModuleSwitcherState): void {
  state = next;
  emit();
}

export function clearModuleSwitcher(): void {
  if (state === null) return;
  state = null;
  emit();
}

export function subscribeModuleSwitcher(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
