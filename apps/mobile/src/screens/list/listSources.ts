import type { SqlDriver } from "@ryuunest/core";

import { loadRecentList, type LoadHomeOptions } from "../home/homeData";
import { SAMPLE_HOME_DATA, type HomeProgress } from "../home/homeFixtures";

/**
 * F82 — fuentes de la pantalla de lista reutilizable. La ruta `/list/<source>` elige una;
 * una lista nueva se añade aquí (título + cargador + reserva web) sin tocar la pantalla.
 */
export interface ListSource {
  /** Clave de traducción del título. */
  titleKey: "home.section.recent";
  /** Clave de traducción del vacío. */
  emptyKey: "list.empty.recent";
  load: (driver: SqlDriver, options: LoadHomeOptions) => Promise<HomeProgress[]>;
  /** Web de Expo (sin base local) hasta F49. */
  fallback: HomeProgress[];
}

export const LIST_SOURCES = {
  recent: {
    titleKey: "home.section.recent",
    emptyKey: "list.empty.recent",
    load: loadRecentList,
    fallback: SAMPLE_HOME_DATA.recent,
  },
} as const satisfies Record<string, ListSource>;

export type ListSourceId = keyof typeof LIST_SOURCES;

export function listSourceOf(id: string | undefined): ListSource | null {
  return id !== undefined && Object.hasOwn(LIST_SOURCES, id)
    ? LIST_SOURCES[id as ListSourceId]
    : null;
}
