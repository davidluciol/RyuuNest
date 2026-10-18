import { StyleSheet, View } from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import { sheetStyle } from "./sheetStyles";

/**
 * F07 — hoja/diálogo (nivel 2, SPEC §11.10): esquinas superiores redondeadas,
 * fondo `elevated`, **sin sombra** (RNF-12). Contenedor reutilizable para
 * hojas inferiores y diálogos; el contenido lo aporta la pantalla.
 */

export interface SheetProps {
  children: React.ReactNode;
}

export default function Sheet({ children }: SheetProps) {
  return <View style={[sheetStyle(), styles.content]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
});
