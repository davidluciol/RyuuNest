import { StyleSheet } from "react-native";

import { Plus } from "../icons";
import FocusPressable from "./FocusPressable";
import {
  FAB_ICON_SIZE,
  floatingButtonIconColor,
  floatingButtonStyle,
} from "./floatingButtonStyles";

/**
 * F53 — botón flotante con un solo icono «+» (nueva carpeta en Tesoros). Quien lo usa lo coloca
 * (posición absoluta abajo) y le da una etiqueta accesible: el icono no lleva texto.
 */

export interface FloatingActionButtonProps {
  /** Etiqueta accesible (el botón solo tiene icono). */
  accessibilityLabel: string;
  onPress?: () => void;
  testID?: string;
}

export default function FloatingActionButton({
  accessibilityLabel,
  onPress,
  testID,
}: FloatingActionButtonProps) {
  return (
    <FocusPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [floatingButtonStyle(), styles.center, pressed && styles.pressed]}
    >
      <Plus size={FAB_ICON_SIZE} color={floatingButtonIconColor()} />
    </FocusPressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.85 },
});
