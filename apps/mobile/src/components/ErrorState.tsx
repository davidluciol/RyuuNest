import { t } from "../i18n";
import FocusPressable from "./FocusPressable";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import Button from "./Button";
import DragonMarker from "./DragonMarker";
import { textStyle } from "./textStyle";
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
  /** F103: muestra «Mandar reporte» (P-198). */
  onReport?: () => void;
}

export default function ErrorState({
  title,
  message,
  detail,
  retryLabel,
  onRetry,
  detailLabel,
  onReport,
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
      {onReport === undefined ? null : (
        <FocusPressable
          accessibilityRole="button"
          accessibilityLabel={t("report.action")}
          hitSlop={touchTarget.min / 4}
          onPress={onReport}
          style={styles.toggle}
          testID="error-state-report"
        >
          <Text style={[styles.toggleText, { color: colors.action }]}>{t("report.action")}</Text>
        </FocusPressable>
      )}
      {hasDetail ? (
        <View style={styles.detailArea}>
          <FocusPressable
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
          </FocusPressable>
          {expanded ? (
            <View style={styles.detailBox}>
              {lines.map((line) => (
                <Text key={line} style={[styles.detailLine, { color: colors.message }]}>
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
    ...textStyle(titleStyle()),
    textAlign: "center",
  },
  message: {
    ...textStyle(messageStyle()),
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
    ...textStyle(typography.labelLg),
  },
  detailBox: detailBoxStyle(),
  detailLine: {
    ...textStyle(detailTextStyle()),
    // Una URL no tiene espacios: sin esto la web no la parte y se sale de la caja.
    ...({ wordBreak: "break-all" } as object), // react-native-web lo acepta; RN nativo parte solo
  },
});
