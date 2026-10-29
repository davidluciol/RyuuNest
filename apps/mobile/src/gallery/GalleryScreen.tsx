import { useWindowDimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { FIXTURE_SERIES } from "@ryuunest/test-site";
import {
  breakpoints,
  coverAspectRatio,
  densityLayout,
  dragonNightColors,
  layoutForWidth,
  radii,
  spacing,
  typography,
  type ThemeColors,
} from "@ryuunest/ui-tokens";

import Badge from "../components/Badge";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import ChapterRow from "../components/ChapterRow";
import Checkbox from "../components/Checkbox";
import Chip from "../components/Chip";
import ContinueCard from "../components/ContinueCard";
import CoverCard from "../components/CoverCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FolderCard from "../components/FolderCard";
import Header from "../components/Header";
import LoadingState from "../components/LoadingState";
import RecentCard from "../components/RecentCard";
import SectionHeader from "../components/SectionHeader";
import SettingsRow from "../components/SettingsRow";
import Sheet from "../components/Sheet";
import Switch from "../components/Switch";
import TextField from "../components/TextField";
import type { BottomNavDestination } from "../components/shellStyles";
import { destinationLabel } from "../navigation/routes";
import AppShell from "../shell/AppShell";
import DestinationFrame from "../shell/DestinationFrame";
import HomeScreen from "../screens/home/HomeScreen";
import { SAMPLE_HOME_DATA } from "../screens/home/homeFixtures";
import LibraryCard from "../components/LibraryCard";
import LibraryScreen from "../screens/library/LibraryScreen";
import { SAMPLE_LIBRARY_DATA } from "../screens/library/libraryFixtures";
import ModulePicker from "../components/ModulePicker";
import DiscoverScreen from "../screens/discover/DiscoverScreen";
import {
  SAMPLE_DISCOVER_MODULES,
  SAMPLE_DISCOVER_VIEW,
} from "../screens/discover/discoverFixtures";
import HoldToConfirm from "../components/HoldToConfirm";
import ModuleRow from "../components/ModuleRow";
import RepoCard from "../components/RepoCard";
import { kindLabel } from "../components/kindLabel";
import SourcesScreen from "../screens/sources/SourcesScreen";
import { INITIAL_SOURCES_FLOW } from "../screens/sources/sourcesFlow";
import { EMPTY_SOURCES_DATA, SAMPLE_SOURCES_DATA } from "../screens/sources/sourcesFixtures";
import SettingsScreen from "../screens/settings/SettingsScreen";
import {
  NO_LOCK_SETTINGS_DATA,
  OFFICIAL_DISMISSED_SETTINGS_DATA,
  SAMPLE_SETTINGS_DATA,
} from "../screens/settings/settingsFixtures";
import OnboardingSample from "../screens/onboarding/OnboardingSample";
import Toast from "../components/Toast";
import ErrorBanner from "../components/ErrorBanner";
import ErrorDialog from "../components/ErrorDialog";
import {
  BADGE_LABEL_KEYS,
  ROW_ACTION_KEYS,
  moduleBadges,
  moduleRowAction,
} from "../screens/sources/sourcesView";
import { Flame, History } from "../icons";

import { COMPONENT_STATES } from "./registry";
import { t } from "../i18n";

/**
 * F05 — galería de componentes (pantalla solo de desarrollo, Regla 3 y 5 de
 * `AGENTS.md`). Muestra los tokens aplicados y los datos de ejemplo únicos;
 * la sección de componentes nace vacía y la llenan F06/F07/F08.
 *
 * Sin literales: todo color, tamaño, espaciado y radio sale de `ui-tokens`.
 */

const colors = dragonNightColors;

type ColorName = keyof ThemeColors;
const colorNames = Object.keys(colors) as ColorName[];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ColorSwatch({ name }: { name: ColorName }) {
  return (
    <View style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: colors[name] }]} />
      <Text style={styles.itemName}>{name}</Text>
      <Text style={styles.itemValue}>{colors[name]}</Text>
    </View>
  );
}

function TypeSample({ name }: { name: keyof typeof typography }) {
  const style = typography[name];
  return (
    <View style={styles.row}>
      <Text style={styles.itemName}>{name}</Text>
      <Text style={styles.itemValue}>
        {style.fontFamily} {style.fontSize}/{style.lineHeight}
      </Text>
    </View>
  );
}

export default function GalleryScreen() {
  const [previewDestination, setPreviewDestination] = useState<BottomNavDestination>("home");
  const { width } = useWindowDimensions();
  const screen = layoutForWidth(width);
  const density = densityLayout("comfortable", width);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingHorizontal: screen.margin }]}
    >
      <Text style={styles.title}>{t("gallery.title")}</Text>
      <Text style={styles.subtitle}>
        {t("gallery.subtitle", {
          breakpoint: screen.breakpoint,
          margin: screen.margin,
          gap: screen.gap,
          fontScale: density.fontScale,
        })}
      </Text>

      <Section title={t("gallery.section.colors")}>
        {colorNames.map((name) => (
          <ColorSwatch key={name} name={name} />
        ))}
      </Section>

      <Section title={t("gallery.section.typography")}>
        {(Object.keys(typography) as (keyof typeof typography)[]).map((name) => (
          <TypeSample key={name} name={name} />
        ))}
      </Section>

      <Section title={t("gallery.section.spacing")}>
        {Object.entries(spacing).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemValue}>{value}</Text>
            <View style={[styles.spacingBar, { width: value }]} />
          </View>
        ))}
      </Section>

      <Section title={t("gallery.section.radii")}>
        {Object.entries(radii).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemValue}>{value}</Text>
          </View>
        ))}
      </Section>

      <Section title={t("gallery.section.layout")}>
        <Text style={styles.body}>
          {t("gallery.section.layoutSummary", {
            mobileMax: breakpoints.mobileMax,
            tabletMax: breakpoints.tabletMax,
            rail: breakpoints.desktopRail,
          })}
        </Text>
      </Section>

      <Section title={t("gallery.section.icons")}>
        <Text style={styles.body}>{t("gallery.section.iconsSource")}</Text>
      </Section>

      <Section title={t("gallery.section.covers")}>
        {FIXTURE_SERIES.map((series) => (
          <View key={series.id} style={styles.row}>
            <View style={styles.cover} />
            <View style={styles.coverText}>
              <Text style={styles.itemName}>{series.id}</Text>
              <Text style={styles.itemValue}>{series.title}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section title={t("gallery.section.components")}>
        <Text style={styles.muted}>
          {t("gallery.states", { list: COMPONENT_STATES.join(" · ") })}
        </Text>

        <Text style={styles.groupLabel}>{t("gallery.component.button")}</Text>
        <View style={styles.componentColumn}>
          <Button label={t("gallery.button.primary")} />
          <Button label={t("gallery.button.secondary")} variant="secondary" />
          <Button label={t("gallery.button.destructive")} variant="destructive" />
          <Button label={t("gallery.button.disabled")} disabled />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.textField")}</Text>
        <TextField placeholder={t("gallery.field.placeholder")} />

        <Text style={styles.groupLabel}>{t("gallery.component.checkbox")}</Text>
        <View style={styles.row}>
          <Checkbox checked={false} />
          <Checkbox checked />
          <Checkbox radio checked={false} />
          <Checkbox radio checked />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.chip")}</Text>
        <View style={styles.row}>
          <Chip label={t("gallery.chip.inactive")} />
          <Chip label={t("gallery.chip.selected")} selected />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.badge")}</Text>
        <View style={styles.row}>
          <Badge label={t("gallery.badge.manhwa")} />
          <Badge label={t("gallery.badge.inProgress")} />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.coverCard")}</Text>
        <View style={styles.row}>
          <View style={styles.coverWrap}>
            <CoverCard />
          </View>
          <View style={styles.coverWrap}>
            <CoverCard progress={0.42} />
          </View>
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.chapterRow")}</Text>
        <View style={styles.componentColumn}>
          <ChapterRow
            title={t("gallery.chapter.title", { number: 1 })}
            hint={t("gallery.chapter.hint")}
          />
          <ChapterRow
            title={t("gallery.chapter.title", { number: 2 })}
            state="in-progress"
            percent={42}
          />
          <ChapterRow title={t("gallery.chapter.title", { number: 3 })} state="completed" />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.header")}</Text>
        <Header title={t("nav.library")} />

        <Text style={styles.groupLabel}>{t("gallery.component.bottomNav")}</Text>
        <BottomNav active="library" />
        <Text style={styles.muted}>{t("gallery.button.disabled")}</Text>
        <BottomNav active="library" disabled />

        <Text style={styles.groupLabel}>{t("gallery.component.settingsRow")}</Text>
        <SettingsRow label={t("gallery.settings.label")} hint={t("gallery.settings.value")} />

        <Text style={styles.groupLabel}>{t("gallery.component.switch")}</Text>
        <View style={styles.row}>
          <Switch
            value={false}
            accessibilityLabel={t("gallery.switch.off")}
            onValueChange={() => {}}
          />
          <Switch
            value
            accessibilityLabel={t("gallery.switch.on")}
            onValueChange={() => {}}
          />
          <Switch
            value
            disabled
            accessibilityLabel={t("gallery.button.disabled")}
            onValueChange={() => {}}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.sheet")}</Text>
        <Sheet>
          <Text style={styles.body}>{t("gallery.sheet.body")}</Text>
        </Sheet>

        <Text style={styles.groupLabel}>{t("gallery.component.emptyState")}</Text>
        <EmptyState
          title={t("state.empty.library.title")}
          message={t("state.empty.library.message")}
          actionLabel={t("actions.addRepository")}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.emptySearch")}</Text>
        <EmptyState
          title={t("state.empty.search.title")}
          message={t("state.empty.search.message", { query: FIXTURE_SERIES[0].title })}
          actionLabel={t("actions.exploreAgain")}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.errorState")}</Text>
        <ErrorState
          title={t("state.error.module.title")}
          message={t("state.error.module.message")}
          detail={{
            module: "m-ejemplo",
            url: "https://sitio-falso.test/listado?page=2",
            code: "PARSE",
            selector: ".lista .item",
          }}
          retryLabel={t("actions.retry")}
          detailLabel={t("actions.showDetail")}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.loadingState")}</Text>
        <LoadingState
          title={t("state.loading.title")}
          message={t("state.loading.message", { page: 2, total: 5 })}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.appShell")}</Text>
        <AppShell section={destinationLabel(previewDestination)} style={styles.shellPreview}>
          <DestinationFrame destination={previewDestination} />
          <BottomNav active={previewDestination} onSelect={setPreviewDestination} />
        </AppShell>
        <AppShell section={t("nav.home")} style={styles.shellPreview}>
          <LoadingState
            title={t("state.loading.title")}
            message={t("state.loading.message", { page: 2, total: 5 })}
          />
          <BottomNav active="home" disabled />
        </AppShell>
        <AppShell section={t("nav.discover")} style={styles.shellErrorPreview}>
          <ErrorState
            title={t("state.error.module.title")}
            message={t("state.error.module.message")}
            retryLabel={t("actions.retry")}
            detailLabel={t("actions.showDetail")}
            detail={{ code: "PARSE" }}
          />
          <BottomNav active="discover" />
        </AppShell>
        <Text style={styles.groupLabel}>{t("gallery.component.destinationFrame")}</Text>
        <DestinationFrame destination="sources" />

        <Text style={styles.groupLabel}>{t("gallery.component.sectionHeader")}</Text>
        <View style={styles.componentColumn}>
          <SectionHeader title={t("home.section.continue")} icon={Flame} />
          <SectionHeader
            title={t("home.section.recent")}
            icon={History}
            actionLabel={t("home.action.seeAll")}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.continueCard")}</Text>
        <ContinueCard
          kind={t("gallery.badge.manhwa")}
          title="El dragón de ceniza"
          meta="Crónicas de Alden · En emisión"
          chapter="Cap. 41"
          pageIndex={11}
          pageTotal={38}
          actionLabel={t("home.action.continueChapter", { number: 41 })}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.recentCard")}</Text>
        <View style={styles.row}>
          <RecentCard
            kind={t("gallery.badge.manhwa")}
            title="Sombras de Arcano"
            chapter="Cap. 24"
            progress={0.78}
          />
          <RecentCard
            kind={t("kind.manga")}
            title="La forja perdida"
            chapter="Cap. 52"
            progress={0.1}
          />
          <RecentCard kind={t("kind.manga")} title="Guardián del nido sin progreso" />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.folderCard")}</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FolderCard name="Favoritos Épicos" description="Fantasía y Aventuras" count={24} />
          </View>
          <View style={{ flex: 1 }}>
            <FolderCard name="Lectura Nocturna" description="Atmósfera y Misterio" count={14} />
          </View>
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.homeScreen")}</Text>
        <View style={styles.shellPreview}>
          <HomeScreen data={SAMPLE_HOME_DATA} />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.libraryCard")}</Text>
        <View style={styles.row}>
          <View style={styles.libraryCardWrap}>
            <LibraryCard kind={t("kind.manhwa")} title="El dragón de ceniza" progress={0.29} />
          </View>
          <View style={styles.libraryCardWrap}>
            <LibraryCard
              kind={t("kind.manga")}
              title="La forja perdida de las estrellas del norte"
            />
          </View>
          <View style={styles.libraryCardWrap}>
            <LibraryCard kind={t("kind.comic")} title="Noche de ámbar" />
          </View>
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.libraryScreen")}</Text>
        <View style={styles.shellPreview}>
          <LibraryScreen data={SAMPLE_LIBRARY_DATA} />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.modulePicker")}</Text>
        <View style={styles.row}>
          <ModulePicker
            modules={SAMPLE_DISCOVER_MODULES.map(({ id, name }) => ({ id, name }))}
            selectedId="m-ejemplo-a"
            onSelect={() => {}}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.discoverScreen")}</Text>
        <View style={styles.shellPreview}>
          <DiscoverScreen view={SAMPLE_DISCOVER_VIEW} />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.repoCard")}</Text>
        <View style={styles.componentColumn}>
          <RepoCard
            name={SAMPLE_SOURCES_DATA.repos[0]?.name ?? ""}
            url={SAMPLE_SOURCES_DATA.repos[0]?.url ?? ""}
            meta={t("sources.repo.modules", { count: 6 })}
            syncLabel={t("sources.repo.sync")}
          />
          <RepoCard
            name={SAMPLE_SOURCES_DATA.repos[0]?.name ?? ""}
            url={SAMPLE_SOURCES_DATA.repos[0]?.url ?? ""}
            syncLabel={t("sources.repo.sync")}
            syncing
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.moduleRow")}</Text>
        <View style={styles.componentColumn}>
          {SAMPLE_SOURCES_DATA.modules.slice(0, 3).map((module) => (
            <ModuleRow
              key={module.id}
              name={module.name}
              meta={t("sources.module.meta", {
                kind: module.kinds.map(kindLabel).join(", "),
                lang: module.lang,
                version: module.version,
              })}
              badges={moduleBadges(module).map((badge) => t(BADGE_LABEL_KEYS[badge]))}
              {...(module.lastError === undefined ? {} : { error: module.lastError })}
              actionLabel={t(ROW_ACTION_KEYS[moduleRowAction(module)])}
            />
          ))}
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.holdToConfirm")}</Text>
        <View style={styles.componentColumn}>
          <HoldToConfirm
            label={t("gallery.holdToConfirm.label")}
            holdingLabel={t("sources.install.holding")}
            onConfirm={() => {}}
          />
          <HoldToConfirm
            label={t("gallery.holdToConfirm.label")}
            holdingLabel={t("sources.install.holding")}
            onConfirm={() => {}}
            disabled
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.sheetModal")}</Text>
        <Sheet>
          <Text style={styles.body}>{t("sources.uninstall.message")}</Text>
        </Sheet>

        <Text style={styles.groupLabel}>{t("gallery.component.sourcesScreen")}</Text>
        <View style={styles.shellPreview}>
          <SourcesScreen
            view={{ status: "ready", data: SAMPLE_SOURCES_DATA }}
            flow={INITIAL_SOURCES_FLOW}
            controller={null}
          />
        </View>
        <View style={styles.shellPreview}>
          <SourcesScreen
            view={{
              status: "ready",
              data: { ...EMPTY_SOURCES_DATA, officialRepoDismissed: true },
            }}
            flow={INITIAL_SOURCES_FLOW}
            controller={null}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.settingsScreen")}</Text>
        <View style={styles.settingsPreview}>
          <SettingsScreen
            view={{ status: "ready", data: SAMPLE_SETTINGS_DATA }}
            onToggleProtection={() => {}}
            onRestoreOfficialRepo={() => {}}
          />
        </View>
        <View style={styles.settingsPreview}>
          <SettingsScreen
            view={{ status: "ready", data: NO_LOCK_SETTINGS_DATA }}
            onToggleProtection={() => {}}
            onRestoreOfficialRepo={() => {}}
          />
        </View>
        <View style={styles.settingsPreview}>
          <SettingsScreen
            view={{ status: "ready", data: OFFICIAL_DISMISSED_SETTINGS_DATA }}
            onToggleProtection={() => {}}
            onRestoreOfficialRepo={() => {}}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.onboardingScreen")}</Text>
        <View style={styles.onboardingPreview}>
          <OnboardingSample />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.toast")}</Text>
        <View style={styles.componentColumn}>
          <Toast
            message={t("gallery.toast.message")}
            severity="info"
            actionLabel={t("gallery.toast.action")}
            onAction={() => {}}
            onClose={() => {}}
          />
          <Toast
            message={t("gallery.toast.message")}
            severity="error"
            onClose={() => {}}
          />
        </View>

        <Text style={styles.groupLabel}>{t("gallery.component.errorBanner")}</Text>
        <ErrorBanner
          title={t("gallery.banner.title")}
          message={t("gallery.banner.message")}
          code="NETWORK"
          detail={{
            module: "m-ejemplo",
            url: "https://sitio-falso.test/listado?page=2",
            code: "NETWORK",
          }}
          actionLabel={t("actions.retry")}
          detailLabel={t("actions.showDetail")}
          onAction={() => {}}
        />

        <Text style={styles.groupLabel}>{t("gallery.component.errorDialog")}</Text>
        <View style={styles.dialogPreview}>
          <ErrorDialog
            visible
            animated={false}
            title={t("gallery.dialog.title")}
            message={t("gallery.dialog.message")}
            code="INVALID"
            detail={{ code: "INVALID" }}
            detailLabel={t("actions.showDetail")}
            retryLabel={t("actions.retry")}
            onRetry={() => {}}
            onClose={() => {}}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingVertical: spacing.lg, gap: spacing.lg },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.headlineLg.fontFamily,
    fontSize: typography.headlineLg.fontSize,
    lineHeight: typography.headlineLg.lineHeight,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  section: { gap: spacing.sm },
  componentColumn: { gap: spacing.sm, alignItems: "stretch" },
  coverWrap: { width: spacing["2xl"] * 2 },
  libraryCardWrap: { flex: 1, minWidth: 0 },
  shellPreview: { flex: 0, minHeight: spacing["2xl"] * 8 },
  settingsPreview: { flex: 0, minHeight: spacing["2xl"] * 4 },
  onboardingPreview: { flex: 0, minHeight: spacing["2xl"] * 10 },
  dialogPreview: { flex: 0, minHeight: spacing["2xl"] * 8 },
  shellErrorPreview: { flex: 0, minHeight: spacing["2xl"] * 16 },
  groupLabel: {
    color: colors.textSecondary,
    fontFamily: typography.labelSm.fontFamily,
    fontSize: typography.labelSm.fontSize,
    lineHeight: typography.labelSm.lineHeight,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: typography.headlineSm.fontSize,
    lineHeight: typography.headlineSm.lineHeight,
    fontWeight: "600",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    color: colors.textPrimary,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    flex: 1,
  },
  itemValue: {
    color: colors.textSecondary,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
  },
  spacingBar: { height: spacing.xs, backgroundColor: colors.accent, borderRadius: radii.control },
  cover: {
    width: spacing["2xl"] * coverAspectRatio.width,
    aspectRatio: coverAspectRatio.width / coverAspectRatio.height,
    backgroundColor: colors.surface,
    borderRadius: radii.cover,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverText: { flex: 1, gap: spacing.xxs },
  body: {
    color: colors.textPrimary,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
  },
  muted: {
    color: colors.textSecondary,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
  },
});
import { useState } from "react";
