import type { ModuleCapability } from "./types.js";

/** Lo que un módulo declara sobre paginar y ordenar por más reciente (F83). */
export interface ModulePaging {
  paginates: boolean;
  sortsLatest: boolean;
}

/** `sortLatest` sin `paginated` no vale: la lista «más reciente» es una lista paginada. */
export function modulePaging(capabilities: readonly ModuleCapability[]): ModulePaging {
  const paginates = capabilities.includes("paginated");
  return { paginates, sortsLatest: paginates && capabilities.includes("sortLatest") };
}
