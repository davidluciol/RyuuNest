import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import Badge from "./Badge";
import {
  LIBRARY_CARD_TITLE_LINES,
  libraryCardBadgeStyle,
  libraryCardMetaStyle,
  libraryCardProgressStyle,
  libraryCardStyle,
  libraryCardTitleStyle,
} from "./libraryCardStyles";
import { textStyle } from "./textStyle";

/**
 * F14a — tarjeta de serie de la cuadrícula de Biblioteca (SPEC §11.10,
 * RF-41, V7, T7): portada 2:3 con insignia de tipo neutra sobre ella y
 * barra de progreso de 3 px cuando hay avance, título a **dos líneas**
 * sin «…» debajo. **Sin contador de no leídos** (RF-42, v2). Área
 * táctil mínima de 48 dp (RNF-7).
 */

export interface LibraryCardProps {
  /** Fuente de la portada. */
  cover?: ImageSourcePropType;
  /** Tipo de obra para el badge (p. ej. «Manhwa»); sin él no hay insignia. */
  kind?: string;
  /** Título de la serie (máx. 2 líneas, T7). */
  title: string;
  /** Avance 0–1; si > 0 muestra la barra de progreso (RF-41). */
  progress?: number;
  /** Dato secundario bajo el título (F15 Descubrir: tipo · pista). */
  meta?: string;
  /** Accesibilidad: nombre completo de la serie. */
  accessibilityLabel?: string;
  onPress?: () => void;
}

export default function LibraryCard({
  cover,
  kind,
  title,
  progress = 0,
  meta,
  accessibilityLabel,
  onPress,
}: LibraryCardProps) {
  const cardStyle = libraryCardStyle();
  const titleStyle = libraryCardTitleStyle();
  const badgeStyle = libraryCardBadgeStyle();
  const metaStyle = libraryCardMetaStyle();
  const hasProgress = progress > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={styles.container}
    >
      <View
        style={[
          styles.coverWrap,
          {
            aspectRatio: cardStyle.aspectRatio,
            borderRadius: cardStyle.borderRadius,
            borderWidth: cardStyle.borderWidth,
            borderColor: cardStyle.borderColor,
            backgroundColor: cardStyle.backgroundColor,
          },
        ]}
      >
        {cover ? <Image source={cover} style={styles.cover} /> : null}
        {kind ? (
          <View
            style={[
              styles.badgeWrap,
              {
                top: badgeStyle.top,
                left: badgeStyle.left,
                height: badgeStyle.height,
                borderRadius: badgeStyle.borderRadius,
                backgroundColor: badgeStyle.backgroundColor,
              },
            ]}
          >
            <Badge label={kind} />
          </View>
        ) : null}
        {hasProgress ? (
          <View style={styles.progressTrack}>
            <View style={libraryCardProgressStyle(progress)} />
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.title,
          {
            fontFamily: titleStyle.fontFamily,
            fontSize: titleStyle.fontSize,
            lineHeight: titleStyle.lineHeight,
            color: titleStyle.color,
          },
        ]}
        numberOfLines={LIBRARY_CARD_TITLE_LINES}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          style={[
            styles.meta,
            {
              fontFamily: metaStyle.fontFamily,
              fontSize: metaStyle.fontSize,
              lineHeight: metaStyle.lineHeight,
              color: metaStyle.color,
            },
          ]}
          numberOfLines={metaStyle.numberOfLines}
        >
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    minHeight: touchTarget.min, // área táctil mínima (RNF-7)
  },
  coverWrap: {
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  badgeWrap: {
    position: "absolute",
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    ...textStyle(typography.labelMd),
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  meta: {
    ...textStyle(typography.labelMd),
    marginTop: spacing.xxs,
  },
});
