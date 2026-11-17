import FocusPressable from "./FocusPressable";
import { StyleSheet, Text, View } from "react-native";
import { Folder, Zap } from "../icons";
import { t } from "../i18n";
import { spacing, typography } from "@ryuunest/ui-tokens";

import {
  FOLDER_CARD_ICON_SIZE,
  folderCardColors,
  folderCardContainer,
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
  /** Carpeta dinámica (con etiquetas): se marca con un rayo pequeño. */
  dynamic?: boolean;
  /** F52: la carpeta que filtra la pantalla (mismo trato que un chip seleccionado). */
  selected?: boolean;
  onPress?: () => void;
}

export default function FolderCard({
  name,
  description,
  count,
  accessibilityLabel,
  dynamic = false,
  selected = false,
  onPress,
}: FolderCardProps) {
  const colors = folderCardColors();
  const shape = folderCardStyle(selected);
  const countLabel = `${count} obras`;

  return (
    <FocusPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        accessibilityLabel ??
        `${name}, ${countLabel}${dynamic ? `, ${t("library.folder.dynamic")}` : ""}`
      }
      onPress={onPress}
      style={[folderCardContainer(), shape]}
    >
      <View style={[styles.row, { gap: shape.gap }]}>
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
        <View style={styles.textBlock}>
          <Text style={[styles.name, { color: colors.name }]} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.meta}>
            {dynamic ? (
              <Zap size={spacing.md} color={colors.icon} testID="folder-card-dynamic" />
            ) : null}
            <Text style={[styles.count, { color: colors.countText }]} numberOfLines={1}>
              {description ? `${countLabel} · ${description}` : countLabel}
            </Text>
          </View>
        </View>
      </View>
    </FocusPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...textStyle(typography.titleLg),
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  count: {
    ...textStyle(typography.bodySm),
  },
});
