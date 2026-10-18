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
import Header from "../components/Header";
import SettingsRow from "../components/SettingsRow";
import Sheet from "../components/Sheet";
import TextField from "../components/TextField";

import { COMPONENT_STATES } from "./registry";

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
      <Text style={styles.title}>Galería de componentes</Text>
      <Text style={styles.subtitle}>
        {screen.breakpoint} · margen {screen.margin} · separación {screen.gap} · tipografía ×
        {density.fontScale}
      </Text>

      <Section title="Colores">
        {colorNames.map((name) => (
          <ColorSwatch key={name} name={name} />
        ))}
      </Section>

      <Section title="Tipografía">
        {(Object.keys(typography) as (keyof typeof typography)[]).map((name) => (
          <TypeSample key={name} name={name} />
        ))}
      </Section>

      <Section title="Espaciado">
        {Object.entries(spacing).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemValue}>{value}</Text>
            <View style={[styles.spacingBar, { width: value }]} />
          </View>
        ))}
      </Section>

      <Section title="Radios">
        {Object.entries(radii).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemValue}>{value}</Text>
          </View>
        ))}
      </Section>

      <Section title="Layout por ancho">
        <Text style={styles.body}>
          móvil &lt; {breakpoints.mobileMax} · tablet hasta {breakpoints.tabletMax} · escritorio
          mayor · riel {breakpoints.desktopRail}
        </Text>
      </Section>

      <Section title="Iconos">
        <Text style={styles.body}>Lucide vía src/icons.ts</Text>
      </Section>

      <Section title="Portadas de ejemplo">
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

      <Section title="Componentes">
        <Text style={styles.muted}>Estados: {COMPONENT_STATES.join(" · ")}</Text>

        <Text style={styles.groupLabel}>botón</Text>
        <View style={styles.componentColumn}>
          <Button label="Primario" />
          <Button label="Secundario" variant="secondary" />
          <Button label="Destructivo" variant="destructive" />
          <Button label="Deshabilitado" disabled />
        </View>

        <Text style={styles.groupLabel}>campo de texto</Text>
        <TextField placeholder="Buscar…" />

        <Text style={styles.groupLabel}>casilla y radio</Text>
        <View style={styles.row}>
          <Checkbox checked={false} />
          <Checkbox checked />
          <Checkbox radio checked={false} />
          <Checkbox radio checked />
        </View>

        <Text style={styles.groupLabel}>chip de filtro</Text>
        <View style={styles.row}>
          <Chip label="Inactivo" />
          <Chip label="Seleccionado" selected />
        </View>

        <Text style={styles.groupLabel}>insignia</Text>
        <View style={styles.row}>
          <Badge label="Manhwa" />
          <Badge label="En curso" />
        </View>

        <Text style={styles.groupLabel}>tarjeta de portada</Text>
        <View style={styles.row}>
          <View style={styles.coverWrap}>
            <CoverCard />
          </View>
          <View style={styles.coverWrap}>
            <CoverCard progress={0.42} />
          </View>
        </View>

        <Text style={styles.groupLabel}>fila de capítulo</Text>
        <View style={styles.componentColumn}>
          <ChapterRow title="Capítulo 1" hint="hace 2 h · Equipo Ryuu" />
          <ChapterRow title="Capítulo 2" state="in-progress" percent={42} />
          <ChapterRow title="Capítulo 3" state="completed" />
        </View>

        <Text style={styles.groupLabel}>cabecera</Text>
        <Header title="Biblioteca" />

        <Text style={styles.groupLabel}>barra inferior</Text>
        <BottomNav active="Biblioteca" />

        <Text style={styles.groupLabel}>fila de ajustes</Text>
        <SettingsRow label="Tema" hint="Dragon Night" />

        <Text style={styles.groupLabel}>hoja y diálogo</Text>
        <Sheet>
          <Text style={styles.body}>Contenido de una hoja (nivel 2, sin sombra).</Text>
        </Sheet>
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
  coverWrap: { width: 96 },
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
