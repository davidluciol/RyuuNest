import { StyleSheet, View, type ViewStyle } from "react-native";
import { dragonNightColors, spacing } from "@ryuunest/ui-tokens";

import DragonMarker from "../components/DragonMarker";
import Header from "../components/Header";
import { t } from "../i18n";

/** Estructura compartida; el contenedor de rutas se encarga de las áreas seguras. */
export default function AppShell({
  section,
  children,
  style,
}: {
  section: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View testID="app-shell" style={[styles.screen, style]}>
      <View testID="shell-header">
        <Header
          title={t("shell.brand")}
          subtitle={section}
          leading={<DragonMarker size={spacing.xl} color={dragonNightColors.textSecondary} />}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: dragonNightColors.bg },
  content: { flex: 1, minHeight: 0 },
});
