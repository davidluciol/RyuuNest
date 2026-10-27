import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { dragonNightColors, layoutForWidth, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import ModuleRow from "../../components/ModuleRow";
import RepoCard from "../../components/RepoCard";
import SectionHeader from "../../components/SectionHeader";
import { kindLabel } from "../../components/kindLabel";
import { textStyle } from "../../components/textStyle";
import { Plus } from "../../icons";
import { t } from "../../i18n";
import type { SourcesController } from "./sourcesController";
import type { SourceModule } from "./sourcesData";
import type { SourcesFlow } from "./sourcesFlow";
import {
  SOURCE_KIND_FILTERS,
  filterSourceModules,
  kindFilterCounts,
  sourcesSummary,
  type SourceKindFilter,
  type SourcesView,
} from "./sourcesFixtures";
import SourcesSheets from "./SourcesSheets";
import { BADGE_LABEL_KEYS, ROW_ACTION_KEYS, moduleBadges, moduleRowAction } from "./sourcesView";

/**
 * F16 — pantalla Fuentes (RF-1 a RF-8, SPEC §11.5): cabecera con resumen y un
 * solo botón primario (V3), tarjetas de repositorio con sincronizar, chips por
 * tipo con contador y filas de módulo con una acción. Presentacional: recibe la
 * vista, el flujo de hojas y el controlador; no toca el núcleo ni la red.
 *
 * Fuera de la v1 y anotado en `design/stitch/DIFFS.md`: «Importar respaldo de
 * fuentes» (F21b) y la tarjeta «Seguridad del Nido» (T4/T6 de `DESIGN_RULES.md`).
 */

const colors = dragonNightColors;

function kindChipLabel(filter: SourceKindFilter, count: number): string {
  return filter === "all"
    ? t("sources.chip.all", { count })
    : t("sources.chip.kind", { kind: kindLabel(filter), count });
}

function moduleMeta(module: SourceModule): string {
  return t("sources.module.meta", {
    kind: module.kinds.map(kindLabel).join(", "),
    lang: module.lang,
    version: module.version,
  });
}

export interface SourcesScreenProps {
  view: SourcesView;
  flow: SourcesFlow;
  controller: SourcesController | null;
  /** Aviso transitorio (errores del servicio fuera de una hoja). */
  notice?: string | null;
  /** Filtro NSFW global (RF-35): apagado por defecto. */
  nsfwVisible?: boolean;
  onRetry?: () => void;
}

export default function SourcesScreen({
  view,
  flow,
  controller,
  notice = null,
  nsfwVisible = false,
  onRetry,
}: SourcesScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  const [filter, setFilter] = useState<SourceKindFilter>("all");

  const data = view.status === "ready" ? view.data : null;
  const visibleByNsfw = useMemo(
    () => (data?.modules ?? []).filter((module) => nsfwVisible || !module.nsfw),
    [data, nsfwVisible],
  );
  const counts = useMemo(() => kindFilterCounts(visibleByNsfw), [visibleByNsfw]);
  const shown = useMemo(
    () => filterSourceModules(data?.modules ?? [], filter, nsfwVisible),
    [data, filter, nsfwVisible],
  );

  if (view.status === "loading") {
    return (
      <View style={styles.stateWrap} testID="screen-sources">
        <LoadingState title={t("state.loading.title")} />
      </View>
    );
  }

  if (view.status === "error") {
    return (
      <View style={styles.stateWrap} testID="screen-sources">
        <ErrorState
          title={t("state.error.sources.title")}
          message={t("state.error.sources.message")}
          retryLabel={t("actions.retry")}
          onRetry={onRetry}
        />
      </View>
    );
  }

  const { repos, modules } = view.data;
  const summary = sourcesSummary(visibleByNsfw);

  return (
    <View style={styles.screen} testID="screen-sources">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerTexts}>
            <Text accessibilityRole="header" style={styles.title}>
              {t("nav.sources")}
            </Text>
            {modules.length > 0 ? (
              <Text style={styles.summary}>
                {t("sources.summary", {
                  installed: summary.installed,
                  available: summary.available,
                })}
              </Text>
            ) : null}
            <Text style={styles.subtitle}>{t("sources.subtitle")}</Text>
          </View>
          <Button
            label={t("actions.addRepository")}
            icon={<Plus size={spacing.md} color={colors.bg} />}
            onPress={controller?.openAddRepo}
            disabled={controller === null}
          />
        </View>

        {notice !== null ? (
          <View style={styles.notice} accessibilityRole="alert">
            <Text style={styles.noticeText}>{notice}</Text>
            <Button
              variant="secondary"
              label={t("sources.sheet.close")}
              onPress={controller?.dismissNotice}
            />
          </View>
        ) : null}

        {repos.length === 0 && modules.length === 0 ? (
          <EmptyState
            title={t("sources.empty.title")}
            message={t("sources.empty.message")}
            actionLabel={t("actions.addRepository")}
            onAction={controller?.openAddRepo}
          />
        ) : (
          <>
            {repos.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={t("sources.section.repos")} />
                {repos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    name={repo.name}
                    url={repo.url}
                    meta={t("sources.repo.modules", { count: repo.moduleCount })}
                    syncLabel={t("sources.repo.sync")}
                    accessibilityLabel={t("sources.repo.remove")}
                    onSync={() => void controller?.syncRepo(repo.id)}
                    onPress={() => controller?.askRemoveRepo(repo.id)}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title={t("sources.section.modules")} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {SOURCE_KIND_FILTERS.map((option) => (
                  <Chip
                    key={option}
                    label={kindChipLabel(option, counts[option])}
                    selected={filter === option}
                    onPress={() => setFilter(option)}
                  />
                ))}
              </ScrollView>

              {shown.length === 0 ? (
                <EmptyState
                  title={t("sources.filtered.title")}
                  message={t("sources.filtered.message")}
                  actionLabel={t("sources.chip.all", { count: counts.all })}
                  onAction={() => setFilter("all")}
                  scale="sm"
                />
              ) : (
                shown.map((module) => {
                  const action = moduleRowAction(module);
                  return (
                    <ModuleRow
                      key={module.id}
                      testID={`module-${module.id}`}
                      name={module.name}
                      meta={moduleMeta(module)}
                      badges={moduleBadges(module).map((badge) => t(BADGE_LABEL_KEYS[badge]))}
                      {...(module.lastError === undefined || module.status !== "installed"
                        ? {}
                        : { error: module.lastError })}
                      actionLabel={t(ROW_ACTION_KEYS[action])}
                      actionVariant={action === "install" ? "primary" : "secondary"}
                      onAction={() =>
                        action === "install"
                          ? void controller?.openInstall(module.repoId, module.id)
                          : controller?.openManage(module.id)
                      }
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {controller !== null ? (
        <SourcesSheets flow={flow} controller={controller} modules={modules} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  header: { gap: spacing.sm },
  headerTexts: { gap: spacing.xxs },
  title: { ...textStyle(typography.headlineMd), color: colors.textPrimary },
  summary: { ...textStyle(typography.labelMd), color: colors.accent },
  subtitle: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  section: { gap: spacing.xs },
  chips: { gap: spacing.xs, paddingVertical: spacing.xxs },
  notice: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
  },
  noticeText: { ...textStyle(typography.bodyMd), color: colors.error },
});
