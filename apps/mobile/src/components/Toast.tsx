import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, touchTarget } from "@ryuunest/ui-tokens";

import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  severityColor,
  TOAST_DURATION_MS,
  toastActionStyle,
  toastDotStyle,
  toastStyle,
  toastTextStyle,
} from "./errorNoticeStyles";
import { X } from "../icons";
import { t } from "../i18n";

/**
 * F29 — toast (P-72): aviso transitorio de 4 s con el mensaje completo y acción opcional.
 * No bloquea la pantalla (se posiciona encima, pero no es modal) y desaparece
 * solo; si el usuario lo cierra antes, se cancela el temporizador.
 *
 * Animación: solo `opacity` (Regla 4 de `AGENTS.md`); en el lector no se usa
 * (nada anima allí).
 */

const colors = dragonNightColors;

export interface ToastProps {
  /** Mensaje del aviso, completo y sin «…» (T7). */
  message: string;
  /** Severidad: fija el color del borde y de la acción. */
  severity?: ErrorSeverity;
  /** Etiqueta de la acción opcional (p. ej. «Reintentar»). */
  actionLabel?: string;
  onAction?: () => void;
  /** Cierra el toast (lo llama el temporizador o el botón de cerrar). */
  onClose: () => void;
  testID?: string;
}

export default function Toast({
  message,
  severity = "info",
  actionLabel,
  onAction,
  onClose,
  testID,
}: ToastProps) {
  const accent = severityColor(severity);

  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <View style={[styles.toast, toastStyle(severity)]} testID={testID} accessibilityRole="alert">
      <View testID="toast-dot" style={toastDotStyle(severity)} />
      <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
      {actionLabel !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={touchTarget.min / 4}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: accent }]} numberOfLines={1}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("toast.close")}
        hitSlop={touchTarget.min / 4}
        onPress={onClose}
        style={styles.close}
      >
        <X size={spacing.md} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    ...textStyle(toastTextStyle()),
    flex: 1,
    minWidth: 0,
  },
  action: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  actionText: {
    ...textStyle(toastActionStyle()),
  },
  close: {
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
  },
});
