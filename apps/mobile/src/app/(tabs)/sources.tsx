import SourcesScreen from "../../screens/sources/SourcesScreen";
import { useSourcesData } from "../../screens/sources/useSourcesData";

/**
 * F16 — ruta Fuentes: solo conecta el estado (useSourcesData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11).
 */
export default function SourcesRoute() {
  const { view, flow, notice, controller, retry } = useSourcesData();

  return (
    <SourcesScreen
      view={view}
      flow={flow}
      controller={controller}
      notice={notice}
      onRetry={retry}
    />
  );
}
