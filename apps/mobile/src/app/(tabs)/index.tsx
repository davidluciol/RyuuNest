import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import ErrorState from "../../components/ErrorState";
import { t } from "../../i18n";
import { destinationRoutes } from "../../navigation/routes";

import HomeScreen from "../../screens/home/HomeScreen";
import type { HomeProgress } from "../../screens/home/homeFixtures";
import { useHomeData } from "../../screens/home/useHomeData";
import { useSettingsPreferences } from "../../screens/settings/useSettingsData";
import OnboardingScreen from "../../screens/onboarding/OnboardingScreen";
import { useOnboardingData } from "../../screens/onboarding/useOnboardingData";
import { useBackupData } from "../../screens/settings/backup/useBackupData";
import { OFFICIAL_REPO_URL } from "../../data/officialRepo";
import { isNativePlatform } from "../../data/backupFilesPort";

/**
 * F13 — ruta Inicio: pantalla completa. F46: con datos reales del dispositivo
 * (web de Expo: datos de ejemplo hasta F49).
 *
 * F12: en el primer uso (nada añadido aún, RF-1) el flujo de bienvenida
 * sustituye a Inicio hasta completarse o saltarse (AC-1). En web nunca hay
 * primer uso (datos de ejemplo, P-79).
 *
 * F21b: en el primer uso, el botón «Importar respaldo» del paso 2 se ofrece
 * en TV (SPEC §11.8: el primer uso en TV lo prioriza) y, para poder probarlo
 * en web, también en la galería; en el móvil nativo queda en Ajustes.
 */
function openReader(item: HomeProgress): void {
  router.push({
    pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
    params: { moduleId: item.moduleId, seriesId: item.seriesId, chapterId: item.chapterId },
  });
}

/** F46 — Inicio con lo guardado en el dispositivo; el vacío lleva a Portales (P-141). */
function HomeContent() {
  const settings = useSettingsPreferences();
  const home = useHomeData(settings.nsfwVisible);

  if (home.status === "ready") {
    return (
      <HomeScreen
        data={home.data}
        onContinue={openReader}
        onRecentPress={openReader}
        onFolderPress={() => router.push(destinationRoutes.library)}
        onSeeAllFolders={() => router.push(destinationRoutes.library)}
        onEmptyAction={() => router.push(destinationRoutes.sources)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {home.status === "error" ? (
        <ErrorState
          title={t("state.error.home.title")}
          message={t("state.error.home.message")}
          retryLabel={t("actions.retry")}
          onRetry={home.reload}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", backgroundColor: dragonNightColors.bg },
});

function FirstUseRoute() {
  const phase = useOnboardingData();
  const backup = useBackupData();
  // En nativo móvil el respaldo vive en Ajustes; en TV y en web se ofrece aquí.
  const [showBackup] = useState(() => isNativePlatform() && !isTvLike());
  const offerBackup = !showBackup;

  if (phase.status === "loading") return <HomeContent />;
  if (phase.status === "error") return <HomeContent />;

  if (phase.status === "first-use") {
    const { session } = phase;
    return (
      <OnboardingScreen
        step={session.step}
        view={session.view}
        flow={session.flow}
        controller={session.controller}
        notice={session.notice}
        suggestedUrl={OFFICIAL_REPO_URL}
        onRetry={session.retry}
        {...(offerBackup ? { backupFlow: backup.flow, backupController: backup.controller } : {})}
      />
    );
  }

  return <HomeContent />;
}

/** Heurística de TV sin importar `react-native` en la ruta (ver `backupFilesPort`). */
function isTvLike(): boolean {
  return typeof navigator !== "undefined" && /TV|SmartTV|SMART-TV/i.test(navigator.userAgent);
}

export default function HomeRoute() {
  return <FirstUseRoute />;
}
