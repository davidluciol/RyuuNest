import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import { X } from "../icons";
import { t } from "../i18n";
import Sheet from "./Sheet";
import { sheetAnimation, sheetBackdropStyle } from "./sheetModalStyles";
import { textStyle } from "./textStyle";

/**
 * F16 — hoja modal reutilizable (nivel 2, SPEC §11.10): velo, hoja de `Sheet`,
 * título, cierre y contenido con desplazamiento. Es la base de todas las hojas
 * de Fuentes (añadir repo, confirmar instalación, gestionar, actualizar…).
 * Con `busy` no se puede cerrar a medias (el velo y el botón no responden).
 */

const colors = dragonNightColors;

export interface SheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Trabajo en curso: bloquea el cierre. */
  busy?: boolean;
  /** La hoja entra deslizando; el lector la pide sin animación. */
  animated?: boolean;
  testID?: string;
  children: React.ReactNode;
}

export default function SheetModal({
  visible,
  title,
  onClose,
  busy = false,
  animated = true,
  testID,
  children,
}: SheetModalProps) {
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={sheetAnimation(animated)}
      onRequestClose={close}
    >
      <Pressable
        style={sheetBackdropStyle()}
        accessibilityLabel={t("sources.sheet.close")}
        onPress={close}
      >
        {/* Pressable vacío: traga el toque del contenido y no cierra la hoja. */}
        <Pressable testID={testID}>
          <Sheet>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("sources.sheet.close")}
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={close}
                style={styles.close}
              >
                <X size={spacing.md} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {children}
            </ScrollView>
          </Sheet>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyle(typography.headlineSm),
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
  },
  close: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  body: { maxHeight: spacing.xl * 16 },
  bodyContent: { gap: spacing.sm, paddingBottom: spacing.xs },
});
