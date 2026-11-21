import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import Badge from "./Badge";
import Button from "./Button";
import { TriangleAlert } from "../icons";
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
  /** F42/N9: permisos ya traducidos («Ejecuta código», «Para adultos»), con icono de aviso. */
  permissions?: readonly string[];
  /** Último error del módulo (RF-5). */
  error?: string;
  /** F21: texto secundario bajo los metadatos (p. ej. «Instálalo desde Fuentes»). */
  hint?: string;
  /** Sin etiqueta no hay botón (p. ej. módulo no compatible, F61). */
  actionLabel?: string;
  actionVariant?: "primary" | "secondary";
  onAction?: () => void;
  /** La acción no aplica (p. ej. recomendado ya añadido). */
  actionDisabled?: boolean;
  testID?: string;
}

export default function ModuleRow({
  name,
  meta,
  badges = [],
  permissions = [],
  error,
  hint,
  actionLabel,
  actionVariant = "secondary",
  onAction,
  actionDisabled = false,
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
        {hint ? <Text style={[styles.meta, { color: text.meta }]}>{hint}</Text> : null}
        {badges.length > 0 ? (
          <View style={styles.badges}>
            {badges.map((label) => (
              <Badge key={label} label={label} />
            ))}
          </View>
        ) : null}
        {permissions.length > 0 ? (
          <View
            style={styles.permissions}
            testID={testID === undefined ? undefined : `${testID}-permissions`}
          >
            {permissions.map((label) => (
              <View key={label} style={styles.permission}>
                <TriangleAlert size={spacing.sm} color={dragonNightColors.progress} />
                <Text style={[styles.meta, { color: text.meta }]}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {error ? <Text style={[styles.meta, { color: text.error }]}>{error}</Text> : null}
      </View>
      {actionLabel === undefined ? null : (
        <Button
          variant={actionVariant}
          label={actionLabel}
          onPress={onAction}
          disabled={actionDisabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  texts: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { ...textStyle(typography.labelLg) },
  meta: { ...textStyle(typography.bodySm) },
  permissions: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm },
  permission: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
