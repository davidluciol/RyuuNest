/**
 * @ryuunest/ui-tokens — tokens semánticos de diseño (tema Dragon Night).
 *
 * Fuente única de valores (SPEC §11.9, P2-1): colores, tipografía, espaciado,
 * radios y densidades. Los componentes de `apps/*` no escriben literales:
 * importan de aquí (AC-13, P2-4; el lint que lo fuerza llega en F09).
 */

export { dragonNightColors, type ThemeColors } from "./colors";
export { fonts, typography, type FontFamily, type TypeStyle, type TypeToken } from "./typography";
export { fontFiles, fontLicenses, type FontFile } from "./fonts";
export { spacing, type SpacingToken } from "./spacing";
export { markers, type MarkerToken } from "./markers";
export { radii, type RadiusToken } from "./radii";
export {
  breakpoints,
  coverAspectRatio,
  densities,
  touchTarget,
  type Density,
  type DensityName,
} from "./density";
export { scaleSize, scaleStyle, scaleTypography } from "./scale";
export {
  breakpointForWidth,
  densityLayout,
  layoutForWidth,
  type BreakpointName,
  type ColumnRange,
  type DensityLayout,
  type ScreenLayout,
} from "./layout";
export { defaultTheme, dragonNight, getTheme, themes, type Theme } from "./theme";
export { contrastRatio, hexToRgb, relativeLuminance, WCAG_AA } from "./contrast";
export { withAlpha } from "./color";

export const UI_TOKENS_VERSION = "0.1.0";
