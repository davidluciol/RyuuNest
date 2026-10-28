import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { settingsRowStyle } from "./sheetStyles";
import { textStyle } from "./textStyle";

/**
 * F07 — fila de ajustes: etiqueta a la izquierda y control/valor a la derecha
 * (interruptor, valor, cheurón…). Alto mínimo, relleno horizontal 16.
 */

const colors = dragonNightColors;

export interface SettingsRowProps {
  label: string;
  /** Valor o descripción secundaria bajo la etiqueta. */
  hint?: string;
  /** F16b: tono del texto secundario; `warning` resalta avisos de la fila. */
  hintTone?: "default" | "warning";
  /** Control de la derecha (interruptor, valor, icono…). */
  right?: React.ReactNode;
  onPress?: () => void;
}

export default function SettingsRow({
  label,
  hint,
  hintTone = "default",
  right,
  onPress,
}: SettingsRowProps) {
  const texts = (
    <View style={styles.textBlock}>
      <Text style={styles.label}>{label}</Text>
      {hint ? (
        <Text style={hintTone === "warning" ? styles.hintWarning : styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
  return (
    // La fila no puede ser un botón: el control de la derecha (interruptor,
    // botón) anidaría en web un botón dentro de otro (HTML inválido). Solo el
    // bloque de textos es pulsable cuando hay `onPress`.
    <View style={settingsRowStyle()}>
      <View style={styles.row}>
        {onPress === undefined ? (
          texts
        ) : (
          <Pressable accessibilityRole="button" onPress={onPress} style={styles.textPress}>
            {texts}
          </Pressable>
        )}
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  textPress: { flex: 1, minWidth: 0 },
  textBlock: { flex: 1, minWidth: 0, gap: spacing.xxs },
  label: { ...textStyle(typography.bodyLg), color: colors.textPrimary },
  hint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  hintWarning: { ...textStyle(typography.bodySm), color: colors.progress },
});
