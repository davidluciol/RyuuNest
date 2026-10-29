import DiagnosticsScreen from "./DiagnosticsScreen";
import { useDiagnosticsData } from "./useDiagnosticsData";

/**
 * F30 — montaje interactivo de Diagnóstico para la galería (como
 * `OnboardingSample`): usa el mismo estado que la ruta real, con los eventos
 * de ejemplo en web. «Volver» no navega.
 */
export default function DiagnosticsSample() {
  const { view, flow, controller, notice, retry } = useDiagnosticsData();
  return (
    <DiagnosticsScreen
      view={view}
      flow={flow}
      controller={controller}
      notice={notice}
      onBack={() => {}}
      onRetry={retry}
    />
  );
}
