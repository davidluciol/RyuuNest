import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ReaderMode } from "@ryuunest/core";
import { dragonNightColors, layoutForWidth, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import SectionHeader from "../../components/SectionHeader";
import SettingsRow from "../../components/SettingsRow";
import Switch from "../../components/Switch";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { SettingsData } from "./settingsData";
import { installProtectionHintKey, READER_MODE_OPTIONS } from "./settingsView";

/**
 * F20 — pantalla de Ajustes (RF-34, RF-39, P-85). Presentacional: recibe la
 * vista y callbacks por props; las preferencias globales se comparten con
 * Biblioteca, Descubrir y el lector desde la capa de datos.
 *
 * Sin diseño en Stitch para esta parte (P-30): se compone con componentes de
 * `DESIGN.md` y se marca «sin diseño».
 */

/** Estado de la pantalla, como lo ve la ruta. */
export type SettingsView =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: SettingsData };

const colors = dragonNightColors;

export interface SettingsScreenProps {
  view: SettingsView;
  /** Cambia `security.installProtection`; el interruptor no se activa sin bloqueo. */
  onToggleProtection?: (on: boolean) => void;
  /** Cambia la visibilidad global de contenido adulto. */
  onToggleNsfw?: (on: boolean) => void;
  /** Cambia el modo global cuando no hay preferencia de serie. */
  onDefaultReaderModeChange?: (mode: ReaderMode) => void;
  /** Vacía la caché de imágenes de la plataforma. */
  onClearCache?: () => void;
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
  onToggleNsfw,
  onDefaultReaderModeChange,
  onClearCache,
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

  const {
    installProtection,
    lockAvailable,
    officialRepoRegistered,
    nsfwVisible,
    language,
    defaultReaderMode,
  } = view.data;

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
            <Button variant="secondary" label={t("actions.close")} onPress={onDismissNotice} />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={t("settings.section.language")} />
          <SettingsRow
            label={t("settings.language.label")}
            hint={t("settings.language.hint")}
            right={
              <Text style={styles.value}>
                {language === "es" ? t("settings.language.es") : language}
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t("settings.section.reading")} />
          <SettingsRow
            label={t("settings.reading.defaultMode")}
            hint={t("settings.reading.defaultModeHint")}
          />
          <View style={styles.options}>
            {READER_MODE_OPTIONS.map((option) => (
              <Chip
                key={option.mode}
                label={t(option.labelKey)}
                selected={defaultReaderMode === option.mode}
                onPress={() => onDefaultReaderModeChange?.(option.mode)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t("settings.section.security")} />
          <SettingsRow
            label={t("settings.security.nsfw")}
            hint={t("settings.security.nsfwHint")}
            right={
              <Switch
                value={nsfwVisible}
                disabled={busy}
                onValueChange={(value) => onToggleNsfw?.(value)}
                accessibilityLabel={t("settings.security.nsfw")}
                testID="settings-nsfw-switch"
              />
            }
          />
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
                testID="settings-protection-switch"
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

        <View style={styles.section}>
          <SectionHeader title={t("settings.section.cache")} />
          <SettingsRow
            label={t("settings.cache.images")}
            hint={t("settings.cache.hint")}
            right={
              <Button
                variant="secondary"
                label={t("settings.cache.clear")}
                disabled={busy}
                onPress={onClearCache}
                accessibilityLabel={t("settings.cache.clear")}
              />
            }
          />
        </View>
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
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  value: {
    ...textStyle(typography.labelLg),
    color: colors.accent,
  },
  notice: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
  },
  noticeText: { ...textStyle(typography.bodyMd), color: colors.error },
});
