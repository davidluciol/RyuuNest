import FocusPressable from "./FocusPressable";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { spacing, typography, dragonNightColors } from "@ryuunest/ui-tokens";

import { settingsRowLayout, settingsRowStyle } from "./sheetStyles";
import { textStyle } from "./textStyle";

/**
 * F07 — fila de ajustes: etiqueta a la izquierda y control/valor a la derecha
 * (interruptor, valor, cheurón…). Alto mínimo 56, relleno horizontal 16; bajo
 * 400 dp el control se apila bajo el texto (F34.2).
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
  const { width } = useWindowDimensions();
  const stacked = settingsRowLayout(width) === "stacked";
  const texts = (
    <View style={[styles.textBlock, stacked ? styles.textBlockStacked : null]}>
      <Text style={styles.label}>{label}</Text>
      {hint ? (
        <Text style={hintTone === "warning" ? styles.hintWarning : styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
  const row = (
    <View style={[styles.row, stacked ? styles.rowStacked : null]}>
      {texts}
      {right ? <View style={stacked ? styles.rightStacked : null}>{right}</View> : null}
    </View>
  );
  // Con `onPress` la fila entera es el botón (el chevrón cuenta como área
  // táctil, F34.2). Esa fila no lleva un control interactivo dentro; si lo
  // llevara (interruptor, botón) anidaría un botón en otro en web.
  return onPress === undefined ? (
    <View style={settingsRowStyle()}>{row}</View>
  ) : (
    <FocusPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={settingsRowStyle()}
    >
      {row}
    </FocusPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  rowStacked: { flexDirection: "column", alignItems: "flex-start", paddingVertical: spacing.sm },
  textBlockStacked: { flex: 0, alignSelf: "stretch" },
  rightStacked: { alignSelf: "stretch", alignItems: "flex-start" },
  textBlock: { flex: 1, minWidth: 0, gap: spacing.xxs },
  label: { ...textStyle(typography.bodyLg), color: colors.textPrimary },
  hint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  hintWarning: { ...textStyle(typography.bodySm), color: colors.progress },
});
