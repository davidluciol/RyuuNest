import HomeScreen from "../../screens/home/HomeScreen";
import { SAMPLE_HOME_DATA } from "../../screens/home/homeFixtures";
import OnboardingScreen from "../../screens/onboarding/OnboardingScreen";
import { useOnboardingData } from "../../screens/onboarding/useOnboardingData";
import { OFFICIAL_REPO_URL } from "../../data/officialRepo";

/**
 * F13 — ruta Inicio: pantalla completa con datos de ejemplo coherentes.
 * Sustituye al marco navegable de F11 (DestinationFrame).
 *
 * F12: en el primer uso (nada añadido aún, RF-1) el flujo de bienvenida
 * sustituye a Inicio hasta completarse o saltarse (AC-1). En web nunca hay
 * primer uso (datos de ejemplo, P-79).
 */
export default function HomeRoute() {
  const phase = useOnboardingData();

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
      />
    );
  }

  return <HomeScreen data={SAMPLE_HOME_DATA} />;
}
