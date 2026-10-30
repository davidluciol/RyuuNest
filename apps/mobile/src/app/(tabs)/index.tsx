import { useState } from "react";

import HomeScreen from "../../screens/home/HomeScreen";
import { SAMPLE_HOME_DATA } from "../../screens/home/homeFixtures";
import OnboardingScreen from "../../screens/onboarding/OnboardingScreen";
import { useOnboardingData } from "../../screens/onboarding/useOnboardingData";
import { useBackupData } from "../../screens/settings/backup/useBackupData";
import { OFFICIAL_REPO_URL } from "../../data/officialRepo";
import { isNativePlatform } from "../../data/backupFilesPort";

/**
 * F13 — ruta Inicio: pantalla completa con datos de ejemplo coherentes.
 * Sustituye al marco navegable de F11 (DestinationFrame).
 *
 * F12: en el primer uso (nada añadido aún, RF-1) el flujo de bienvenida
 * sustituye a Inicio hasta completarse o saltarse (AC-1). En web nunca hay
 * primer uso (datos de ejemplo, P-79).
 *
 * F21b: en el primer uso, el botón «Importar respaldo» del paso 2 se ofrece
 * en TV (SPEC §11.8: el primer uso en TV lo prioriza) y, para poder probarlo
 * en web, también en la galería; en el móvil nativo queda en Ajustes.
 */
function FirstUseRoute() {
  const phase = useOnboardingData();
  const backup = useBackupData();
  // En nativo móvil el respaldo vive en Ajustes; en TV y en web se ofrece aquí.
  const [showBackup] = useState(() => isNativePlatform() && !isTvLike());
  const offerBackup = !showBackup;

  if (phase.status === "loading") return <HomeScreen data={SAMPLE_HOME_DATA} />;
  if (phase.status === "error") return <HomeScreen data={SAMPLE_HOME_DATA} />;

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
        {...(offerBackup
          ? { backupFlow: backup.flow, backupController: backup.controller }
          : {})}
      />
    );
  }

  return <HomeScreen data={SAMPLE_HOME_DATA} />;
}

/** Heurística de TV sin importar `react-native` en la ruta (ver `backupFilesPort`). */
function isTvLike(): boolean {
  return typeof navigator !== "undefined" && /TV|SmartTV|SMART-TV/i.test(navigator.userAgent);
}

export default function HomeRoute() {
  return <FirstUseRoute />;
}
