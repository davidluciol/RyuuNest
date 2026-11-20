import type { DiscoverPage } from "./discoverFixtures";

/** F84 — une la página siguiente al catálogo: sin series repetidas, `hasNext` del sitio. */
export function mergeCatalogPage(current: DiscoverPage, incoming: DiscoverPage): DiscoverPage {
  const seen = new Set(current.entries.map((entry) => entry.seriesId));
  return {
    page: incoming.page,
    hasNext: incoming.hasNext,
    entries: [...current.entries, ...incoming.entries.filter((entry) => !seen.has(entry.seriesId))],
  };
}

/**
 * Pide de una en una la página siguiente. Devuelve `null` si ya no hay más o si
 * hay una petición en curso; un error se propaga y deja reintentar la misma página.
 */
export function createCatalogPager(loadPage: (page: number) => Promise<DiscoverPage>) {
  let inFlight = false;
  return async (current: DiscoverPage): Promise<DiscoverPage | null> => {
    if (inFlight || !current.hasNext) return null;
    inFlight = true;
    try {
      return mergeCatalogPage(current, await loadPage(current.page + 1));
    } finally {
      inFlight = false;
    }
  };
}
