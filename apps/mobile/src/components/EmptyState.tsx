import { StyleSheet, Text, View } from "react-native";

import Button from "./Button";
import DragonMarker from "./DragonMarker";
import { type StateScale, messageStyle, stateColors, stateStyle, titleStyle } from "./stateStyles";

/**
 * F08 — estado vacío (SPEC §11.12): dragon mediano (biblioteca vacía, sin
 * resultados), título en Manrope, mensaje atenuado y **una acción siguiente**
 * (añadir repo, explorar…). Sin tarjetas-mascota (T4). Los textos llegan por
 * props (las cadenas van al archivo de traducciones, F10).
 */

const colors = stateColors();

export interface EmptyStateProps {
  title: string;
  /** Texto de apoyo opcional bajo el título. */
  message?: string;
  /** Etiqueta de la acción siguiente (obligatoria: todo vacío lleva una). */
  actionLabel: string;
  onAction?: () => void;
  /** Escala del dragón: mediano por defecto (§11.12). */
  scale?: StateScale;
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  scale = "md",
}: EmptyStateProps) {
  const shape = stateStyle(scale);
  return (
    <View style={[styles.block, { gap: shape.gap, padding: shape.padding }]}>
      <DragonMarker size={shape.dragonSize} color={colors.dragon} />
      <Text style={[styles.title, { color: colors.title }]} numberOfLines={2}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: colors.message }]} numberOfLines={3}>
          {message}
        </Text>
      ) : null}
      <Button label={actionLabel} onPress={onAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
  },
  title: {
    fontFamily: titleStyle().fontFamily,
    fontSize: titleStyle().fontSize,
    lineHeight: titleStyle().lineHeight,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    fontFamily: messageStyle().fontFamily,
    fontSize: messageStyle().fontSize,
    lineHeight: messageStyle().lineHeight,
    textAlign: "center",
  },
});
