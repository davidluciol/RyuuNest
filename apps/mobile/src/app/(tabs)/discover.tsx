import { router } from "expo-router";

import { destinationRoutes } from "../../navigation/routes";
import DiscoverScreen from "../../screens/discover/DiscoverScreen";
import { useDiscoverData } from "../../screens/discover/useDiscoverData";

/**
 * F15 — ruta Descubrir: solo conecta el estado (useDiscoverData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11).
 * Tocar una serie no navega todavía: la ficha de serie llega con F17.
 */
export default function DiscoverRoute() {
  const { view, selectModule, search, nextPage, prevPage, retry } = useDiscoverData();

  return (
    <DiscoverScreen
      view={view}
      onModuleSelect={selectModule}
      onSearch={search}
      onNextPage={nextPage}
      onPrevPage={prevPage}
      onRetry={retry}
      onSeriesPress={(entry) =>
        router.push({
          pathname: "/series/[moduleId]/[seriesId]",
          params: { moduleId: entry.moduleId, seriesId: entry.seriesId },
        })
      }
      onEmptyAction={() => router.push(destinationRoutes.sources)}
    />
  );
}
