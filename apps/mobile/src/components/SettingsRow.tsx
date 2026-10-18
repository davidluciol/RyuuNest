import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { settingsRowStyle } from "./sheetStyles";

/**
 * F07 — fila de ajustes: etiqueta a la izquierda y control/valor a la derecha
 * (interruptor, valor, cheurón…). Alto mínimo, relleno horizontal 16.
 */

const colors = dragonNightColors;

export interface SettingsRowProps {
  label: string;
  /** Valor o descripción secundaria bajo la etiqueta. */
  hint?: string;
  /** Control de la derecha (interruptor, valor, icono…). */
  right?: React.ReactNode;
  onPress?: () => void;
}

export default function SettingsRow({ label, hint, right, onPress }: SettingsRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={settingsRowStyle()}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  textBlock: { flex: 1, gap: spacing.xxs },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    lineHeight: typography.bodyLg.lineHeight,
  },
  hint: {
    color: colors.textSecondary,
    fontFamily: typography.bodySm.fontFamily,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
});
