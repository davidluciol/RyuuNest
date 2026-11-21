import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { activeColors } from "@ryuunest/ui-tokens";

import { galleryFontSources } from "../gallery/fontSources";
import ChallengeHost from "../screens/challenge/ChallengeHost";

export default function RootLayout() {
  const [loaded, error] = useFonts(galleryFontSources);
  if (error) throw error;
  if (!loaded) return null;
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: activeColors.bg },
        }}
      />
      <ChallengeHost />
      <StatusBar style="light" />
    </>
  );
}
