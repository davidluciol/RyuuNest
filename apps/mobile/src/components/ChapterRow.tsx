import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { type ChapterState, chapterRowColors, chapterRowStyle } from "./chapterRowStyles";

/**
 * F07 — fila de capítulo (SPEC §11.10, V8): alto mínimo 56 px, relleno
 * horizontal 16. Tres estados con **máximo dos señales**: sin leer (texto
 * principal), en curso (marcador ● y porcentaje en `progress`), completado
 * (atenuado y ✓ en `positive`, **sin tachar**).
 */

const colors = dragonNightColors;

export interface ChapterRowProps {
  title: string;
  state?: ChapterState;
  /** Porcentaje 0–100, solo si `state` es "in-progress". */
  percent?: number;
  /** Fecha o grupo (metadato secundario). */
  hint?: string;
  onPress?: () => void;
}

export default function ChapterRow({
  title,
  state = "unread",
  percent,
  hint,
  onPress,
}: ChapterRowProps) {
  const rowColors = chapterRowColors(state);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={chapterRowStyle(state)}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: rowColors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {state === "in-progress" && typeof percent === "number" ? (
            <Text style={[styles.progress, { color: rowColors.accent }]}>● {percent}%</Text>
          ) : hint ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={1}>
              {hint}
            </Text>
          ) : null}
        </View>
        {state === "completed" ? <Check size={20} color={colors.positive} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  textBlock: { flex: 1, gap: spacing.xxs },
  title: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    lineHeight: typography.bodyLg.lineHeight,
  },
  progress: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    lineHeight: typography.labelMd.lineHeight,
  },
  hint: {
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
});
