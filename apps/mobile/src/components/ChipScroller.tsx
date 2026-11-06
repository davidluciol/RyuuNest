import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import { fadeColors, scrollFadeState } from "./scrollFade";

export interface ChipScrollerProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * F34.3 — fila de chips con desplazamiento horizontal y pista visual: un
 * degradado del color de fondo en el borde que aún esconde contenido
 * (`scrollFadeState`). No anima: el degradado aparece o desaparece según el
 * desplazamiento y no intercepta toques.
 */
export default function ChipScroller({ children, contentContainerStyle }: ChipScrollerProps) {
  const [offset, setOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const fade = scrollFadeState({ offset, contentWidth, viewportWidth });
  const [solid, clear] = fadeColors();

  return (
    <View
      style={styles.wrap}
      onLayout={(e: LayoutChangeEvent) => setViewportWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
          setOffset(e.nativeEvent.contentOffset.x)
        }
        onContentSizeChange={(width) => setContentWidth(width)}
      >
        {children}
      </ScrollView>
      {fade.start ? (
        <LinearGradient
          testID="chip-fade-start"
          pointerEvents="none"
          colors={[solid, clear]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, styles.fadeStart]}
        />
      ) : null}
      {fade.end ? (
        <LinearGradient
          testID="chip-fade-end"
          pointerEvents="none"
          colors={[clear, solid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, styles.fadeEnd]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: spacing.xl,
  },
  fadeStart: {
    left: 0,
  },
  fadeEnd: {
    right: 0,
  },
});
