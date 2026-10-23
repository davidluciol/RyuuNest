import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { Play } from "../icons";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import Badge from "./Badge";
import Button from "./Button";
import {
  CONTINUE_CARD_COVER_WIDTH,
  continueCardColors,
  continueCardCoverHeight,
  continueCardStyle,
} from "./continueCardStyles";
import { progressBarStyle } from "./coverCardStyles";
import { textStyle } from "./textStyle";

/**
 * F13 — tarjeta hero "Continuar la Aventura" (SPEC §11.10, RF-14, RF-41):
 * portada grande a la izquierda (96×144, 2:3) con badge de tipo y barra de
 * progreso de 3 px, contenido a la derecha con metadatos, título, capítulo,
 * progreso lineal y botón primario "Continuar cap. N". Fondo `surface`,
 * radio 12, borde `border`, sin sombra (RNF-12).
 */

export interface ContinueCardProps {
  /** Fuente de la portada. */
  cover?: ImageSourcePropType;
  /** Tipo de obra para el badge (p. ej. «Manga»). */
  kind: string;
  /** Título de la serie. */
  title: string;
  /** Metadatos superiores (p. ej. «Crónicas de Alden · En emisión»). */
  meta: string;
  /** Capítulo en curso (p. ej. «Cap. 41»). */
  chapter: string;
  /** Página actual (base 0). */
  pageIndex: number;
  /** Total de páginas del capítulo. */
  pageTotal: number;
  /** Etiqueta del botón primario (p. ej. «Continuar cap. 41»). */
  actionLabel: string;
  onPress?: () => void;
}

export default function ContinueCard({
  cover,
  kind,
  title,
  meta,
  chapter,
  pageIndex,
  pageTotal,
  actionLabel,
  onPress,
}: ContinueCardProps) {
  const colors = continueCardColors();
  const shape = continueCardStyle();
  const coverHeight = continueCardCoverHeight();
  const progress = pageTotal > 0 ? pageIndex / pageTotal : 0;
  const pageLabel = `Pág. ${pageIndex + 1} de ${pageTotal}`;

  return (
    <View style={[styles.container, shape]}>
      <View style={[styles.coverWrap, { width: CONTINUE_CARD_COVER_WIDTH, height: coverHeight }]}>
        {cover ? <Image source={cover} style={styles.cover} /> : null}
        <View style={styles.badgeWrap}>
          <Badge label={kind} />
        </View>
        {progress > 0 ? (
          <View style={styles.progressTrack}>
            <View style={progressBarStyle(progress)} />
          </View>
        ) : null}
      </View>
      <View style={[styles.content, { gap: shape.gap }]}>
        <View style={styles.textBlock}>
          <Text style={[styles.meta, { color: colors.meta }]} numberOfLines={1}>
            {meta}
          </Text>
          <Text style={[styles.title, { color: colors.title }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.chapterRow}>
            <Text style={[styles.chapter, { color: colors.progress }]}>{chapter}</Text>
            <Text style={[styles.page, { color: colors.meta }]}>{pageLabel}</Text>
          </View>
          <View style={styles.progressLine}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.progress, width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
        </View>
        <Button
          label={actionLabel}
          onPress={onPress}
          icon={<Play size={spacing.md} color={colors.buttonText} />}
        />
      </View>
    </View>
  );
}

const colors = dragonNightColors;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  coverWrap: {
    borderRadius: radii.cover,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing.xxs,
  },
  textBlock: {
    gap: spacing.xxs,
  },
  meta: {
    ...textStyle(typography.labelMd),
  },
  title: {
    ...textStyle(typography.headlineSm),
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  chapter: {
    ...textStyle(typography.labelLg),
    fontWeight: "600",
  },
  page: {
    ...textStyle(typography.bodySm),
  },
  progressLine: {
    height: spacing.xxs,
    borderRadius: spacing.xxs / 2,
    backgroundColor: colors.elevated,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: spacing.xxs / 2,
  },
});
