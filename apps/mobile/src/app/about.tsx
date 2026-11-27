import { router } from "expo-router";

import SafeScreen from "../components/SafeScreen";
import AboutScreen from "../screens/settings/about/AboutScreen";

/**
 * Acerca de (AB2) — ruta de Ajustes → Acerca de, fuera de las pestañas como
 * Diagnóstico: volver siempre lleva a Ajustes (`dismissTo`), también si se
 * entró por enlace directo.
 */
export default function AboutRoute() {
  return (
    <SafeScreen>
      <AboutScreen onBack={() => router.dismissTo("/settings")} />
    </SafeScreen>
  );
}
