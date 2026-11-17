import type { BottomNavDestination } from "../components/shellStyles";
import { t } from "../i18n";

/** F11: la URL es la fuente de verdad; no hay una segunda selección en estado local. */
export const destinationRoutes = {
  home: "/",
  library: "/library",
  discover: "/discover",
  sources: "/sources",
  settings: "/settings",
} as const satisfies Record<BottomNavDestination, string>;

export function destinationForPath(path: string): BottomNavDestination | null {
  return (
    (Object.keys(destinationRoutes) as BottomNavDestination[]).find(
      (id) => destinationRoutes[id] === path,
    ) ?? null
  );
}

/**
 * Destino que muestra el shell: el de la URL si es una pestaña; si la URL es una
 * pantalla encima (ficha, lector), se conserva el último. Así el navegador de
 * pestañas no se desmonta y «atrás» vuelve a la pestaña de origen.
 */
export function shellDestination(
  path: string,
  previous: BottomNavDestination | null,
): BottomNavDestination | null {
  return destinationForPath(path) ?? previous;
}

/**
 * F60: parámetros de la ruta de Aventuras al buscar desde la cabecera. `ts` cambia en cada
 * envío para que repetir la misma consulta vuelva a lanzarla (la pestaña sigue montada).
 */
export function discoverSearchParams(
  query: string,
  stamp: number,
): { q: string; ts: string } | null {
  const q = query.trim();
  return q === "" ? null : { q, ts: String(stamp) };
}

export function destinationLabel(destination: BottomNavDestination): string {
  const labels: Record<BottomNavDestination, string> = {
    home: t("nav.home"),
    library: t("nav.library"),
    discover: t("nav.discover"),
    sources: t("nav.sources"),
    settings: t("nav.settings"),
  };
  return labels[destination];
}
