import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";

import { coverCardStyle, progressBarStyle } from "./coverCardStyles";

/**
 * F07 — tarjeta de portada (SPEC §11.10, RF-41): 2:3, radio 12, borde `border`,
 * barra de progreso de 3 px cuando hay avance. **Sin contador de no leídos.**
 * Props tipadas; todo desde `ui-tokens`.
 */

export interface CoverCardProps {
  /** Fuente de la portada (asset local o URI). */
  source?: ImageSourcePropType;
  /** Avance de lectura 0–1; si > 0 se muestra la barra de progreso (RF-41). */
  progress?: number;
  /** Ancho de la tarjeta; el alto sale de la relación 2:3. */
  width?: number;
  accessibilityLabel?: string;
}

export default function CoverCard({
  source,
  progress = 0,
  width,
  accessibilityLabel,
}: CoverCardProps) {
  return (
    <View style={[coverCardStyle(), width ? { width } : null, styles.container]}>
      {source ? (
        <Image source={source} style={styles.image} accessibilityLabel={accessibilityLabel} />
      ) : null}
      {progress > 0 ? (
        <View style={styles.progressTrack}>
          <View style={progressBarStyle(progress)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});
