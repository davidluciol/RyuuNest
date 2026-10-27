import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
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
import TextField from "../../components/TextField";
import { recentCardStyle } from "../../components/recentCardStyles";
import { kindLabel } from "../../components/kindLabel";
import { Search } from "../../icons";
import { t } from "../../i18n";
import {
  visibleDiscoverEntries,
  visibleDiscoverModules,
  type DiscoverEntry,
  type DiscoverView,
} from "./discoverFixtures";

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

/** Filas del catálogo: 3 por línea en móvil, como la cuadrícula de Biblioteca. */
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
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRetry?: () => void;
  onSeriesPress?: (entry: DiscoverEntry) => void;
  /** Acción del vacío: ir a añadir un repositorio. */
  onEmptyAction?: () => void;
}

export default function DiscoverScreen({
  view,
  nsfwVisible = false,
  onModuleSelect,
  onSearch,
  onNextPage,
  onPrevPage,
  onRetry,
  onSeriesPress,
  onEmptyAction,
}: DiscoverScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  if (view.status === "empty") {
    return (
      <View style={styles.stateWrap} testID="discover-screen">
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
      <View style={styles.stateWrap} testID="discover-screen">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="discover-screen">
        <ErrorState
          title={t("state.error.module.title")}
          message={view.error.cause}
          detail={{
            module: view.error.moduleName,
            url: view.error.url,
            code: view.error.code,
            selector: view.error.selector,
          }}
          retryLabel={t("actions.retry")}
          onRetry={onRetry}
          detailLabel={t("actions.showDetail")}
        />
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
      onNextPage={onNextPage}
      onPrevPage={onPrevPage}
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
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onSeriesPress?: (entry: DiscoverEntry) => void;
}

function DiscoverReady({
  ready,
  nsfwVisible,
  sidePadding,
  gap,
  onModuleSelect,
  onSearch,
  onNextPage,
  onPrevPage,
  onSeriesPress,
}: DiscoverReadyProps) {
  // Borrador del campo: se entrega con Entrar (RF-10); al cambiar de módulo o
  // limpiarse desde fuera, el campo sigue a la consulta activa.
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
  const showLatest = (selectedModule?.hasLatest ?? false) && latest.length > 0;
  const showPopular = (selectedModule?.hasPopular ?? false) && popular.length > 0;

  if (!selected || modules.length === 0) {
    return (
      <View style={styles.stateWrap} testID="discover-screen">
        <EmptyState
          title={t("state.empty.discover.title")}
          message={t("state.empty.discover.message")}
          actionLabel={t("actions.addRepository")}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="discover-screen">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
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

        {showLatest ? (
          <View style={styles.section}>
            <SectionHeader title={t("discover.section.latest")} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowScroller}
            >
              {latest.map((entry) => (
                <View key={entry.seriesId} style={{ width: ROW_CARD_WIDTH }}>
                  <DiscoverCard entry={entry} onPress={onSeriesPress} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {showPopular ? (
          <View style={styles.section}>
            <SectionHeader title={t("discover.section.popular")} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowScroller}
            >
              {popular.map((entry) => (
                <View key={entry.seriesId} style={{ width: ROW_CARD_WIDTH }}>
                  <DiscoverCard entry={entry} onPress={onSeriesPress} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Catálogo paginado (RF-10): con consulta o exploración libre. */}
        <View style={styles.section}>
          <SectionHeader title={t("discover.section.catalog")} />
          {catalog.entries.length === 0 ? (
            <EmptyState
              title={t("state.empty.search.title")}
              message={t("state.empty.search.message", { query: ready.query || "…" })}
              actionLabel={t("actions.exploreAgain")}
              onAction={() => onSearch?.("")}
              scale="sm"
            />
          ) : (
            <View style={{ gap }}>
              {chunk(catalog.entries, CATALOG_COLUMNS).map((row, rowIndex) => (
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
          )}

          <View style={styles.pagerRow}>
            <Button
              variant="secondary"
              label={t("discover.page.previous")}
              disabled={catalog.page <= 1}
              onPress={onPrevPage}
            />
            <Text style={styles.pageLabel}>{t("discover.page.label", { page: catalog.page })}</Text>
            <Button
              variant="secondary"
              label={t("discover.page.next")}
              disabled={!catalog.hasNext}
              onPress={onNextPage}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
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
      kind={entry.kind === null ? undefined : kindLabel(entry.kind)}
      title={entry.title}
      meta={entryMeta(entry)}
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
  pagerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: touchTarget.min,
    gap: spacing.sm,
  },
  pageLabel: {
    fontFamily: typography.labelMd.fontFamily,
    fontSize: typography.labelMd.fontSize,
    lineHeight: typography.labelMd.lineHeight,
    color: colors.textSecondary,
  },
});
