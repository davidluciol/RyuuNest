import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "../../icons";
import {
  dragonNightColors,
  layoutForWidth,
  spacing,
  touchTarget,
  typography,
} from "@ryuunest/ui-tokens";
import { useWindowDimensions } from "react-native";

import EmptyState from "../../components/EmptyState";
import FocusPressable from "../../components/FocusPressable";
import RecentCard from "../../components/RecentCard";
import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";
import type { HomeProgress } from "../home/homeFixtures";

/**
 * F82 — pantalla de lista reutilizable («Ver todas»): cabecera con atrás + título y
 * cuadrícula de tarjetas. El título y los ítems llegan por props; quien la usa decide
 * la fuente de datos (`listSources`) y qué hace al tocar (P-155).
 */
const colors = dragonNightColors;

export interface ListScreenProps {
  title: string;
  items: HomeProgress[];
  /** Título del estado vacío. */
  emptyTitle: string;
  /** Acción del estado vacío (obligatoria en `EmptyState`). */
  emptyActionLabel: string;
  onBack?: () => void;
  onItemPress?: (item: HomeProgress) => void;
  onEmptyAction?: () => void;
}

export default function ListScreen({
  title,
  items,
  emptyTitle,
  emptyActionLabel,
  onBack,
  onItemPress,
  onEmptyAction,
}: ListScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  return (
    <View style={styles.screen} testID="screen-list">
      <View style={[styles.header, { paddingHorizontal: layout.margin }]}>
        <FocusPressable
          onPress={onBack}
          hitSlop={touchTarget.min / 4}
          accessibilityRole="button"
          accessibilityLabel={t("actions.back")}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </FocusPressable>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState title={emptyTitle} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.grid,
            { paddingHorizontal: layout.margin, gap: layout.gap },
          ]}
        >
          {items.map((item) => (
            <RecentCard
              key={item.seriesId}
              kind={item.kind ?? undefined}
              title={item.title}
              chapter={item.chapterLabel}
              progress={item.pageTotal > 0 ? item.pageIndex / item.pageTotal : 0}
              onPress={() => onItemPress?.(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  title: { ...textStyle(typography.headlineSm), color: colors.textPrimary, flexShrink: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingVertical: spacing.md },
  emptyWrap: { flex: 1, justifyContent: "center" },
});
