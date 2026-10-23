import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { spacing, typography } from "@ryuunest/ui-tokens";

import Badge from "./Badge";
import { progressBarStyle } from "./coverCardStyles";
import {
  recentCardColors,
  recentCardStyle,
} from "./recentCardStyles";
import { textStyle } from "./textStyle";

/**
 * F13 — tarjeta de portada para la fila horizontal "Lecturas Recientes"
 * (SPEC §11.10, RF-41, T7): ancho fijo para carrusel, portada 2:3 con badge
 * de tipo y barra de progreso de 3 px, título a **dos líneas** (sin «…», T7)
 * y metadatos de capítulo debajo. **Sin contador de no leídos** (RF-42, v2).
 * Al pulsar, navega al detalle de la serie.
 */

export interface RecentCardProps {
  /** Fuente de la portada. */
  cover?: ImageSourcePropType;
  /** Tipo de obra para el badge (p. ej. «Manhwa»). */
  kind: string;
  /** Título de la serie (máx. 2 líneas, T7). */
  title: string;
  /** Capítulo en curso (p. ej. «Cap. 24»). */
  chapter?: string;
  /** Avance 0–1; si > 0 muestra la barra de progreso (RF-41). */
  progress?: number;
  /** Accesibilidad: nombre completo de la serie. */
  accessibilityLabel?: string;
  onPress?: () => void;
}

export default function RecentCard({
  cover,
  kind,
  title,
  chapter,
  progress = 0,
  accessibilityLabel,
  onPress,
}: RecentCardProps) {
  const colors = recentCardColors();
  const shape = recentCardStyle();
  const hasProgress = progress > 0;
  const percent = Math.round(progress * 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={[styles.container, { width: shape.width }]}
    >
      <View
        style={[
          styles.coverWrap,
          {
            aspectRatio: shape.coverAspectRatio,
            borderRadius: shape.coverBorderRadius,
            borderWidth: shape.coverBorderWidth,
            borderColor: shape.coverBorderColor,
            backgroundColor: shape.coverBackgroundColor,
          },
        ]}
      >
        {cover ? <Image source={cover} style={styles.cover} /> : null}
        <View style={styles.badgeWrap}>
          <Badge label={kind} />
        </View>
        {hasProgress ? (
          <View style={styles.progressTrack}>
            <View style={progressBarStyle(progress)} />
          </View>
        ) : null}
      </View>
      <View style={[styles.textBlock, { marginTop: shape.gapCoverText }]}>
        <Text
          style={[styles.title, { color: colors.title }]}
          numberOfLines={shape.titleMaxLines}
        >
          {title}
        </Text>
        {chapter ? (
          <View style={[styles.metaRow, { marginTop: shape.gapTextMeta }]}>
            <Text style={[styles.chapter, { color: colors.chapterInProgress }]}>{chapter}</Text>
            {hasProgress ? (
              <Text style={[styles.percent, { color: colors.meta }]}>{percent}%</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
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
    top: spacing.xs,
    left: spacing.xs,
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  textBlock: {
    minWidth: 0,
  },
  title: {
    ...textStyle(typography.labelLg),
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapter: {
    ...textStyle(typography.labelMd),
    fontWeight: "600",
  },
  percent: {
    ...textStyle(typography.labelSm),
  },
});
