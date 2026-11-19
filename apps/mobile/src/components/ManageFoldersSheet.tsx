import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { Zap } from "../icons";
import { t } from "../i18n";
import type { LibraryFolder } from "../screens/library/libraryFixtures";
import Button from "./Button";
import SheetModal from "./SheetModal";
import { textStyle } from "./textStyle";

/**
 * F93 — hoja «Gestionar carpetas»: lista cada carpeta (nombre, nº de series y rayo si es
 * dinámica) con Editar y Eliminar. «Favoritos» (del sistema) sale sin acciones; «Gemas» es una
 * vista y no sale. Reutiliza `SheetModal` y `Button`; editar abre `NewFolderSheet` en modo
 * edición y eliminar pasa por `ConfirmSheet` (lo orquesta la pantalla).
 */

const colors = dragonNightColors;

export interface ManageFoldersSheetProps {
  visible: boolean;
  /** Carpetas a listar (sin «Gemas»). */
  folders: readonly LibraryFolder[];
  onEdit: (folder: LibraryFolder) => void;
  onDelete: (folder: LibraryFolder) => void;
  onClose: () => void;
}

export default function ManageFoldersSheet({
  visible,
  folders,
  onEdit,
  onDelete,
  onClose,
}: ManageFoldersSheetProps) {
  const hasUserFolders = folders.some((folder) => folder.kind === undefined);

  return (
    <SheetModal
      visible={visible}
      title={t("library.folder.manage.title")}
      onClose={onClose}
      testID="manage-folders-sheet"
    >
      {folders.map((folder) => {
        const system = folder.kind !== undefined;
        const dynamic = (folder.tags?.length ?? 0) > 0;
        return (
          <View key={folder.id} style={styles.row} testID={`manage-folder-${folder.id}`}>
            <View style={styles.info}>
              <View style={styles.nameLine}>
                <Text style={styles.name} numberOfLines={2}>
                  {folder.name}
                </Text>
                {dynamic ? (
                  <Zap
                    size={spacing.md}
                    color={colors.textSecondary}
                    accessibilityLabel={t("library.folder.dynamic")}
                    testID="manage-folder-dynamic"
                  />
                ) : null}
              </View>
              <Text style={styles.meta}>
                {system
                  ? t("library.folder.manage.system")
                  : t("library.folder.manage.count", { count: folder.count })}
              </Text>
            </View>
            {system ? null : (
              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  label={t("library.folder.manage.edit")}
                  accessibilityLabel={t("library.folder.manage.editA11y", { name: folder.name })}
                  onPress={() => onEdit(folder)}
                  testID={`manage-folder-edit-${folder.id}`}
                />
                <Button
                  variant="destructive"
                  label={t("library.folder.manage.delete")}
                  accessibilityLabel={t("library.folder.manage.deleteA11y", { name: folder.name })}
                  onPress={() => onDelete(folder)}
                  testID={`manage-folder-delete-${folder.id}`}
                />
              </View>
            )}
          </View>
        );
      })}
      {hasUserFolders ? null : (
        <Text style={styles.meta} testID="manage-folders-empty">
          {t("library.folder.manage.empty")}
        </Text>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  info: { gap: spacing.xs },
  nameLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { ...textStyle(typography.labelLg), color: colors.textPrimary, flexShrink: 1 },
  meta: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  actions: { flexDirection: "row", gap: spacing.sm },
});
