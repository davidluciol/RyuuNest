import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
} from "react-native";
import { typography } from "@ryuunest/ui-tokens";

import { textStyle } from "./textStyle";
import {
  HOLD_DURATION_MS,
  holdToConfirmStyle,
  holdToConfirmTextColor,
  holdTrackStyle,
} from "./holdToConfirmStyles";

/**
 * F16 — botón de mantener pulsado (confirmación reforzada, SPEC §7.1 paso 3).
 * Confirma solo si se mantiene `HOLD_DURATION_MS`; soltar antes cancela y el
 * relleno vuelve a cero. El relleno anima solo `transform` (Regla 4) y se
 * omite con movimiento reducido: la espera sigue siendo la misma.
 */

export interface HoldToConfirmProps {
  label: string;
  /** Texto mientras se mantiene pulsado. */
  holdingLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

export default function HoldToConfirm({
  label,
  holdingLabel,
  onConfirm,
  disabled = false,
  accessibilityHint,
}: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false);
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function start() {
    if (disabled || timer.current !== null) return;
    setHolding(true);
    if (!reduceMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: HOLD_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      progress.setValue(0);
      onConfirm();
    }, HOLD_DURATION_MS);
  }

  function cancel() {
    if (timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
    progress.stopAnimation();
    progress.setValue(0);
  }

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={start}
      onPressOut={cancel}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.container, holdToConfirmStyle(), disabled && styles.disabled]}
    >
      <Animated.View
        pointerEvents="none"
        style={[holdTrackStyle(), { transform: [{ translateX }] }]}
      />
      <Text style={[styles.label, { color: holdToConfirmTextColor(holding) }]}>
        {holding ? holdingLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  label: { ...textStyle(typography.labelLg) },
});
