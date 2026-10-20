import { StyleSheet, Text, View } from "react-native";
import { typography } from "@ryuunest/ui-tokens";

import DragonMarker from "./DragonMarker";
import { messageStyle, stateColors, stateStyle, titleStyle } from "./stateStyles";

/**
 * F08 — carga breve (SPEC §11.12): dragon **pequeño** y texto corto; sin
 * acción (la acción siguiente es de los estados vacío y de error). Nada
 * animado aquí: el lector nunca anima y los estados se mantienen quietos
 * (Regla 4 de `AGENTS.md`); el movimiento se añade en el shell (F11+).
 */

const colors = stateColors();

export interface LoadingStateProps {
  title: string;
  /** Texto de apoyo opcional (qué está cargando). */
  message?: string;
}

export default function LoadingState({ title, message }: LoadingStateProps) {
  const shape = stateStyle("sm");
  return (
    <View style={[styles.block, { gap: shape.gap, padding: shape.padding }]}>
      <DragonMarker size={shape.dragonSize} color={colors.dragon} />
      <Text style={[styles.title, { color: colors.title }]} numberOfLines={2}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: colors.message }]} numberOfLines={2}>
          {message}
        </Text>
      ) : null}
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
