import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../../components/Button";
import ErrorDialog from "../../../components/ErrorDialog";
import { kindLabel } from "../../../components/kindLabel";
import ModuleRow from "../../../components/ModuleRow";
import SheetModal from "../../../components/SheetModal";
import { textStyle } from "../../../components/textStyle";
import { t } from "../../../i18n";
import { BADGE_LABEL_KEYS, moduleBadges } from "../../sources/sourcesView";
import type { BackupFlow } from "./backupFlow";
import type { BackupController } from "./backupController";
import type { ModuleSuggestion, RepoSuggestion } from "./backupData";

/**
 * F21 — hojas del respaldo en Ajustes (sin diseño en Stitch, P-30):
 *
 * - `ImportModeSheet`: elige «Fusionar» o «Reemplazar» tras elegir el archivo.
 * - `ReplaceConfirmSheet`: confirmación explícita antes del reemplazo
 *   (destructivo: borra el estado actual).
 * - `SuggestionsSheet`: repos y módulos sugeridos por el respaldo; nada se
 *   instala solo (AC-8): un repo se registra con su confirmación y un módulo
 *   apunta a Fuentes.
 *
 * Cada hoja pinta el estado del flujo (`backupFlow`) y manda acciones al
 * controlador; no toca el núcleo.
 */

const colors = dragonNightColors;

/** Insignias de un módulo sugerido (mismo cálculo que Fuentes, F16). */
function moduleBadgesFor(module: ModuleSuggestion): string[] {
  // Un módulo sugerido aún no está instalado: solo pueden salir «script» y
  // «nsfw» (V13: sin señales de estado de instalación).
  return moduleBadges({
    id: module.id,
    name: module.id,
    status: "available",
    version: module.version,
    runtime: module.runtime,
    kinds: module.kinds,
    lang: module.lang,
    nsfw: module.nsfw,
    domains: [],
    repoId: module.repoUrl,
    enabled: true,
    orphan: false,
  }).map((badge) => t(BADGE_LABEL_KEYS[badge]));
}

export interface BackupSheetsProps {
  flow: BackupFlow;
  controller: BackupController;
}

function ImportModeSheet({
  flow,
  controller,
}: {
  flow: Extract<BackupFlow, { sheet: "import-mode" }>;
  controller: BackupController;
}) {
  return (
    <SheetModal
      visible
      title={t("settings.backup.sheet.title")}
      onClose={controller.close}
      busy={flow.busy}
      testID="sheet-backup-import-mode"
    >
      <Text style={styles.body}>{t("settings.backup.sheet.description")}</Text>
      <Text style={styles.optionHint}>{t("settings.backup.sheet.mergeHint")}</Text>
      <Button
        label={t("settings.backup.sheet.merge")}
        disabled={flow.busy}
        onPress={() => void controller.applyImport("merge")}
        testID="backup-apply-merge"
      />
      <Text style={styles.optionHint}>{t("settings.backup.sheet.replaceHint")}</Text>
      <Button
        variant="destructive"
        label={t("settings.backup.sheet.replace")}
        disabled={flow.busy}
        onPress={controller.askReplace}
        testID="backup-ask-replace"
      />
      {flow.error !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {flow.error}
        </Text>
      ) : null}
      <Button variant="secondary" label={t("settings.backup.sheet.cancel")} onPress={controller.close} />
    </SheetModal>
  );
}

function ReplaceConfirmSheet({
  flow,
  controller,
}: {
  flow: Extract<BackupFlow, { sheet: "replace-confirm" }>;
  controller: BackupController;
}) {
  return (
    <SheetModal
      visible
      title={t("settings.backup.replace.title")}
      onClose={controller.close}
      busy={flow.busy}
      testID="sheet-backup-replace"
    >
      <Text style={styles.body}>{t("settings.backup.replace.message")}</Text>
      {flow.error !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {flow.error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button variant="secondary" label={t("settings.backup.sheet.cancel")} onPress={controller.close} />
        <Button
          variant="destructive"
          label={t("settings.backup.replace.confirm")}
          disabled={flow.busy}
          onPress={() => void controller.applyImport("replace")}
          testID="backup-apply-replace"
        />
      </View>
    </SheetModal>
  );
}

function SuggestionsSheet({
  flow,
  controller,
}: {
  flow: Extract<BackupFlow, { sheet: "suggestions" }>;
  controller: BackupController;
}) {
  const repos: readonly RepoSuggestion[] = flow.suggestions.repos;
  const modules: readonly ModuleSuggestion[] = flow.suggestions.modules;

  return (
    <SheetModal
      visible
      title={t("settings.backup.suggestions.title")}
      onClose={controller.close}
      busy={flow.busy}
      testID="sheet-backup-suggestions"
    >
      <Text style={styles.body}>{t("settings.backup.suggestions.message")}</Text>
      {repos.length === 0 && modules.length === 0 ? (
        <Text style={styles.body}>{t("settings.backup.suggestions.empty")}</Text>
      ) : null}
      {repos.map((repo) => {
        const confirmed = flow.confirmedRepos.includes(repo.url);
        return (
          <View key={repo.url} style={styles.suggestionRow}>
            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle} numberOfLines={1}>
                {repo.name}
              </Text>
              <Text style={styles.suggestionHint} numberOfLines={1}>
                {repo.url}
              </Text>
            </View>
            <Button
              variant="secondary"
              label={t(
                confirmed
                  ? "settings.backup.suggestions.repo.confirmed"
                  : "settings.backup.suggestions.repo.confirm",
              )}
              disabled={confirmed || flow.busy}
              onPress={() => void controller.confirmRepo(repo.url)}
              testID={`backup-confirm-repo-${repo.url}`}
            />
          </View>
        );
      })}
      {modules.map((module) => (
        <ModuleRow
          key={module.id}
          name={module.id}
          meta={t("sources.module.meta", {
            kind: module.kinds.map(kindLabel).join(", "),
            lang: module.lang,
            version: module.version,
          })}
          badges={moduleBadgesFor(module)}
          hint={t("settings.backup.suggestions.module.hint")}
          actionLabel={t("settings.backup.suggestions.module.goSources")}
          onAction={controller.goToSources}
          testID={`backup-suggestion-module-${module.id}`}
        />
      ))}
      {flow.error !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {flow.error === "" ? t("settings.backup.suggestions.repo.failed") : flow.error}
        </Text>
      ) : null}
      <Button variant="secondary" label={t("settings.backup.suggestions.close")} onPress={controller.close} />
    </SheetModal>
  );
}

export default function BackupSheets({ flow, controller }: BackupSheetsProps) {
  if (flow.sheet === "import-mode") {
    return <ImportModeSheet flow={flow} controller={controller} />;
  }
  if (flow.sheet === "replace-confirm") {
    return <ReplaceConfirmSheet flow={flow} controller={controller} />;
  }
  if (flow.sheet === "suggestions") {
    return <SuggestionsSheet flow={flow} controller={controller} />;
  }
  if (flow.sheet === "import-error") {
    return (
      <ErrorDialog
        visible
        title={t("settings.backup.importFailed")}
        message={flow.error}
        code={flow.reason}
        severity="error"
        detailLabel={t("actions.showDetail")}
        detail={flow.issues.length > 0 ? { code: flow.issues.map((issue) => issue.path).join(", ") } : undefined}
        retryLabel={t("actions.retry")}
        onRetry={controller.close}
        onClose={controller.close}
        testID="dialog-backup-import-error"
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  body: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  optionHint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  suggestionText: { flex: 1, minWidth: 0, gap: spacing.xxs },
  suggestionTitle: { ...textStyle(typography.bodyLg), color: colors.textPrimary },
  suggestionHint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
});
