import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import GalleryScreen from "./src/gallery/GalleryScreen";

/**
 * F05: la galería de componentes es la pantalla por defecto durante la Fase
 * 6a (desarrollo del sistema de diseño). La calibración T05 quedó verificada
 * (arranque/memoria en dispositivo); el shell real llega en F11.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <GalleryScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
