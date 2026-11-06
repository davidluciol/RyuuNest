import FocusPressable from "./FocusPressable";
import { Modal, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { dragonNightColors, radii, spacing, typography } from "@ryuunest/ui-tokens";

import Button from "./Button";
import Sheet from "./Sheet";
import {
  confirmActionsLayout,
  confirmPresentation,
  confirmSubjectStyle,
} from "./confirmSheetStyles";
import {
  dialogBackdropStyle,
  dialogFrameStyle,
  dialogMessageStyle,
  dialogStyle,
  dialogTitleStyle,
} from "./errorNoticeStyles";
import { sheetAnimation, sheetBackdropStyle } from "./sheetModalStyles";
import { textStyle } from "./textStyle";
import { Trash2 } from "../icons";
import { t } from "../i18n";

/**
 * F34.2 — confirmación de una acción con consecuencias (reemplazar el respaldo, desinstalar,
 * quitar un repositorio, borrar el registro). **Un solo patrón**: hoja inferior en móvil y
 * diálogo centrado en tablet, TV y escritorio (`confirmar_accion_dragon_night`). La acción va en
 * amarillo (`caution`): avisa sin asustar. Con `busy` no se puede cerrar a medias.
 */

const colors = dragonNightColors;

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  /** Consecuencia de la acción, en lenguaje simple. */
  message: string;
  /** Nombre del elemento afectado (módulo, repositorio, archivo), si lo hay. */
  subject?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Trabajo en curso: bloquea el cierre y la acción. */
  busy?: boolean;
  /** Error de la acción, visible dentro de la hoja. */
  error?: string | null;
  /** Sin animación de entrada (la pide el lector). */
  animated?: boolean;
  testID?: string;
  confirmTestID?: string;
  cancelTestID?: string;
}

export default function ConfirmSheet({
  visible,
  title,
  message,
  subject,
  confirmLabel,
  cancelLabel = t("confirm.cancel"),
  onConfirm,
  onCancel,
  busy = false,
  error = null,
  animated = true,
  testID,
  confirmTestID,
  cancelTestID,
}: ConfirmSheetProps) {
  const { width } = useWindowDimensions();
  const presentation = confirmPresentation(width);
  const layout = confirmActionsLayout(presentation);
  const cancel = () => {
    if (!busy) onCancel();
  };

  const confirm = (
    <Button
      key="confirm"
      variant="caution"
      label={confirmLabel}
      icon={<Trash2 size={spacing.md} color={colors.warning} />}
      disabled={busy}
      onPress={onConfirm}
      testID={confirmTestID}
      style={layout.fullWidth ? styles.full : undefined}
    />
  );
  const dismiss = (
    <Button
      key="cancel"
      variant="secondary"
      label={cancelLabel}
      disabled={busy}
      onPress={cancel}
      testID={cancelTestID}
      style={layout.fullWidth ? styles.full : undefined}
    />
  );

  const body = (
    <>
      {presentation === "sheet" ? <View style={styles.grab} /> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subject !== undefined ? (
        <View style={confirmSubjectStyle()}>
          <Text style={styles.subject}>{subject}</Text>
        </View>
      ) : null}
      <Text style={styles.message}>{message}</Text>
      {error !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={[styles.actions, layout.direction === "column" ? styles.column : styles.row]}>
        {layout.confirmFirst ? [confirm, dismiss] : [dismiss, confirm]}
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={
        presentation === "sheet" ? sheetAnimation(animated) : animated ? "fade" : "none"
      }
      onRequestClose={cancel}
    >
      <FocusPressable
        style={presentation === "sheet" ? sheetBackdropStyle() : dialogBackdropStyle()}
        accessibilityLabel={cancelLabel}
        onPress={cancel}
      >
        {/* Pressable vacío: traga el toque del contenido y no cierra la confirmación. */}
        <FocusPressable
          testID={testID}
          focusable={false}
          style={presentation === "sheet" ? styles.sheetFrame : styles.dialogFrame}
        >
          {presentation === "sheet" ? (
            <Sheet>
              <View style={styles.content}>{body}</View>
            </Sheet>
          ) : (
            <View style={[styles.dialog, styles.content]}>{body}</View>
          )}
        </FocusPressable>
      </FocusPressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetFrame: { width: "100%" },
  dialogFrame: dialogFrameStyle(),
  dialog: dialogStyle(),
  content: { gap: spacing.md },
  grab: {
    alignSelf: "center",
    width: spacing.xl + spacing.xs,
    height: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  title: { ...textStyle(dialogTitleStyle()), color: colors.textPrimary },
  subject: { ...textStyle(typography.labelLg), color: colors.textPrimary },
  message: { ...textStyle(dialogMessageStyle()), color: colors.textSecondary },
  error: { ...textStyle(typography.bodyMd), color: colors.error },
  actions: { gap: spacing.xs },
  column: { flexDirection: "column", alignItems: "stretch" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  full: { alignSelf: "stretch" },
});
