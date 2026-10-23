import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Compass, Home, Library, Settings, type LucideIcon } from "../icons";
import { spacing, typography } from "@ryuunest/ui-tokens";

import { destinationLabel } from "../navigation/routes";
import { textStyle } from "./textStyle";
import {
  BOTTOM_NAV_DESTINATIONS,
  type BottomNavDestination,
  bottomNavStyle,
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
}

export default function BottomNav({ active, onSelect, disabled = false }: BottomNavProps) {
  const [focused, setFocused] = useState<BottomNavDestination | null>(null);
  return (
    <View accessibilityRole="tablist" style={[bottomNavStyle(), styles.container]}>
      {BOTTOM_NAV_DESTINATIONS.map((destination) => {
        const isActive = destination === active;
        const colors = navItemColors(isActive);
        const Icon = DESTINATION_ICONS[destination];
        return (
          <Pressable
            key={destination}
            accessibilityRole="tab"
            accessibilityLabel={destinationLabel(destination)}
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
            <Icon size={spacing.lg} color={colors.icon} />
            <Text testID="nav-label" style={[styles.label, { color: colors.text }]}>
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
    padding: spacing.xxs,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  label: {
    ...textStyle(typography.labelSm),
  },
});
