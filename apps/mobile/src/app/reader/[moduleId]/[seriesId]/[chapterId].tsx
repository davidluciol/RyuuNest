import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { activeColors, spacing } from "@ryuunest/ui-tokens";

import Button from "../../../../components/Button";
import ErrorBanner from "../../../../components/ErrorBanner";
import LoadingState from "../../../../components/LoadingState";
import { retryWithChallenge } from "../../../../data/appChallenge";
import { appReport } from "../../../../data/appReport";
import { t } from "../../../../i18n";
import ReaderScreen from "../../../../screens/reader/ReaderScreen";
import { useReader } from "../../../../screens/reader/useReader";
import { themedStyles } from "../../../../components/themedStyles";

/**
 * F18 — ruta del lector, a pantalla completa y fuera del shell de destinos. Solo conecta la
 * carga (`useReader`) con la pantalla y la navegación. `?release=` elige la edición del capítulo.
 *
 * F31: el error al abrir el capítulo es un banner estático inline (sin
 * animación, Regla 4) dentro del lienzo, con reintentar y volver; el fallo
 * queda registrado en `log` (P-72) desde `useReader`.
 */
export default function ReaderRoute() {
  const { moduleId, seriesId, chapterId, release } = useLocalSearchParams<{
    moduleId: string;
    seriesId: string;
    chapterId: string;
    release?: string;
  }>();
  const { view, actions, preload } = useReader({
    moduleId,
    seriesId,
    chapterId,
    releaseId: release,
  });

  // Cerrar vuelve a la ficha; si el lector se abrió directo, no hay atrás y se abre la ficha.
  const close = () => {
    if (router.canGoBack()) router.back();
    else
      router.replace({ pathname: "/series/[moduleId]/[seriesId]", params: { moduleId, seriesId } });
  };

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-reader-loading">
        <LoadingState title={t("reader.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="screen-reader-error">
        <View style={styles.bannerWrap}>
          <ErrorBanner
            title={t("reader.error.title")}
            message={view.error.cause}
            detail={{
              ...(view.error.moduleName === "" ? {} : { module: view.error.moduleName }),
              url: view.error.url,
              code: view.error.code,
              selector: view.error.selector,
            }}
            code={view.error.code}
            actionLabel={t("actions.retry")}
            onAction={retryWithChallenge(moduleId, view.error, actions.retry)}
            detailLabel={t("actions.showDetail")}
            onReport={() =>
              void appReport.open({ code: view.error.code, message: view.error.cause, moduleId })
            }
            testID="reader-error-banner"
          />
        </View>
        <View style={styles.back}>
          <Button variant="secondary" label={t("actions.back")} onPress={close} />
        </View>
      </View>
    );
  }

  return (
    <ReaderScreen
      ready={view.ready}
      preload={preload}
      actions={actions}
      onClose={close}
      onReportPage={(failure) => void appReport.open({ ...failure, moduleId })}
      onOpenChapter={(nextChapterId, releaseId) =>
        router.replace({
          pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
          params: {
            moduleId,
            seriesId,
            chapterId: nextChapterId,
            ...(releaseId === null ? {} : { release: releaseId }),
          },
        })
      }
    />
  );
}

const styles = themedStyles(() => ({
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: activeColors.bg,
  },
  bannerWrap: { width: "100%" },
  back: { padding: spacing.md, alignItems: "center" },
}));
