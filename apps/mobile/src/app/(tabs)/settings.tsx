import SettingsScreen from "../../screens/settings/SettingsScreen";
import { useSettingsData } from "../../screens/settings/useSettingsData";

/**
 * F16b — ruta Ajustes: solo conecta el estado (useSettingsData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11); el
 * resto del contenido de Ajustes llega con F20.
 */
export default function SettingsRoute() {
  const {
    view,
    notice,
    busy,
    toggleProtection,
    toggleNsfw,
    setDefaultReaderMode,
    clearCache,
    restoreOfficialRepo,
    dismissNotice,
    retry,
  } = useSettingsData();

  return (
    <SettingsScreen
      view={view}
      notice={notice}
      busy={busy}
      onToggleProtection={toggleProtection}
      onToggleNsfw={toggleNsfw}
      onDefaultReaderModeChange={setDefaultReaderMode}
      onClearCache={clearCache}
      onRestoreOfficialRepo={restoreOfficialRepo}
      onDismissNotice={dismissNotice}
      onRetry={retry}
    />
  );
}
