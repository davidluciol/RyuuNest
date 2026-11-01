import { t } from "@ryuunest/i18n";

/**
 * F24 — dragón marcador en DOM: reproduce la silueta original de
 * `apps/mobile/assets/placeholder/dragon.svg` (misma retícula 96×96 y mismos
 * trazos que la versión React Native). Sin texto y sin obras reales (D2/D3).
 */
export const DRAGON_VIEWBOX = 96;

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
      fill="none"
      role="img"
      aria-label={t("a11y.dragonMarker")}
      className="dragon-marker"
    >
      {/* cuerpo serpenteante */}
      <path
        d="M24 22 C34 12 48 14 55 25 C61 34 56 45 45 49 C36 52 30 58 32 67 C34 77 46 82 57 75"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* asta */}
      <path d="M31 14 L36 4 L40 16 Z" fill={color} />
      {/* hocico */}
      <path d="M25 20 L11 25 L23 32 Z" fill={color} />
      {/* ala */}
      <path d="M47 31 L72 18 L65 42 Z" fill={color} />
      {/* aleta de la cola */}
      <path d="M57 75 L74 77 L62 86 Z" fill={color} />
    </svg>
  );
}
