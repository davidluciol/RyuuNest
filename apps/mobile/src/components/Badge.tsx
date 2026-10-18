import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "@ryuunest/ui-tokens";

import { badgeColors, badgeStyle } from "./badgeStyles";

/**
 * F06 — insignia de tipo/estado (SPEC §11.10): pill de 24 px, **neutra**
 * (fondo `elevated`, texto `text-secondary`) según `DESIGN_RULES.md` V1. No es
 * interactiva. Props tipadas; todo desde `ui-tokens`.
 */

export interface BadgeProps {
  label: string;
}

export default function Badge({ label }: BadgeProps) {
  const colors = badgeColors();
  return (
    <View style={[badgeStyle(), styles.content]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: typography.labelSm.fontSize,
    lineHeight: typography.labelSm.lineHeight,
    fontWeight: "600",
  },
});
