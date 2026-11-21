import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import NewFolderSheet from "../../../components/NewFolderSheet";
import SaveFolderSheet from "../../../components/SaveFolderSheet";
import ErrorState from "../../../components/ErrorState";
import { retryWithChallenge } from "../../../data/appChallenge";
import { resolveErrorReporter } from "../../../data/errorLog";
import LoadingState from "../../../components/LoadingState";
import SafeScreen from "../../../components/SafeScreen";
import { t } from "../../../i18n";
import { readingOrder } from "../../../reader/readingOrder";
import SeriesScreen from "../../../screens/series/SeriesScreen";
import { resolveReadingSource } from "../../../screens/reader/readingSource";
import { preferredRelease } from "../../../screens/series/seriesFixtures";
import {
  createAndSave,
  loadSaveOptions,
  saveInFolder,
  type SaveFolderState,
} from "../../../screens/series/saveFolder";
import { useSeriesData } from "../../../screens/series/useSeriesData";

/**
 * F17/F18 — ruta de la ficha de serie: lee `details()` del módulo con su progreso (useSeriesData)
 * y abre el lector desde «Continuar/Empezar» o desde un capítulo. El favorito se guarda en la base
 * junto con su serie (P-126) y la edición preferida se guarda como grupo por serie (F17); la
 * carpeta se elige en la hoja «Guardar» (F96): una sola carpeta; sin carpetas propias, Gemas.
 */
export default function SeriesRoute() {
  return (
    <SafeScreen>
      <SeriesRouteContent />
    </SafeScreen>
  );
}

function SeriesRouteContent() {
  const { moduleId, seriesId } = useLocalSearchParams<{ moduleId: string; seriesId: string }>();
  const { view, retry } = useSeriesData(moduleId, seriesId);
  const [favorite, setFavorite] = useState(false);
  const [saveState, setSaveState] = useState<SaveFolderState | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preferredReleaseId, setPreferredReleaseId] = useState<string | null>(null);
  const savedFavorite = view.status === "ready" ? view.data.favorite : undefined;
  const savedRelease = view.status === "ready" ? view.data.preferredReleaseId : undefined;

  useEffect(() => {
    if (savedFavorite !== undefined) setFavorite(savedFavorite);
  }, [savedFavorite]);

  useEffect(() => {
    if (savedRelease !== undefined) setPreferredReleaseId(savedRelease);
  }, [savedRelease]);

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
          onRetry={retryWithChallenge(moduleId, view.error, retry)}
          detailLabel={t("actions.showDetail")}
        />
      </View>
    );
  }

  const data = { ...view.data, preferredReleaseId };

  const reportError = async (code: string, error: unknown) => {
    const reporter = await resolveErrorReporter();
    reporter.report("error", code, error instanceof Error ? error.message : String(error), {
      moduleId,
      seriesId,
    });
  };

  const openSave = () => {
    resolveReadingSource()
      .then((source) => loadSaveOptions(source.driver, moduleId, seriesId))
      .then((state) => {
        setSaveState(state);
        setSaveOpen(true);
      })
      .catch((error: unknown) => reportError("series.save.internal", error));
  };

  const afterSave = (state: SaveFolderState, id: string) => {
    setFavorite(id === state.favoritesId);
    setSaveOpen(false);
  };

  const selectFolder = (id: string) => {
    if (saveState === null) return;
    resolveReadingSource()
      .then((source) => saveInFolder(source.driver, moduleId, seriesId, data.details, id))
      .then(() => afterSave(saveState, id))
      .catch((error: unknown) => reportError("series.save.internal", error));
  };

  const openReader = (chapterId: string, releaseId: string | null) =>
    router.push({
      pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
      params: {
        moduleId,
        seriesId,
        chapterId,
        ...(releaseId === null ? {} : { release: releaseId }),
      },
    });

  const openChapter = (chapterId: string) => {
    const chapter = data.details.chapters.find((item) => item.id === chapterId);
    if (chapter !== undefined) {
      openReader(chapterId, preferredRelease(chapter.releases, preferredReleaseId)?.id ?? null);
    }
  };

  return (
    <>
      <SeriesScreen
        data={data}
        favorite={favorite}
        onBack={() => router.back()}
        onContinue={() => {
          const target =
            data.progress?.chapterId ?? readingOrder(data.details.chapters)[0]?.id ?? null;
          if (target !== null) openChapter(target);
        }}
        onFavoriteToggle={() => {
          resolveReadingSource()
            .then((source) => source.toggleFavorite(moduleId, seriesId, data.details))
            .then(setFavorite)
            .catch(async (error: unknown) => {
              const reporter = await resolveErrorReporter();
              reporter.report(
                "error",
                "series.favorite.internal",
                error instanceof Error ? error.message : String(error),
                { moduleId, seriesId },
              );
            });
        }}
        onSave={openSave}
        onReleaseSelect={(chapterId, releaseId) => {
          const chapter = data.details.chapters.find((item) => item.id === chapterId);
          const release = chapter?.releases.find((item) => item.id === releaseId);
          if (release === undefined) return;
          setPreferredReleaseId(release.group ?? release.id);
          resolveReadingSource()
            .then((source) => source.setPreferredRelease(moduleId, seriesId, release))
            .catch(async (error: unknown) => {
              const reporter = await resolveErrorReporter();
              reporter.report(
                "error",
                "series.release.internal",
                error instanceof Error ? error.message : String(error),
                { moduleId, seriesId },
              );
            });
        }}
        onChapterPress={openReader}
      />
      {saveState === null ? null : (
        <>
          <SaveFolderSheet
            visible={saveOpen && !creating}
            options={saveState.options}
            currentId={saveState.currentId}
            onSelect={selectFolder}
            onCreate={() => setCreating(true)}
            onClose={() => setSaveOpen(false)}
          />
          <NewFolderSheet
            visible={creating}
            existingNames={saveState.options.map((o) => o.name)}
            availableTags={saveState.tags}
            onSubmit={async (name, tags) => {
              const source = await resolveReadingSource();
              const problem = await createAndSave(
                source.driver,
                moduleId,
                seriesId,
                data.details,
                name,
                tags,
              );
              if (problem === null) {
                setFavorite(false);
                setSaveOpen(false);
              }
              return problem;
            }}
            onClose={() => setCreating(false)}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  stateWrap: { flex: 1, justifyContent: "center", backgroundColor: dragonNightColors.bg },
});
