import { StyleSheet, View } from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { LIBRARY_ORDERS, type LibraryFilters } from "../screens/library/libraryFixtures";
import Chip from "./Chip";
import SheetModal from "./SheetModal";

/**
 * F58 — menú de orden de Tesoros (RF-28): una hoja con los tres órdenes y el actual marcado.
 * Al elegir uno se aplica y se cierra. Reutiliza `SheetModal` y `Chip`.
 */

/** Claves de traducción de cada orden. */
export const ORDER_KEYS: Record<LibraryFilters["order"], string> = {
  name: "library.sort.name",
  lastRead: "library.sort.lastRead",
  addedAt: "library.sort.addedAt",
};

export interface SortSheetProps {
  visible: boolean;
  order: LibraryFilters["order"];
  onSelect: (order: LibraryFilters["order"]) => void;
  onClose: () => void;
}

export default function SortSheet({ visible, order, onSelect, onClose }: SortSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("library.sort.sheet.title")}
      onClose={onClose}
      testID="sort-sheet"
    >
      <View style={styles.list}>
        {LIBRARY_ORDERS.map((option) => (
          <Chip
            key={option}
            label={t(ORDER_KEYS[option])}
            selected={option === order}
            onPress={() => onSelect(option)}
          />
        ))}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
