import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, type LucideIcon } from "../icons";
import { spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import {
  sectionHeaderColors,
  sectionHeaderStyle,
} from "./sectionHeaderStyles";
import { textStyle } from "./textStyle";

/**
 * F13 — encabezado de sección (SPEC §11.10, `DESIGN_RULES.md` V1/V4): icono
 * opcional a la izquierda en `text-secondary`, título en `title-lg` y acción
 * secundaria a la derecha ("Ver todas" en `text-primary` con chevron). Sin
 * `accent` en el título ni en la acción (V1). Área táctil mínima de 48 dp
 * cuando hay acción (RNF-7).
 */

export interface SectionHeaderProps {
  /** Título de la sección (p. ej. «Continuar la Aventura»). */
  title: string;
  /** Icono Lucide opcional a la izquierda del título. */
  icon?: LucideIcon;
  /** Etiqueta de la acción secundaria (p. ej. «Ver todas»). */
  actionLabel?: string;
  /** Callback al pulsar la acción secundaria. */
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  icon: Icon,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const colors = sectionHeaderColors();
  const shape = sectionHeaderStyle();
  return (
    <View style={[styles.container, shape]}>
      <View style={styles.left}>
        {Icon ? <Icon size={spacing.lg} color={colors.icon} /> : null}
        <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={[styles.actionText, { color: colors.action }]}>{actionLabel}</Text>
          <ChevronRight size={16} color={colors.action} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...textStyle(typography.titleLg),
    flexShrink: 1,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: touchTarget.min,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    ...textStyle(typography.labelMd),
  },
});
