import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { dragonNightColors, layoutForWidth, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import SectionHeader from "../../components/SectionHeader";
import SettingsRow from "../../components/SettingsRow";
import Switch from "../../components/Switch";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { SettingsData } from "./settingsData";
import { installProtectionHintKey } from "./settingsView";

/**
 * F16b — pantalla de Ajustes mínima (RF-7, P-85): el contenido completo de
 * Ajustes llega con F20; hoy nace la sección «Seguridad» con el interruptor de
 * «Protección de instalación» y la fila de restaurar el repo oficial si el
 * usuario lo quitó. Presentacional: recibe la vista y callbacks por props.
 *
 * Sin diseño en Stitch para esta parte (P-30): se compone con componentes de
 * `DESIGN.md` y se marca «sin diseño».
 */

/** Estado de la pantalla, como lo ve la ruta. */
export type SettingsView =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: SettingsData };

const colors = dragonNightColors;

export interface SettingsScreenProps {
  view: SettingsView;
  /** Cambia `security.installProtection`; el interruptor no se activa sin bloqueo. */
  onToggleProtection?: (on: boolean) => void;
  /** Vuelve a registrar el repo oficial (P-85). */
  onRestoreOfficialRepo?: () => void;
  /** Aviso transitorio (errores del servicio fuera de una hoja). */
  notice?: string | null;
  onDismissNotice?: () => void;
  /** Una operación en curso bloquea los controles. */
  busy?: boolean;
  onRetry?: () => void;
}

export default function SettingsScreen({
  view,
  onToggleProtection,
  onRestoreOfficialRepo,
  notice = null,
  onDismissNotice,
  busy = false,
  onRetry,
}: SettingsScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-settings">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="screen-settings">
        <ErrorState
          title={t("state.error.settings.title")}
          message={t("state.error.settings.message")}
          retryLabel={t("actions.retry")}
          onRetry={onRetry}
        />
      </View>
    );
  }

  const { installProtection, lockAvailable, officialRepoRegistered } = view.data;

  return (
    <View style={styles.screen} testID="screen-settings">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
      >
        {notice !== null ? (
          <View style={styles.notice} accessibilityRole="alert">
            <Text style={styles.noticeText}>{notice}</Text>
            <Button
              variant="secondary"
              label={t("actions.close")}
              onPress={onDismissNotice}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={t("settings.section.security")} />
          <SettingsRow
            label={t("settings.security.installProtection")}
            hint={t(installProtectionHintKey(lockAvailable))}
            hintTone={lockAvailable ? "default" : "warning"}
            right={
              <Switch
                value={installProtection}
                disabled={!lockAvailable || busy}
                onValueChange={(value) => onToggleProtection?.(value)}
                accessibilityLabel={t("settings.security.installProtection")}
              />
            }
          />
        </View>

        {officialRepoRegistered ? null : (
          <View style={styles.section}>
            <SectionHeader title={t("settings.section.sources")} />
            <SettingsRow
              label={t("settings.official.title")}
              hint={t("settings.official.hint")}
              right={
                <Button
                  variant="secondary"
                  label={t("settings.official.restore")}
                  disabled={busy}
                  onPress={onRestoreOfficialRepo}
                />
              }
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  section: { gap: spacing.xs },
  notice: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
  },
  noticeText: { ...textStyle(typography.bodyMd), color: colors.error },
});
