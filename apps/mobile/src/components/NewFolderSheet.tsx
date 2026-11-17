import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { t } from "../i18n";
import { validateFolderName, type FolderNameProblem } from "../screens/library/libraryFixtures";
import Button from "./Button";
import Chip from "./Chip";
import SheetModal from "./SheetModal";
import TextField from "./TextField";
import { textStyle } from "./textStyle";

/**
 * F53 — hoja «Nueva carpeta»: nombre (obligatorio, sin repetir) y etiquetas opcionales (se
 * eligen entre las de las series guardadas). Con etiquetas la carpeta es **inteligente**:
 * muestra siempre las series que las tengan. Reutiliza `SheetModal`, `TextField` y `Chip`.
 */

const colors = dragonNightColors;

const PROBLEM_KEYS: Record<FolderNameProblem | "FAILED", string> = {
  EMPTY: "library.folder.new.error.empty",
  DUPLICATE: "library.folder.new.error.duplicate",
  FAILED: "library.folder.new.error.failed",
};

export interface NewFolderSheetProps {
  visible: boolean;
  /** Nombres de carpeta ya usados (para avisar de repetidos antes de enviar). */
  existingNames: readonly string[];
  /** Etiquetas entre las que elegir (las de las series guardadas). */
  availableTags: readonly string[];
  /** Crea la carpeta; si lanza o devuelve un problema, la hoja lo muestra y sigue abierta. */
  onSubmit: (name: string, tags: string[]) => Promise<FolderNameProblem | null>;
  onClose: () => void;
}

export default function NewFolderSheet({
  visible,
  existingNames,
  availableTags,
  onSubmit,
  onClose,
}: NewFolderSheetProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [problem, setProblem] = useState<FolderNameProblem | "FAILED" | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setName("");
    setTags([]);
    setProblem(null);
    onClose();
  };

  const submit = async () => {
    const invalid = validateFolderName(name, existingNames);
    if (invalid !== null) {
      setProblem(invalid);
      return;
    }
    setBusy(true);
    try {
      const rejected = await onSubmit(name.trim(), tags);
      if (rejected === null) close();
      else setProblem(rejected);
    } catch {
      setProblem("FAILED");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((other) => other !== tag) : [...current, tag],
    );

  return (
    <SheetModal
      visible={visible}
      title={t("library.folder.new.title")}
      onClose={close}
      busy={busy}
      testID="new-folder-sheet"
    >
      <TextField
        value={name}
        onChangeText={(text) => {
          setName(text);
          setProblem(null);
        }}
        placeholder={t("library.folder.new.name")}
        accessibilityLabel={t("library.folder.new.name")}
        autoFocus
        maxLength={60}
        onSubmitEditing={() => void submit()}
        testID="new-folder-name"
      />
      {problem !== null ? (
        <Text accessibilityRole="alert" style={styles.error} testID="new-folder-error">
          {t(PROBLEM_KEYS[problem])}
        </Text>
      ) : null}

      <Text style={styles.label}>{t("library.folder.new.tags")}</Text>
      {availableTags.length === 0 ? (
        <Text style={styles.hint}>{t("library.folder.new.noTags")}</Text>
      ) : (
        <>
          <Text style={styles.hint}>{t("library.folder.new.tagsHint")}</Text>
          <View style={styles.tags} testID="new-folder-tags">
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                onPress={() => toggle(tag)}
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button variant="secondary" label={t("confirm.cancel")} disabled={busy} onPress={close} />
        <Button
          label={t("library.folder.new.create")}
          disabled={busy}
          onPress={() => void submit()}
          testID="new-folder-create"
        />
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  label: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  hint: { ...textStyle(typography.bodySm), color: colors.textSecondary },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
