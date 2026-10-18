import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { touchTarget, typography } from "@ryuunest/ui-tokens";

import {
  type ButtonVariant,
  buttonStyle,
  buttonTextColor,
} from "./buttonStyles";

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
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  variant = "primary",
  label,
  onPress,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={touchTarget.min / 4}
      style={({ pressed }) => [buttonStyle(variant, { pressed, disabled }), style]}
    >
      {icon}
      <Text style={[styles.label, { color: buttonTextColor(variant) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.labelLg.fontFamily,
    fontSize: typography.labelLg.fontSize,
    lineHeight: typography.labelLg.lineHeight,
    fontWeight: "600",
  },
});
