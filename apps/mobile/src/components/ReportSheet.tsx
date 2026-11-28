import { Text, View } from "react-native";
import { activeColors, radii, spacing, typography } from "@ryuunest/ui-tokens";
import { REPORT_DETAILS_MAX } from "@ryuunest/core";

import { t } from "../i18n";
import Button from "./Button";
import Checkbox from "./Checkbox";
import SheetModal from "./SheetModal";
import TextField from "./TextField";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * F103 — hoja «Mandar reporte» (P-198): muestra **todo** lo que saldrá, ya limpio;
 * el usuario solo edita «Detalles» y elige el canal. GitHub es el primario
 * (atención prioritaria); correo, el secundario (más lento). Sin animación: también
 * se abre desde el lector (Regla 4).
 */

const colors = activeColors;

export type ReportSheetChannel = "github" | "email";

export interface ReportSheetProps {
  visible: boolean;
  /** Título y cuerpo tal como se enviarán. */
  preview: { title: string; body: string } | null;
  details: string;
  onDetailsChange: (details: string) => void;
  includeLog: boolean;
  onIncludeLogChange: (include: boolean) => void;
  sending?: boolean;
  sendFailed?: boolean;
  onSend: (channel: ReportSheetChannel) => void;
  /** Tercera vía: copia el reporte; `copied` confirma que ya está en el portapapeles. */
  onCopy?: () => void;
  copied?: boolean;
  /** Abre la búsqueda de la huella en los issues antes de enviar un duplicado. */
  onSearchExisting?: () => void;
  onClose: () => void;
}

export default function ReportSheet({
  visible,
  preview,
  details,
  onDetailsChange,
  includeLog,
  onIncludeLogChange,
  sending = false,
  sendFailed = false,
  onSend,
  onCopy,
  copied = false,
  onSearchExisting,
  onClose,
}: ReportSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("report.title")}
      onClose={onClose}
      busy={sending}
      animated={false}
      testID="sheet-report"
      footer={
        <View style={styles.channels}>
          <View style={styles.channel}>
            <Button
              label={t("report.github.action")}
              onPress={() => onSend("github")}
              disabled={sending}
              testID="report-send-github"
            />
            <Text style={styles.hint}>{t("report.github.hint")}</Text>
          </View>
          <View style={styles.channel}>
            <Button
              variant="secondary"
              label={t("report.email.action")}
              onPress={() => onSend("email")}
              disabled={sending}
              testID="report-send-email"
            />
            <Text style={styles.hint}>{t("report.email.hint")}</Text>
          </View>
        </View>
      }
    >
      <Text style={styles.intro}>{t("report.intro")}</Text>
      <Text style={styles.label}>{t("report.details.label")}</Text>
      <TextField
        value={details}
        onChangeText={onDetailsChange}
        placeholder={t("report.details.placeholder")}
        maxLength={REPORT_DETAILS_MAX}
        multiline
        accessibilityLabel={t("report.details.label")}
        testID="report-details"
      />
      <View style={styles.logRow}>
        <Checkbox checked={includeLog} onChange={onIncludeLogChange} />
        <Text style={styles.logLabel}>{t("report.log.label")}</Text>
      </View>
      {onCopy !== undefined || onSearchExisting !== undefined ? (
        <View style={styles.extras}>
          {onSearchExisting === undefined ? null : (
            <Button
              variant="secondary"
              label={t("report.searchExisting")}
              onPress={onSearchExisting}
              disabled={sending}
              testID="report-search-existing"
            />
          )}
          {onCopy === undefined ? null : (
            <Button
              variant="secondary"
              label={t("report.copy")}
              onPress={onCopy}
              disabled={sending}
              testID="report-copy"
            />
          )}
        </View>
      ) : null}
      {copied ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite" testID="report-copied">
          {t("report.copied")}
        </Text>
      ) : null}
      {sendFailed ? (
        <Text style={styles.error} accessibilityRole="alert" testID="report-send-failed">
          {t("report.sendFailed")}
        </Text>
      ) : null}
      <Text style={styles.label}>{t("report.preview.label")}</Text>
      {preview === null ? null : (
        <View style={styles.preview} testID="report-preview">
          <Text style={styles.previewTitle}>{preview.title}</Text>
          <Text style={styles.previewBody} selectable>
            {preview.body}
          </Text>
        </View>
      )}
    </SheetModal>
  );
}

const styles = themedStyles(() => ({
  intro: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  label: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  logRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logLabel: { ...textStyle(typography.bodyMd), color: colors.textPrimary, flex: 1 },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  preview: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.control,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  previewTitle: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  previewBody: { ...textStyle(typography.mono), color: colors.textSecondary },
  channels: { gap: spacing.sm },
  extras: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  channel: { gap: spacing.xxs },
  hint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
}));
