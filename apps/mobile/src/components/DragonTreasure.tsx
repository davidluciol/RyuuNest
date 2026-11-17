import Svg, { Circle, G, Path } from "react-native-svg";

import { t } from "../i18n";
import {
  DRAGON_TREASURE_HEIGHT,
  DRAGON_TREASURE_WIDTH,
  dragonTreasureColors,
} from "./dragonTreasureStyles";

/**
 * F56 — dragón sin tesoros: la silueta de `DragonMarker` asomada sobre un montón de gemas, con
 * una lupa. Sin texto; coloreable solo desde los tokens del tema.
 */
export default function DragonTreasure() {
  const colors = dragonTreasureColors();
  return (
    <Svg
      width={DRAGON_TREASURE_WIDTH}
      height={DRAGON_TREASURE_HEIGHT}
      viewBox="0 0 192 120"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={t("a11y.dragonTreasure")}
    >
      {/* montón de tesoro */}
      <Path
        d="M16 108 C36 74 68 64 96 64 C124 64 156 74 176 108 Z"
        fill={colors.pile}
        stroke={colors.pileEdge}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* gemas */}
      <Path d="M50 100 L58 90 L70 90 L78 100 L64 114 Z" fill={colors.gem} />
      <Path d="M98 96 L106 86 L118 86 L126 96 L112 110 Z" fill={colors.gem} />
      <Path d="M132 102 L138 94 L146 94 L152 102 L142 112 Z" fill={colors.gem} />
      <Circle cx={36} cy={106} r={5} fill={colors.gem} />
      {/* dragón asomado (silueta del marcador, a escala) */}
      <G transform="translate(52 0) scale(0.7)">
        <Path
          d="M24 22 C34 12 48 14 55 25 C61 34 56 45 45 49 C36 52 30 58 32 67 C34 77 46 82 57 75"
          stroke={colors.dragon}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Path d="M31 14 L36 4 L40 16 Z" fill={colors.dragon} />
        <Path d="M25 20 L11 25 L23 32 Z" fill={colors.dragon} />
        <Path d="M47 31 L72 18 L65 42 Z" fill={colors.dragon} />
        <Path d="M57 75 L74 77 L62 86 Z" fill={colors.dragon} />
      </G>
      {/* lupa */}
      <Circle cx={148} cy={40} r={14} stroke={colors.dragon} strokeWidth={4} />
      <Path d="M158 50 L172 64" stroke={colors.dragon} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
