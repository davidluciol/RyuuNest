import appJson from "../../app.json";

/**
 * Acerca de — datos de la app que comparten móvil y web (sin react-native: la
 * web los importa por `@ryuunest/mobile-src`). La versión sale de `app.json`,
 * la misma que lee Expo; los créditos repiten lo registrado en `docs/ASSETS.md`
 * (la prueba `tests/about/appInfo.test.ts` vigila que coincidan).
 */

export const APP_VERSION: string = appJson.expo.version;

export interface AppLink {
  readonly id: "source" | "license";
  readonly labelKey: string;
  readonly url: string;
}

export const APP_LINKS: readonly AppLink[] = [
  { id: "source", labelKey: "about.links.source", url: "https://github.com/davidluciol/RyuuNest" },
  // shortcut: el repo aún no tiene LICENSE; cuando lo tenga, enlazar a `…/blob/master/LICENSE`.
  { id: "license", labelKey: "about.links.license", url: "https://www.gnu.org/licenses/gpl-3.0.html" },
];

export interface ThirdPartyCredit {
  readonly name: string;
  readonly license: string;
}

export const THIRD_PARTY_CREDITS: readonly ThirdPartyCredit[] = [
  { name: "Manrope", license: "OFL-1.1" },
  { name: "Inter", license: "OFL-1.1" },
  { name: "JetBrains Mono", license: "OFL-1.1" },
  { name: "Lucide", license: "ISC" },
  { name: "Tabler Icons", license: "MIT" },
];
