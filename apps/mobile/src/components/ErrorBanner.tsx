import FocusPressable from "./FocusPressable";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, touchTarget } from "@ryuunest/ui-tokens";

import CodeChip from "./CodeChip";
import { ChevronDown, ChevronUp, CircleAlert, RefreshCw } from "../icons";

import { type ErrorDetail, detailLines } from "./stateStyles";
import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  bannerActionMinHeight,
  bannerActionTextStyle,
  bannerMessageStyle,
  bannerStyle,
  bannerTitleStyle,
  dialogDetailBoxStyle,
  dialogDetailTextStyle,
  severityColor,
} from "./errorNoticeStyles";

/**
 * F29 — banner inline de error (P-72, F15/F16): vive **dentro** de la pantalla
 * (no encima): causa con código, acción de reintentar y detalle técnico
 * desplegable (módulo, URL, código, selector — el mismo `ErrorDetail` de
 * `ErrorState`). Sin animaciones (Regla 4).
 */

const colors = dragonNightColors;

export interface ErrorBannerProps {
  /** Causa legible (título del aviso). */
  title: string;
  /** Explicación simple, opcional. */
  message?: string;
  /** Datos técnicos para el detalle desplegable. */
  detail?: ErrorDetail;
  /** Código del error (siempre visible; nunca solo color, RF-43). */
  code?: string;
  severity?: ErrorSeverity;
  /** Etiqueta de la acción principal (reintentar). */
  actionLabel: string;
  onAction?: () => void;
  /** Etiqueta del desplegable de detalle. */
  detailLabel?: string;
  testID?: string;
}

export default function ErrorBanner({
  title,
  message,
  detail,
  code,
  severity = "error",
  actionLabel,
  onAction,
  detailLabel,
  testID,
}: ErrorBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const accent = severityColor(severity);
  const lines = detail ? detailLines(detail) : [];
  const hasDetail = detailLabel !== undefined && lines.length > 0;

  return (
    <View style={[styles.banner, bannerStyle(severity)]} testID={testID} accessibilityRole="alert">
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <CircleAlert size={spacing.lg} color={accent} />
      </View>
      {code !== undefined ? (
        <CodeChip code={code} severity={severity} testID="error-code-chip" />
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      <View style={styles.actions}>
        <FocusPressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={touchTarget.min / 4}
          onPress={onAction}
          style={styles.action}
        >
          <RefreshCw size={spacing.md} color={accent} />
          <Text style={[styles.actionText, { color: accent }]}>{actionLabel}</Text>
        </FocusPressable>
        {hasDetail ? (
          <FocusPressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={detailLabel}
            hitSlop={touchTarget.min / 4}
            onPress={() => setExpanded((value) => !value)}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: accent }]}>{detailLabel}</Text>
            {expanded ? (
              <ChevronUp size={16} color={accent} />
            ) : (
              <ChevronDown size={16} color={accent} />
            )}
          </FocusPressable>
        ) : null}
      </View>
      {expanded ? (
        <View style={styles.detailBox}>
          {lines.map((line) => (
            <Text key={line} style={[styles.detailLine, { color: colors.textSecondary }]}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {},
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    ...textStyle(bannerTitleStyle()),
    flex: 1,
    minWidth: 0,
  },
  message: {
    ...textStyle(bannerMessageStyle()),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: touchTarget.min / 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: touchTarget.min / 8,
    minHeight: bannerActionMinHeight(),
  },
  actionText: {
    ...textStyle(bannerActionTextStyle()),
  },
  detailBox: dialogDetailBoxStyle(),
  detailLine: {
    ...textStyle(dialogDetailTextStyle()),
  },
});
