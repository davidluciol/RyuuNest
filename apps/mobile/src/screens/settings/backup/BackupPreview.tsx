import Button from "../../../components/Button";
import SettingsCard from "../../../components/SettingsCard";
import SettingsRow from "../../../components/SettingsRow";
import { t } from "../../../i18n";
import type { BackupController } from "./backupController";

/**
 * F21 — sección «Respaldo» de Ajustes (sin diseño en Stitch, P-30; SPEC §11.5
 * fija «filas de ajustes y diálogo de confirmación»). Dos filas: exportar
 * (comparte el archivo con la hoja del sistema en nativo; descarga en web) e
 * importar (elige el archivo y abre la hoja de modo). La pantalla no toca el
 * núcleo: las acciones van al controlador.
 */

export interface BackupSectionProps {
  controller: BackupController;
  disabled?: boolean;
}

export default function BackupSection({ controller, disabled = false }: BackupSectionProps) {
  return (
    <SettingsCard>
      <SettingsRow
        label={t("settings.backup.export")}
        hint={t("settings.backup.exportHint")}
        right={
          <Button
            variant="secondary"
            label={t("settings.backup.exportAction")}
            disabled={disabled}
            onPress={() => void controller.exportBackup()}
            accessibilityLabel={t("settings.backup.export")}
            testID="settings-backup-export"
          />
        }
      />
      <SettingsRow
        label={t("settings.backup.import")}
        hint={t("settings.backup.importHint")}
        right={
          <Button
            variant="secondary"
            label={t("settings.backup.importAction")}
            disabled={disabled}
            onPress={() => void controller.importBackup()}
            accessibilityLabel={t("settings.backup.import")}
            testID="settings-backup-import"
          />
        }
      />
    </SettingsCard>
  );
}
