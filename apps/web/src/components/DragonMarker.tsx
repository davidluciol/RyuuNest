import { t } from "@ryuunest/i18n";
import { DRAGON_PATH, DRAGON_VIEWBOX } from "@ryuunest/mobile-src/components/dragonPath";

/**
 * FA1 — logo de RyuuNest en DOM: mismo trazo que la versión React Native (`dragonPath.ts`).
 */
export { DRAGON_VIEWBOX };

export interface DragonMarkerProps {
  readonly size: number;
  readonly color: string;
}

export default function DragonMarker({ size, color }: DragonMarkerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${DRAGON_VIEWBOX} ${DRAGON_VIEWBOX}`}
      role="img"
      aria-label={t("a11y.dragonMarker")}
      className="dragon-marker"
    >
      <path d={DRAGON_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}
