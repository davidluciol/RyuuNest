import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import type { LibraryFolder } from "../screens/library/libraryFixtures";
import Button from "./Button";
import SheetModal from "./SheetModal";

/**
 * F54 — menú de una serie de Tesoros (pulsación larga o «⋮»): Mover, Mover y crear, Añadir a
 * favoritos y Eliminar. «Mover» enseña las carpetas (no «Gemas», que es una vista); la serie
 * queda en una sola (D-12). Reutiliza `SheetModal` y `Button`.
 */

export interface SeriesMenuSheetProps {
  visible: boolean;
  /** Título de la serie: cabecera de la hoja. */
  title: string;
  /** Carpetas del usuario y «Favoritos» (sin «Gemas»), a las que se puede mover. */
  folders: readonly LibraryFolder[];
  /** Carpeta actual de la serie (`null` = ninguna). */
  currentFolderId: string | null;
  /** La serie ya está en «Favoritos»: se oculta «Añadir a favoritos». */
  inFavorites: boolean;
  onMove: (folderId: string) => void;
  onMoveAndCreate: () => void;
  onAddToFavorites: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function SeriesMenuSheet({
  visible,
  title,
  folders,
  currentFolderId,
  inFavorites,
  onMove,
  onMoveAndCreate,
  onAddToFavorites,
  onRemove,
  onClose,
}: SeriesMenuSheetProps) {
  const [picking, setPicking] = useState(false);
  const close = () => {
    setPicking(false);
    onClose();
  };

  return (
    <SheetModal
      visible={visible}
      title={picking ? t("library.series.menu.moveTitle") : title}
      onClose={close}
      testID="series-menu"
    >
      {picking ? (
        <View style={styles.list}>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="secondary"
              label={
                folder.id === currentFolderId
                  ? `${folder.name} · ${t("library.series.menu.current")}`
                  : folder.name
              }
              disabled={folder.id === currentFolderId}
              onPress={() => {
                setPicking(false);
                onMove(folder.id);
              }}
              testID={`series-menu-folder-${folder.id}`}
            />
          ))}
          <Button
            variant="secondary"
            label={t("library.series.menu.back")}
            onPress={() => setPicking(false)}
            testID="series-menu-back"
          />
        </View>
      ) : (
        <View style={styles.list}>
          <Button
            variant="secondary"
            label={t("library.series.menu.move")}
            onPress={() => setPicking(true)}
            testID="series-menu-move"
          />
          <Button
            variant="secondary"
            label={t("library.series.menu.moveAndCreate")}
            onPress={onMoveAndCreate}
            testID="series-menu-move-create"
          />
          {inFavorites ? null : (
            <Button
              variant="secondary"
              label={t("library.series.menu.addFavorite")}
              onPress={onAddToFavorites}
              testID="series-menu-favorite"
            />
          )}
          <Button
            variant="destructive"
            label={t("library.series.menu.remove")}
            onPress={onRemove}
            testID="series-menu-remove"
          />
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
});
