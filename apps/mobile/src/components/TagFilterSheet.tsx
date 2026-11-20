import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { Check, ChevronDown, ChevronUp } from "../icons";
import {
  toggleFilterValue,
  type DiscoverFilter,
  type DiscoverFilterValues,
} from "../screens/discover/discoverFixtures";
import Button from "./Button";
import { checkboxStyle, radioStyle } from "./fieldStyles";
import FocusPressable from "./FocusPressable";
import SheetModal from "./SheetModal";
import { textStyle } from "./textStyle";

/**
 * F50 + F87 — hoja de filtros de Descubrir: un desplegable por cada filtro que declara el
 * módulo (`filters()`), cerrado al abrir la hoja y con el número de opciones activas en su
 * cabecera. Dentro, una fila por opción con casilla en `tags`/`multi` (varias) o radio en
 * `select` (una). Controlada: cada fila cambia la selección al instante; «Limpiar» la vacía
 * y «Listo» cierra. Reutiliza `SheetModal`, `Button` y los estilos de `Checkbox`.
 */

const colors = dragonNightColors;

export interface TagFilterSheetProps {
  visible: boolean;
  groups: readonly DiscoverFilter[];
  selected: DiscoverFilterValues;
  onChange: (next: DiscoverFilterValues) => void;
  onClose: () => void;
}

export default function TagFilterSheet({
  visible,
  groups,
  selected,
  onChange,
  onClose,
}: TagFilterSheetProps) {
  const [open, setOpen] = useState<readonly string[]>([]);

  return (
    <SheetModal
      visible={visible}
      title={t("discover.filter.sheet.title")}
      onClose={onClose}
      testID="tag-filter-sheet"
      footer={
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t("discover.filter.sheet.clear")}
            onPress={() => onChange({})}
            testID="tag-filter-clear"
          />
          <Button
            label={t("discover.filter.sheet.done")}
            onPress={onClose}
            testID="tag-filter-done"
          />
        </View>
      }
    >
      {groups.map((group) => {
        const expanded = open.includes(group.id);
        const active = selected[group.id]?.length ?? 0;
        const Chevron = expanded ? ChevronUp : ChevronDown;
        return (
          <View key={group.id}>
            <FocusPressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              aria-expanded={expanded}
              accessibilityLabel={
                active > 0
                  ? t("discover.filter.sheet.groupCount", { label: group.label, count: active })
                  : group.label
              }
              onPress={() =>
                setOpen(expanded ? open.filter((id) => id !== group.id) : [...open, group.id])
              }
              style={styles.row}
              testID={`tag-filter-toggle-${group.id}`}
            >
              <Text style={styles.label}>{group.label}</Text>
              {active > 0 ? <Text style={styles.count}>{active}</Text> : null}
              <Chevron size={20} color={colors.textSecondary} />
            </FocusPressable>
            {expanded ? (
              <View testID={`tag-filter-group-${group.id}`}>
                {group.options.map((option) => {
                  const checked = (selected[group.id] ?? []).includes(option.value);
                  return (
                    <FocusPressable
                      key={option.value}
                      accessibilityRole={group.multi ? "checkbox" : "radio"}
                      accessibilityState={{ checked }}
                      aria-checked={checked}
                      onPress={() =>
                        onChange(toggleFilterValue(selected, group.id, option.value, group.multi))
                      }
                      style={styles.row}
                      testID={`tag-filter-option-${group.id}-${option.value}`}
                    >
                      <View
                        style={[
                          group.multi ? checkboxStyle(checked) : radioStyle(checked),
                          styles.box,
                        ]}
                      >
                        {checked ? <Check size={14} color={colors.bg} strokeWidth={3} /> : null}
                      </View>
                      <Text style={styles.option}>{option.label}</Text>
                    </FocusPressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: { ...textStyle(typography.labelLg), color: colors.textPrimary, flex: 1 },
  count: { ...textStyle(typography.labelSm), color: colors.accent },
  box: { alignItems: "center", justifyContent: "center" },
  option: { ...textStyle(typography.bodyMd), color: colors.textPrimary, flex: 1 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
