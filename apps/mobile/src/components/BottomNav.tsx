import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Compass, Home, Library, Settings, type LucideIcon } from "../icons";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import { destinationLabel } from "../navigation/routes";
import { t } from "../i18n";
import { textStyle } from "./textStyle";
import {
  BOTTOM_NAV_DESTINATIONS,
  type BottomNavDestination,
  bottomNavStyle,
  NAV_LABEL_MAX_FONT_SCALE,
  navItemColors,
  navItemStyle,
} from "./shellStyles";

/**
 * F07 — barra inferior de 5 destinos (T1): Inicio, Biblioteca, Descubrir,
 * Fuentes, Ajustes; la misma en todas las pantallas. `elevated` al 95 %, borde
 * superior `border`, **sin sombra** (RNF-12). Destino activo en `accent`.
 *
 * F10: los destinos son identificadores de API y sus etiquetas salen del
 * catálogo (`nav.*`), escritas con claves literales para que la puerta de i18n
 * las vea.
 */

const DESTINATION_ICONS: Record<BottomNavDestination, LucideIcon> = {
  home: Home,
  library: Library,
  discover: Compass,
  sources: BookOpen,
  settings: Settings,
};

export interface BottomNavProps {
  active: BottomNavDestination;
  onSelect?: (destination: BottomNavDestination) => void;
  disabled?: boolean;
  /** F99: destinos con un punto de aviso (p. ej. actualizaciones en Portales). */
  dots?: readonly BottomNavDestination[];
}

export default function BottomNav({ active, onSelect, disabled = false, dots = [] }: BottomNavProps) {
  const [focused, setFocused] = useState<BottomNavDestination | null>(null);
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t("a11y.mainNav")}
      style={[bottomNavStyle(), styles.container]}
    >
      {BOTTOM_NAV_DESTINATIONS.map((destination) => {
        const isActive = destination === active;
        const colors = navItemColors(isActive);
        const Icon = DESTINATION_ICONS[destination];
        return (
          <Pressable
            key={destination}
            accessibilityRole="tab"
            accessibilityLabel={
              dots.includes(destination)
                ? `${destinationLabel(destination)}, ${t("sources.updates.dotA11y")}`
                : destinationLabel(destination)
            }
            accessibilityState={{ selected: isActive, disabled }}
            aria-selected={isActive}
            aria-disabled={disabled}
            disabled={disabled}
            onFocus={() => setFocused(destination)}
            onBlur={() => setFocused(null)}
            onPress={() => onSelect?.(destination)}
            style={({ pressed }) => [
              styles.item,
              navItemStyle({ focused: focused === destination, pressed, disabled }),
            ]}
          >
            <View>
              <Icon size={spacing.lg} color={colors.icon} />
              {dots.includes(destination) ? <View testID="nav-dot" style={styles.dot} /> : null}
            </View>
            <Text
              testID="nav-label"
              maxFontSizeMultiplier={NAV_LABEL_MAX_FONT_SCALE}
              style={[styles.label, { color: colors.text }]}
            >
              {destinationLabel(destination)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    // Sin relleno horizontal: a 273 px las cinco pestañas (mín. 48 dp) ocupan 268 px.
    paddingVertical: spacing.xxs,
  },
  item: {
    // Ancho por contenido y reparto del sobrante: «Biblioteca» no cabe en 1/5 de 273 px.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  dot: {
    position: "absolute",
    top: 0,
    right: -spacing.xxs,
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: dragonNightColors.textPrimary,
  },
  label: {
    ...textStyle(typography.labelSm),
  },
});
