import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { dragonNightColors, layoutForWidth, markers, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import DragonMarker from "../../components/DragonMarker";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import ModuleRow from "../../components/ModuleRow";
import TextField from "../../components/TextField";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { SourceModule } from "../sources/sourcesData";
import type { SourcesFlow } from "../sources/sourcesFlow";
import type { SourcesView } from "../sources/sourcesFixtures";
import InstallSheet from "../sources/InstallSheet";
import { moduleBadges, moduleRowAction, BADGE_LABEL_KEYS, ROW_ACTION_KEYS } from "../sources/sourcesView";
import { kindLabel } from "../../components/kindLabel";
import type { OnboardingController, OnboardingStep } from "./onboardingController";
import BackupSheets from "../settings/backup/BackupSheets";
import type { BackupController } from "../settings/backup/backupController";
import type { BackupFlow } from "../settings/backup/backupFlow";

/**
 * F12 — pantalla del primer uso (SPEC §11.8, sin diseño en Stitch: wireframe;
 * «sin diseño», P-30). Tres pasos: bienvenida con el dragón grande, añadir
 * repositorio (con la URL del repo oficial ya puesta, P-85) e instalar un
 * módulo con la confirmación de Fuentes (AC-8). Presentacional: los pasos los
 * lleva la sesión (`useOnboardingSession`), que le pasa controlador y flujo.
 *
 * F21b: en el paso 2 se ofrece «Importar respaldo» (en web y en TV; en móvil
 * el respaldo vive en Ajustes). El botón abre el flujo de respaldo de
 * Ajustes (elegir archivo → fusionar/reemplazar), sin completar el primer
 * uso.
 *
 * Anotado en `design/stitch/DIFFS.md`: sin botón de pegar del portapapeles
 * (necesitaría `expo-clipboard`, dependencia nueva).
 */

const colors = dragonNightColors;

function moduleMeta(module: SourceModule): string {
  return t("sources.module.meta", {
    kind: module.kinds.map(kindLabel).join(", "),
    lang: module.lang,
    version: module.version,
  });
}

export interface OnboardingScreenProps {
  step: OnboardingStep;
  view: SourcesView;
  flow: SourcesFlow;
  controller: OnboardingController | null;
  /** Aviso transitorio del servicio. */
  notice?: string | null;
  /** URL con la que empieza el paso 2 (el repo oficial, P-85). */
  suggestedUrl?: string;
  onRetry?: () => void;
  /** F21b — flujo de respaldo para «Importar respaldo» (paso 2, TV y web). */
  backupFlow?: BackupFlow;
  backupController?: BackupController | null;
}

export default function OnboardingScreen({
  step,
  view,
  flow,
  controller,
  notice = null,
  suggestedUrl = "",
  onRetry,
  backupFlow,
  backupController = null,
}: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  const [repoUrl, setRepoUrl] = useState(suggestedUrl);

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-onboarding">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="screen-onboarding">
        <ErrorState
          title={t("state.error.sources.title")}
          message={t("state.error.sources.message")}
          retryLabel={t("actions.retry")}
          onRetry={onRetry}
        />
      </View>
    );
  }

  const stepError = flow.sheet === "add-repo" ? flow.error : null;

  return (
    <View style={styles.screen} testID="screen-onboarding">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Text style={styles.stepLabel}>{t("onboarding.step.of", { step })}</Text>

        {notice !== null ? (
          <View style={styles.notice} accessibilityRole="alert">
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.step} testID="onboarding-step-1">
            <View style={styles.dragonWrap}>
              <DragonMarker size={markers.md} color={colors.accent} />
            </View>
            <Text style={styles.title}>{t("onboarding.welcome.title")}</Text>
            <Text style={styles.message}>{t("onboarding.welcome.message")}</Text>
            <View style={styles.actions}>
              <Button
                variant="secondary"
                label={t("onboarding.skip")}
                onPress={controller?.skip}
                disabled={controller === null}
              />
              <Button label={t("onboarding.start")} onPress={controller?.start} />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.step} testID="onboarding-step-2">
            <Text style={styles.title}>{t("sources.add.title")}</Text>
            <Text style={styles.message}>{t("sources.add.description")}</Text>
            <TextField
              value={repoUrl}
              onChangeText={setRepoUrl}
              placeholder={t("sources.add.placeholder")}
              accessibilityLabel={t("sources.add.label")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={() => void controller?.submitRepo(repoUrl)}
            />
            {stepError !== null ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {stepError}
              </Text>
            ) : null}
            {backupController !== null ? (
              <Button
                variant="secondary"
                label={t("settings.backup.import")}
                onPress={() => void backupController.importBackup()}
                testID="onboarding-import-backup"
              />
            ) : null}
            <View style={styles.actions}>
              <Button
                variant="secondary"
                label={t("onboarding.skip")}
                onPress={controller?.skip}
                disabled={controller === null}
              />
              <Button
                label={t("onboarding.repo.continue")}
                onPress={() => void controller?.submitRepo(repoUrl)}
                disabled={controller === null}
              />
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.step} testID="onboarding-step-3">
            <Text style={styles.title}>{t("onboarding.modules.title")}</Text>
            <Text style={styles.message}>{t("onboarding.modules.hint")}</Text>
            {view.data.modules.map((module) => {
              const action = moduleRowAction(module);
              return (
                <ModuleRow
                  key={module.id}
                  testID={`onboarding-module-${module.id}`}
                  name={module.name}
                  meta={moduleMeta(module)}
                  badges={moduleBadges(module).map((badge) => t(BADGE_LABEL_KEYS[badge]))}
                  actionLabel={t(ROW_ACTION_KEYS[action])}
                  onAction={() =>
                    action === "install"
                      ? void controller?.openInstall(module.repoId, module.id)
                      : undefined
                  }
                />
              );
            })}
            <View style={styles.actions}>
              <Button
                variant="secondary"
                label={t("onboarding.skip")}
                onPress={controller?.skip}
                disabled={controller === null}
              />
              <Button
                label={t("onboarding.finish")}
                onPress={controller?.finish}
                disabled={controller === null}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {controller !== null && flow.sheet === "install" ? (
        <InstallSheet
          preview={flow.preview}
          busy={flow.busy}
          error={flow.error}
          onCancel={controller.close}
          onConfirm={(reinforced) => void controller.confirmInstall(reinforced)}
        />
      ) : null}

      {backupController !== null && backupFlow !== undefined ? (
        <BackupSheets flow={backupFlow} controller={backupController} />
      ) : null}
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
  step: { gap: spacing.md },
  dragonWrap: { alignItems: "center", paddingVertical: spacing.md },
  stepLabel: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  title: { ...textStyle(typography.headlineMd), color: colors.textPrimary },
  message: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  notice: {
    padding: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
  },
  noticeText: { ...textStyle(typography.bodyMd), color: colors.error },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
