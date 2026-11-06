import { useState } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { focusRingStyle } from "./focusRing";

/**
 * F34.3 — `Pressable` con anillo de foco (2 px `accent`, separación 2 px) para
 * teclado y D-pad. Mismas props que `Pressable`; el estilo se compone como
 * siempre y el anillo se añade al final.
 */
export default function FocusPressable({ style, onFocus, onBlur, ...rest }: PressableProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={(state) => {
        const base: StyleProp<ViewStyle> = typeof style === "function" ? style(state) : style;
        return [base, focusRingStyle(focused)];
      }}
    />
  );
}
