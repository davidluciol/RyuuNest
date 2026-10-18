import { radii, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F06 — reglas de campo de texto y casilla/radio (SPEC §11.10, `DESIGN.md`).
 * Campo: `surface`, borde `border`, 48 px, radio 8; en foco borde `accent` sin
 * brillo. Casilla/radio: 20×20, borde de 1,5 px `border`; marcado con relleno
 * `accent` y glifo `bg`. Puras, testeables sin Metro.
 */

const colors = dragonNightColors;

export interface TextFieldStyleShape {
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

/** Estilo del campo según foco. */
export function textFieldStyle(state: { focused?: boolean } = {}): TextFieldStyleShape {
  return {
    height: 48,
    backgroundColor: colors.surface,
    borderColor: state.focused ? colors.accent : colors.border,
    borderWidth: 1,
    borderRadius: radii.control,
  };
}

/** Colores del campo para la puerta de contraste. */
export function textFieldColors(state: { focused?: boolean } = {}): {
  bg: string;
  border: string;
  text: string;
  placeholder: string;
} {
  return {
    bg: colors.surface,
    border: state.focused ? colors.accent : colors.border,
    text: colors.textPrimary,
    placeholder: colors.textSecondary,
  };
}

export const CHECKBOX_SIZE = 20;

export interface CheckStyleShape {
  width: number;
  height: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  backgroundColor: string;
}

/** Casilla: 20×20, radio 4; marcada con relleno accent. */
export function checkboxStyle(checked: boolean): CheckStyleShape {
  return {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: 1.5,
    borderColor: checked ? colors.accent : colors.border,
    borderRadius: radii.checkbox,
    backgroundColor: checked ? colors.accent : "transparent",
  };
}

/** Radio: 20×20, círculo completo; marcado con relleno accent. */
export function radioStyle(selected: boolean): CheckStyleShape {
  return {
    ...checkboxStyle(selected),
    borderRadius: radii.pill,
  };
}
