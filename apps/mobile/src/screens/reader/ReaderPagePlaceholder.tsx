import { memo, useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { activeColors, spacing, typography } from "@ryuunest/ui-tokens";
import { Image as ImageIcon } from "lucide-react-native";

import { textStyle } from "../../components/textStyle";
import { t } from "../../i18n";

/**
 * Hueco de una página del lector que aún no tiene imagen: en espera, en cola o
 * descargando. Sin porcentajes ni transiciones; el spinner nativo es la única
 * animación permitida en el lector y con movimiento reducido pasa a un icono
 * fijo (Regla 4 de `AGENTS.md`).
 */

export type ReaderPagePlaceholderStatus = "idle" | "queued" | "loading";

export interface ReaderPagePlaceholderProps {
  /** Número de página, base 1. */
  pageNumber: number;
  status: ReaderPagePlaceholderStatus;
  width: number;
  height: number;
  testID?: string;
}

const STATE_KEYS: Record<ReaderPagePlaceholderStatus, string> = {
  idle: "reader.page.state.idle",
  queued: "reader.page.state.queued",
  loading: "reader.page.state.loading",
};

const A11Y_KEYS: Record<ReaderPagePlaceholderStatus, string> = {
  idle: "reader.page.a11y.idle",
  queued: "reader.page.a11y.queued",
  loading: "reader.page.a11y.loading",
};

function ReaderPagePlaceholder({
  pageNumber,
  status,
  width,
  height,
  testID,
}: ReaderPagePlaceholderProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const loading = status === "loading";

  // Solo escucha mientras descarga: hay un hueco por página y casi todos esperan quietos.
  useEffect(() => {
    if (!loading) return;
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, [loading]);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={status === "loading" ? "progressbar" : "text"}
      accessibilityLabel={t(A11Y_KEYS[status], { number: pageNumber })}
      style={[styles.container, { width, height }]}
    >
      {status === "loading" ? (
        reduceMotion ? (
          <ImageIcon size={spacing.lg} color={activeColors.accent} />
        ) : (
          <ActivityIndicator size="small" color={activeColors.accent} />
        )
      ) : null}
      <Text
        style={[
          styles.number,
          { color: status === "idle" ? activeColors.textSecondary : activeColors.textPrimary },
        ]}
      >
        {pageNumber}
      </Text>
      <Text style={styles.state}>{t(STATE_KEYS[status])}</Text>
    </View>
  );
}

export default memo(ReaderPagePlaceholder);

const styles = StyleSheet.create({
  container: {
    backgroundColor: activeColors.bg,
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  number: {
    ...textStyle(typography.labelLg),
  },
  state: {
    ...textStyle(typography.bodySm),
    color: activeColors.textSecondary,
  },
});
