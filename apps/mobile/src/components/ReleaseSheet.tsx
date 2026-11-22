import { StyleSheet, View } from "react-native";
import type { Release } from "@ryuunest/core";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { releaseLabel } from "../screens/series/seriesLogic";
import Chip from "./Chip";
import SheetModal from "./SheetModal";

/**
 * F17 — selector de release de un capítulo (mismo patrón que `SortSheet`): un chip por release y
 * la actual marcada. Al elegir, quien la abre la guarda para toda la serie y la cierra.
 */
export interface ReleaseSheetProps {
  visible: boolean;
  releases: readonly Release[];
  currentId: string | null;
  onSelect: (release: Release) => void;
  onClose: () => void;
}

export default function ReleaseSheet({
  visible,
  releases,
  currentId,
  onSelect,
  onClose,
}: ReleaseSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("series.release.sheet.title")}
      onClose={onClose}
      testID="release-sheet"
    >
      <View style={styles.list}>
        {releases.map((release) => (
          <Chip
            key={release.id}
            label={releaseLabel(release)}
            selected={release.id === currentId}
            onPress={() => onSelect(release)}
          />
        ))}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
