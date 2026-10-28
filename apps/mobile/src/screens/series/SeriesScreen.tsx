import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { dragonNightColors, radii, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ChapterRow from "../../components/ChapterRow";
import { CONTINUE_CARD_COVER_WIDTH, continueCardCoverHeight } from "../../components/continueCardStyles";
import { ChevronDown, ChevronLeft, Folder, Heart, Play, Search } from "../../icons";
import { kindLabel } from "../../components/kindLabel";
import { t } from "../../i18n";
import { textStyle } from "../../components/textStyle";
import {
  chapterProgress,
  chapterState,
  preferredRelease,
  type SeriesViewData,
} from "./seriesFixtures";

const colors = dragonNightColors;

function statusLabel(status: SeriesViewData["details"]["status"]): string {
  switch (status) {
    case "ongoing": return t("series.status.ongoing");
    case "completed": return t("series.status.completed");
    case "hiatus": return t("series.status.hiatus");
    case "cancelled": return t("series.status.cancelled");
    case "unknown": return t("series.status.unknown");
  }
}

function stateLabel(state: "unread" | "in-progress" | "completed"): string {
  switch (state) {
    case "unread": return t("series.state.unread");
    case "in-progress": return t("series.state.inProgress");
    case "completed": return t("series.state.completed");
  }
}

export interface SeriesScreenProps {
  data: SeriesViewData;
  favorite?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  onFavoriteToggle?: () => void;
  onFolderLongPress?: () => void;
  onReleaseSelect?: (chapterId: string, releaseId: string) => void;
  onChapterPress?: (chapterId: string, releaseId: string) => void;
}

export default function SeriesScreen({
  data,
  favorite = false,
  onBack,
  onContinue,
  onFavoriteToggle,
  onFolderLongPress,
  onReleaseSelect,
  onChapterPress,
}: SeriesScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const [descending, setDescending] = useState(true);
  const [query, setQuery] = useState("");
  const { details, progress, readChapterIds } = data;
  const chapters = useMemo(() => {
    const filtered = details.chapters.filter((chapter) =>
      `${chapter.number} ${chapter.title}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
    return descending ? filtered : [...filtered].reverse();
  }, [details.chapters, descending, query]);
  const currentChapter = details.chapters.find((chapter) => chapter.id === progress?.chapterId);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="screen-series">
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={touchTarget.min / 4} accessibilityRole="button" accessibilityLabel={t("actions.back")}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("series.title")}</Text>
      </View>

      <View style={styles.hero}>
        {details.cover ? (
          <Image source={data.coverSource ?? { uri: details.cover.url }} style={styles.cover} />
        ) : null}
        <View style={styles.heroText}>
          <View style={styles.badges}>
            {details.kind ? <Badge label={kindLabel(details.kind)} /> : null}
            <Badge label={statusLabel(details.status)} />
          </View>
          <Text style={styles.title} numberOfLines={2}>{details.title}</Text>
          <Text style={styles.meta} numberOfLines={2}>{details.altTitles.join(" · ")}</Text>
          <Text style={styles.source}>{data.moduleName}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
        {details.genres.map((genre) => <Chip key={genre} label={genre} />)}
      </ScrollView>

      {details.description ? (
        <View style={styles.descriptionCard}>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>{details.description}</Text>
          <Pressable onPress={() => setExpanded((value) => !value)} hitSlop={touchTarget.min / 4} accessibilityRole="button">
            <Text style={styles.link}>{expanded ? t("series.description.less") : t("series.description.more")}</Text>
          </Pressable>
        </View>
      ) : null}

      <Button
        label={progress && currentChapter ? t("series.continue", { number: currentChapter.number ?? "" }) : t("series.start")}
        onPress={onContinue}
        icon={<Play size={spacing.md} color={colors.bg} />}
        trailingIcon={progress && currentChapter ? <Text style={styles.ctaPercent}>{chapterProgress(currentChapter, progress) ?? 0}%</Text> : undefined}
      />

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onFavoriteToggle}
          hitSlop={touchTarget.min / 4}
          accessibilityRole="button"
          accessibilityLabel={favorite ? t("series.favorited") : t("series.favorite")}
        >
          <Heart size={20} color={favorite ? colors.progress : colors.textPrimary} fill={favorite ? colors.progress : "transparent"} />
          <Text style={styles.actionLabel}>{favorite ? t("series.favorited") : t("series.favorite")}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onLongPress={onFolderLongPress} delayLongPress={400} hitSlop={touchTarget.min / 4} accessibilityRole="button" accessibilityLabel={t("series.folder") }>
          <Folder size={20} color={colors.accent} /><Text style={styles.actionLabel}>{t("series.folder")}</Text>
        </Pressable>
      </View>

      <View style={styles.chapterHeader}>
        <Text style={styles.sectionTitle}>{t("series.chapters")}</Text>
        <Text style={styles.count}>{details.chapters.length}</Text>
      </View>
      <View style={styles.searchRow}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("series.search")}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          accessibilityLabel={t("series.search")}
        />
        <Pressable onPress={() => setDescending((value) => !value)} hitSlop={touchTarget.min / 4} accessibilityRole="button" accessibilityLabel={t("series.sort") }>
          <ChevronDown size={20} color={colors.textSecondary} style={{ transform: [{ rotate: descending ? "0deg" : "180deg" }] }} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {chapters.map((chapter) => {
          const state = chapterState(chapter.id, progress, readChapterIds);
          const release = preferredRelease(chapter.releases, data.preferredReleaseId);
          const percent = chapterProgress(chapter, progress);
          return (
            <View key={chapter.id} style={styles.chapterCard}>
              <ChapterRow
                title={`${t("series.chapter", { number: chapter.number ?? "" })}: ${chapter.title}`}
                state={state}
                percent={percent}
                hint={stateLabel(state)}
                onPress={() => release && onChapterPress?.(chapter.id, release.id)}
              />
              {release ? (
                <Pressable onPress={() => onReleaseSelect?.(chapter.id, release.id)} style={styles.release} hitSlop={touchTarget.min / 4} accessibilityRole="button">
                  <Text style={styles.releaseText}>{release.group}</Text><ChevronDown size={14} color={colors.accent} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: touchTarget.min },
  headerTitle: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  hero: { flexDirection: "row", gap: spacing.md },
  cover: { width: CONTINUE_CARD_COVER_WIDTH, height: continueCardCoverHeight(), borderRadius: radii.card, backgroundColor: colors.surface },
  heroText: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  title: { ...textStyle(typography.headlineMd), color: colors.textPrimary },
  meta: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  source: { ...textStyle(typography.labelMd), color: colors.accent },
  genreRow: { gap: spacing.xs },
  descriptionCard: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.xs },
  description: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
  link: { ...textStyle(typography.labelMd), color: colors.accent },
  ctaPercent: { ...textStyle(typography.labelMd), color: colors.bg },
  actions: { flexDirection: "row", gap: spacing.xs },
  actionButton: { flex: 1, minHeight: touchTarget.min, borderRadius: radii.card, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.xs },
  actionLabel: { ...textStyle(typography.labelMd), color: colors.textPrimary },
  chapterHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md },
  sectionTitle: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  count: { ...textStyle(typography.labelMd), color: colors.textSecondary, backgroundColor: colors.elevated, paddingHorizontal: spacing.xs, borderRadius: radii.pill },
  searchRow: { minHeight: touchTarget.min, backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  searchInput: { flex: 1, ...textStyle(typography.bodyMd), color: colors.textPrimary },
  list: { gap: spacing.xs },
  chapterCard: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.xs },
  release: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xxs, marginLeft: spacing.md, paddingBottom: spacing.xs },
  releaseText: { ...textStyle(typography.labelSm), color: colors.accent },
});
