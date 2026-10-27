import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import HoldToConfirm from "../../components/HoldToConfirm";
import SheetModal from "../../components/SheetModal";
import TextField from "../../components/TextField";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { SourceModule } from "./sourcesData";
import type { SourcesController } from "./sourcesController";
import { canConfirmInstall, type SourcesFlow } from "./sourcesFlow";

/**
 * F16 — hojas de Fuentes (sin diseño en Stitch, P-30): añadir repositorio,
 * confirmar instalación (permisos y huella; mantener pulsado si es `script`),
 * gestionar, confirmar actualización, desinstalar y quitar repositorio. Cada
 * hoja pinta el estado del flujo (`sourcesFlow`) y manda acciones al
 * controlador; no toca el núcleo.
 */

const colors = dragonNightColors;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SheetError({ message }: { message: string | null }) {
  return message === null ? null : (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

function runtimeLabel(runtime: "declarative" | "script"): string {
  return t(runtime === "script" ? "sources.runtime.script" : "sources.runtime.declarative");
}

export interface SourcesSheetsProps {
  flow: SourcesFlow;
  controller: SourcesController;
  modules: readonly SourceModule[];
}

/** Hoja propia: al cerrarse se desmonta y el campo no arrastra la URL anterior. */
function AddRepoSheet({
  error,
  controller,
}: {
  error: string | null;
  controller: SourcesController;
}) {
  const [url, setUrl] = useState("");
  return (
    <SheetModal
      visible
      title={t("sources.add.title")}
      onClose={controller.close}
      testID="sheet-add-repo"
    >
      <Text style={styles.body}>{t("sources.add.description")}</Text>
      <Text style={styles.detailLabel}>{t("sources.add.label")}</Text>
      <TextField
        value={url}
        onChangeText={setUrl}
        placeholder={t("sources.add.placeholder")}
        accessibilityLabel={t("sources.add.label")}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={() => void controller.submitAddRepo(url)}
      />
      <SheetError message={error} />
      <View style={styles.actions}>
        <Button variant="secondary" label={t("sources.sheet.cancel")} onPress={controller.close} />
        <Button
          label={t("sources.add.submit")}
          onPress={() => void controller.submitAddRepo(url)}
        />
      </View>
    </SheetModal>
  );
}

export default function SourcesSheets({ flow, controller, modules }: SourcesSheetsProps) {
  if (flow.sheet === "none") return null;

  if (flow.sheet === "add-repo") {
    return <AddRepoSheet error={flow.error} controller={controller} />;
  }

  if (flow.sheet === "install") {
    const { preview } = flow;
    return (
      <SheetModal
        visible
        title={t("sources.install.title")}
        onClose={controller.close}
        busy={flow.busy}
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
        <SheetError message={flow.error} />
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t("sources.sheet.cancel")}
            disabled={flow.busy}
            onPress={controller.close}
          />
          {preview.reinforced ? (
            <HoldToConfirm
              label={t("sources.install.hold")}
              holdingLabel={t("sources.install.holding")}
              disabled={flow.busy}
              onConfirm={() => void controller.confirmInstall(true)}
            />
          ) : (
            <Button
              label={t("sources.install.submit")}
              disabled={!canConfirmInstall(preview, { reinforced: false }) || flow.busy}
              onPress={() => void controller.confirmInstall(false)}
            />
          )}
        </View>
      </SheetModal>
    );
  }

  if (flow.sheet === "manage") {
    const module = modules.find((candidate) => candidate.id === flow.moduleId);
    if (module === undefined) return null;
    return (
      <SheetModal visible title={module.name} onClose={controller.close} testID="sheet-manage">
        <DetailRow label={t("sources.detail.version")} value={module.version} />
        <DetailRow label={t("sources.detail.runtime")} value={runtimeLabel(module.runtime)} />
        <DetailRow label={t("sources.detail.repo")} value={module.repoId} />
        <DetailRow label={t("sources.detail.permissions")} value={module.domains.join(", ")} />
        {module.orphan ? <Text style={styles.warning}>{t("sources.manage.orphan")}</Text> : null}
        {module.lastError !== undefined ? (
          <DetailRow label={t("sources.manage.lastError")} value={module.lastError} />
        ) : null}
        <SheetError message={flow.error} />
        <View style={styles.column}>
          <Button
            variant="secondary"
            label={t(module.enabled ? "sources.manage.disable" : "sources.manage.enable")}
            onPress={() => void controller.setEnabled(module.id, !module.enabled)}
          />
          {module.updateTo !== undefined ? (
            <Button
              variant="secondary"
              label={t("sources.module.updateTo", { version: module.updateTo })}
              onPress={() => void controller.openUpdate(module.id)}
            />
          ) : null}
          <Button
            variant="destructive"
            label={t("sources.manage.uninstall")}
            onPress={controller.askUninstall}
          />
        </View>
      </SheetModal>
    );
  }

  if (flow.sheet === "update") {
    const { preview } = flow;
    return (
      <SheetModal
        visible
        title={t("sources.update.title")}
        onClose={controller.close}
        busy={flow.busy}
        testID="sheet-update"
      >
        <Text style={styles.name}>
          {t("sources.update.versions", {
            current: preview.currentVersion,
            next: preview.nextVersion ?? preview.currentVersion,
          })}
        </Text>
        {preview.reasons.length > 0 ? (
          <>
            <Text style={styles.body}>{t("sources.update.reasons")}</Text>
            {preview.reasons.map((reason) => (
              <Text key={reason} style={styles.warning}>
                {reason}
              </Text>
            ))}
          </>
        ) : null}
        <SheetError message={flow.error} />
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t("sources.sheet.back")}
            disabled={flow.busy}
            onPress={controller.back}
          />
          {preview.reinforced ? (
            <HoldToConfirm
              label={t("sources.update.hold")}
              holdingLabel={t("sources.install.holding")}
              disabled={flow.busy}
              onConfirm={() => void controller.confirmUpdate(true)}
            />
          ) : (
            <Button
              label={t("sources.update.submit")}
              disabled={flow.busy}
              onPress={() => void controller.confirmUpdate(false)}
            />
          )}
        </View>
      </SheetModal>
    );
  }

  if (flow.sheet === "uninstall") {
    return (
      <SheetModal
        visible
        title={t("sources.uninstall.title")}
        onClose={controller.close}
        busy={flow.busy}
        testID="sheet-uninstall"
      >
        <Text style={styles.body}>{t("sources.uninstall.message")}</Text>
        <SheetError message={flow.error} />
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t("sources.sheet.back")}
            disabled={flow.busy}
            onPress={controller.back}
          />
          <Button
            variant="destructive"
            label={t("sources.uninstall.submit")}
            disabled={flow.busy}
            onPress={() => void controller.confirmUninstall()}
          />
        </View>
      </SheetModal>
    );
  }

  return (
    <SheetModal
      visible
      title={t("sources.removeRepo.title")}
      onClose={controller.close}
      busy={flow.busy}
      testID="sheet-remove-repo"
    >
      <Text style={styles.body}>{t("sources.removeRepo.message")}</Text>
      <SheetError message={flow.error} />
      <View style={styles.actions}>
        <Button
          variant="secondary"
          label={t("sources.sheet.back")}
          disabled={flow.busy}
          onPress={controller.back}
        />
        <Button
          variant="destructive"
          label={t("sources.removeRepo.submit")}
          disabled={flow.busy}
          onPress={() => void controller.confirmRemoveRepo()}
        />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  name: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  body: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  warning: { ...textStyle(typography.bodyMd), color: colors.progress },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  detail: { gap: spacing.xxs },
  detailLabel: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  detailValue: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  column: { gap: spacing.xs },
});
