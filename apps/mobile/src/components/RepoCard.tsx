import { Pressable, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { Network, RefreshCw } from "../icons";
import { repoCardStyle, repoCardTextColors, repoSyncButtonStyle } from "./repoCardStyles";
import { textStyle } from "./textStyle";

/**
 * F16 — tarjeta de repositorio (RF-3): icono, nombre, URL y botón de
 * sincronizar. Plana, sin brillos (V11). Los textos llegan por props (F10).
 * `onPress` abre la acción de quitar; sincronizar es el botón de la derecha.
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
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function RepoCard({
  name,
  url,
  meta,
  syncLabel,
  syncing = false,
  onSync,
  onPress,
  accessibilityLabel,
}: RepoCardProps) {
  const text = repoCardTextColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      onPress={onPress}
      style={[repoCardStyle(), styles.card]}
    >
      <View style={styles.icon}>
        <Network size={spacing.md + spacing.xxs} color={colors.accent} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.name, { color: text.name }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.url, { color: text.url }]} numberOfLines={2}>
          {url}
        </Text>
        {meta ? <Text style={[styles.url, { color: text.url }]}>{meta}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={syncLabel}
        accessibilityState={{ busy: syncing, disabled: syncing }}
        disabled={syncing}
        onPress={onSync}
        style={[repoSyncButtonStyle(), styles.sync, syncing && styles.syncing]}
      >
        <RefreshCw size={spacing.md + spacing.xxs} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { ...textStyle(typography.labelLg), fontWeight: "700" },
  url: { ...textStyle(typography.bodySm) },
  sync: { alignItems: "center", justifyContent: "center" },
  syncing: { opacity: 0.5 },
});
