import FocusPressable from "./FocusPressable";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { switchLabelKey, switchStyle } from "./switchStyles";
import { textStyle } from "./textStyle";

/**
 * F34.2 — interruptor de las filas de ajustes (Regla 3): control propio con
 * borde visible y el texto «Sí»/«No» al lado, para que el estado no dependa solo
 * del color. Rol `switch` con etiqueta y estado (marcado/deshabilitado) iguales
 * en móvil y web. Colores y medidas salen de `switchStyle` (tokens).
 */

export interface SwitchProps {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  /** Etiqueta de accesibilidad del interruptor. */
  accessibilityLabel: string;
  /** Marcador estable para las pruebas de interfaz. */
  testID?: string;
}

export default function Switch({
  value,
  disabled = false,
  onValueChange,
  accessibilityLabel,
  testID,
}: SwitchProps) {
  const s = switchStyle(value, disabled);
  return (
    <FocusPressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      testID={testID}
      style={[styles.hit, { minHeight: s.hitHeight, opacity: s.opacity }]}
    >
      <Text style={styles.state}>{t(switchLabelKey(value))}</Text>
      <View style={[styles.track, s.track]}>
        <View
          style={{
            position: "absolute",
            top: (s.track.height - s.track.borderWidth * 2 - s.thumb.size) / 2,
            left: s.thumb.left,
            width: s.thumb.size,
            height: s.thumb.size,
            borderRadius: s.thumb.size / 2,
            backgroundColor: s.thumb.backgroundColor,
          }}
        />
      </View>
    </FocusPressable>
  );
}

const styles = StyleSheet.create({
  hit: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  track: { justifyContent: "center" },
  state: { ...textStyle(typography.labelMd), color: dragonNightColors.textSecondary },
});
