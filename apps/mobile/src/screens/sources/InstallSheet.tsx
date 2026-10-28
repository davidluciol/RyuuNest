import { StyleSheet, Text, View } from "react-native";
import type { InstallPreview } from "@ryuunest/core";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import HoldToConfirm from "../../components/HoldToConfirm";
import SheetModal from "../../components/SheetModal";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import { canConfirmInstall } from "./sourcesFlow";
import { DetailRow, SheetError, runtimeLabel } from "./sheetPieces";

/**
 * F16/F12 — hoja de confirmación de instalación (SPEC §7.1): nombre, versión,
 * runtime, repo, permisos y huella; un módulo `script` avisa y exige mantener
 * pulsado. La usan Fuentes (F16) y el primer uso (F12): la confirmación es la
 * misma y nada se instala sin ella (AC-8).
 */

const colors = dragonNightColors;

export interface InstallSheetProps {
  preview: InstallPreview;
  busy: boolean;
  /** Mensaje de error de la hoja; `null` si no hay. */
  error: string | null;
  onCancel: () => void;
  /** Confirma la instalación; `reinforced` cuando se mantuvo pulsado. */
  onConfirm: (reinforced: boolean) => void;
}

export default function InstallSheet({
  preview,
  busy,
  error,
  onCancel,
  onConfirm,
}: InstallSheetProps) {
  return (
    <SheetModal
      visible
      title={t("sources.install.title")}
      onClose={onCancel}
      busy={busy}
      testID="sheet-install"
    >
      <Text style={styles.name}>{preview.name}</Text>
      <DetailRow label={t("sources.detail.version")} value={preview.version} />
      <DetailRow label={t("sources.detail.runtime")} value={runtimeLabel(preview.runtime)} />
      <DetailRow label={t("sources.detail.repo")} value={preview.repoId} />
      <DetailRow
        label={t("sources.detail.permissions")}
        value={preview.permissions.domains.join(", ")}
      />
      <DetailRow label={t("sources.detail.hash")} value={preview.sha256} />
      {preview.reinforced ? (
        <Text style={styles.warning}>{t("sources.install.scriptWarning")}</Text>
      ) : null}
      <SheetError message={error} />
      <View style={styles.actions}>
        <Button variant="secondary" label={t("sources.sheet.cancel")} disabled={busy} onPress={onCancel} />
        {preview.reinforced ? (
          <HoldToConfirm
            label={t("sources.install.hold")}
            holdingLabel={t("sources.install.holding")}
            disabled={busy}
            onConfirm={() => onConfirm(true)}
          />
        ) : (
          <Button
            label={t("sources.install.submit")}
            disabled={!canConfirmInstall(preview, { reinforced: false }) || busy}
            onPress={() => onConfirm(false)}
          />
        )}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  name: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  warning: { ...textStyle(typography.bodyMd), color: colors.progress },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
