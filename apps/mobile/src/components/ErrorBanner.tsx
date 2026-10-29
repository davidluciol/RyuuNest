import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { dragonNightColors, touchTarget } from "@ryuunest/ui-tokens";

import {
  type ErrorDetail,
  detailLines,
} from "./stateStyles";
import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  bannerActionMinHeight,
  bannerCodeStyle,
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
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {title}
      </Text>
      {code !== undefined ? (
        <Text style={[styles.code, { color: accent }]} numberOfLines={1}>
          {code}
        </Text>
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
          {message}
        </Text>
      ) : null}
      <View style={styles.actions}>
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
        {hasDetail ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={detailLabel}
            hitSlop={touchTarget.min / 4}
            onPress={() => setExpanded((value) => !value)}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: accent }]} numberOfLines={1}>
              {detailLabel}
            </Text>
            {expanded ? (
              <ChevronUp size={16} color={accent} />
            ) : (
              <ChevronDown size={16} color={accent} />
            )}
          </Pressable>
        ) : null}
      </View>
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
  );
}

const styles = StyleSheet.create({
  banner: {},
  title: {
    ...textStyle(bannerTitleStyle()),
  },
  code: {
    ...textStyle(bannerCodeStyle()),
    fontWeight: "600",
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
    ...textStyle(bannerCodeStyle()),
    fontWeight: "600",
  },
  detailBox: dialogDetailBoxStyle(),
  detailLine: {
    ...textStyle(dialogDetailTextStyle()),
  },
});
