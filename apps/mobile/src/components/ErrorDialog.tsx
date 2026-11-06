import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, touchTarget } from "@ryuunest/ui-tokens";

import Button from "./Button";
import CodeChip from "./CodeChip";
import { ChevronDown, ChevronUp } from "../icons";
import {
  type ErrorDetail,
  detailLines,
} from "./stateStyles";
import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  dialogBackdropStyle,
  dialogDetailTextStyle,
  dialogDisclosureStyle,
  dialogFrameStyle,
  dialogMessageStyle,
  dialogStyle,
  dialogTitleStyle,
  severityColor,
} from "./errorNoticeStyles";
import { t } from "../i18n";

/**
 * F29 — diálogo de error bloqueante (P-72): nivel 2, título, etiqueta de código,
 * explicación simple, «Ver detalle técnico» plegable y acciones (cerrar,
 * reintentar: el único primario). Con `busy` no se puede cerrar a medias (el
 * velo y «Cerrar» no responden), igual que `SheetModal`. Alineado con
 * `di_logo_de_error_bloqueante_dragon_night` (F34.1).
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
        <Pressable testID={testID} style={styles.frame}>
          <View style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {code !== undefined ? (
              <CodeChip code={code} severity={severity} testID="error-code-chip" />
            ) : null}
            {message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            ) : null}
            {hasDetail ? (
              <View style={styles.disclosure}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={detailLabel}
                  onPress={() => setExpanded((value) => !value)}
                  style={styles.detailToggle}
                >
                  <Text style={[styles.detailToggleText, { color: accent }]}>{detailLabel}</Text>
                  {expanded ? (
                    <ChevronUp size={spacing.md} color={accent} />
                  ) : (
                    <ChevronDown size={spacing.md} color={accent} />
                  )}
                </Pressable>
                {expanded ? (
                  <View style={styles.detailBody}>
                    {lines.map((line) => (
                      <Text key={line} style={[styles.detailLine, { color: colors.textSecondary }]}>
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
  frame: dialogFrameStyle(),
  dialog: dialogStyle(),
  title: {
    ...textStyle(dialogTitleStyle()),
    color: colors.textPrimary,
  },
  message: {
    ...textStyle(dialogMessageStyle()),
  },
  disclosure: dialogDisclosureStyle(),
  detailToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.sm,
  },
  detailToggleText: {
    ...textStyle(dialogDetailTextStyle()),
  },
  detailBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
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
