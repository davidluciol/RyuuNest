import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, withAlpha } from "@ryuunest/ui-tokens";

import { Check, ChevronDown, Layers } from "../icons";
import { t } from "../i18n";
import Button from "./Button";
import Sheet from "./Sheet";
import { modulePickerRowStyle, modulePickerRowTextStyle, modulePickerTitleStyle } from "./modulePickerStyles";
import { textStyle } from "./textStyle";

/**
 * F15 — selector de módulo de Descubrir (RF-9): botón con el módulo activo y
 * hoja inferior de nivel 2 (SPEC §11.5) con los módulos visibles. Las opciones
 * llegan ya filtradas por NSFW (RF-35) — la pantalla decide quién aparece.
 * Reutilizable (Regla 3): la hoja de fuentes (F16) puede montar lo mismo.
 */

const colors = dragonNightColors;

export interface ModulePickerOption {
  id: string;
  /** Nombre visible del módulo (viene del manifiesto; no es copy de la app). */
  name: string;
}

export interface ModulePickerProps {
  modules: readonly ModulePickerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ModulePicker({ modules, selectedId, onSelect }: ModulePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = modules.find((module) => module.id === selectedId);
  const rowStyle = modulePickerRowStyle();
  const titleStyle = modulePickerTitleStyle();
  const rowTextStyle = modulePickerRowTextStyle();

  return (
    <View testID="module-picker">
      <Button
        variant="secondary"
        label={selected?.name ?? ""}
        icon={<Layers size={spacing.md} color={colors.accent} />}
        trailingIcon={<ChevronDown size={16} color={colors.textSecondary} />}
        accessibilityLabel={t("discover.selector.open")}
        onPress={() => setOpen(true)}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel={t("discover.sheet.close")}
          onPress={() => setOpen(false)}
        >
          {/* Pressable vacío: traga el toque del contenido y no cierra la hoja. */}
          <Pressable>
            <Sheet>
              <Text
                style={[styles.sheetTitle, textStyle(titleStyle), { color: titleStyle.color }]}
              >
                {t("discover.sheet.title")}
              </Text>
              <ScrollView style={styles.sheetList}>
                {modules.map((module) => (
                  <Pressable
                    key={module.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: module.id === selectedId }}
                    testID={`module-option-${module.id}`}
                    style={[styles.row, rowStyle]}
                    onPress={() => {
                      onSelect(module.id);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.rowText, textStyle(rowTextStyle), { color: rowTextStyle.color }]}
                      numberOfLines={1}
                    >
                      {module.name}
                    </Text>
                    {module.id === selectedId ? (
                      <Check size={spacing.md} color={colors.accent} />
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            </Sheet>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha(colors.bg, 0.64), // velo sobre el contenido
    justifyContent: "flex-end",
  },
  sheetTitle: {
    marginBottom: spacing.xs,
  },
  sheetList: {
    maxHeight: spacing.xl * 8, // la hoja no crece más que la pantalla
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
});
