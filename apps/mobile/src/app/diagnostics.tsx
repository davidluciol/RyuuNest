import { router } from "expo-router";

import DiagnosticsScreen from "../screens/settings/diagnostics/DiagnosticsScreen";
import { useDiagnosticsData } from "../screens/settings/diagnostics/useDiagnosticsData";

/**
 * F30 — ruta de Ajustes → Diagnóstico (P-72): solo conecta el estado
 * (`useDiagnosticsData`) con la pantalla. Va fuera de las pestañas, como la
 * ficha de serie: tiene su propia cabecera con «volver». Volver siempre
 * lleva a Ajustes (`dismissTo`), también si se entró por enlace directo.
 */
export default function DiagnosticsRoute() {
  const { view, flow, controller, notice, retry } = useDiagnosticsData();

  return (
    <DiagnosticsScreen
      view={view}
      flow={flow}
      controller={controller}
      notice={notice}
      onBack={() => router.dismissTo("/settings")}
      onRetry={retry}
    />
  );
}
