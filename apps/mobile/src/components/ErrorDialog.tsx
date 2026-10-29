import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp, X } from "lucide-react-native";
import { dragonNightColors, spacing, touchTarget } from "@ryuunest/ui-tokens";

import Button from "./Button";
import {
  type ErrorDetail,
  detailLines,
} from "./stateStyles";
import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  dialogBackdropStyle,
  dialogCodeColor,
  dialogDetailBoxStyle,
  dialogDetailTextStyle,
  dialogMessageStyle,
  dialogStyle,
  dialogTitleStyle,
  severityColor,
} from "./errorNoticeStyles";
import { t } from "../i18n";

/**
 * F29 — diálogo de error bloqueante (P-72): nivel 2, título, explicación
 * simple, código, detalle expandible y acciones (reintentar, cerrar). Con
 * `busy` no se puede cerrar a medias (el velo y la X no responden), igual
 * que `SheetModal`.
 *
 * Sin animación de entrada en el lector (Regla 4: nada anima allí); fuera
 * del lector entra con `fade` (solo `opacity`).
 */

const colors = dragonNightColors;

export interface ErrorDialogProps {
  visible: boolean;
  /** Título del error (causa legible). */
  title: string;
  /** Explicación simple, sin jerga técnica (T5). */
  message?: string;
  /** Datos técnicos para el detalle expandible. */
  detail?: ErrorDetail;
  /** Código del error (siempre visible; nunca solo color, RF-43). */
  code?: string;
  severity?: ErrorSeverity;
  /** Etiqueta de la acción principal (reintentar). */
  retryLabel?: string;
  onRetry?: () => void;
  /** Etiqueta del desplegable de detalle. */
  detailLabel?: string;
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Trabajo en curso: bloquea el cierre. */
  busy?: boolean;
  /** Sin animación de entrada (la pide el lector). */
  animated?: boolean;
  testID?: string;
}

export default function ErrorDialog({
  visible,
  title,
  message,
  detail,
  code,
  severity = "error",
  retryLabel,
  onRetry,
  detailLabel,
  onClose,
  busy = false,
  animated = true,
  testID,
}: ErrorDialogProps) {
  const [expanded, setExpanded] = useState(false);
  const accent = severityColor(severity);
  const lines = detail ? detailLines(detail) : [];
  const hasDetail = detailLabel !== undefined && lines.length > 0;

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animated ? "fade" : "none"}
      onRequestClose={close}
    >
      <Pressable style={dialogBackdropStyle()} accessibilityLabel={t("actions.close")} onPress={close}>
        {/* Pressable vacío: traga el toque del contenido y no cierra el diálogo. */}
        <Pressable testID={testID}>
          <View style={styles.dialog}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("actions.close")}
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={close}
                style={styles.close}
              >
                <X size={spacing.md} color={colors.textSecondary} />
              </Pressable>
            </View>
            {code !== undefined ? (
              <Text style={[styles.code, { color: dialogCodeColor(severity) }]} numberOfLines={1}>
                {code}
              </Text>
            ) : null}
            {message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={4}>
                {message}
              </Text>
            ) : null}
            {hasDetail ? (
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={detailLabel}
                  hitSlop={touchTarget.min / 4}
                  onPress={() => setExpanded((value) => !value)}
                  style={styles.detailToggle}
                >
                  <Text style={[styles.detailToggleText, { color: accent }]}>{detailLabel}</Text>
                  {expanded ? (
                    <ChevronUp size={16} color={accent} />
                  ) : (
                    <ChevronDown size={16} color={accent} />
                  )}
                </Pressable>
                {expanded ? (
                  <View style={styles.detailBox}>
                    {lines.map((line) => (
                      <Text
                        key={line}
                        style={[styles.detailLine, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.actions}>
              <Button variant="secondary" label={t("actions.close")} onPress={close} disabled={busy} />
              {retryLabel !== undefined ? (
                <Button label={retryLabel} onPress={onRetry} disabled={busy} />
              ) : null}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: dialogStyle(),
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    ...textStyle(dialogTitleStyle()),
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
  },
  close: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  code: {
    ...textStyle(dialogDetailTextStyle()),
    fontWeight: "600",
  },
  message: {
    ...textStyle(dialogMessageStyle()),
  },
  detailToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: touchTarget.min,
  },
  detailToggleText: {
    ...textStyle(dialogDetailTextStyle()),
    fontWeight: "600",
  },
  detailBox: dialogDetailBoxStyle(),
  detailLine: {
    ...textStyle(dialogDetailTextStyle()),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
