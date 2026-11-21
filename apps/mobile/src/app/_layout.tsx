import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { activeColors, relativeLuminance } from "@ryuunest/ui-tokens";

import { galleryFontSources } from "../gallery/fontSources";
import ChallengeHost from "../screens/challenge/ChallengeHost";
import { useAppTheme } from "../theme/useAppTheme";

export default function RootLayout() {
  const [loaded, error] = useFonts(galleryFontSources);
  const theme = useAppTheme();
  if (error) throw error;
  if (!loaded || !theme.ready) return null;
  return (
    <>
      {/* `key`: al cambiar de tema se repinta todo con los colores nuevos (F90). */}
      <Stack
        key={theme.version}
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: activeColors.bg },
        }}
      />
      <ChallengeHost />
      <StatusBar style={relativeLuminance(activeColors.bg) > 0.5 ? "dark" : "light"} />
    </>
  );
}
