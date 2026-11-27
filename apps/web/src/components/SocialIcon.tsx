import { SOCIAL_NETWORKS, type SocialFallback, type SocialNetwork } from "@ryuunest/mobile-src/about/socialIcons";

import { Coffee, Globe, Palette, type LucideIcon } from "../icons";

/**
 * Acerca de (AB3) — icono de una red social en DOM: los trazos de Tabler (MIT,
 * `about/socialIcons.ts`, compartidos con móvil) o el genérico de Lucide si la
 * red no tiene logo libre. Misma rejilla y trazo que Lucide (24×24, trazo 2).
 */

const FALLBACKS: Record<SocialFallback, LucideIcon> = { coffee: Coffee, palette: Palette, globe: Globe };

export default function SocialIcon({ network, size }: { network: SocialNetwork; size: number }) {
  const { paths, fallback = "globe" } = SOCIAL_NETWORKS[network];
  if (paths === undefined) {
    const Icon = FALLBACKS[fallback];
    return <Icon size={size} aria-hidden />;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
