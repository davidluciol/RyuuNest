import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { LogEntry } from "@ryuunest/core";
import {
  dragonNightColors,
  layoutForWidth,
  radii,
  spacing,
  touchTarget,
  typography,
} from "@ryuunest/ui-tokens";

import Button from "../../../components/Button";
import Chip from "../../../components/Chip";
import EmptyState from "../../../components/EmptyState";
import ErrorState from "../../../components/ErrorState";
import LoadingState from "../../../components/LoadingState";
import LogEventRow from "../../../components/LogEventRow";
import SheetModal from "../../../components/SheetModal";
import Toast from "../../../components/Toast";
import { textStyle } from "../../../components/textStyle";
import { ChevronLeft, Copy, Trash2, Upload } from "../../../icons";
import { t } from "../../../i18n";
import type { DiagnosticsController } from "./diagnosticsController";
import type { DiagnosticsFlow, DiagnosticsNotice } from "./diagnosticsFlow";
import { confirmClearMessage, eventDetailLines, eventLevel, eventWhen } from "./diagnosticsView";

/**
 * F30 — pantalla Ajustes → Diagnóstico (FB2, P-72; diseño en
 * `design/stitch/ajustes_diagnostico_dragon_night/`). Presentacional: recibe
 * la vista, el estado del flujo y el controlador; no toca el núcleo.
 *
 * Un solo botón primario («Exportar informe»); «Copiar» es secundario y
 * «Borrar» destructivo, con confirmación explícita (hoja). El registro vacío
 * se resuelve con `EmptyState` y una única acción (volver a Ajustes).
 */

const colors = dragonNightColors;

/** Estado de la pantalla, como lo ve la ruta. */
export type DiagnosticsView =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; events: LogEntry[] };

export interface DiagnosticsScreenProps {
  view: DiagnosticsView;
  flow: DiagnosticsFlow;
  controller: DiagnosticsController | null;
  notice?: DiagnosticsNotice | null;
  /** Ahora, para «Hoy/Ayer» (inyectable en pruebas). */
  now?: number;
  onBack?: () => void;
  onRetry?: () => void;
}

export default function DiagnosticsScreen({
  view,
  flow,
  controller,
  notice = null,
  now = Date.now(),
  onBack,
  onRetry,
}: DiagnosticsScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={touchTarget.min / 4}
        accessibilityRole="button"
        accessibilityLabel={t("actions.back")}
        style={styles.back}
        testID="diagnostics-back"
      >
        <ChevronLeft size={24} color={colors.textPrimary} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        {t("diagnostics.title")}
      </Text>
    </View>
  );

  if (view.status === "loading") {
    return (
      <View style={styles.screen} testID="screen-diagnostics">
        {header}
        <View style={styles.stateWrap}>
          <LoadingState title={t("state.loading.title")} />
        </View>
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.screen} testID="screen-diagnostics">
        {header}
        <View style={styles.stateWrap}>
          <ErrorState
            title={t("state.error.diagnostics.title")}
            message={t("state.error.diagnostics.message")}
            retryLabel={t("actions.retry")}
            onRetry={onRetry}
          />
        </View>
      </View>
    );
  }

  const { events } = view;

  if (events.length === 0) {
    return (
      <View style={styles.screen} testID="screen-diagnostics">
        {header}
        <View style={styles.stateWrap} testID="diagnostics-empty">
          <EmptyState
            title={t("diagnostics.empty.title")}
            message={t("diagnostics.empty.message")}
            actionLabel={t("diagnostics.empty.action")}
            onAction={onBack}
          />
        </View>
        <NoticeToast notice={notice} onClose={controller?.dismissNotice} />
      </View>
    );
  }

  const disabled = flow.busy || controller === null;

  return (
    <View style={styles.screen} testID="screen-diagnostics">
      {header}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
      >
        <Text style={styles.intro}>{t("diagnostics.intro")}</Text>

        <View style={styles.group}>
          <Text style={styles.label}>{t("diagnostics.format.label")}</Text>
          <View style={styles.chips}>
            <Chip
              label={t("diagnostics.format.text")}
              selected={flow.format === "text"}
              onPress={() => controller?.setFormat("text")}
            />
            <Chip
              label={t("diagnostics.format.json")}
              selected={flow.format === "json"}
              onPress={() => controller?.setFormat("json")}
            />
          </View>
          <Button
            label={t("diagnostics.export")}
            icon={<Upload size={spacing.md} color={colors.bg} />}
            disabled={disabled}
            onPress={() => void controller?.exportReport()}
            testID="diagnostics-export"
          />
          <View style={styles.pair}>
            <Button
              variant="secondary"
              label={t("diagnostics.copy")}
              icon={<Copy size={spacing.md} color={colors.textPrimary} />}
              disabled={disabled}
              onPress={() => void controller?.copyReport()}
              style={styles.half}
              testID="diagnostics-copy"
            />
            <Button
              variant="destructive"
              label={t("diagnostics.clear")}
              icon={<Trash2 size={spacing.md} color={colors.error} />}
              disabled={disabled}
              onPress={() => controller?.askClear()}
              style={styles.half}
              testID="diagnostics-clear"
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>{t("diagnostics.events", { count: events.length })}</Text>
          <View style={styles.list} testID="diagnostics-list">
            {events.map((event, index) => {
              const level = eventLevel(event.level);
              return (
                <View key={event.id} style={index === 0 ? undefined : styles.divider}>
                  <LogEventRow
                    levelLabel={level.label}
                    tone={level.tone}
                    code={event.code}
                    message={event.message}
                    when={eventWhen(event.at, now)}
                    detailLines={eventDetailLines(event)}
                    expanded={flow.expanded.includes(event.id)}
                    onToggleDetail={() => controller?.toggleDetail(event.id)}
                    showDetailLabel={t("diagnostics.detail.show")}
                    hideDetailLabel={t("diagnostics.detail.hide")}
                    testID={`diagnostics-event-${event.id}`}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <SheetModal
        visible={flow.confirmClear}
        title={t("diagnostics.confirm.title")}
        onClose={() => controller?.cancelClear()}
        testID="diagnostics-confirm"
      >
        <Text style={styles.confirmText}>{confirmClearMessage(events.length)}</Text>
        <View style={styles.pair}>
          <Button
            variant="secondary"
            label={t("diagnostics.confirm.cancel")}
            onPress={() => controller?.cancelClear()}
            style={styles.half}
            testID="diagnostics-confirm-cancel"
          />
          <Button
            variant="destructive"
            label={t("diagnostics.confirm.submit")}
            onPress={() => void controller?.confirmClear()}
            style={styles.half}
            testID="diagnostics-confirm-submit"
          />
        </View>
      </SheetModal>

      <NoticeToast notice={notice} onClose={controller?.dismissNotice} />
    </View>
  );
}

function NoticeToast({
  notice,
  onClose,
}: {
  notice: DiagnosticsNotice | null;
  onClose?: () => void;
}) {
  if (notice === null) return null;
  return (
    <View style={styles.toastWrap} pointerEvents="box-none">
      <Toast
        message={notice.message}
        severity={notice.severity}
        onClose={onClose ?? (() => {})}
        testID="diagnostics-toast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stateWrap: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTarget.min + spacing.xs,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  intro: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  group: { gap: spacing.xs },
  label: { ...textStyle(typography.labelMd), color: colors.textSecondary, textTransform: "uppercase" },
  chips: { flexDirection: "row", gap: spacing.xs },
  pair: { flexDirection: "row", gap: spacing.xs },
  half: { flex: 1 },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  confirmText: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
  toastWrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
  },
});
