import { Pressable, StyleSheet, Text } from "react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { chipColors, chipStyle } from "./chipStyles";
import { textStyle } from "./textStyle";

/**
 * F06 — chip de filtro (SPEC §11.10): pill de 36 px, inactivo/seleccionado.
 * La altura visible es 36 px; el área táctil llega a 48 dp con `hitSlop`
 * (RNF-7). Props tipadas; todo desde `ui-tokens`.
 */

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function Chip({ label, selected = false, onPress }: ChipProps) {
  const colors = chipColors(selected);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={(touchTarget.min - 36) / 2} // 36 visible → 48 táctil
      style={({ pressed }) => [chipStyle(selected), styles.content, pressed && styles.pressed]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.8 },
  label: { ...textStyle(typography.labelMd) },
});
