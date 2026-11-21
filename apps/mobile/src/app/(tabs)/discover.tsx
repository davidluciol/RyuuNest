import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";

import { retryWithChallenge } from "../../data/appChallenge";
import { resolveErrorReporter } from "../../data/errorLog";
import { clearModuleSwitcher, publishModuleSwitcher } from "../../navigation/moduleSwitcherStore";
import { destinationRoutes } from "../../navigation/routes";
import DiscoverScreen from "../../screens/discover/DiscoverScreen";
import NsfwNoticeSheet from "../../screens/discover/NsfwNoticeSheet";
import { visibleDiscoverModules } from "../../screens/discover/discoverFixtures";
import { useDiscoverData } from "../../screens/discover/useDiscoverData";
import { useSettingsPreferences } from "../../screens/settings/useSettingsData";

/**
 * F15 — ruta Descubrir: solo conecta el estado (useDiscoverData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11).
 * Tocar una serie no navega todavía: la ficha de serie llega con F17.
 */
export default function DiscoverRoute() {
  const settings = useSettingsPreferences();
  const {
    view,
    more,
    rowMore,
    loadMoreRow,
    loadMore,
    selectModule,
    search,
    applyFilters,
    openSection,
    closeSection,
    retry,
    refreshModules,
    nsfwNotice,
    acknowledgeNsfwNotice,
    declineNsfwNotice,
  } = useDiscoverData({
    resolveReporter: resolveErrorReporter,
    nsfwVisible: settings.nsfwVisible,
  });

  // F88: el selector de módulo vive en la cabecera mientras Aventuras tenga módulos listos.
  useEffect(() => {
    if (view.status !== "ready") {
      clearModuleSwitcher();
      return;
    }
    publishModuleSwitcher({
      modules: visibleDiscoverModules(view.ready.modules, settings.nsfwVisible).map((module) => ({
        id: module.id,
        name: module.name,
      })),
      selectedId: view.ready.selectedModuleId,
      onSelect: selectModule,
    });
  }, [view, settings.nsfwVisible, selectModule]);
  useEffect(() => clearModuleSwitcher, []);

  // F60: la búsqueda de la cabecera llega como `q`; `ts` cambia en cada envío.
  const { q, ts } = useLocalSearchParams<{ q?: string; ts?: string }>();
  useEffect(() => {
    if (q !== undefined) search(q);
  }, [q, ts, search]);

  // Las pestañas siguen montadas: al volver se releen los módulos por si se
  // activó, desactivó, instaló o desinstaló alguno en Portales (F32).
  useFocusEffect(
    useCallback(() => {
      refreshModules();
    }, [refreshModules]),
  );

  return (
    <>
      <DiscoverScreen
        view={view}
        nsfwVisible={settings.nsfwVisible}
        onModuleSelect={selectModule}
        onSearch={search}
        more={more}
        rowMore={rowMore}
        onLoadMoreRow={loadMoreRow}
        onLoadMore={loadMore}
        onApplyFilters={applyFilters}
        onOpenSection={openSection}
        onCloseSection={closeSection}
        onRetry={
          view.status === "error"
            ? retryWithChallenge(view.selectedModuleId, view.error, retry)
            : retry
        }
        onSeriesPress={(entry) =>
          router.push({
            pathname: "/series/[moduleId]/[seriesId]",
            params: { moduleId: entry.moduleId, seriesId: entry.seriesId },
          })
        }
        onEmptyAction={() => router.push(destinationRoutes.sources)}
        onOpenSettings={() => router.push(destinationRoutes.settings)}
      />
      {nsfwNotice === null ? null : (
        <NsfwNoticeSheet
          moduleName={nsfwNotice.name}
          onContinue={acknowledgeNsfwNotice}
          onBack={declineNsfwNotice}
        />
      )}
    </>
  );
}
