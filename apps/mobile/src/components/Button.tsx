import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { type ButtonVariant, buttonStyle, buttonTextColor } from "./buttonStyles";
import { textStyle } from "./textStyle";

/**
 * F06 — botón primario / secundario / destructivo (SPEC §11.10). Props
 * tipadas, todo desde `ui-tokens`. Un botón primario por pantalla; el relleno
 * `accent`/`progress` lleva texto e icono en `bg` (inversión, SPEC §11.9).
 */

export type { ButtonVariant } from "./buttonStyles";

export interface ButtonProps {
  variant?: ButtonVariant;
  /** Texto del botón. */
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Icono Lucide a la izquierda (F03); hereda el color del texto. */
  icon?: React.ReactNode;
  /** Icono Lucide a la derecha (F15: chevron del selector); hereda el color. */
  trailingIcon?: React.ReactNode;
  /** Etiqueta de accesibilidad del botón (si el label visual no basta). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  variant = "primary",
  label,
  onPress,
  disabled = false,
  icon,
  trailingIcon,
  accessibilityLabel,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={touchTarget.min / 4}
      style={({ pressed }) => [styles.container, buttonStyle(variant, { pressed, disabled }), style]}
    >
      {icon}
      <Text style={[styles.label, { color: buttonTextColor(variant) }]}>{label}</Text>
      {trailingIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // icono + etiqueta + icono derecho en línea
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    ...textStyle(typography.labelLg),
  },
});
