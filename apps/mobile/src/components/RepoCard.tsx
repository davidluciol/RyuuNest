import Button from "./Button";
import FocusPressable from "./FocusPressable";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { Network, RefreshCw } from "../icons";
import { repoCardStyle, repoCardTextColors, repoSyncButtonStyle } from "./repoCardStyles";
import { textStyle } from "./textStyle";

/**
 * F16 — tarjeta de repositorio (RF-3): icono, nombre, URL y botón de
 * sincronizar. Plana, sin brillos (V11). Los textos llegan por props (F10).
 * V7: «Quitar» es un botón visible en la tarjeta (`onRemove`); sincronizar, el icono.
 */

const colors = dragonNightColors;

export interface RepoCardProps {
  name: string;
  url: string;
  /** Línea secundaria, p. ej. «Módulos: 6». */
  meta?: string;
  syncLabel: string;
  syncing?: boolean;
  onSync?: () => void;
  /** Texto visible de quitar, p. ej. «Quitar». */
  removeLabel?: string;
  onRemove?: () => void;
  /** Nombre accesible de quitar, p. ej. «Quitar repositorio». */
  removeAccessibilityLabel?: string;
}

export default function RepoCard({
  name,
  url,
  meta,
  syncLabel,
  syncing = false,
  onSync,
  removeLabel,
  onRemove,
  removeAccessibilityLabel,
}: RepoCardProps) {
  const text = repoCardTextColors();
  return (
    <View style={[repoCardStyle(), styles.card]}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Network size={spacing.md + spacing.xxs} color={colors.accent} />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.name, { color: text.name }]} numberOfLines={2}>
            {name}
          </Text>
          <Text style={[styles.url, { color: text.url }]}>{url}</Text>
          {meta ? <Text style={[styles.url, { color: text.url }]}>{meta}</Text> : null}
        </View>
      </View>
      <FocusPressable
        accessibilityRole="button"
        accessibilityLabel={syncLabel}
        accessibilityState={{ busy: syncing, disabled: syncing }}
        disabled={syncing}
        onPress={onSync}
        style={[repoSyncButtonStyle(), styles.sync, syncing && styles.syncing]}
      >
        <RefreshCw size={spacing.md + spacing.xxs} color={colors.textSecondary} />
      </FocusPressable>
      {removeLabel !== undefined ? (
        <Button
          variant="secondary"
          label={removeLabel}
          accessibilityLabel={removeAccessibilityLabel}
          onPress={onRemove}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  body: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { ...textStyle(typography.labelLg) },
  url: { ...textStyle(typography.bodySm) },
  sync: { alignItems: "center", justifyContent: "center" },
  syncing: { opacity: 0.5 },
});
