import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BookOpen, Compass, Home, Library, Settings, type LucideIcon } from "../icons";
import { activeColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

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
  RAIL_ICON_SIZE,
  RAIL_ITEM_MIN_HEIGHT,
  RAIL_LABEL,
  railNavStyle,
} from "./shellStyles";
import { nextRailIndex } from "../tv/tvShell";
import { themedStyles } from "./themedStyles";

/**
 * F07 — barra inferior de 5 destinos (T1): Inicio, Biblioteca, Descubrir,
 * Fuentes, Ajustes; la misma en todas las pantallas. `elevated` al 95 %, borde
 * superior `border`, **sin sombra** (RNF-12). Destino activo en `accent`.
 *
 * F10: los destinos son identificadores de API y sus etiquetas salen del
 * catálogo (`nav.*`), escritas con claves literales para que la puerta de i18n
 * las vea.
 *
 * F22: `variant="rail"` es el riel lateral de TV (SPEC §11.10): mismos destinos,
 * tamaños ×1,25 y flechas arriba/abajo entre destinos (en Android el D-pad ya
 * mueve el foco de forma nativa; en web lo hacen las flechas).
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
  /** F22: barra inferior (móvil/web) o riel lateral (TV). */
  variant?: "bar" | "rail";
}

export default function BottomNav({
  active,
  onSelect,
  disabled = false,
  dots = [],
  variant = "bar",
}: BottomNavProps) {
  const [focused, setFocused] = useState<BottomNavDestination | null>(null);
  const rail = variant === "rail";
  const items = useRef<(View | null)[]>([]);
  useEffect(() => {
    if (!rail || typeof document === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      const current = items.current.findIndex(
        (item) => item === (document.activeElement as unknown),
      );
      const next = nextRailIndex(current, event.key, items.current.length);
      if (next === null) return;
      event.preventDefault();
      items.current[next]?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rail]);
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t("a11y.mainNav")}
      style={rail ? [railNavStyle(), styles.rail] : [bottomNavStyle(), styles.container]}
    >
      {BOTTOM_NAV_DESTINATIONS.map((destination, index) => {
        const isActive = destination === active;
        const colors = navItemColors(isActive);
        const Icon = DESTINATION_ICONS[destination];
        return (
          <Pressable
            key={destination}
            ref={(item) => {
              items.current[index] = item;
            }}
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
              navItemStyle({ focused: focused === destination, pressed, disabled }),
              rail ? styles.railItem : styles.item,
            ]}
          >
            <View>
              <Icon size={rail ? RAIL_ICON_SIZE : spacing.lg} color={colors.icon} />
              {dots.includes(destination) ? <View testID="nav-dot" style={styles.dot} /> : null}
            </View>
            <Text
              testID="nav-label"
              maxFontSizeMultiplier={NAV_LABEL_MAX_FONT_SCALE}
              style={[rail ? styles.railLabel : styles.label, { color: colors.text }]}
            >
              {destinationLabel(destination)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => ({
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
  rail: {
    gap: spacing.xs,
    padding: spacing.sm,
  },
  railItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: RAIL_ITEM_MIN_HEIGHT,
    paddingHorizontal: spacing.md,
  },
  railLabel: {
    ...textStyle(RAIL_LABEL),
  },
  dot: {
    position: "absolute",
    top: 0,
    right: -spacing.xxs,
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: activeColors.textPrimary,
  },
  label: {
    ...textStyle(typography.labelSm),
  },
}));
