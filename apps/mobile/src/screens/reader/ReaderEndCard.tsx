// single-use: tarjeta de fin de capítulo del lector (RF-21); solo existe dentro de él.
import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "../../components/Button";
import { textStyle } from "../../components/textStyle";
import { ArrowRight, CircleCheck } from "../../icons";
import { t } from "../../i18n";

/**
 * F18 — fin del capítulo (RF-21): confirma el fin y ofrece abrir el siguiente. Si no hay más
 * capítulos lo dice sin inventar una acción.
 */

const colors = dragonNightColors;

export interface ReaderEndCardProps {
  /** Número del capítulo que termina; `undefined` si no tiene número. */
  chapterNumber: number | undefined;
  /** Capítulo siguiente; `null` si es el último disponible. */
  next: { number: number | undefined } | null;
  /** Ancho de la columna de lectura. */
  width: number;
  onOpenNext: () => void;
}

export default function ReaderEndCard({ chapterNumber, next, width, onOpenNext }: ReaderEndCardProps) {
  return (
    <View testID="reader-end-card" style={[styles.card, { width }]}>
      <View style={styles.badge}>
        <CircleCheck size={spacing.lg} color={colors.accent} />
      </View>
      <Text style={styles.title}>
        {chapterNumber === undefined
          ? t("reader.end.titleUnnumbered")
          : t("reader.end.title", { number: chapterNumber })}
      </Text>
      {next === null ? (
        <Text style={styles.message}>{t("reader.end.last")}</Text>
      ) : (
        <Button
          label={
            next.number === undefined
              ? t("reader.end.nextUnnumbered")
              : t("reader.end.next", { number: next.number })
          }
          onPress={onOpenNext}
          icon={<ArrowRight size={spacing.md} color={colors.bg} />}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  badge: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    borderRadius: radii.pill,
    backgroundColor: colors.badgeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...textStyle(typography.headlineSm), color: colors.textPrimary, textAlign: "center" },
  message: { ...textStyle(typography.bodyMd), color: colors.textSecondary, textAlign: "center" },
  button: { alignSelf: "stretch" },
});
