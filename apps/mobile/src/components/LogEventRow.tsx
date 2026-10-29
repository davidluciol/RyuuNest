import { Pressable, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { ChevronDown, ChevronUp, CircleAlert, Info, TriangleAlert } from "../icons";
import {
  LOG_EVENT_ICON_SIZE,
  logEventDetailBoxStyle,
  logEventRowStyle,
  logEventToneColor,
  type LogEventTone,
} from "./logEventRowStyles";
import { textStyle } from "./textStyle";

/**
 * F30 — fila de evento del registro de diagnóstico (FB2: «Ajustes →
 * Diagnóstico», P-72). Icono de nivel + etiqueta de texto (nunca solo color),
 * código en mono, mensaje completo (sin «…», T7), cuándo ocurrió y un detalle
 * desplegable con el contexto saneado. Presentacional: el estado de
 * desplegado vive en quien la usa.
 */

const colors = dragonNightColors;

export interface LogEventDetailLine {
  label: string;
  value: string;
}

export interface LogEventRowProps {
  /** Etiqueta del nivel («Error», «Aviso», «Info»). */
  levelLabel: string;
  tone: LogEventTone;
  /** Código corto del evento (`module.timeout`). */
  code: string;
  message: string;
  /** «Hoy · 14:32». */
  when: string;
  detailLines: LogEventDetailLine[];
  expanded: boolean;
  onToggleDetail?: () => void;
  showDetailLabel: string;
  hideDetailLabel: string;
  testID?: string;
}

function ToneIcon({ tone, color }: { tone: LogEventTone; color: string }) {
  if (tone === "error") return <CircleAlert size={LOG_EVENT_ICON_SIZE} color={color} />;
  if (tone === "warning") return <TriangleAlert size={LOG_EVENT_ICON_SIZE} color={color} />;
  return <Info size={LOG_EVENT_ICON_SIZE} color={color} />;
}

export default function LogEventRow({
  levelLabel,
  tone,
  code,
  message,
  when,
  detailLines,
  expanded,
  onToggleDetail,
  showDetailLabel,
  hideDetailLabel,
  testID,
}: LogEventRowProps) {
  const toneColor = logEventToneColor(tone);
  const toggleLabel = expanded ? hideDetailLabel : showDetailLabel;

  return (
    <View style={[styles.row, logEventRowStyle()]} testID={testID}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ToneIcon tone={tone} color={toneColor} />
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={[styles.level, { color: toneColor }]}>{levelLabel}</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.when}>{when}</Text>
        {expanded ? (
          <View style={logEventDetailBoxStyle()}>
            {detailLines.map((line) => (
              <Text key={`${line.label}:${line.value}`} style={styles.detailLine}>
                <Text style={styles.detailLabel}>{line.label}: </Text>
                {line.value}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={toggleLabel}
          onPress={onToggleDetail}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>{toggleLabel}</Text>
          {expanded ? (
            <ChevronUp size={spacing.md} color={colors.textPrimary} />
          ) : (
            <ChevronDown size={spacing.md} color={colors.textPrimary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  body: { flex: 1, minWidth: 0, gap: spacing.xxs },
  head: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: spacing.xs },
  level: { ...textStyle(typography.labelMd) },
  code: { ...textStyle(typography.bodySm), color: colors.textPrimary },
  message: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  when: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  detailLine: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  detailLabel: { color: colors.textPrimary },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: touchTarget.min,
  },
  toggleText: { ...textStyle(typography.labelLg), color: colors.textPrimary },
});
