/**
 * F24 — tabla de rutas del cliente web. Las pestañas del riel (escritorio) o de
 * la barra inferior (< 1024 px) salen de `TAB_ROUTES`; el resto son rutas fuera
 * de las pestañas (ficha, lector, diagnóstico).
 *
 * Los ids de serie/capítulo son cadenas opacas que pueden llevar `/`, `?` y `=`
 * (ADR-0003), así que siempre van codificados en la URL.
 */

export type TabIcon = "home" | "library" | "compass" | "layers" | "settings";

export interface TabRoute {
  readonly path: string;
  /** Id estable: el marcador e2e es `destination-<id>` y la raíz de la pantalla `screen-<id>`. */
  readonly id: string;
  readonly labelKey: string;
  readonly icon: TabIcon;
}

export const TAB_ROUTES: readonly TabRoute[] = [
  { path: "/", id: "home", labelKey: "nav.home", icon: "home" },
  { path: "/library", id: "library", labelKey: "nav.library", icon: "library" },
  { path: "/discover", id: "discover", labelKey: "nav.discover", icon: "compass" },
  { path: "/sources", id: "sources", labelKey: "nav.sources", icon: "layers" },
  { path: "/settings", id: "settings", labelKey: "nav.settings", icon: "settings" },
];

export const DIAGNOSTICS_PATH = "/diagnostics";

export function seriesPath(moduleId: string, seriesId: string): string {
  return `/series/${encodeURIComponent(moduleId)}/${encodeURIComponent(seriesId)}`;
}

export function readerPath(moduleId: string, seriesId: string, chapterId: string, release?: string): string {
  const base = `/reader/${encodeURIComponent(moduleId)}/${encodeURIComponent(seriesId)}/${encodeURIComponent(chapterId)}`;
  return release === undefined ? base : `${base}?release=${encodeURIComponent(release)}`;
}
