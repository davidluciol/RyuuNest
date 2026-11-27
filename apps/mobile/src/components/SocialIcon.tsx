import Svg, { Path } from "react-native-svg";

import { SOCIAL_NETWORKS, type SocialFallback, type SocialNetwork } from "../about/socialIcons";
import { Coffee, Globe, Palette, type LucideIcon } from "../icons";

/**
 * Acerca de — icono de una red social: el logo de Tabler (MIT, trazos en
 * `about/socialIcons.ts`) o, si la red no tiene logo libre, el genérico de
 * Lucide. Misma rejilla y trazo que el resto de iconos (24×24, trazo 2).
 */

const FALLBACKS: Record<SocialFallback, LucideIcon> = { coffee: Coffee, palette: Palette, globe: Globe };

export interface SocialIconProps {
  network: SocialNetwork;
  size: number;
  color: string;
}

export default function SocialIcon({ network, size, color }: SocialIconProps) {
  const { paths, fallback = "globe" } = SOCIAL_NETWORKS[network];
  if (paths === undefined) {
    const Icon = FALLBACKS[fallback];
    return <Icon size={size} color={color} />;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}
