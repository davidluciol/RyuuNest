import Svg, { Path } from "react-native-svg";

import { t } from "../i18n";
import { DRAGON_PATH, DRAGON_VIEWBOX } from "./dragonPath";

/**
 * FA1 — logo de RyuuNest (dragón con pupila, `dragonPath.ts`) con `react-native-svg`, coloreable
 * desde el tema. Sustituye al marcador temporal de F08 en cabecera, bienvenida y estados.
 */
export { DRAGON_VIEWBOX };

export default function DragonMarker({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${DRAGON_VIEWBOX} ${DRAGON_VIEWBOX}`}
      accessibilityRole="image"
      accessibilityLabel={t("a11y.dragonMarker")}
    >
      <Path d={DRAGON_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
