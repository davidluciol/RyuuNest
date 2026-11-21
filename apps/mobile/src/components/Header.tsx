import { useState } from "react";
import { Image, Text, View, type ImageSourcePropType } from "react-native";
import { spacing, touchTarget, typography, activeColors } from "@ryuunest/ui-tokens";

import { Search, X } from "../icons";
import { t } from "../i18n";
import FocusPressable from "./FocusPressable";
import TextField from "./TextField";
import { HEADER_HEIGHT, headerStyle } from "./shellStyles";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * F07 — cabecera única (V5): nivel `elevated`, **sin sombra** (RNF-12). El
 * logo es un recurso local (`logo`); el texto alternativo nunca se dibuja.
 * La misma en todas las pantallas. F60: con `onSearch`, la lupa de la derecha abre un
 * campo que ocupa la cabecera; Entrar entrega la consulta y lo cierra.
 */

const colors = activeColors;

export interface HeaderProps {
  /** Título de la pantalla. */
  title: string;
  /** Logo local (asset); no se dibuja texto alternativo si falta. */
  logo?: ImageSourcePropType;
  /** Acceso a la acción de la derecha (p. ej. avatar/ajustes). */
  right?: React.ReactNode;
  leading?: React.ReactNode;
  subtitle?: string;
  /** Búsqueda global (F60): recibe la consulta escrita; sin ella no hay lupa. */
  onSearch?: (query: string) => void;
}

export default function Header({ title, logo, right, leading, subtitle, onSearch }: HeaderProps) {
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState("");

  if (onSearch !== undefined && searching) {
    return (
      <View style={[headerStyle(), styles.container]}>
        <View style={styles.field}>
          <TextField
            autoFocus
            placeholder={t("discover.search.placeholder")}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              onSearch(draft);
              setSearching(false);
              setDraft("");
            }}
            returnKeyType="search"
            accessibilityLabel={t("discover.search.placeholder")}
            leadingIcon={<Search size={spacing.md} color={colors.textSecondary} />}
          />
        </View>
        <FocusPressable
          accessibilityRole="button"
          accessibilityLabel={t("shell.search.close")}
          onPress={() => {
            setSearching(false);
            setDraft("");
          }}
          style={styles.iconButton}
        >
          <X size={spacing.md} color={colors.textSecondary} />
        </FocusPressable>
      </View>
    );
  }

  return (
    <View style={[headerStyle(), styles.container]}>
      <View style={styles.left}>
        {leading}
        {logo ? <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors /> : null}
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
      {onSearch !== undefined ? (
        <FocusPressable
          accessibilityRole="button"
          accessibilityLabel={t("shell.search.open")}
          onPress={() => setSearching(true)}
          style={styles.iconButton}
        >
          <Search size={spacing.md} color={colors.textSecondary} />
        </FocusPressable>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    minHeight: HEADER_HEIGHT,
    height: "auto", // crece con el texto del sistema al 200 % en vez de recortar el título
    paddingVertical: spacing.xs,
  },
  left: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  logo: { width: spacing.xl, height: spacing.xl },
  text: { flexShrink: 1 },
  field: { flex: 1, minWidth: 0 },
  iconButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...textStyle(typography.headlineSm),
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...textStyle(typography.labelMd),
    color: colors.textSecondary,
  },
}));
