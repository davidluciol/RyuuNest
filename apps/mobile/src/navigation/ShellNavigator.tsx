import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { activeColors, breakpoints, spacing } from "@ryuunest/ui-tokens";

import BottomNav from "../components/BottomNav";
import { BOTTOM_NAV_DESTINATIONS, type BottomNavDestination } from "../components/shellStyles";
import UpdatesBanner from "../components/UpdatesBanner";
import { resolveSourcesService } from "../screens/sources/useSourcesData";
import { countUpdates } from "../screens/sources/sourcesView";
import AppShell from "../shell/AppShell";
import HeaderModuleSwitcher from "./HeaderModuleSwitcher";
import { useFirstUseActive } from "./firstUseStore";
import { destinationLabel, destinationRoutes, shellDestination } from "./routes";
import { requestOpenUpdates, setUpdateCount, useUpdateCount } from "./updatesStore";
import { themedStyles } from "../components/themedStyles";
import { isTvDevice, TV_SAFE_MARGINS } from "../tv/tvShell";

/** F22: en TV, riel lateral con márgenes seguros en lugar de la barra inferior. */
const IS_TV = isTvDevice(
  Platform.isTV,
  typeof navigator === "undefined" ? undefined : navigator.userAgent,
);

export default function ShellNavigator() {
  const firstUse = useFirstUseActive();
  const updates = useUpdateCount();
  const router = useRouter();
  // Una ventana de TV estrecha (solo en web) no tiene sitio para el riel: vuelve la barra.
  const { width } = useWindowDimensions();
  const tv = IS_TV && width >= breakpoints.mobileMax;
  // F99 (RNF-5): solo lee lo ya guardado en SQLite del último sync; no pide nada a la red.
  useEffect(() => {
    void resolveSourcesService()
      .then((service) => service.load())
      .then((data) => setUpdateCount(countUpdates(data.modules)))
      .catch(() => {});
  }, []);
  const lastDestination = useRef<BottomNavDestination | null>(null);
  const destination = shellDestination(usePathname(), lastDestination.current);
  lastDestination.current = destination;
  if (destination === null) return null;
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={tv ? [styles.screen, styles.tvScreen] : styles.screen}
    >
      <AppShell
        section={destinationLabel(destination)}
        right={destination === "discover" ? <HeaderModuleSwitcher /> : undefined}
      >
        {updates > 0 && destination === "home" && !firstUse ? (
          <View style={styles.banner}>
            <UpdatesBanner
              testID="updates-banner"
              count={updates}
              onView={() => {
                requestOpenUpdates();
                router.navigate(destinationRoutes.sources);
              }}
            />
          </View>
        ) : null}
        <Tabs
          backBehavior="history"
          screenOptions={{
            headerShown: false,
            animation: "none",
            sceneStyle: styles.scene,
            tabBarPosition: tv ? "left" : "bottom",
          }}
          tabBar={({ navigation }) =>
            firstUse ? null : (
              <BottomNav
                active={destination}
                variant={tv ? "rail" : "bar"}
                dots={updates > 0 ? ["sources"] : []}
                onSelect={(id) => navigation.navigate(id === "home" ? "index" : id)}
              />
            )
          }
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

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: activeColors.elevated },
  banner: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  scene: { backgroundColor: activeColors.bg },
  tvScreen: { backgroundColor: activeColors.bg, ...TV_SAFE_MARGINS },
}));
