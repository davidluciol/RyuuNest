import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { spacing, typography } from "@ryuunest/ui-tokens";

import { textFieldColors, textFieldStyle } from "./fieldStyles";

/**
 * F06 — campo de texto y búsqueda (SPEC §11.10): `surface`, borde `border`,
 * 48 px, radio 8; en foco borde `accent` sin brillo. Props tipadas; todo desde
 * `ui-tokens`.
 */

export interface TextFieldProps extends Omit<TextInputProps, "style" | "placeholderTextColor"> {
  /** Icono Lucide a la izquierda (p. ej. búsqueda, 20 px). */
  leadingIcon?: React.ReactNode;
}

export default function TextField({ leadingIcon, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const colors = textFieldColors({ focused });
  return (
    <View style={[textFieldStyle({ focused }), styles.container]}>
      {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.placeholder}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  icon: { marginRight: spacing.xs },
  input: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
});
