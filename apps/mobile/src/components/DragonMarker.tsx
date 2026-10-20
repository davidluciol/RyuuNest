import Svg, { Path } from "react-native-svg";

/**
 * F08 — dragón marcador (SPEC §11.12): reproduce la silueta original de
 * `assets/placeholder/dragon.svg` (registro y carácter temporal en el README de
 * esa carpeta) con `react-native-svg`, coloreable desde el tema. Sin texto y
 * sin obras reales (D2/D3).
 */

/** Rutas de la silueta, en la retícula 96×96 del SVG registrado. */
export const DRAGON_VIEWBOX = 96;

export default function DragonMarker({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="Dragón marcador"
    >
      {/* cuerpo serpenteante */}
      <Path
        d="M24 22 C34 12 48 14 55 25 C61 34 56 45 45 49 C36 52 30 58 32 67 C34 77 46 82 57 75"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* asta */}
      <Path d="M31 14 L36 4 L40 16 Z" fill={color} />
      {/* hocico */}
      <Path d="M25 20 L11 25 L23 32 Z" fill={color} />
      {/* ala */}
      <Path d="M47 31 L72 18 L65 42 Z" fill={color} />
      {/* aleta de la cola */}
      <Path d="M57 75 L74 77 L62 86 Z" fill={color} />
    </Svg>
  );
}
