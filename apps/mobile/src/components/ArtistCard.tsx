import { Image } from "expo-image";
import { Linking, Text, View } from "react-native";
import { activeColors, markers, spacing, typography } from "@ryuunest/ui-tokens";

import { safeLinks, type Artist } from "../about/artists";
import { SOCIAL_NETWORKS } from "../about/socialIcons";
import { t } from "../i18n";
import { artistLinkStyle, artistPhotoStyle } from "./artistCardStyles";
import { settingsCardStyle } from "./cardStyles";
import DragonMarker from "./DragonMarker";
import FocusPressable from "./FocusPressable";
import SocialIcon from "./SocialIcon";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * Acerca de — tarjeta de un artista: foto (o el dragón marcador si falta),
 * nombre artístico, agradecimiento y un botón por red. Las redes se reparten en
 * varias líneas si no caben; tocar una abre el navegador del sistema (la app no
 * hace ninguna petición, RNF-5). Solo se muestran enlaces `https:`.
 */

const colors = activeColors;

export interface ArtistCardProps {
  artist: Artist;
  testID?: string;
}

export default function ArtistCard({ artist, testID }: ArtistCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      {artist.image !== undefined ? (
        <Image source={artist.image} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.photo}>
          <DragonMarker size={markers.md} color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.name} accessibilityRole="header">
        {artist.name}
      </Text>
      <Text style={styles.bio}>{t(artist.bioKey)}</Text>
      <View style={styles.links}>
        {safeLinks(artist).map((link) => {
          const network = t(SOCIAL_NETWORKS[link.network].labelKey);
          return (
            <FocusPressable
              key={link.url}
              style={styles.link}
              accessibilityRole="link"
              accessibilityLabel={t("about.social.openA11y", { network, name: artist.name })}
              onPress={() => void Linking.openURL(link.url)}
              testID={`${testID ?? "artist"}-link-${link.network}`}
            >
              <SocialIcon network={link.network} size={spacing.lg} color={colors.accent} />
              <Text style={styles.linkLabel}>{network}</Text>
            </FocusPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  card: { ...settingsCardStyle(), alignItems: "center", padding: spacing.md, gap: spacing.sm },
  photo: { ...artistPhotoStyle(), overflow: "hidden", alignItems: "center", justifyContent: "center" },
  name: { ...textStyle(typography.titleLg), color: colors.textPrimary, textAlign: "center" },
  bio: { ...textStyle(typography.bodyMd), color: colors.textSecondary, textAlign: "center" },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.xs },
  link: { ...artistLinkStyle(), flexDirection: "row", gap: spacing.xs, backgroundColor: colors.elevated },
  linkLabel: { ...textStyle(typography.labelLg), color: colors.textPrimary },
}));
