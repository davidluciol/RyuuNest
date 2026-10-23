import { Pressable, StyleSheet, Text, View } from "react-native";
import { Folder } from "../icons";
import { radii, spacing, typography } from "@ryuunest/ui-tokens";

import {
  FOLDER_CARD_ICON_SIZE,
  folderCardColors,
  folderCardStyle,
} from "./folderCardStyles";
import { textStyle } from "./textStyle";

/**
 * F13 — tarjeta de carpeta ("Tesoros Guardados", SPEC §11.10, V1/V4/V6):
 * fondo `surface`, radio 12, borde `border`, icono monocromo `text-secondary`
 * en cuadrado de 36 px (V4), contador de obras en pill `elevated`, nombre en
 * `text-primary` y descripción en `text-secondary`. Área táctil mínima de
 * 48 dp (RNF-7). Un solo acceso a carpetas por pantalla (V6).
 */

export interface FolderCardProps {
  /** Nombre de la carpeta. */
  name: string;
  /** Descripción/subtítulo opcional (p. ej. «Fantasía y Aventuras»). */
  description?: string;
  /** Número de obras en la carpeta. */
  count: number;
  /** Etiqueta accesible (p. ej. «Favoritos Épicos, 24 obras»). */
  accessibilityLabel?: string;
  onPress?: () => void;
}

export default function FolderCard({
  name,
  description,
  count,
  accessibilityLabel,
  onPress,
}: FolderCardProps) {
  const colors = folderCardColors();
  const shape = folderCardStyle();
  const countLabel = `${count} obras`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${name}, ${countLabel}`}
      onPress={onPress}
      style={[styles.container, shape]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            {
              width: FOLDER_CARD_ICON_SIZE,
              height: FOLDER_CARD_ICON_SIZE,
              borderRadius: shape.iconBorderRadius,
              backgroundColor: colors.iconBackground,
            },
          ]}
        >
          <Folder size={spacing.lg} color={colors.icon} />
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.countBackground }]}>
          <Text style={[styles.countText, { color: colors.countText }]}>{countLabel}</Text>
        </View>
      </View>
      <View style={[styles.textBlock, { marginTop: shape.gap, gap: shape.gap / 3 }]}>
        <Text style={[styles.name, { color: colors.name }]} numberOfLines={1}>
          {name}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: colors.description }]} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  countText: {
    ...textStyle(typography.labelSm),
    fontWeight: "500",
  },
  textBlock: {
    minWidth: 0,
  },
  name: {
    ...textStyle(typography.titleLg),
  },
  description: {
    ...textStyle(typography.bodySm),
  },
});
