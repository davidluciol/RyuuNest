import { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  dragonNightColors,
  layoutForWidth,
  spacing,
  touchTarget,
  typography,
} from "@ryuunest/ui-tokens";

import LibraryCard from "../../components/LibraryCard";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import TextField from "../../components/TextField";
import { Search } from "../../icons";
import { t } from "../../i18n";
import { kindLabel } from "../../components/kindLabel";
import {
  DEFAULT_LIBRARY_FILTERS,
  EMPTY_LIBRARY_DATA,
  filterLibrarySeries,
  type LibraryData,
  type LibraryFilters,
} from "./libraryFixtures";

/**
 * F14a/F14b — pantalla Biblioteca (RF-26 a RF-30, RF-35, SPEC §11.5):
 * búsqueda siempre visible, chips Todo · Leyendo · Carpetas, filtros por
 * tipo/fuente/NSFW, orden por nombre/último leído/fecha, cuadrícula
 * virtualizada con títulos a 2 líneas sin «…» (T7). Sin «Completado»
 * (RF-42, v2). Un solo acceso a carpetas (V6).
 */

const colors = dragonNightColors;

/** Mapa de claves de traducción para los órdenes (RF-28). */
const ORDER_KEYS = {
  name: "library.sort.name",
  lastRead: "library.sort.lastRead",
  addedAt: "library.sort.addedAt",
} as const;

export interface LibraryScreenProps {
  /** Datos de la pantalla; por defecto, estado vacío. */
  data?: LibraryData;
  /** Filtros iniciales (para pruebas y estado). */
  initialFilters?: Partial<LibraryFilters>;
  /** Callback al pulsar una serie. */
  onSeriesPress?: (seriesId: string, moduleId: string) => void;
  /** Callback al pulsar una carpeta. */
  onFolderPress?: (folderId: string) => void;
  /** Callback al pulsar «Gestionar» carpetas. */
  onManageFolders?: () => void;
  /** Callback del estado vacío (añadir repositorio). */
  onEmptyAction?: () => void;
  /** Callback al cambiar los filtros (para persistir estado). */
  onFiltersChange?: (filters: LibraryFilters) => void;
}

export default function LibraryScreen({
  data = EMPTY_LIBRARY_DATA,
  initialFilters,
  onSeriesPress,
  onFolderPress,
  onManageFolders,
  onEmptyAction,
  onFiltersChange,
}: LibraryScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  const [filters, setFilters] = useState<LibraryFilters>({
    ...DEFAULT_LIBRARY_FILTERS,
    ...initialFilters,
  });

  const updateFilters = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange?.(next);
  };

  const visibleSeries = useMemo(
    () => filterLibrarySeries(data.series, filters),
    [data.series, filters],
  );

  const totalCount = data.series.filter((s) => !s.nsfw || filters.nsfwVisible).length;
  const readingCount = data.series.filter(
    (s) => s.progress !== null && (!s.nsfw || filters.nsfwVisible),
  ).length;
  const foldersCount = data.folders.length;

  // Estado vacío: sin favoritos.
  if (data.series.length === 0) {
    return (
      <View style={styles.emptyWrap} testID="screen-library">
        <EmptyState
          title={t("state.empty.library.title")}
          message={t("state.empty.library.message")}
          actionLabel={t("actions.addRepository")}
          onAction={onEmptyAction}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="screen-library">
      {/* Búsqueda siempre visible (RF-26). */}
      <View style={[styles.searchWrap, { paddingHorizontal: layout.margin }]}>
        <TextField
          placeholder={t("library.search.placeholder")}
          value={filters.search}
          onChangeText={(text) => updateFilters({ search: text })}
          leadingIcon={<Search size={20} color={colors.textSecondary} />}
          accessibilityLabel={t("library.search.placeholder")}
        />
      </View>

      {/* Chips Todo · Leyendo · Carpetas (RF-26). */}
      <View style={[styles.chipsWrap, { paddingHorizontal: layout.margin }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label={t("library.chip.all", { count: totalCount })}
            selected={filters.chip === "all"}
            onPress={() => updateFilters({ chip: "all" })}
          />
          <Chip
            label={t("library.chip.reading", { count: readingCount })}
            selected={filters.chip === "reading"}
            onPress={() => updateFilters({ chip: "reading" })}
          />
          <Chip
            label={t("library.chip.folders", { count: foldersCount })}
            selected={filters.chip === "folders"}
            onPress={() => updateFilters({ chip: "folders" })}
          />
        </ScrollView>
      </View>

      {/* Filtros secundarios: tipo, fuente, orden, NSFW (RF-27, RF-28). */}
      <View style={[styles.filtersWrap, { paddingHorizontal: layout.margin }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <Chip label={t("library.filter.kind")} selected={filters.kinds.length > 0} />
          <Chip label={t("library.filter.source")} selected={filters.moduleIds.length > 0} />
          <Chip
            label={`${t("library.sort.label")}: ${t(ORDER_KEYS[filters.order])}`}
            selected={filters.order !== "name"}
            onPress={() => {
              const orders: Array<LibraryFilters["order"]> = ["name", "lastRead", "addedAt"];
              const idx = orders.indexOf(filters.order);
              const next = orders[(idx + 1) % orders.length];
              updateFilters({ order: next });
            }}
          />
          <Chip
            label={t("library.filter.nsfw")}
            selected={filters.nsfwVisible}
            onPress={() => updateFilters({ nsfwVisible: !filters.nsfwVisible })}
          />
        </ScrollView>
      </View>

      {/* Sección de carpetas (F14b, V6: un solo acceso). */}
      {data.folders.length > 0 ? (
        <View style={[styles.foldersSection, { paddingHorizontal: layout.margin }]}>
          <View style={styles.foldersHeader}>
            <Text style={styles.foldersTitle}>{t("library.section.folders")}</Text>
            <Text style={styles.foldersManage} onPress={onManageFolders}>
              {t("library.folder.manage")}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foldersRow}
          >
            {data.folders.map((folder) => (
              <View key={folder.id} style={styles.folderChip}>
                <Chip
                  label={`${folder.name} (${folder.count})`}
                  selected={filters.folderId === folder.id}
                  onPress={() => {
                    updateFilters({
                      folderId: filters.folderId === folder.id ? undefined : folder.id,
                    });
                    onFolderPress?.(folder.id);
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Cuadrícula virtualizada (RF-26, AC-4). */}
      {visibleSeries.length === 0 ? (
        <View style={styles.emptySearchWrap}>
          <EmptyState
            title={t("state.empty.search.title")}
            message={t("state.empty.search.message", { query: filters.search || "…" })}
            actionLabel={t("actions.exploreAgain")}
            onAction={() => updateFilters({ search: "" })}
            scale="sm"
          />
        </View>
      ) : (
        <FlatList
          style={styles.grid}
          contentContainerStyle={{
            paddingHorizontal: layout.margin,
            paddingBottom: spacing.xl,
            gap: layout.gap,
          }}
          data={visibleSeries}
          keyExtractor={(item) => `${item.moduleId}:${item.seriesId}`}
          numColumns={3}
          columnWrapperStyle={{ gap: layout.gap }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <LibraryCard
                kind={item.kind === null ? undefined : kindLabel(item.kind)}
                title={item.title}
                progress={
                  item.progress && item.progress.pageTotal > 0
                    ? item.progress.pageIndex / item.progress.pageTotal
                    : 0
                }
                accessibilityLabel={item.title}
                onPress={() => onSeriesPress?.(item.seriesId, item.moduleId)}
              />
            </View>
          )}
          initialNumToRender={12}
          windowSize={5}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  searchWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chipsWrap: {
    paddingBottom: spacing.xs,
  },
  chipsRow: {
    gap: spacing.xs,
  },
  filtersWrap: {
    paddingBottom: spacing.sm,
  },
  filtersRow: {
    gap: spacing.xs,
  },
  foldersSection: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  foldersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  foldersTitle: {
    fontFamily: typography.titleLg.fontFamily,
    fontSize: typography.titleLg.fontSize,
    lineHeight: typography.titleLg.lineHeight,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  foldersManage: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    lineHeight: typography.labelMd.lineHeight,
    color: colors.accent,
  },
  foldersRow: {
    gap: spacing.xs,
  },
  folderChip: {
    minHeight: touchTarget.min, // área táctil (RNF-7)
    justifyContent: "center",
  },
  grid: {
    flex: 1,
  },
  gridItem: {
    flex: 1 / 3,
    minWidth: 0,
  },
  emptySearchWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
