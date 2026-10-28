// single-use: barras superior e inferior del lector (RF-22); no tienen sentido fuera de él.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import { textStyle } from "../../components/textStyle";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, List, Rows3 } from "../../icons";
import { t } from "../../i18n";
import { percentOf } from "../../reader/readerLayout";
import { readerBarStyle, readerIconButtonStyle } from "./readerStyles";

/**
 * F18 — controles mínimos del lector (RF-22): cerrar, título, selector de capítulo y modo de
 * lectura, más el progreso. Fondo `elevated` al 95 % con borde `border`; sin marca, sombras ni
 * mascota, y sin transiciones (el lector no anima).
 */

const colors = dragonNightColors;

export interface ReaderTopBarProps {
  title: string;
  subtitle: string;
  chapterShort: string;
  onClose: () => void;
  onOpenChapters: () => void;
}

export function ReaderTopBar({
  title,
  subtitle,
  chapterShort,
  onClose,
  onOpenChapters,
}: ReaderTopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="reader-top-bar"
      style={[styles.bar, styles.top, readerBarStyle(), { paddingTop: insets.top + spacing.xs }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("reader.close")}
        onPress={onClose}
        style={readerIconButtonStyle()}
      >
        <ArrowLeft size={spacing.lg} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.subtitleRow}>
          <View style={styles.dot} />
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("reader.chapters.select")}
        onPress={onOpenChapters}
        style={styles.chapterPill}
      >
        <List size={spacing.md} color={colors.accent} />
        <Text style={styles.pillLabel}>{chapterShort}</Text>
        <ChevronDown size={spacing.md} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export interface ReaderBottomBarProps {
  pageIndex: number;
  pageTotal: number | null;
  modeLabel: string;
  /** Número del capítulo siguiente; `undefined` si no tiene número. */
  next: { number: number | undefined } | null;
  onPrevious: () => void;
  onNext: () => void;
  onOpenMode: () => void;
  onOpenNextChapter: () => void;
}

export function ReaderBottomBar({
  pageIndex,
  pageTotal,
  modeLabel,
  next,
  onPrevious,
  onNext,
  onOpenMode,
  onOpenNextChapter,
}: ReaderBottomBarProps) {
  const insets = useSafeAreaInsets();
  const percent = percentOf(pageIndex, pageTotal);
  return (
    <View
      testID="reader-bottom-bar"
      style={[styles.bar, styles.bottom, readerBarStyle(), { paddingBottom: insets.bottom + spacing.sm }]}
    >
      <View style={styles.pageRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("reader.page.previous")}
          accessibilityState={{ disabled: pageIndex === 0 }}
          disabled={pageIndex === 0}
          onPress={onPrevious}
          style={[readerIconButtonStyle(), styles.pageButton, pageIndex === 0 && styles.disabled]}
        >
          <ChevronLeft size={spacing.lg} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <Text style={styles.pageLabel}>
              {pageTotal === null
                ? t("reader.page.indicatorOpen", { current: pageIndex + 1 })
                : t("reader.page.indicator", { current: pageIndex + 1, total: pageTotal })}
            </Text>
            {percent === null ? null : (
              <Text style={styles.percent}>{t("reader.progress.percent", { percent })}</Text>
            )}
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent ?? 0}%` }]} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("reader.page.next")}
          onPress={onNext}
          style={[readerIconButtonStyle(), styles.pageButton]}
        >
          <ChevronRight size={spacing.lg} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("reader.mode.open")}
          onPress={onOpenMode}
          style={styles.modePill}
        >
          <Rows3 size={spacing.md} color={colors.accent} />
          <Text style={styles.modeLabel}>{modeLabel}</Text>
        </Pressable>
        {next === null ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("reader.nextChapter")}
            onPress={onOpenNextChapter}
            style={styles.nextPill}
          >
            <Text style={styles.nextLabel}>
              {next.number === undefined
                ? t("reader.nextChapter")
                : t("reader.chapter.short", { number: next.number })}
            </Text>
            <ChevronRight size={spacing.md} color={colors.progress} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  top: {
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  bottom: {
    bottom: 0,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { ...textStyle(typography.titleLg), color: colors.textPrimary },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  subtitle: { ...textStyle(typography.labelSm), color: colors.textSecondary },
  chapterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: spacing["2xl"],
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  pillLabel: { ...textStyle(typography.labelMd), color: colors.textPrimary },
  pageRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pageButton: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  progress: { flex: 1, gap: spacing.xxs },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  pageLabel: { ...textStyle(typography.labelMd), color: colors.textPrimary },
  percent: { ...textStyle(typography.labelMd), color: colors.progress },
  track: {
    height: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  fill: { height: spacing.xxs, backgroundColor: colors.progress },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: spacing["2xl"],
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.badgeBg,
  },
  modeLabel: { ...textStyle(typography.labelMd), color: colors.accent },
  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: spacing["2xl"],
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  nextLabel: { ...textStyle(typography.labelMd), color: colors.progress },
});
