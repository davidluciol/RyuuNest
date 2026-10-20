import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import Button from "./Button";
import DragonMarker from "./DragonMarker";
import {
  type ErrorDetail,
  detailBoxStyle,
  detailLines,
  detailTextStyle,
  messageStyle,
  stateColors,
  stateStyle,
  titleStyle,
} from "./stateStyles";

/**
 * F08 — error de módulo (SPEC §11.12): dragon mediano «confundido», causa con
 * código en color `error`, acción de **reintentar** y detalle técnico
 * desplegable (módulo, URL, código, selector). Sin sombras (RNF-12). Los
 * textos llegan por props (traducciones, F10).
 */

const colors = stateColors();

export interface ErrorStateProps {
  title: string;
  /** Causa legible bajo el título. */
  message?: string;
  /** Datos técnicos para el detalle desplegable (SPEC §11.12). */
  detail?: ErrorDetail;
  /** Etiqueta de la acción principal (reintentar). */
  retryLabel: string;
  onRetry?: () => void;
  /** Etiqueta del desplegable de detalle (p. ej. «Ver detalle»). */
  detailLabel?: string;
}

export default function ErrorState({
  title,
  message,
  detail,
  retryLabel,
  onRetry,
  detailLabel,
}: ErrorStateProps) {
  const [expanded, setExpanded] = useState(false);
  const shape = stateStyle("md");
  const lines = detail ? detailLines(detail) : [];
  const hasDetail = detailLabel !== undefined && lines.length > 0;
  return (
    <View style={[styles.block, { gap: shape.gap, padding: shape.padding }]}>
      <DragonMarker size={shape.dragonSize} color={colors.dragon} />
      <Text style={[styles.title, { color: colors.error }]} numberOfLines={2}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: colors.message }]} numberOfLines={3}>
          {message}
        </Text>
      ) : null}
      <Button label={retryLabel} onPress={onRetry} />
      {hasDetail ? (
        <View style={styles.detailArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={detailLabel}
            hitSlop={touchTarget.min / 4}
            onPress={() => setExpanded((value) => !value)}
            style={styles.toggle}
          >
            <Text style={[styles.toggleText, { color: colors.action }]}>{detailLabel}</Text>
            {expanded ? (
              <ChevronUp size={16} color={colors.action} />
            ) : (
              <ChevronDown size={16} color={colors.action} />
            )}
          </Pressable>
          {expanded ? (
            <View style={styles.detailBox}>
              {lines.map((line) => (
                <Text key={line} style={[styles.detailLine, { color: colors.message }]} numberOfLines={1}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
  },
  title: {
    fontFamily: titleStyle().fontFamily,
    fontSize: titleStyle().fontSize,
    lineHeight: titleStyle().lineHeight,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    fontFamily: messageStyle().fontFamily,
    fontSize: messageStyle().fontSize,
    lineHeight: messageStyle().lineHeight,
    textAlign: "center",
  },
  detailArea: { alignItems: "center" },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: touchTarget.min,
    justifyContent: "center",
  },
  toggleText: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: typography.labelLg.fontSize,
    lineHeight: typography.labelLg.lineHeight,
    fontWeight: "600",
  },
  detailBox: detailBoxStyle(),
  detailLine: {
    fontFamily: detailTextStyle().fontFamily,
    fontSize: detailTextStyle().fontSize,
    lineHeight: detailTextStyle().lineHeight,
  },
});
