import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Compass, Home, Library, Settings, type LucideIcon } from "lucide-react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import {
  BOTTOM_NAV_DESTINATIONS,
  type BottomNavDestination,
  bottomNavStyle,
  navItemColors,
} from "./shellStyles";

/**
 * F07 — barra inferior de 5 destinos (T1): Inicio, Biblioteca, Descubrir,
 * Fuentes, Ajustes; la misma en todas las pantallas. `elevated` al 95 %, borde
 * superior `border`, **sin sombra** (RNF-12). Destino activo en `accent`.
 */

const DESTINATION_ICONS: Record<BottomNavDestination, LucideIcon> = {
  Inicio: Home,
  Biblioteca: Library,
  Descubrir: Compass,
  Fuentes: BookOpen,
  Ajustes: Settings,
};

export interface BottomNavProps {
  active: BottomNavDestination;
  onSelect?: (destination: BottomNavDestination) => void;
}

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <View style={[bottomNavStyle(), styles.container]}>
      {BOTTOM_NAV_DESTINATIONS.map((destination) => {
        const isActive = destination === active;
        const colors = navItemColors(isActive);
        const Icon = DESTINATION_ICONS[destination];
        return (
          <Pressable
            key={destination}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect?.(destination)}
            hitSlop={touchTarget.min / 8}
            style={styles.item}
          >
            <Icon size={24} color={colors.icon} />
            <Text style={[styles.label, { color: colors.text }]}>{destination}</Text>
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
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: typography.labelSm.fontSize,
    lineHeight: typography.labelSm.lineHeight,
  },
});
