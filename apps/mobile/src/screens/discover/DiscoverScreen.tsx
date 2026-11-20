import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  dragonNightColors,
  layoutForWidth,
  spacing,
  touchTarget,
  typography,
} from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LibraryCard from "../../components/LibraryCard";
import LoadingState from "../../components/LoadingState";
import ModulePicker from "../../components/ModulePicker";
import SectionHeader from "../../components/SectionHeader";
import TagFilterSheet from "../../components/TagFilterSheet";
import TextField from "../../components/TextField";
import { recentCardStyle } from "../../components/recentCardStyles";
import { kindLabel } from "../../components/kindLabel";
import { Search } from "../../icons";
import { t } from "../../i18n";
import {
  countActiveFilters,
  hasNsfwBorder,
  showDiscoverRows,
  visibleDiscoverEntries,
  visibleDiscoverModules,
  type DiscoverEntry,
  type DiscoverFilterValues,
  type DiscoverView,
} from "./discoverFixtures";
import type { DiscoverMoreStatus, DiscoverRow } from "./useDiscoverData";
import { textStyle } from "../../components/textStyle";

/**
 * F15 — pantalla Descubrir (RF-9 a RF-11, RF-35, SPEC §11.5): selector de
 * módulo que recuerda el último, filas `latest` y `popular` **solo si el
 * módulo las ofrece**, búsqueda con paginación y error de módulo con causa,
 * código, reintentar y detalle. Sin género: orden/filtro por género no entra
 * en la v1 (`tasks/todo.md` F15). Presentacional: los datos y el montaje del
 * módulo llegan desde `useDiscoverData`; la pantalla no toca el núcleo.
 */

const colors = dragonNightColors;

/** Ancho del carrusel de portadas: el mismo que la fila de Inicio (F13). */
const ROW_CARD_WIDTH = recentCardStyle().width;

/** Filas del catálogo: 3 por línea, como la cuadrícula de Biblioteca (F14a). */
const CATALOG_COLUMNS = 3;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Segunda línea de la tarjeta: «tipo · pista» con lo que haya. */
function entryMeta(entry: DiscoverEntry): string | undefined {
  const parts = [
    entry.kind === null ? null : kindLabel(entry.kind),
    entry.hint === null ? null : entry.hint,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export interface DiscoverScreenProps {
  view: DiscoverView;
  /** Filtro NSFW global (RF-34/RF-35): apagado por defecto. */
  nsfwVisible?: boolean;
  onModuleSelect?: (id: string) => void;
  onSearch?: (query: string) => void;
  /** F84: estado de «cargar más» y la petición de la página siguiente (scroll infinito). */
  more?: DiscoverMoreStatus;
  onLoadMore?: () => void;
  /** F85: estado y petición de «Cargar más» de las filas Reciente/Popular. */
  rowMore?: Record<DiscoverRow, DiscoverMoreStatus>;
  onLoadMoreRow?: (row: DiscoverRow) => void;
  /** F59: «Ver más» de una sección de `home()` y vuelta a la portada. */
  onOpenSection?: (id: string, title: string) => void;
  onCloseSection?: () => void;
  /** F50: aplica las etiquetas elegidas en la hoja de filtros. */
  onApplyFilters?: (filters: DiscoverFilterValues) => void;
  onRetry?: () => void;
  onSeriesPress?: (entry: DiscoverEntry) => void;
  /** Acción del vacío: ir a añadir un repositorio. */
  onEmptyAction?: () => void;
  /** Abre Ajustes (aviso de módulos ocultos por el filtro NSFW). */
  onOpenSettings?: () => void;
}

export default function DiscoverScreen({
  view,
  nsfwVisible = false,
  onModuleSelect,
  onSearch,
  more = "idle",
  onLoadMore,
  rowMore = { latest: "idle", popular: "idle" },
  onLoadMoreRow,
  onOpenSection,
  onCloseSection,
  onApplyFilters,
  onRetry,
  onSeriesPress,
  onEmptyAction,
  onOpenSettings,
}: DiscoverScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  if (view.status === "empty") {
    if ((view.hiddenByNsfw ?? 0) > 0) {
      return (
        <View style={styles.stateWrap} testID="screen-discover">
          <EmptyState
            title={t("state.empty.discover.hiddenTitle")}
            message={t("state.empty.discover.hiddenMessage")}
            actionLabel={t("actions.openSettings")}
            onAction={onOpenSettings}
          />
        </View>
      );
    }
    return (
      <View style={styles.stateWrap} testID="screen-discover">
        <EmptyState
          title={t("state.empty.discover.title")}
          message={t("state.empty.discover.message")}
          actionLabel={t("actions.addRepository")}
          onAction={onEmptyAction}
        />
      </View>
    );
  }

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-discover">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    const pickable = visibleDiscoverModules(view.modules ?? [], nsfwVisible);
    return (
      <View style={styles.errorScreen} testID="screen-discover">
        {pickable.length > 0 ? (
          <View style={[styles.errorPicker, { paddingHorizontal: layout.margin }]}>
            <ModulePicker
              modules={pickable.map((module) => ({ id: module.id, name: module.name }))}
              selectedId={view.selectedModuleId ?? pickable[0]?.id ?? ""}
              onSelect={(id) => onModuleSelect?.(id)}
            />
          </View>
        ) : null}
        <View style={styles.stateWrap}>
          <ErrorState
            title={t("state.error.module.title")}
            message={view.error.cause}
            detail={{
              ...(view.error.moduleName === "" ? {} : { module: view.error.moduleName }),
              url: view.error.url,
              code: view.error.code,
              selector: view.error.selector,
            }}
            retryLabel={t("actions.retry")}
            onRetry={onRetry}
            detailLabel={t("actions.showDetail")}
          />
        </View>
      </View>
    );
  }

  return (
    <DiscoverReady
      ready={view.ready}
      nsfwVisible={nsfwVisible}
      sidePadding={layout.margin}
      gap={layout.gap}
      onModuleSelect={onModuleSelect}
      onSearch={onSearch}
      more={more}
      onLoadMore={onLoadMore}
      rowMore={rowMore}
      onLoadMoreRow={onLoadMoreRow}
      onOpenSection={onOpenSection}
      onCloseSection={onCloseSection}
      onApplyFilters={onApplyFilters}
      onSeriesPress={onSeriesPress}
    />
  );
}

interface DiscoverReadyProps {
  ready: Extract<DiscoverView, { status: "ready" }>["ready"];
  nsfwVisible: boolean;
  sidePadding: number;
  gap: number;
  onModuleSelect?: (id: string) => void;
  onSearch?: (query: string) => void;
  more: DiscoverMoreStatus;
  onLoadMore?: () => void;
  rowMore: Record<DiscoverRow, DiscoverMoreStatus>;
  onLoadMoreRow?: (row: DiscoverRow) => void;
  onOpenSection?: (id: string, title: string) => void;
  onCloseSection?: () => void;
  onApplyFilters?: (filters: DiscoverFilterValues) => void;
  onSeriesPress?: (entry: DiscoverEntry) => void;
}

function DiscoverReady({
  ready,
  nsfwVisible,
  sidePadding,
  gap,
  onModuleSelect,
  onSearch,
  more,
  onLoadMore,
  rowMore,
  onLoadMoreRow,
  onOpenSection,
  onCloseSection,
  onApplyFilters,
  onSeriesPress,
}: DiscoverReadyProps) {
  // Borrador del campo: se entrega con Entrar (RF-10); al cambiar de módulo o
  // limpiarse desde fuera, el campo sigue a la consulta activa.
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState(ready.query);
  useEffect(() => setDraft(ready.query), [ready.query]);

  const modules = visibleDiscoverModules(ready.modules, nsfwVisible);
  const selected = modules.find((module) => module.id === ready.selectedModuleId) ?? modules[0];
  const latest = visibleDiscoverEntries(ready.latest, nsfwVisible);
  const popular = visibleDiscoverEntries(ready.popular, nsfwVisible);
  const catalog = {
    ...ready.catalog,
    entries: visibleDiscoverEntries(ready.catalog.entries, nsfwVisible),
  };
  const selectedModule = ready.modules.find((module) => module.id === selected?.id);
  const rows = showDiscoverRows(ready.query, ready.activeFilters);
  const activeCount = countActiveFilters(ready.activeFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // F59: con `home()` las secciones del módulo sustituyen a latest/popular.
  const sections = rows
    ? ready.sections
        .map((section) => ({
          ...section,
          entries: visibleDiscoverEntries(section.entries, nsfwVisible),
        }))
        .filter((section) => section.entries.length > 0)
    : [];
  const hasHome = sections.length > 0;
  const showLatest = rows && !hasHome && (selectedModule?.hasLatest ?? false) && latest.length > 0;
  const showPopular =
    rows && !hasHome && (selectedModule?.hasPopular ?? false) && popular.length > 0;

  if (!selected || modules.length === 0) {
    return (
      <View style={styles.stateWrap} testID="screen-discover">
        <EmptyState
          title={t("state.empty.discover.title")}
          message={t("state.empty.discover.message")}
          actionLabel={t("actions.addRepository")}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="screen-discover">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
        scrollEventThrottle={100}
        onContentSizeChange={(_width, contentHeight) => {
          // Si la lista no llena la pantalla no habrá scroll: se sigue pidiendo hasta llenarla o agotarla.
          if (contentHeight < windowHeight && catalog.hasNext && more === "idle") onLoadMore?.();
        }}
        onScroll={(event) => {
          // F84: al acercarse al final se pide la página siguiente (con el fallo, solo con «Reintentar»).
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height);
          if (remaining < layoutMeasurement.height && more === "idle") onLoadMore?.();
        }}
      >
        {/* Búsqueda del módulo + selector (RF-9, RF-10). */}
        <View style={styles.topRow}>
          <View style={styles.searchWrap}>
            <TextField
              placeholder={t("discover.search.placeholder")}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => onSearch?.(draft.trim())}
              returnKeyType="search"
              accessibilityLabel={t("discover.search.placeholder")}
              leadingIcon={<Search size={20} color={colors.textSecondary} />}
            />
          </View>
          <ModulePicker
            modules={modules.map((module) => ({ id: module.id, name: module.name }))}
            selectedId={selected.id}
            onSelect={(id) => onModuleSelect?.(id)}
          />
        </View>
        <View style={styles.actionsRow}>
          <View style={styles.actionItem}>
            <Button
              variant="secondary"
              label={t("discover.search.submit")}
              onPress={() => onSearch?.(draft.trim())}
            />
          </View>
          {ready.filters.length > 0 ? (
            <View style={styles.actionItem}>
              <Button
                variant="secondary"
                label={
                  activeCount > 0
                    ? t("discover.filter.buttonCount", { count: activeCount })
                    : t("discover.filter.button")
                }
                onPress={() => setFiltersOpen(true)}
                testID="discover-filters-button"
              />
            </View>
          ) : null}
        </View>
        <TagFilterSheet
          visible={filtersOpen}
          groups={ready.filters}
          selected={ready.activeFilters}
          onChange={(next) => onApplyFilters?.(next)}
          onClose={() => setFiltersOpen(false)}
        />

        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <SectionHeader
              title={section.title}
              {...(section.hasMore
                ? {
                    actionLabel: t("discover.section.seeMore"),
                    onAction: () => onOpenSection?.(section.id, section.title),
                  }
                : {})}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowScroller}
            >
              {section.entries.map((entry) => (
                <View key={entry.seriesId} style={{ width: ROW_CARD_WIDTH }}>
                  <DiscoverCard entry={entry} onPress={onSeriesPress} />
                </View>
              ))}
            </ScrollView>
          </View>
        ))}

        {showLatest ? (
          <View style={styles.section}>
            <SectionHeader title={t("discover.section.latest")} />
            <CoverGrid entries={latest} gap={gap} onSeriesPress={onSeriesPress} />
            <MoreRowFooter
              hasNext={ready.latestMore?.hasNext ?? false}
              status={rowMore.latest}
              onLoadMore={() => onLoadMoreRow?.("latest")}
            />
          </View>
        ) : null}

        {showPopular ? (
          <View style={styles.section}>
            <SectionHeader title={t("discover.section.popular")} />
            <CoverGrid entries={popular} gap={gap} onSeriesPress={onSeriesPress} />
            <MoreRowFooter
              hasNext={ready.popularMore?.hasNext ?? false}
              status={rowMore.popular}
              onLoadMore={() => onLoadMoreRow?.("popular")}
            />
          </View>
        ) : null}

        {/* Catálogo paginado (RF-10): con consulta o exploración libre. */}
        <View style={styles.section}>
          <SectionHeader
            title={ready.section?.title ?? t("discover.section.catalog")}
            {...(ready.section === undefined
              ? {}
              : { actionLabel: t("actions.back"), onAction: onCloseSection })}
          />
          {catalog.entries.length === 0 ? (
            <EmptyState
              title={t("state.empty.search.title")}
              message={t("state.empty.search.message", { query: ready.query || "…" })}
              actionLabel={t("actions.exploreAgain")}
              onAction={() => onSearch?.("")}
              scale="sm"
            />
          ) : (
            <CoverGrid entries={catalog.entries} gap={gap} onSeriesPress={onSeriesPress} />
          )}

          {catalog.entries.length > 0 ? (
            <CatalogFooter hasNext={catalog.hasNext} more={more} onRetry={onLoadMore} />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/** F85: rejilla de portadas (3 columnas, T7: 3 líneas) compartida por filas y catálogo. */
function CoverGrid({
  entries,
  gap,
  onSeriesPress,
}: {
  entries: readonly DiscoverEntry[];
  gap: number;
  onSeriesPress?: ((entry: DiscoverEntry) => void) | undefined;
}) {
  return (
    <View style={{ gap }}>
      {chunk(entries, CATALOG_COLUMNS).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.catalogRow}>
          {row.map((entry) => (
            <View key={entry.seriesId} style={styles.catalogItem}>
              <DiscoverCard entry={entry} onPress={onSeriesPress} />
            </View>
          ))}
          {/* Relleno para que la última fila no deforme las tarjetas. */}
          {Array.from({ length: CATALOG_COLUMNS - row.length }).map((_, i) => (
            <View key={`spacer-${i}`} style={styles.catalogItem} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** F85: «Cargar más» de una fila Reciente/Popular (el scroll infinito es del catálogo). */
function MoreRowFooter({
  hasNext,
  status,
  onLoadMore,
}: {
  hasNext: boolean;
  status: DiscoverMoreStatus;
  onLoadMore: () => void;
}) {
  if (status === "loading") {
    return (
      <View style={styles.footerRow}>
        <ActivityIndicator color={colors.textSecondary} />
        <Text style={styles.footerText}>{t("discover.more.loading")}</Text>
      </View>
    );
  }
  if (status === "error") {
    return (
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{t("discover.more.error")}</Text>
        <Button variant="secondary" label={t("discover.more.retry")} onPress={onLoadMore} />
      </View>
    );
  }
  if (!hasNext) return null;
  return <Button variant="secondary" label={t("discover.more.load")} onPress={onLoadMore} />;
}

/** F84: pie del catálogo con scroll infinito: cargando más, error con reintento o fin de lista. */
function CatalogFooter({
  hasNext,
  more,
  onRetry,
}: {
  hasNext: boolean;
  more: DiscoverMoreStatus;
  onRetry?: (() => void) | undefined;
}) {
  if (more === "error") {
    return (
      <View style={styles.footerRow} testID="discover-more-error">
        <Text style={styles.footerText}>{t("discover.more.error")}</Text>
        <Button variant="secondary" label={t("discover.more.retry")} onPress={onRetry} />
      </View>
    );
  }
  if (more === "loading") {
    return (
      <View style={styles.footerRow} testID="discover-more-loading">
        <ActivityIndicator color={colors.textSecondary} />
        <Text style={styles.footerText}>{t("discover.more.loading")}</Text>
      </View>
    );
  }
  if (!hasNext) {
    return (
      <View style={styles.footerRow} testID="discover-more-end">
        <Text style={styles.footerText}>{t("discover.more.end")}</Text>
      </View>
    );
  }
  return <View style={styles.footerRow} testID="discover-more-idle" />;
}

function DiscoverCard({
  entry,
  onPress,
}: {
  entry: DiscoverEntry;
  onPress?: (entry: DiscoverEntry) => void;
}) {
  return (
    <LibraryCard
      cover={entry.cover}
      kind={entry.kind === null ? undefined : kindLabel(entry.kind)}
      title={entry.title}
      meta={entryMeta(entry)}
      nsfw={hasNsfwBorder(entry)}
      accessibilityLabel={entry.title}
      onPress={() => onPress?.(entry)}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  errorScreen: { flex: 1, backgroundColor: colors.bg },
  errorPicker: { alignSelf: "stretch", alignItems: "flex-end", paddingTop: spacing.md },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  actionItem: { flex: 1 },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: spacing.xs,
  },
  rowScroller: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  catalogRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  catalogItem: {
    flex: 1 / CATALOG_COLUMNS,
    minWidth: 0,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: touchTarget.min,
    gap: spacing.sm,
  },
  footerText: {
    ...textStyle(typography.labelMd),
    color: colors.textSecondary,
  },
});
