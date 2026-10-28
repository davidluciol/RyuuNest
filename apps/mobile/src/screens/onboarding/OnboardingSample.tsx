import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import { OFFICIAL_REPO_URL } from "../../data/officialRepo";
import { createSampleSourcesService } from "../sources/sampleSourcesService";
import { EMPTY_SOURCES_DATA } from "../sources/sourcesFixtures";
import OnboardingScreen from "./OnboardingScreen";
import { useOnboardingSession } from "./useOnboardingData";

/**
 * F12 — el flujo de primer uso montado sobre el servicio de ejemplo, vacío al
 * empezar (solo galería y e2e; la app usa el servicio real sobre SQLite).
 * Instalar recorre la confirmación real del servicio de ejemplo (AC-8). Al
 * terminar («Saltar» o «Ir a leer») muestra el texto de completado.
 */

export default function OnboardingSample() {
  const [service] = useState(() => createSampleSourcesService(EMPTY_SOURCES_DATA));
  const [done, setDone] = useState(false);
  const complete = useCallback(async () => {
    setDone(true);
  }, []);
  const session = useOnboardingSession({ service, complete });

  return (
    <View style={styles.wrap} testID="onboarding-sample">
      {done ? (
        <Text style={styles.done}>{t("onboarding.done")}</Text>
      ) : (
        <OnboardingScreen
          step={session.step}
          view={session.view}
          flow={session.flow}
          controller={session.controller}
          notice={session.notice}
          suggestedUrl={OFFICIAL_REPO_URL}
          onRetry={session.retry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 0, minHeight: spacing["2xl"] * 12, backgroundColor: dragonNightColors.bg },
  done: {
    ...textStyle(typography.bodyLg),
    color: dragonNightColors.textPrimary,
    padding: spacing.md,
    textAlign: "center",
  },
});
