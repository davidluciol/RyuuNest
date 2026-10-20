/* eslint-disable ryuunest/no-design-literals -- Excepción documentada (F09): panel de medida del
   tope de imágenes (T05, P-45), de un solo uso y fuera del alcance de diseño de la Fase 6a
   (Regla 3). Sus colores claros son deliberados para la medición y no son interfaz de la app. */
// single-use: panel de medición del tope de imágenes en memoria (T05) — no forma parte
// de la app de lectura; vive solo en la app de calibración.
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import paginaCalibracion from "../assets/pagina-calibracion.png";
import { clampCount, decodedBytes, toMB } from "./imageBudget";

/**
 * Red de seguridad del panel: 30 imágenes a 1440×3200 son ~528 MB decodificados, más que
 * suficiente para encontrar el tope en un teléfono. El humano sube de una en una hasta
 * que la app deje de responder y de ahí sale el tope (SPEC §9, `MEMORY.md` P-45).
 */
const MAX_COUNT = 30;

export default function ImageCapPanel() {
  const { width, height } = useWindowDimensions();
  const [count, setCount] = useState(0);
  const perImage = useMemo(() => decodedBytes(width, height), [width, height]);

  function step(delta: number): void {
    setCount((current) => clampCount(current + delta, 0, MAX_COUNT));
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Tope de imágenes (T05)</Text>
      <Text style={styles.readout}>
        {count} en memoria · {toMB(perImage)} MB por imagen · {toMB(count * perImage)} MB
        decodificados
      </Text>

      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => step(-1)} hitSlop={8}>
          <Text style={styles.buttonLabel}>−1</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => step(1)} hitSlop={8}>
          <Text style={styles.buttonLabel}>+1</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setCount(0)} hitSlop={8}>
          <Text style={styles.buttonLabel}>Vaciar</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {
          "Sube de una en una y lee la memoria con: adb shell dumpsys meminfo <paquete> | grep TOTAL. El tope es la mayor N que aguanta sin que la app muera."
        }
      </Text>

      <View>
        {Array.from({ length: count }, (_, index) => (
          <Image
            key={index}
            source={paginaCalibracion}
            style={{ width, height }}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: "stretch",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#d7d7d7",
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  readout: { fontSize: 14, marginBottom: 12 },
  controls: { flexDirection: "row", gap: 8, marginBottom: 12 },
  button: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#e8e8e8",
  },
  buttonLabel: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12, lineHeight: 16, marginBottom: 16, color: "#4a4a4a" },
});
