import { StyleSheet, Text, View } from "react-native";
import { dragonNightColors, spacing, typography } from "@ryuunest/ui-tokens";

import type { BottomNavDestination } from "../components/shellStyles";
import { destinationLabel } from "../navigation/routes";
import { textStyle } from "../components/textStyle";

/** F11: marco sin datos ni acciones ficticias; contenido pendiente de cada tarea de pantalla. */
export default function DestinationFrame({ destination }: { destination: BottomNavDestination }) {
  return (
    <View testID={`destination-${destination}`} style={styles.frame}>
      <Text accessibilityRole="header" style={styles.title}>
        {destinationLabel(destination)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, padding: spacing.md, backgroundColor: dragonNightColors.bg },
  title: {
    ...textStyle(typography.headlineMd),
    color: dragonNightColors.textPrimary,
  },
});
