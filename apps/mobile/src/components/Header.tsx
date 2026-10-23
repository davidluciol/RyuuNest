import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { HEADER_HEIGHT, headerStyle } from "./shellStyles";
import { textStyle } from "./textStyle";

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
  leading?: React.ReactNode;
  subtitle?: string;
}

export default function Header({ title, logo, right, leading, subtitle }: HeaderProps) {
  return (
    <View style={[headerStyle(), styles.container]}>
      <View style={styles.left}>
        {leading}
        {logo ? <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors /> : null}
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
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
    minHeight: HEADER_HEIGHT,
    paddingVertical: spacing.xs,
  },
  left: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  logo: { width: spacing.xl, height: spacing.xl },
  text: { flexShrink: 1 },
  title: {
    ...textStyle(typography.headlineSm),
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...textStyle(typography.labelMd),
    color: colors.textSecondary,
  },
});
