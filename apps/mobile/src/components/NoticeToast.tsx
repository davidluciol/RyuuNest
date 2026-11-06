import { StyleSheet, View } from "react-native";
import { spacing } from "@ryuunest/ui-tokens";

import type { ErrorSeverity } from "./errorNoticeStyles";
import Toast from "./Toast";

/**
 * F34.2 — único patrón de aviso transitorio de las pantallas: un `Toast`
 * anclado abajo, sin el bloque ad hoc con «Cerrar». Nada si no hay aviso.
 */

export interface NoticeToastProps {
  notice: { message: string; severity: ErrorSeverity } | null;
  onClose?: (() => void) | undefined;
  testID?: string;
}

export default function NoticeToast({ notice, onClose, testID }: NoticeToastProps) {
  if (notice === null) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Toast
        message={notice.message}
        severity={notice.severity}
        onClose={onClose ?? (() => {})}
        {...(testID !== undefined ? { testID } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.lg },
});
