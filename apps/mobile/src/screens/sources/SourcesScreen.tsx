import { useMemo, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { activeColors, layoutForWidth, spacing, typography } from "@ryuunest/ui-tokens";
import { isRecommendedAdded } from "@ryuunest/core";

import Button from "../../components/Button";
import { contentColumnStyle } from "../../components/cardStyles";
import Chip from "../../components/Chip";
import ChipScroller from "../../components/ChipScroller";
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
import type { NoticeKind, SourcesController } from "./sourcesController";
import type { SourceModule } from "./sourcesData";
import type { SourcesFlow } from "./sourcesFlow";
import {
  SOURCE_KIND_FILTERS,
  filterSourceModules,
  kindFilterCounts,
  sourcesSummary,
  type RecommendedView,
  type SourceKindFilter,
  type SourcesView,
} from "./sourcesFixtures";
import SourcesSheets from "./SourcesSheets";
import {
  BADGE_LABEL_KEYS,
  INCOMPATIBLE_LABEL_KEY,
  ROW_ACTION_KEYS,
  PERMISSION_LABEL_KEYS,
  modulePermissions,
  moduleRowAction,
  moduleStatusBadges,
} from "./sourcesView";
import { themedStyles } from "../../components/themedStyles";

/**
 * F16 — pantalla Fuentes (RF-1 a RF-8, SPEC §11.5): cabecera con resumen y un
 * solo botón primario (V3), tarjetas de repositorio con sincronizar, chips por
 * tipo con contador y filas de módulo con una acción. Presentacional: recibe la
 * vista, el flujo de hojas y el controlador; no toca el núcleo ni la red.
 *
 * Fuera de la v1 y anotado en `design/stitch/DIFFS.md`: «Importar respaldo de
 * fuentes» (F21b) y la tarjeta «Seguridad del Nido» (T4/T6 de `DESIGN_RULES.md`).
 */

const colors = activeColors;

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
  /** `info` = aviso neutro (éxito); `error` en rojo. */
  noticeKind?: NoticeKind;
  onRetry?: () => void;
  /** F44: sección «Recomendados»; sin ella (galería, primer uso) no se pinta. */
  recommended?: RecommendedView;
  onRefreshRecommended?: () => void;
}

export default function SourcesScreen({
  view,
  flow,
  controller,
  notice = null,
  noticeKind = "error",
  onRetry,
  recommended,
  onRefreshRecommended,
}: SourcesScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);
  const [filter, setFilter] = useState<SourceKindFilter>("all");

  const data = view.status === "ready" ? view.data : null;
  const counts = useMemo(() => kindFilterCounts(data?.modules ?? []), [data]);
  const shown = useMemo(() => filterSourceModules(data?.modules ?? [], filter), [data, filter]);

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

  const { repos, modules, incompatible = [] } = view.data;
  const summary = sourcesSummary(modules);

  return (
    <View style={styles.screen} testID="screen-sources">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
          ...contentColumnStyle(),
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerTexts}>
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
            onPress={() => controller?.openAddRepo()}
            disabled={controller === null}
          />
        </View>

        {notice !== null ? (
          <View style={styles.notice} accessibilityRole="alert">
            <Text style={[styles.noticeText, noticeKind === "info" && styles.noticeInfo]}>
              {notice}
            </Text>
            <Button
              variant="secondary"
              label={t("sources.sheet.close")}
              onPress={controller?.dismissNotice}
            />
          </View>
        ) : null}

        {repos.length === 0 && modules.length === 0 ? (
          view.data.officialRepoDismissed ? (
            <EmptyState
              title={t("sources.empty.dismissedTitle")}
              message={t("sources.empty.dismissedMessage")}
              actionLabel={t("actions.addRepository")}
              onAction={() => controller?.openAddRepo()}
            />
          ) : (
            <EmptyState
              title={t("sources.empty.title")}
              message={t("sources.empty.message")}
              actionLabel={t("actions.addRepository")}
              onAction={() => controller?.openAddRepo()}
            />
          )
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
                    removeLabel={t("sources.removeRepo.submit")}
                    removeAccessibilityLabel={t("sources.repo.remove")}
                    onSync={() => void controller?.syncRepo(repo.id)}
                    onRemove={() => controller?.askRemoveRepo(repo.id)}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title={t("sources.section.modules")} />
              <ChipScroller contentContainerStyle={styles.chips}>
                {SOURCE_KIND_FILTERS.map((option) => (
                  <Chip
                    key={option}
                    label={kindChipLabel(option, counts[option])}
                    selected={filter === option}
                    onPress={() => setFilter(option)}
                  />
                ))}
              </ChipScroller>

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
                      nsfw={module.nsfw}
                      meta={moduleMeta(module)}
                      badges={moduleStatusBadges(module).map((badge) => t(BADGE_LABEL_KEYS[badge]))}
                      permissions={modulePermissions(module).map((permission) =>
                        t(PERMISSION_LABEL_KEYS[permission]),
                      )}
                      {...(module.lastError === undefined || module.status !== "installed"
                        ? {}
                        : { error: module.lastError })}
                      actionLabel={t(ROW_ACTION_KEYS[action])}
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

        {incompatible.length === 0 ? null : (
          <View style={styles.section} testID="sources-incompatible">
            <SectionHeader title={t("sources.section.incompatible")} />
            {incompatible.map((item) => (
              <ModuleRow
                key={`${item.repoId}/${item.id}`}
                testID={`incompatible-${item.id}`}
                name={item.name}
                meta={t(INCOMPATIBLE_LABEL_KEY)}
                hint={item.reason}
              />
            ))}
          </View>
        )}

        {recommended !== undefined ? (
          <View style={styles.section} testID="sources-recommended">
            <SectionHeader title={t("sources.section.recommended")} />
            {recommended.status === "loading" ? (
              <LoadingState title={t("sources.recommended.loading")} />
            ) : recommended.status === "offline" ? (
              <EmptyState
                title={t("sources.recommended.offlineTitle")}
                message={t("sources.recommended.offlineMessage")}
                actionLabel={t("actions.retry")}
                onAction={onRefreshRecommended}
                scale="sm"
              />
            ) : recommended.repos.length === 0 ? (
              <EmptyState
                title={t("sources.recommended.emptyTitle")}
                actionLabel={t("sources.recommended.refresh")}
                onAction={onRefreshRecommended}
                scale="sm"
              />
            ) : (
              <>
                {recommended.repos.map((repo) => {
                  const added = isRecommendedAdded(data?.repos ?? [], repo.indexUrl);
                  return (
                    <ModuleRow
                      key={repo.indexUrl}
                      testID={`recommended-${repo.indexUrl}`}
                      name={repo.name}
                      nsfw={repo.nsfw}
                      meta={repo.description}
                      hint={repo.indexUrl}
                      badges={repo.nsfw ? [t(BADGE_LABEL_KEYS.nsfw)] : []}
                      actionLabel={t(
                        added ? "sources.recommended.added" : "sources.recommended.add",
                      )}
                      actionVariant="secondary"
                      actionDisabled={added}
                      onAction={() => controller?.openAddRepo(repo.indexUrl)}
                    />
                  );
                })}
                <Button
                  variant="secondary"
                  label={t("sources.recommended.refresh")}
                  onPress={onRefreshRecommended}
                />
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      {controller !== null ? (
        <SourcesSheets flow={flow} controller={controller} modules={modules} />
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  header: { gap: spacing.sm },
  headerTexts: { gap: spacing.xxs },
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
  noticeInfo: { color: colors.textPrimary },
}));
