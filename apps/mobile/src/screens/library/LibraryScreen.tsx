import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  dragonNightColors,
  layoutForWidth,
  spacing,
  typography,
} from "@ryuunest/ui-tokens";

import LibraryCard from "../../components/LibraryCard";
import { libraryColumnsFor } from "../../components/libraryCardStyles";
import Chip from "../../components/Chip";
import ChipScroller from "../../components/ChipScroller";
import ConfirmSheet from "../../components/ConfirmSheet";
import DragonTreasure from "../../components/DragonTreasure";
import EmptyState from "../../components/EmptyState";
import ErrorBanner from "../../components/ErrorBanner";
import FloatingActionButton from "../../components/FloatingActionButton";
import { FAB_SIZE } from "../../components/floatingButtonStyles";
import FolderCard from "../../components/FolderCard";
import NewFolderSheet from "../../components/NewFolderSheet";
import SeriesMenuSheet from "../../components/SeriesMenuSheet";
import TextField from "../../components/TextField";
import { Search } from "../../icons";
import { t } from "../../i18n";
import { kindLabel } from "../../components/kindLabel";
import {
  DEFAULT_LIBRARY_FILTERS,
  EMPTY_LIBRARY_DATA,
  clearedFilters,
  filterLibrarySeries,
  hasActiveFilters,
  type FolderNameProblem,
  type SeriesKey,
  libraryGridRows,
  type LibraryData,
  type LibraryFilters,
  type LibrarySeries,
} from "./libraryFixtures";
import { textStyle } from "../../components/textStyle";
import { useDebouncedValue } from "./debounce";

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

/** F54 — acciones del menú de una serie; sin ellas no hay menú ni «⋮». */
export interface LibrarySeriesActions {
  move: (key: SeriesKey, folderId: string) => Promise<void>;
  /** «Mover y crear»: devuelve el problema del nombre si lo hay. */
  moveAndCreate: (
    key: SeriesKey,
    name: string,
    tags: string[],
  ) => Promise<FolderNameProblem | null>;
  addToFavorites: (key: SeriesKey) => Promise<void>;
  /** Quita la serie de Tesoros; su progreso se conserva (RF-30). */
  remove: (key: SeriesKey) => Promise<void>;
}

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
  /**
   * F53 — crea una carpeta (nombre y etiquetas). Devuelve el problema del nombre si lo hay.
   * Sin esta función no hay botón flotante «+».
   */
  onCreateFolder?: (name: string, tags: string[]) => Promise<FolderNameProblem | null>;
  /** F54 — menú de pulsación larga de cada serie (mover, favoritos, eliminar). */
  seriesActions?: LibrarySeriesActions;
  /** Callback del estado vacío (añadir repositorio). */
  onEmptyAction?: () => void;
  /** Callback al cambiar los filtros (para persistir estado). */
  onFiltersChange?: (filters: LibraryFilters) => void;
  /**
   * F34: `false` cuando la pantalla se incrusta en otro contenedor con scroll (galería). La
   * cuadrícula se dibuja sin `FlatList` para no anidar listas virtualizadas (aviso de React
   * Native y windowing roto); el scroll lo lleva el contenedor padre.
   */
  virtualize?: boolean;
}

export default function LibraryScreen({
  data = EMPTY_LIBRARY_DATA,
  initialFilters,
  onSeriesPress,
  onFolderPress,
  onManageFolders,
  onCreateFolder,
  seriesActions,
  onEmptyAction,
  onFiltersChange,
  virtualize = true,
}: LibraryScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  const columns = libraryColumnsFor(width);
  // Tarjetas de carpeta en una fila que se desplaza (como el diseño): caben `columns - 1` a la
  // vista, más anchas que las portadas para que el nombre se lea entero (T7).
  const folderColumns = Math.max(1, columns - 1);
  const folderCardWidth =
    (width - 2 * layout.margin - layout.gap * (folderColumns - 1)) / folderColumns;
  const [filters, setFilters] = useState<LibraryFilters>({
    ...DEFAULT_LIBRARY_FILTERS,
    ...initialFilters,
  });

  const updateFilters = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange?.(next);
  };

  const [creating, setCreating] = useState(false);
  // F54: la serie del menú abierto, la que se va a eliminar y la que espera su carpeta nueva.
  const [menuSeries, setMenuSeries] = useState<LibrarySeries | null>(null);
  const [removing, setRemoving] = useState<LibrarySeries | null>(null);
  const [creatingFor, setCreatingFor] = useState<LibrarySeries | null>(null);
  const [actionFailed, setActionFailed] = useState(false);

  /** Ejecuta una acción de serie; si falla, avisa y no pierde nada. */
  const run = (action: () => Promise<unknown>) => {
    action().catch(() => setActionFailed(true));
  };

  const withFilters = hasActiveFilters(filters);

  // La búsqueda espera una pausa corta al escribir (F55); el resto de filtros es inmediato.
  const search = useDebouncedValue(filters.search);
  const visibleSeries = useMemo(
    () => filterLibrarySeries(data.series, { ...filters, search }, data.folders),
    [data.series, data.folders, filters, search],
  );

  const totalCount = data.series.filter((s) => !s.nsfw || filters.nsfwVisible).length;
  const readingCount = data.series.filter(
    (s) => s.progress !== null && (!s.nsfw || filters.nsfwVisible),
  ).length;
  // «Gemas» es una vista, no una carpeta: no cuenta en «Carpetas (n)».
  const foldersCount = data.folders.filter((f) => f.kind !== "gems").length;

  // La última fila no queda tapada por el botón flotante (F53).
  const listBottom = onCreateFolder === undefined ? spacing.xl : spacing.xl + FAB_SIZE + spacing.md;

  const renderCard = (item: LibrarySeries) => (
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
      {...(seriesActions === undefined
        ? {}
        : {
            onLongPress: () => setMenuSeries(item),
            onMenuPress: () => setMenuSeries(item),
            menuLabel: t("library.series.menu.label", { title: item.title }),
          })}
    />
  );

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
        <ChipScroller contentContainerStyle={styles.chipsRow}>
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
        </ChipScroller>
      </View>

      {/* Filtros secundarios: tipo, fuente, orden, NSFW (RF-27, RF-28). */}
      <View style={[styles.filtersWrap, { paddingHorizontal: layout.margin }]}>
        <ChipScroller contentContainerStyle={styles.filtersRow}>
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
        </ChipScroller>
      </View>

      {/* Categorías (F55): etiquetas de las series guardadas; sale la serie con alguna marcada. */}
      {data.tags.length > 0 ? (
        <View
          testID="library-categories"
          accessibilityLabel={t("library.section.categories")}
          style={[styles.filtersWrap, { paddingHorizontal: layout.margin }]}
        >
          <ChipScroller contentContainerStyle={styles.filtersRow}>
            {data.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={filters.tags.includes(tag)}
                onPress={() =>
                  updateFilters({
                    tags: filters.tags.includes(tag)
                      ? filters.tags.filter((other) => other !== tag)
                      : [...filters.tags, tag],
                  })
                }
              />
            ))}
          </ChipScroller>
        </View>
      ) : null}

      {/* Sección de carpetas (F14b, V6: un solo acceso). */}
      {data.folders.length > 0 ? (
        <View style={[styles.foldersSection, { paddingHorizontal: layout.margin }]}>
          <View style={styles.foldersHeader}>
            <Text style={styles.foldersTitle}>{t("library.section.folders")}</Text>
            <Text style={styles.foldersManage} onPress={onManageFolders}>
              {t("library.folder.manage")}
            </Text>
          </View>
          <ChipScroller contentContainerStyle={{ gap: layout.gap }}>
            {data.folders.map((folder) => (
              <View key={folder.id} style={{ width: folderCardWidth }}>
                <FolderCard
                  name={folder.name}
                  count={folder.count}
                  selected={
                    folder.kind === "gems"
                      ? filters.folderId === undefined || filters.folderId === folder.id
                      : filters.folderId === folder.id
                  }
                  onPress={() => {
                    updateFilters({
                      folderId:
                        folder.kind === "gems" || filters.folderId === folder.id
                          ? undefined
                          : folder.id,
                    });
                    onFolderPress?.(folder.id);
                  }}
                />
              </View>
            ))}
          </ChipScroller>
        </View>
      ) : null}

      {/* Cuadrícula virtualizada (RF-26, AC-4); sin virtualizar cuando la incrusta la galería (F34). */}
      {visibleSeries.length === 0 ? (
        <View style={styles.emptySearchWrap}>
          {/* F56: el dragón sin tesoros, con la causa a la vista (texto o filtros). */}
          <EmptyState
            illustration={<DragonTreasure />}
            title={t(withFilters ? "library.empty.filters.title" : "library.empty.search.title")}
            message={
              withFilters
                ? t("library.empty.filters.message")
                : t("library.empty.search.message", { query: filters.search.trim() || "…" })
            }
            actionLabel={t(
              withFilters ? "library.empty.filters.action" : "library.empty.search.action",
            )}
            onAction={() => {
              const next = withFilters ? clearedFilters(filters) : { ...filters, search: "" };
              setFilters(next);
              onFiltersChange?.(next);
            }}
            scale="sm"
          />
        </View>
      ) : virtualize ? (
        <FlatList
          style={styles.grid}
          contentContainerStyle={{
            paddingHorizontal: layout.margin,
            paddingBottom: listBottom,
            gap: layout.gap,
          }}
          data={visibleSeries}
          keyExtractor={(item) => `${item.moduleId}:${item.seriesId}`}
          key={`grid-${columns}`}
          numColumns={columns}
          columnWrapperStyle={{ gap: layout.gap }}
          renderItem={({ item }) => (
            <View style={[styles.gridItem, { flex: 1 / columns }]}>{renderCard(item)}</View>
          )}
          initialNumToRender={12}
          windowSize={5}
          removeClippedSubviews
        />
      ) : (
        <View
          testID="library-grid"
          style={[
            styles.gridStatic,
            {
              paddingHorizontal: layout.margin,
              paddingBottom: listBottom,
              gap: layout.gap,
            },
          ]}
        >
          {libraryGridRows(visibleSeries, columns).map((row) => (
            <View
              key={`${row[0]?.moduleId}:${row[0]?.seriesId ?? ""}`}
              style={[styles.gridRow, { gap: layout.gap }]}
            >
              {row.map((item) => (
                <View
                  key={`${item.moduleId}:${item.seriesId}`}
                  style={[styles.gridItem, { flex: 1 / columns }]}
                >
                  {renderCard(item)}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {actionFailed ? (
        <View style={[styles.banner, { paddingHorizontal: layout.margin }]}>
          <ErrorBanner
            title={t("library.series.error.title")}
            message={t("library.series.error.message")}
            actionLabel={t("library.series.error.dismiss")}
            onAction={() => setActionFailed(false)}
            testID="library-action-error"
          />
        </View>
      ) : null}

      {onCreateFolder !== undefined ? (
        <View style={[styles.fab, { right: layout.margin }]} pointerEvents="box-none">
          <FloatingActionButton
            accessibilityLabel={t("library.folder.new.fab")}
            onPress={() => setCreating(true)}
            testID="library-new-folder"
          />
        </View>
      ) : null}

      {/* Una sola hoja de «Nueva carpeta»: la del botón «+» o la de «Mover y crear» (F54). */}
      {onCreateFolder !== undefined || seriesActions !== undefined ? (
        <NewFolderSheet
          visible={creating || creatingFor !== null}
          existingNames={data.folders.map((f) => f.name)}
          availableTags={data.tags}
          onSubmit={(name, tags) =>
            creatingFor !== null && seriesActions !== undefined
              ? seriesActions.moveAndCreate(creatingFor, name, tags)
              : (onCreateFolder?.(name, tags) ?? Promise.resolve(null))
          }
          onClose={() => {
            setCreating(false);
            setCreatingFor(null);
          }}
        />
      ) : null}

      {seriesActions !== undefined && menuSeries !== null ? (
        <SeriesMenuSheet
          visible
          title={menuSeries.title}
          folders={data.folders.filter((f) => f.kind !== "gems")}
          currentFolderId={menuSeries.folderId}
          inFavorites={
            data.folders.find((f) => f.id === menuSeries.folderId)?.kind === "favorites"
          }
          onMove={(folderId) => {
            const series = menuSeries;
            setMenuSeries(null);
            run(() => seriesActions.move(series, folderId));
          }}
          onMoveAndCreate={() => {
            setCreatingFor(menuSeries);
            setMenuSeries(null);
          }}
          onAddToFavorites={() => {
            const series = menuSeries;
            setMenuSeries(null);
            run(() => seriesActions.addToFavorites(series));
          }}
          onRemove={() => {
            setRemoving(menuSeries);
            setMenuSeries(null);
          }}
          onClose={() => setMenuSeries(null)}
        />
      ) : null}

      {seriesActions !== undefined ? (
        <ConfirmSheet
          visible={removing !== null}
          title={t("library.series.remove.title")}
          message={t("library.series.remove.message", { title: removing?.title ?? "" })}
          confirmLabel={t("library.series.remove.confirm")}
          onConfirm={() => {
            const series = removing;
            setRemoving(null);
            if (series !== null) run(() => seriesActions.remove(series));
          }}
          onCancel={() => setRemoving(null)}
          testID="library-remove-confirm"
          confirmTestID="library-remove-confirm-submit"
        />
      ) : null}
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
    ...textStyle(typography.titleLg),
    color: colors.textPrimary,
  },
  foldersManage: {
    ...textStyle(typography.labelMd),
    color: colors.accent,
  },
  grid: {
    flex: 1,
  },
  gridStatic: {
    flex: 0,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridItem: {
    flex: 1 / 3,
    minWidth: 0,
  },
  fab: {
    position: "absolute",
    bottom: spacing.md,
  },
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.md,
  },
  emptySearchWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
