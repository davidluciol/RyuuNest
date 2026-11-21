import { Text, View } from "react-native";
import { activeColors, spacing, typography } from "@ryuunest/ui-tokens";
import type { MediaKind } from "@ryuunest/core";

import { t } from "../i18n";
import {
  toggleItem,
  type LibraryFilters,
  type LibrarySource,
} from "../screens/library/libraryFixtures";
import Button from "./Button";
import Chip from "./Chip";
import { kindLabel } from "./kindLabel";
import SheetModal from "./SheetModal";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * F57 — hoja de filtros de Tesoros (RF-27): tipo, fuente y NSFW. Controlada: cada chip aplica
 * el filtro al instante; «Limpiar» vacía tipo y fuente (el NSFW es una preferencia y se
 * respeta) y «Listo» cierra. Reutiliza `SheetModal`, `Chip` y `Button`.
 */

const colors = activeColors;

/** Tipos de obra (D-13), en el orden en que se muestran. */
const KINDS: readonly MediaKind[] = ["manga", "manhwa", "manhua", "comic"];

type FilterPatch = Partial<Pick<LibraryFilters, "kinds" | "moduleIds" | "nsfwVisible">>;

export interface FilterSheetProps {
  visible: boolean;
  kinds: readonly MediaKind[];
  moduleIds: readonly string[];
  nsfwVisible: boolean;
  /** Fuentes de las series guardadas, con su nombre visible. */
  sources: readonly LibrarySource[];
  onChange: (patch: FilterPatch) => void;
  onClose: () => void;
}

export default function FilterSheet({
  visible,
  kinds,
  moduleIds,
  nsfwVisible,
  sources,
  onChange,
  onClose,
}: FilterSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("library.filter.sheet.title")}
      onClose={onClose}
      testID="filter-sheet"
    >
      <Text style={styles.label}>{t("library.filter.sheet.kinds")}</Text>
      <View style={styles.chips} testID="filter-sheet-kinds">
        {KINDS.map((kind) => (
          <Chip
            key={kind}
            label={kindLabel(kind)}
            selected={kinds.includes(kind)}
            onPress={() => onChange({ kinds: toggleItem(kinds, kind) })}
          />
        ))}
      </View>

      <Text style={styles.label}>{t("library.filter.sheet.sources")}</Text>
      {sources.length === 0 ? (
        <Text style={styles.hint}>{t("library.filter.sheet.noSources")}</Text>
      ) : (
        <View style={styles.chips} testID="filter-sheet-sources">
          {sources.map((source) => (
            <Chip
              key={source.id}
              label={source.name}
              selected={moduleIds.includes(source.id)}
              onPress={() => onChange({ moduleIds: toggleItem(moduleIds, source.id) })}
            />
          ))}
        </View>
      )}

      <View style={styles.chips}>
        <Chip
          label={t("library.filter.sheet.nsfw")}
          selected={nsfwVisible}
          onPress={() => onChange({ nsfwVisible: !nsfwVisible })}
        />
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label={t("library.filter.sheet.clear")}
          onPress={() => onChange({ kinds: [], moduleIds: [] })}
          testID="filter-sheet-clear"
        />
        <Button
          label={t("library.filter.sheet.done")}
          onPress={onClose}
          testID="filter-sheet-done"
        />
      </View>
    </SheetModal>
  );
}

const styles = themedStyles(() => ({
  label: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  hint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
}));
