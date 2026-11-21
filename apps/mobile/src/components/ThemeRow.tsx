import { Text, View } from "react-native";
import { activeColors, radii, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";
import type { Theme } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import Button from "./Button";
import FocusPressable from "./FocusPressable";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * F90/F91 — fila del selector de temas: nombre, vista previa con los colores del
 * propio tema (no los del tema activo) y, si es importado, botón para borrarlo.
 * Seleccionar aplica el tema al instante.
 */

const SWATCH_KEYS = ["bg", "surface", "accent", "progress", "textPrimary"] as const;
const SWATCH = spacing.md;

export interface ThemeRowProps {
  theme: Theme;
  selected?: boolean;
  /** Los importados se pueden borrar; los integrados no. */
  imported?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  testID?: string;
}

/** Puntos de color del tema: sirven de vista previa en la fila y en la hoja de confirmación. */
export function ThemeSwatches({ theme }: { theme: Theme }) {
  return (
    <View style={styles.swatches} accessibilityElementsHidden importantForAccessibility="no">
      {SWATCH_KEYS.map((key) => (
        <View
          key={key}
          style={[
            styles.swatch,
            { backgroundColor: theme.colors[key], borderColor: theme.colors.border },
          ]}
        />
      ))}
    </View>
  );
}

export default function ThemeRow({
  theme,
  selected = false,
  imported = false,
  disabled = false,
  onSelect,
  onDelete,
  testID,
}: ThemeRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <FocusPressable
        accessibilityRole="radio"
        accessibilityLabel={t("settings.themes.selectA11y", { name: theme.name })}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={onSelect}
        style={({ pressed }) => [
          styles.pick,
          selected ? styles.pickSelected : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {theme.name}
          </Text>
          <Text style={styles.tag}>
            {selected ? t("settings.themes.inUse") : imported ? t("settings.themes.imported") : ""}
          </Text>
        </View>
        <ThemeSwatches theme={theme} />
      </FocusPressable>
      {imported ? (
        <Button
          variant="secondary"
          label={t("settings.themes.deleteAction")}
          accessibilityLabel={t("settings.themes.deleteA11y", { name: theme.name })}
          disabled={disabled}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  texts: { flex: 1, gap: spacing.xxs },
  swatches: { flexDirection: "row", gap: spacing.xxs },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: radii.pill, borderWidth: 1 },
  pressed: { opacity: 0.8 },
  pick: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: activeColors.border,
    backgroundColor: activeColors.surface,
  },
  pickSelected: { borderColor: activeColors.accent, backgroundColor: activeColors.badgeBg },
  name: { ...textStyle(typography.labelLg), color: activeColors.textPrimary },
  tag: { ...textStyle(typography.labelMd), color: activeColors.textSecondary },
}));
