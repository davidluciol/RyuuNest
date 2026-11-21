import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { activeColors } from "@ryuunest/ui-tokens";

import { SAFE_SCREEN_EDGES } from "./safeScreenStyles";
import { themedStyles } from "./themedStyles";

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

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: activeColors.bg },
}));
