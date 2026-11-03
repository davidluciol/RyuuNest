import { StyleSheet, Text, View } from "react-native";

import { textStyle } from "./textStyle";
import {
  type ErrorSeverity,
  bannerCodeStyle,
  codeChipStyle,
  severityColor,
} from "./errorNoticeStyles";

/**
 * F34.1 — etiqueta de código de error (diseño `banner_inline_de_error_y_toast`
 * y `di_logo_de_error_bloqueante`): pastilla con borde y tinte del color de la
 * severidad. El código siempre se ve completo y nunca es el único aviso
 * (RF-43). La usan `ErrorBanner` y `ErrorDialog`.
 */

export interface CodeChipProps {
  code: string;
  severity?: ErrorSeverity;
  testID?: string;
}

export default function CodeChip({ code, severity = "error", testID }: CodeChipProps) {
  return (
    <View style={codeChipStyle(severity)} testID={testID}>
      <Text style={[styles.code, { color: severityColor(severity) }]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  code: { ...textStyle(bannerCodeStyle()) },
});
