import { Tabs, usePathname } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import BottomNav from "../components/BottomNav";
import { BOTTOM_NAV_DESTINATIONS } from "../components/shellStyles";
import AppShell from "../shell/AppShell";
import { destinationForPath, destinationLabel } from "./routes";

export default function ShellNavigator() {
  const destination = destinationForPath(usePathname());
  if (destination === null) return null;
  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <AppShell section={destinationLabel(destination)}>
        <Tabs
          backBehavior="history"
          screenOptions={{ headerShown: false, animation: "none", sceneStyle: styles.scene }}
          tabBar={({ navigation }) => (
            <BottomNav
              active={destination}
              onSelect={(id) => navigation.navigate(id === "home" ? "index" : id)}
            />
          )}
        >
          {BOTTOM_NAV_DESTINATIONS.map((id) => (
            <Tabs.Screen
              key={id}
              name={id === "home" ? "index" : id}
              options={{ title: destinationLabel(id) }}
            />
          ))}
        </Tabs>
      </AppShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: dragonNightColors.elevated },
  scene: { backgroundColor: dragonNightColors.bg },
});
