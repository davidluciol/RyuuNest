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
import CoverCard from "../components/CoverCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import Header from "../components/Header";
import LoadingState from "../components/LoadingState";
import SettingsRow from "../components/SettingsRow";
import Sheet from "../components/Sheet";
import TextField from "../components/TextField";

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

        <Text style={styles.groupLabel}>{t("gallery.component.settingsRow")}</Text>
        <SettingsRow label={t("gallery.settings.label")} hint={t("gallery.settings.value")} />

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
