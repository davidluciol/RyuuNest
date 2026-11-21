import { View, type ViewStyle } from "react-native";
import { activeColors, spacing } from "@ryuunest/ui-tokens";

import DragonMarker from "../components/DragonMarker";
import Header from "../components/Header";
import { t } from "../i18n";
import { themedStyles } from "../components/themedStyles";

/** Estructura compartida; el contenedor de rutas se encarga de las áreas seguras. */
export default function AppShell({
  section,
  children,
  style,
  right,
}: {
  section: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Contenido de la derecha de la cabecera (F88: selector de módulo en Aventuras). */
  right?: React.ReactNode;
}) {
  return (
    <View testID="app-shell" style={[styles.screen, style]}>
      <View testID="shell-header">
        <Header
          title={t("shell.brand")}
          subtitle={section}
          right={right}
          leading={<DragonMarker size={spacing.xl} color={activeColors.textSecondary} />}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: activeColors.bg },
  content: { flex: 1, minHeight: 0 },
}));
