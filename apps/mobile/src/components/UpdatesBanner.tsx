import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, radii, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { ChevronRight } from "../icons";
import { t } from "../i18n";
import FocusPressable from "./FocusPressable";
import { textStyle } from "./textStyle";

/**
 * F99 — aviso «Hay N actualizaciones» fuera de Portales. Neutro (V1: el ámbar y
 * el esmeralda no son para avisos de actualización) y con «Ver» como enlace
 * secundario en `textPrimary` con chevron. No actualiza nada: solo lleva a Portales.
 */

const colors = dragonNightColors;

export interface UpdatesBannerProps {
  count: number;
  onView?: () => void;
  testID?: string;
}

export default function UpdatesBanner({ count, onView, testID }: UpdatesBannerProps) {
  return (
    <View style={styles.banner} testID={testID} accessibilityRole="summary">
      <Text style={styles.text}>
        {count === 1
          ? t("sources.updates.banner.one")
          : t("sources.updates.banner.other", { count })}
      </Text>
      <FocusPressable
        accessibilityRole="button"
        accessibilityLabel={t("sources.updates.banner.view")}
        onPress={onView}
        style={styles.action}
      >
        <Text style={styles.actionText}>{t("sources.updates.banner.view")}</Text>
        <ChevronRight size={spacing.md} color={colors.textPrimary} />
      </FocusPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  text: {
    ...textStyle(typography.bodyLg),
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...textStyle(typography.labelLg),
    color: colors.textPrimary,
  },
});
