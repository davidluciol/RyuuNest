/**
 * F10 — internacionalización (RF-40, RNF-11): todas las cadenas visibles viven
 * en el catálogo (`es.json`) y se leen por clave; los números y las fechas se
 * formatean en la localidad activa.
 *
 * Añadir inglés es **rellenar un catálogo** y registrarlo en `supportedLocales`:
 * ningún componente cambia. Un idioma declarado tiene que traer su catálogo
 * completo; mientras no exista, pedirlo es un error (falla ruidosamente antes
 * de publicar una pantalla a medio traducir).
 */

import es from "./es.json";

/** Códigos de idioma soportados. Añadir inglés: `"es" | "en"` y su catálogo. */
export type LocaleCode = "es";

/** Un catálogo es un mapa plano de clave a texto (las claves usan puntos). */
export type Catalog = Record<string, string>;

/** Etiqueta BCP-47 para `Intl` (el idioma base puede tener variantes regionales). */
const LOCALE_TAGS: Record<LocaleCode, string> = {
  es: "es-ES",
};

/** Catálogos disponibles, por código de idioma. */
export const catalogs: Partial<Record<LocaleCode, Catalog>> = {
  es: es as Catalog,
};

/** Idioma por defecto y de respaldo (RF-40: la interfaz nace en español). */
export const defaultLocale: LocaleCode = "es";

/** Idiomas con catálogo registrado. */
export const supportedLocales: readonly LocaleCode[] = ["es"];

let activeLocale: LocaleCode = defaultLocale;

/** Cambia el idioma activo; falla si no hay catálogo registrado. */
export function setLocale(code: LocaleCode): void {
  if (!supportedLocales.includes(code)) {
    throw new Error(`Idioma sin catálogo registrado: «${String(code)}»`);
  }
  activeLocale = code;
}

/** Idioma activo. */
export function getLocale(): LocaleCode {
  return activeLocale;
}

/** Etiqueta BCP-47 del idioma (para `Intl`). */
export function localeTag(code: LocaleCode = activeLocale): string {
  return LOCALE_TAGS[code];
}

/** Rellena los `{parametros}` de una plantilla; falta de parámetro = error. */
function interpolate(key: string, template: string, params: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Falta el parámetro «${name}» de la traducción «${key}»`);
    }
    return String(value);
  });
}

/**
 * Traduce una clave. Una clave inexistente es un error de programación: falla
 * en vez de pintar texto de relleno (y las pruebas de catálogo lo detectan).
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  code: LocaleCode = activeLocale,
): string {
  const template = catalogs[code]?.[key] ?? catalogs[defaultLocale]?.[key];
  if (template === undefined) {
    throw new Error(`Falta la traducción de «${key}» (${code})`);
  }
  // Si la plantilla pide parámetros, hay que darlos: si no, se pintaría «{query}».
  return template.includes("{") ? interpolate(key, template, params ?? {}) : template;
}

/** Todas las claves del catálogo por defecto (para las puertas de calidad). */
export function catalogKeys(): string[] {
  return Object.keys(catalogs[defaultLocale] ?? {});
}

/** Número en el formato de la localidad activa (RNF-11). */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  code: LocaleCode = activeLocale,
): string {
  return new Intl.NumberFormat(localeTag(code), options).format(value);
}

/** Fecha en el formato de la localidad activa (RNF-11). */
export function formatDate(
  value: Date,
  options?: Intl.DateTimeFormatOptions,
  code: LocaleCode = activeLocale,
): string {
  return new Intl.DateTimeFormat(localeTag(code), options).format(value);
}
