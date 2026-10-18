import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { HEADER_HEIGHT, headerStyle } from "./shellStyles";

/**
 * F07 — cabecera única (V5): nivel `elevated`, **sin sombra** (RNF-12). El
 * logo es un recurso local (`logo`); el texto alternativo nunca se dibuja.
 * La misma en todas las pantallas.
 */

const colors = dragonNightColors;

export interface HeaderProps {
  /** Título de la pantalla. */
  title: string;
  /** Logo local (asset); no se dibuja texto alternativo si falta. */
  logo?: ImageSourcePropType;
  /** Acceso a la acción de la derecha (p. ej. avatar/ajustes). */
  right?: React.ReactNode;
}

export default function Header({ title, logo, right }: HeaderProps) {
  return (
    <View style={[headerStyle(), styles.container]}>
      <View style={styles.left}>
        {logo ? <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors /> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    height: HEADER_HEIGHT,
  },
  left: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  logo: { width: spacing.xl, height: spacing.xl },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.headlineSm.fontFamily,
    fontSize: typography.headlineSm.fontSize,
    lineHeight: typography.headlineSm.lineHeight,
    fontWeight: "600",
    flexShrink: 1,
  },
});
