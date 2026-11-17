import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import {
  toggleFilterValue,
  type DiscoverFilter,
  type DiscoverFilterValues,
} from "../screens/discover/discoverFixtures";
import Button from "./Button";
import Chip from "./Chip";
import SheetModal from "./SheetModal";
import { textStyle } from "./textStyle";

/**
 * F50 — hoja de filtros por etiquetas de Descubrir: un grupo de chips por cada filtro
 * que declara el módulo (`filters()`): multiselección en `tags`/`multi`, elección única en `select`. Controlada: cada chip cambia la
 * selección al instante; «Limpiar» la vacía y «Listo» cierra. Reutiliza `SheetModal`,
 * `Chip` y `Button`.
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
  return (
    <SheetModal
      visible={visible}
      title={t("discover.filter.sheet.title")}
      onClose={onClose}
      testID="tag-filter-sheet"
    >
      {groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.label}>{group.label}</Text>
          <View style={styles.chips} testID={`tag-filter-group-${group.id}`}>
            {group.options.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={(selected[group.id] ?? []).includes(option.value)}
                onPress={() => onChange(toggleFilterValue(selected, group.id, option.value, group.multi))}
              />
            ))}
          </View>
        </View>
      ))}

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
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
