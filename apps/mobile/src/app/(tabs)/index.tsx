import HomeScreen from "../../screens/home/HomeScreen";
import { SAMPLE_HOME_DATA } from "../../screens/home/homeFixtures";

/**
 * F13 — ruta Inicio: pantalla completa con datos de ejemplo coherentes.
 * Sustituye al marco navegable de F11 (DestinationFrame).
 */
export default function HomeRoute() {
  return <HomeScreen data={SAMPLE_HOME_DATA} />;
}
