import { router } from "expo-router";

import SettingsScreen from "../../screens/settings/SettingsScreen";
import { useSettingsData } from "../../screens/settings/useSettingsData";
import { useBackupData } from "../../screens/settings/backup/useBackupData";

/**
 * F16b/F20 — ruta Ajustes: solo conecta el estado (useSettingsData) con la
 * pantalla. El título de la sección lo pinta la cabecera del shell (F11); el
 * resto del contenido de Ajustes llega con F20. F21 añade la sección de
 * respaldo con su propio estado (useBackupData).
 */
export default function SettingsRoute() {
  const {
    view,
    notice,
    busy,
    toggleProtection,
    toggleNsfw,
    setDefaultReaderMode,
    selectTheme,
    pickTheme,
    pendingTheme,
    confirmThemeImport,
    cancelThemeImport,
    deleteTheme,
    clearCache,
    restoreOfficialRepo,
    dismissNotice,
    retry,
  } = useSettingsData();
  const { flow: backupFlow, controller: backupController, notice: backupNotice } = useBackupData();

  return (
    <SettingsScreen
      view={view}
      notice={notice}
      busy={busy}
      onToggleProtection={toggleProtection}
      onToggleNsfw={toggleNsfw}
      onDefaultReaderModeChange={setDefaultReaderMode}
      onSelectTheme={selectTheme}
      onPickTheme={pickTheme}
      pendingTheme={pendingTheme}
      onConfirmThemeImport={confirmThemeImport}
      onCancelThemeImport={cancelThemeImport}
      onDeleteTheme={deleteTheme}
      onClearCache={clearCache}
      onRestoreOfficialRepo={restoreOfficialRepo}
      onDismissNotice={dismissNotice}
      onRetry={retry}
      onOpenDiagnostics={() => router.push("/diagnostics")}
      onOpenAbout={() => router.push("/about")}
      backupFlow={backupFlow}
      backupController={backupController}
      backupNotice={backupNotice}
      onDismissBackupNotice={() => backupController?.dismissNotice()}
    />
  );
}
