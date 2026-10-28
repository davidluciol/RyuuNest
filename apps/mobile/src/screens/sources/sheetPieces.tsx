import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";

/**
 * F16/F12 — piezas compartidas de las hojas de Fuentes: fila de datos
 * (etiqueta/valor), aviso de error y etiqueta del runtime. Las usan las hojas
 * de gestión de Fuentes y la hoja de instalación, que también monta el primer
 * uso (F12) con la misma confirmación (AC-8).
 */

const colors = dragonNightColors;

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function SheetError({ message }: { message: string | null }) {
  return message === null ? null : (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

export function runtimeLabel(runtime: "declarative" | "script"): string {
  return t(runtime === "script" ? "sources.runtime.script" : "sources.runtime.declarative");
}

const styles = StyleSheet.create({
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  detail: { gap: spacing.xxs },
  detailLabel: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  detailValue: { ...textStyle(typography.bodyMd), color: colors.textPrimary },
});
