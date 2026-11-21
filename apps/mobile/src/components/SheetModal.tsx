import FocusPressable from "./FocusPressable";
import { Modal, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { activeColors, spacing, typography } from "@ryuunest/ui-tokens";

import { X } from "../icons";
import { t } from "../i18n";
import Sheet from "./Sheet";
import { sheetAnimation, sheetBackdropStyle } from "./sheetModalStyles";
import { textStyle } from "./textStyle";
import { themedStyles } from "./themedStyles";

/**
 * F16 — hoja modal reutilizable (nivel 2, SPEC §11.10): velo, hoja de `Sheet`,
 * título, cierre y contenido con desplazamiento. Es la base de todas las hojas
 * de Fuentes (añadir repo, confirmar instalación, gestionar, actualizar…).
 * Con `busy` no se puede cerrar a medias (el velo y el botón no responden).
 */

const colors = activeColors;
const BODY_MAX = spacing.xl * 16;

export interface SheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Trabajo en curso: bloquea el cierre. */
  busy?: boolean;
  /** La hoja entra deslizando; el lector la pide sin animación. */
  animated?: boolean;
  testID?: string;
  /** Acciones fijas bajo el contenido desplazable (siempre visibles). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function SheetModal({
  visible,
  title,
  onClose,
  busy = false,
  animated = true,
  testID,
  footer,
  children,
}: SheetModalProps) {
  const { height } = useWindowDimensions();
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
      <FocusPressable
        style={sheetBackdropStyle()}
        accessibilityLabel={t("sources.sheet.close")}
        onPress={close}
      >
        {/* Pressable vacío: traga el toque del contenido y no cierra la hoja. */}
        <FocusPressable testID={testID} focusable={false}>
          <Sheet>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <FocusPressable
                accessibilityRole="button"
                accessibilityLabel={t("sources.sheet.close")}
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={close}
                style={styles.close}
              >
                <X size={spacing.md} color={colors.textSecondary} />
              </FocusPressable>
            </View>
            <ScrollView
              // Con pie fijo, el contenido cede altura para que las acciones quepan en pantalla (S25).
              style={[styles.body, footer ? { maxHeight: Math.min(BODY_MAX, height / 2) } : null]}
              contentContainerStyle={styles.bodyContent}
            >
              {children}
            </ScrollView>
            {footer}
          </Sheet>
        </FocusPressable>
      </FocusPressable>
    </Modal>
  );
}

const styles = themedStyles(() => ({
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
  body: { maxHeight: BODY_MAX },
  bodyContent: { gap: spacing.sm, paddingBottom: spacing.xs },
}));
