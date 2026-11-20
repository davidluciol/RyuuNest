import { StyleSheet, View } from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import Button from "./Button";
import SheetModal from "./SheetModal";

/**
 * F96 — hoja «Guardar» de la ficha: elige **una** carpeta (Gemas, Favoritos o las del usuario) o
 * crea una nueva. La carpeta actual va marcada; sin guardar, la marcada es «Gemas», que es donde
 * se guarda por defecto. Reutiliza `SheetModal` y `Button`, igual que el menú «Mover» (F54).
 */

export interface SaveFolderOptionItem {
  id: string;
  name: string;
}

export interface SaveFolderSheetProps {
  visible: boolean;
  options: readonly SaveFolderOptionItem[];
  currentId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export default function SaveFolderSheet({
  visible,
  options,
  currentId,
  onSelect,
  onCreate,
  onClose,
}: SaveFolderSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("series.save.title")}
      onClose={onClose}
      testID="save-folder-sheet"
    >
      <View style={styles.list}>
        {options.map((option) => (
          <Button
            key={option.id}
            variant="secondary"
            label={
              option.id === currentId
                ? `${option.name} · ${t("library.series.menu.current")}`
                : option.name
            }
            onPress={() => onSelect(option.id)}
            testID={`save-folder-${option.id}`}
          />
        ))}
        <Button
          variant="secondary"
          label={t("series.save.newFolder")}
          onPress={onCreate}
          testID="save-folder-new"
        />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
});
