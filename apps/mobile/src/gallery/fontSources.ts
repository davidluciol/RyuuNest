import type { FontSource } from "expo-font";

import interMedium from "../../assets/fonts/Inter-Medium.ttf";
import interRegular from "../../assets/fonts/Inter-Regular.ttf";
import interSemiBold from "../../assets/fonts/Inter-SemiBold.ttf";
import manropeBold from "../../assets/fonts/Manrope-Bold.ttf";
import manropeSemiBold from "../../assets/fonts/Manrope-SemiBold.ttf";

/**
 * F05 — mapa `nombre PostScript → asset` para `useFonts` (expo-font). Las
 * claves y archivos salen del manifiesto `fontFiles` de F03 (un archivo por
 * peso, sin pesos sintéticos). Los imports estáticos son el equivalente del
 * `require` de Metro (así los empaqueta también en web).
 */
export const galleryFontSources: Record<string, FontSource> = {
  "Manrope-SemiBold": manropeSemiBold,
  "Manrope-Bold": manropeBold,
  "Inter-Regular": interRegular,
  "Inter-Medium": interMedium,
  "Inter-SemiBold": interSemiBold,
};
