import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@ryuunest/ui-tokens";

import Badge from "./Badge";
import Button from "./Button";
import { moduleRowStyle, moduleRowTextColors } from "./moduleRowStyles";
import { textStyle } from "./textStyle";

/**
 * F16 — fila de módulo (RF-3 y RF-5): nombre, metadatos, hasta dos insignias
 * (V8/V9) y una sola acción (instalar o gestionar). El último error, si lo
 * hay, va en el color de error. Textos por props (F10); sin cortes con «…» en
 * el nombre (T7): hasta 2 líneas.
 */

export interface ModuleRowProps {
  name: string;
  /** «Manga · es · v1.0.0». */
  meta: string;
  /** Etiquetas ya traducidas; el tope de señales lo aplica quien las calcula. */
  badges?: readonly string[];
  /** Último error del módulo (RF-5). */
  error?: string;
  actionLabel: string;
  actionVariant?: "primary" | "secondary";
  onAction?: () => void;
  testID?: string;
}

export default function ModuleRow({
  name,
  meta,
  badges = [],
  error,
  actionLabel,
  actionVariant = "secondary",
  onAction,
  testID,
}: ModuleRowProps) {
  const text = moduleRowTextColors();
  return (
    <View testID={testID} style={[moduleRowStyle(), styles.row]}>
      <View style={styles.texts}>
        <Text style={[styles.name, { color: text.name }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.meta, { color: text.meta }]}>{meta}</Text>
        {badges.length > 0 ? (
          <View style={styles.badges}>
            {badges.map((label) => (
              <Badge key={label} label={label} />
            ))}
          </View>
        ) : null}
        {error ? <Text style={[styles.meta, { color: text.error }]}>{error}</Text> : null}
      </View>
      <Button variant={actionVariant} label={actionLabel} onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  texts: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { ...textStyle(typography.labelLg), fontWeight: "700" },
  meta: { ...textStyle(typography.bodySm) },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
