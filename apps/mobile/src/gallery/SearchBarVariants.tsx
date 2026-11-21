import { useState } from "react";
import { Text, View } from "react-native";
import { activeColors, radii, spacing, touchTarget, typography } from "@ryuunest/ui-tokens";

import FocusPressable from "../components/FocusPressable";
import ModulePicker from "../components/ModulePicker";
import TextField from "../components/TextField";
import { textStyle } from "../components/textStyle";
import { t } from "../i18n";
import { Search, SlidersHorizontal } from "../icons";
import { themedStyles } from "../components/themedStyles";

/**
 * F86 — tres variantes de la búsqueda y los filtros de Aventuras para que el
 * humano elija (solo galería: ninguna está cableada a la pantalla real).
 * Común a las tres: la barra se ve siempre, el botón de buscar es un icono de
 * 48×48 y el botón de filtros nace oculto y aparece junto a él al enfocar o
 * escribir. Fuera de alcance aquí: los desplegables de F87 y la posición final
 * del selector de módulo (F88).
 */

const colors = activeColors;
const MODULES = [
  { id: "a", name: "Módulo A" },
  { id: "b", name: "Módulo B" },
];

function IconButton({
  icon,
  label,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  testID?: string;
}) {
  return (
    <FocusPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      {icon}
    </FocusPressable>
  );
}

function useSearchDraft() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  return { text, setText, setFocused, showFilters: focused || text.length > 0 };
}

/** A — selector de módulo arriba; debajo, barra + 🔍 y, al activarla, filtros a su lado. */
function VariantA() {
  const draft = useSearchDraft();
  return (
    <View style={styles.variant} testID="search-variant-a">
      <ModulePicker modules={MODULES} selectedId="a" onSelect={() => undefined} />
      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            placeholder={t("discover.search.placeholder")}
            value={draft.text}
            onChangeText={draft.setText}
            onFocus={() => draft.setFocused(true)}
            onBlur={() => draft.setFocused(false)}
          />
        </View>
        {draft.showFilters ? (
          <IconButton
            icon={<SlidersHorizontal size={20} color={colors.textSecondary} />}
            label={t("discover.filter.button")}
          />
        ) : null}
        <IconButton
          icon={<Search size={20} color={colors.textPrimary} />}
          label={t("discover.search.submit")}
        />
      </View>
    </View>
  );
}

/** B — módulo, barra y 🔍 en una sola fila (mínimo alto); los filtros salen en una fila de chips debajo. */
function VariantB() {
  const draft = useSearchDraft();
  return (
    <View style={styles.variant} testID="search-variant-b">
      <View style={styles.row}>
        <ModulePicker modules={MODULES} selectedId="a" onSelect={() => undefined} />
        <View style={styles.grow}>
          <TextField
            placeholder={t("discover.search.placeholder")}
            value={draft.text}
            onChangeText={draft.setText}
            onFocus={() => draft.setFocused(true)}
            onBlur={() => draft.setFocused(false)}
          />
        </View>
        <IconButton
          icon={<Search size={20} color={colors.textPrimary} />}
          label={t("discover.search.submit")}
        />
      </View>
      {draft.showFilters ? (
        <FocusPressable accessibilityRole="button" style={styles.chip}>
          <SlidersHorizontal size={16} color={colors.textSecondary} />
          <Text style={styles.chipLabel}>{t("discover.filter.button")}</Text>
        </FocusPressable>
      ) : null}
    </View>
  );
}

/** C — barra a todo el ancho con 🔍 dentro de la cabecera de la lista; filtros y módulo como fila secundaria. */
function VariantC() {
  const draft = useSearchDraft();
  return (
    <View style={styles.variant} testID="search-variant-c">
      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            placeholder={t("discover.search.placeholder")}
            value={draft.text}
            onChangeText={draft.setText}
            onFocus={() => draft.setFocused(true)}
            onBlur={() => draft.setFocused(false)}
            leadingIcon={<Search size={20} color={colors.textSecondary} />}
          />
        </View>
        <IconButton
          icon={<Search size={20} color={colors.textPrimary} />}
          label={t("discover.search.submit")}
        />
      </View>
      <View style={styles.row}>
        <ModulePicker modules={MODULES} selectedId="a" onSelect={() => undefined} />
        {draft.showFilters ? (
          <IconButton
            icon={<SlidersHorizontal size={20} color={colors.textSecondary} />}
            label={t("discover.filter.button")}
          />
        ) : null}
      </View>
    </View>
  );
}

export default function SearchBarVariants() {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{t("gallery.searchVariants.a")}</Text>
      <VariantA />
      <Text style={styles.label}>{t("gallery.searchVariants.b")}</Text>
      <VariantB />
      <Text style={styles.label}>{t("gallery.searchVariants.c")}</Text>
      <VariantC />
    </View>
  );
}

const styles = themedStyles(() => ({
  column: { gap: spacing.sm },
  variant: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  grow: { flex: 1, minWidth: 0 },
  label: { ...textStyle(typography.labelMd), color: colors.textSecondary },
  iconButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonPressed: { opacity: 0.7 },
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { ...textStyle(typography.labelMd), color: colors.textPrimary },
}));
