import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import ErrorState from "../../../components/ErrorState";
import LoadingState from "../../../components/LoadingState";
import { t } from "../../../i18n";
import { readingOrder } from "../../../reader/readingOrder";
import SeriesScreen from "../../../screens/series/SeriesScreen";
import { preferredRelease } from "../../../screens/series/seriesFixtures";
import { useSeriesData } from "../../../screens/series/useSeriesData";

/**
 * F17/F18 — ruta de la ficha de serie: lee `details()` del módulo con su progreso (useSeriesData)
 * y abre el lector desde «Continuar/Empezar» o desde un capítulo. Favorito, carpeta y edición
 * preferida siguen en el estado de la pantalla hasta que se conecten (F20).
 */
export default function SeriesRoute() {
  const { moduleId, seriesId } = useLocalSearchParams<{ moduleId: string; seriesId: string }>();
  const { view, retry } = useSeriesData(moduleId, seriesId);
  const [favorite, setFavorite] = useState(false);
  const [preferredReleaseId, setPreferredReleaseId] = useState<string | null>(null);

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-series-loading">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="screen-series-error">
        <ErrorState
          title={t("state.error.module.title")}
          message={view.error.cause}
          detail={{
            ...(view.error.moduleName === "" ? {} : { module: view.error.moduleName }),
            url: view.error.url,
            code: view.error.code,
            selector: view.error.selector,
          }}
          retryLabel={t("actions.retry")}
          onRetry={retry}
          detailLabel={t("actions.showDetail")}
        />
      </View>
    );
  }

  const data = { ...view.data, preferredReleaseId };

  const openReader = (chapterId: string, releaseId: string | null) =>
    router.push({
      pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
      params: { moduleId, seriesId, chapterId, ...(releaseId === null ? {} : { release: releaseId }) },
    });

  const openChapter = (chapterId: string) => {
    const chapter = data.details.chapters.find((item) => item.id === chapterId);
    if (chapter !== undefined) {
      openReader(chapterId, preferredRelease(chapter.releases, preferredReleaseId)?.id ?? null);
    }
  };

  return (
    <SeriesScreen
      data={data}
      favorite={favorite}
      onBack={() => router.back()}
      onContinue={() => {
        const target =
          data.progress?.chapterId ?? readingOrder(data.details.chapters)[0]?.id ?? null;
        if (target !== null) openChapter(target);
      }}
      onFavoriteToggle={() => setFavorite((value) => !value)}
      onFolderLongPress={() => undefined}
      onReleaseSelect={(chapterId, releaseId) => {
        const chapter = data.details.chapters.find((item) => item.id === chapterId);
        if (chapter !== undefined && preferredRelease(chapter.releases, releaseId)?.id === releaseId) {
          setPreferredReleaseId(releaseId);
        }
      }}
      onChapterPress={openReader}
    />
  );
}

const styles = StyleSheet.create({
  stateWrap: { flex: 1, justifyContent: "center", backgroundColor: dragonNightColors.bg },
});
