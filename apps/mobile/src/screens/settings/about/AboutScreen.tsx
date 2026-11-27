import { Linking, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { activeColors, layoutForWidth, markers, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { APP_LINKS, APP_VERSION, THIRD_PARTY_CREDITS } from "../../../about/appInfo";
import { ARTISTS, type Artist } from "../../../about/artists";
import ArtistCard from "../../../components/ArtistCard";
import { contentColumnStyle } from "../../../components/cardStyles";
import DragonMarker from "../../../components/DragonMarker";
import FocusPressable from "../../../components/FocusPressable";
import SectionHeader from "../../../components/SectionHeader";
import SettingsCard from "../../../components/SettingsCard";
import SettingsRow from "../../../components/SettingsRow";
import { textStyle } from "../../../components/textStyle";
import { themedStyles } from "../../../components/themedStyles";
import { ChevronLeft, ExternalLink } from "../../../icons";
import { t } from "../../../i18n";

/**
 * Acerca de (AB2) — Ajustes → Acerca de: versión, licencia, privacidad, enlaces
 * (abren el navegador del sistema; la app no hace ninguna petición, RNF-5),
 * «Artistas» (una tarjeta por artista; oculta si no hay ninguno) y recursos de
 * terceros. Presentacional: `artists` es inyectable para la galería.
 */

const colors = activeColors;

export interface AboutScreenProps {
  artists?: readonly Artist[];
  onBack?: () => void;
}

export default function AboutScreen({ artists = ARTISTS, onBack }: AboutScreenProps) {
  const { width } = useWindowDimensions();
  const layout = layoutForWidth(width);

  return (
    <View style={styles.screen} testID="screen-about">
      <View style={styles.header}>
        <FocusPressable
          onPress={onBack}
          hitSlop={touchTarget.min / 4}
          accessibilityRole="button"
          accessibilityLabel={t("actions.back")}
          style={styles.back}
          testID="about-back"
        >
          <ChevronLeft size={spacing.lg} color={colors.textPrimary} />
        </FocusPressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {t("about.title")}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.margin,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
          ...contentColumnStyle(),
        }}
      >
        <View style={styles.app}>
          <DragonMarker size={markers.md} color={colors.accent} />
          <Text style={styles.version} testID="about-version">
            {t("about.version", { version: APP_VERSION })}
          </Text>
          <Text style={styles.line}>{t("about.license")}</Text>
          <Text style={styles.line}>{t("about.privacy")}</Text>
        </View>

        <SettingsCard>
          {APP_LINKS.map((link) => (
            <SettingsRow
              key={link.id}
              label={t(link.labelKey)}
              onPress={() => void Linking.openURL(link.url)}
              right={<ExternalLink size={spacing.lg} color={colors.textSecondary} />}
            />
          ))}
        </SettingsCard>

        {artists.length > 0 ? (
          <View style={styles.section} testID="about-artists">
            <SectionHeader title={t("about.artists.title")} />
            <Text style={styles.intro}>{t("about.artists.intro")}</Text>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} testID={`about-artist-${artist.id}`} />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={t("about.credits.title")} />
          <SettingsCard>
            {THIRD_PARTY_CREDITS.map((credit) => (
              <SettingsRow key={credit.name} label={t("about.credits.item", { ...credit })} />
            ))}
          </SettingsCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTarget.min + spacing.xs,
    paddingRight: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...textStyle(typography.headlineSm), color: colors.textPrimary },
  app: { alignItems: "center", gap: spacing.xs },
  version: { ...textStyle(typography.titleLg), color: colors.textPrimary },
  line: { ...textStyle(typography.bodyMd), color: colors.textSecondary, textAlign: "center" },
  section: { gap: spacing.sm },
  intro: { ...textStyle(typography.bodyMd), color: colors.textSecondary },
}));
