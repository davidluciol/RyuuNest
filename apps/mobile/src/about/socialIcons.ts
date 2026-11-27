/**
 * Acerca de — redes sociales de los artistas. Solo datos: cada plataforma
 * dibuja los trazos con su propia librería SVG (`react-native-svg` en móvil,
 * `<svg>` en web).
 *
 * Los logos son trazos copiados de **Tabler Icons** v3.53.0 (MIT © Paweł Kuna,
 * `github.com/tabler/tabler-icons`, `icons/outline/brand-*.svg`), registrados
 * en `ASSETS.md`. Misma rejilla que Lucide: 24×24, trazo 2, extremos redondos.
 * Las marcas son de sus dueños; solo se usan para enlazar al perfil.
 * Las redes sin logo en Tabler (`paths` ausente) usan el genérico de Lucide.
 */

/** Icono genérico de Lucide para las redes sin logo libre. */
export type SocialFallback = "coffee" | "palette" | "globe";

export interface SocialNetworkInfo {
  /** Nombre visible de la red, en el catálogo. */
  readonly labelKey: string;
  /** Trazos `d` del logo de Tabler (viewBox 24×24); ausente = genérico. */
  readonly paths?: readonly string[];
  readonly fallback?: SocialFallback;
}

const NETWORKS = {
  instagram: {
    labelKey: "about.social.instagram",
    paths: [
      "M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10",
      "M8.5 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 0 0 -7 0",
      "M17 7v.01",
    ],
  },
  telegram: {
    labelKey: "about.social.telegram",
    paths: ["M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"],
  },
  x: {
    labelKey: "about.social.x",
    paths: ["M4 4l11.733 16h4.267l-11.733 -16l-4.267 0", "M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"],
  },
  tiktok: {
    labelKey: "about.social.tiktok",
    paths: [
      "M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917",
    ],
  },
  youtube: {
    labelKey: "about.social.youtube",
    paths: [
      "M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8",
      "M10 9l5 3l-5 3l0 -6",
    ],
  },
  discord: {
    labelKey: "about.social.discord",
    paths: [
      "M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0",
      "M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0",
      "M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3",
      "M7 16.5c3.5 1 6.5 1 10 0",
    ],
  },
  twitch: {
    labelKey: "about.social.twitch",
    paths: [
      "M4 5v11a1 1 0 0 0 1 1h2v4l4 -4h5.584c.266 0 .52 -.105 .707 -.293l2.415 -2.414c.187 -.188 .293 -.442 .293 -.708v-8.585a1 1 0 0 0 -1 -1h-14a1 1 0 0 0 -1 1l.001 0",
      "M16 8l0 4",
      "M12 8l0 4",
    ],
  },
  patreon: {
    labelKey: "about.social.patreon",
    paths: [
      "M20 8.408c-.003 -2.299 -1.746 -4.182 -3.79 -4.862c-2.54 -.844 -5.888 -.722 -8.312 .453c-2.939 1.425 -3.862 4.545 -3.896 7.656c-.028 2.559 .22 9.297 3.92 9.345c2.75 .036 3.159 -3.603 4.43 -5.356c.906 -1.247 2.071 -1.599 3.506 -1.963c2.465 -.627 4.146 -2.626 4.142 -5.273",
    ],
  },
  deviantart: {
    labelKey: "about.social.deviantart",
    paths: ["M18 3v4l-3.857 6h3.857v4h-6.429l-2.571 4h-3v-4l3.857 -6h-3.857v-4h6.429l2.571 -4l3 0"],
  },
  bluesky: {
    labelKey: "about.social.bluesky",
    paths: [
      "M6.335 5.144c-1.654 -1.199 -4.335 -2.127 -4.335 .826c0 .59 .35 4.953 .556 5.661c.713 2.463 3.13 2.75 5.444 2.369c-4.045 .665 -4.889 3.208 -2.667 5.41c1.03 1.018 1.913 1.59 2.667 1.59c2 0 3.134 -2.769 3.5 -3.5c.333 -.667 .5 -1.167 .5 -1.5c0 .333 .167 .833 .5 1.5c.366 .731 1.5 3.5 3.5 3.5c.754 0 1.637 -.571 2.667 -1.59c2.222 -2.203 1.378 -4.746 -2.667 -5.41c2.314 .38 4.73 .094 5.444 -2.369c.206 -.708 .556 -5.072 .556 -5.661c0 -2.953 -2.68 -2.025 -4.335 -.826c-2.293 1.662 -4.76 5.048 -5.665 6.856c-.905 -1.808 -3.372 -5.194 -5.665 -6.856",
    ],
  },
  threads: {
    labelKey: "about.social.threads",
    paths: [
      "M19 7.5c-1.333 -3 -3.667 -4.5 -7 -4.5c-5 0 -8 2.5 -8 9s3.5 9 8 9s7 -3 7 -5s-1 -5 -7 -5c-2.5 0 -3 1.25 -3 2.5c0 1.5 1 2.5 2.5 2.5c2.5 0 3.5 -1.5 3.5 -5s-2 -4 -3 -4s-1.833 .333 -2.5 1",
    ],
  },
  facebook: {
    labelKey: "about.social.facebook",
    paths: ["M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"],
  },
  behance: {
    labelKey: "about.social.behance",
    paths: [
      "M3 18v-12h4.5a3 3 0 0 1 0 6a3 3 0 0 1 0 6h-4.5",
      "M3 12l4.5 0",
      "M14 13h7a3.5 3.5 0 0 0 -7 0v2a3.5 3.5 0 0 0 6.64 1",
      "M16 6l3 0",
    ],
  },
  linktree: {
    labelKey: "about.social.linktree",
    paths: ["M4 10h16", "M6.5 4.5l11 11", "M6.5 15.5l11 -11", "M12 10v-8", "M12 15v7"],
  },
  github: {
    labelKey: "about.social.github",
    paths: [
      "M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5",
    ],
  },
  kofi: { labelKey: "about.social.kofi", fallback: "coffee" },
  pixiv: { labelKey: "about.social.pixiv", fallback: "palette" },
  artstation: { labelKey: "about.social.artstation", fallback: "palette" },
  web: { labelKey: "about.social.web", fallback: "globe" },
} satisfies Record<string, SocialNetworkInfo>;

/** Identificador de red: las claves del registro (sin repetirlas como texto). */
export type SocialNetwork = keyof typeof NETWORKS;

export const SOCIAL_NETWORKS: Readonly<Record<SocialNetwork, SocialNetworkInfo>> = NETWORKS;
