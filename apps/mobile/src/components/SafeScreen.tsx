import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import { SAFE_SCREEN_EDGES } from "./safeScreenStyles";

/**
 * F34.2 — contenedor de las rutas que viven fuera de las pestañas (ficha de
 * serie, Diagnóstico): respeta las zonas seguras del dispositivo. Las pestañas
 * ya van dentro del `SafeAreaView` del shell y el lector aplica los insets a
 * sus barras.
 */
export default function SafeScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={SAFE_SCREEN_EDGES} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: dragonNightColors.bg },
});
