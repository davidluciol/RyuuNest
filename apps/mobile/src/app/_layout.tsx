import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { dragonNightColors } from "@ryuunest/ui-tokens";

import { galleryFontSources } from "../gallery/fontSources";

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
          contentStyle: { backgroundColor: dragonNightColors.bg },
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
