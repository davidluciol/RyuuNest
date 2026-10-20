import { radii, spacing, touchTarget, withAlpha, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F06 — reglas de estilo del botón (SPEC §11.10), separadas del componente
 * React Native para poder probarlas sin Metro. La lógica de color y forma
 * vive aquí; `Button.tsx` solo la monta con `Pressable`.
 */

export type ButtonVariant = "primary" | "secondary" | "destructive";

/** Alto mínimo de botón = área táctil (48 dp, RNF-7). */
export const BUTTON_MIN_HEIGHT = touchTarget.min;

const colors = dragonNightColors;

/** Un subconjunto de ViewStyle con lo que usan los botones (sin RN). */
export interface ButtonStyleShape {
  height: number;
  borderRadius: number;
  backgroundColor: string;
  borderColor?: string;
  borderWidth: number;
  paddingHorizontal: number;
  opacity?: number;
}

interface ButtonState {
  pressed?: boolean;
  disabled?: boolean;
}

/** Estilo del contenedor por variante y estado. */
export function buttonStyle(variant: ButtonVariant, state: ButtonState = {}): ButtonStyleShape {
  const base: ButtonStyleShape = {
    height: BUTTON_MIN_HEIGHT,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    borderWidth: 0,
    backgroundColor: "transparent",
  };
  let variantStyle: Partial<ButtonStyleShape>;
  if (variant === "primary") {
    variantStyle = { backgroundColor: colors.accent };
  } else if (variant === "secondary") {
    variantStyle = state.pressed
      ? { backgroundColor: withAlpha(colors.accent, 0.1) } // accent al 10 %
      : { backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1 };
  } else {
    variantStyle = {
      backgroundColor: "transparent",
      borderColor: colors.error,
      borderWidth: 1,
    };
  }
  return {
    ...base,
    ...variantStyle,
    ...(state.disabled ? { opacity: 0.5 } : null),
  };
}

/** Color de texto (e icono) por variante (inversión sobre accent/progress). */
export function buttonTextColor(variant: ButtonVariant): string {
  if (variant === "primary") return colors.bg;
  if (variant === "secondary") return colors.textPrimary;
  return colors.error;
}

/** Par fondo/texto para la puerta de contraste. */
export function buttonColors(variant: ButtonVariant): { bg: string; text: string } {
  return { bg: buttonStyle(variant).backgroundColor, text: buttonTextColor(variant) };
}
