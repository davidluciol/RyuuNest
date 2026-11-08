import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { resolveErrorReporter } from "../../data/errorLog";
import { destinationRoutes } from "../../navigation/routes";
import DiscoverScreen from "../../screens/discover/DiscoverScreen";
import { useDiscoverData } from "../../screens/discover/useDiscoverData";
import { useSettingsPreferences } from "../../screens/settings/useSettingsData";

/**
 * F15 — ruta Descubrir: solo conecta el estado (useDiscoverData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11).
 * Tocar una serie no navega todavía: la ficha de serie llega con F17.
 */
export default function DiscoverRoute() {
  const settings = useSettingsPreferences();
  const { view, selectModule, search, nextPage, prevPage, retry, refreshModules } = useDiscoverData({
    resolveReporter: resolveErrorReporter,
    nsfwVisible: settings.nsfwVisible,
  });

  // Las pestañas siguen montadas: al volver se releen los módulos por si se
  // activó, desactivó, instaló o desinstaló alguno en Portales (F32).
  useFocusEffect(
    useCallback(() => {
      refreshModules();
    }, [refreshModules]),
  );

  return (
    <DiscoverScreen
      view={view}
      nsfwVisible={settings.nsfwVisible}
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
      onOpenSettings={() => router.push(destinationRoutes.settings)}
    />
  );
}
