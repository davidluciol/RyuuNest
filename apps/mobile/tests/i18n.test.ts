import { describe, expect, it } from "vitest";

import {
  catalogs,
  catalogKeys,
  defaultLocale,
  formatDate,
  formatNumber,
  getLocale,
  localeTag,
  setLocale,
  supportedLocales,
  t,
} from "../src/i18n";

/**
 * F10 — internacionalización (RF-40, RNF-11): las cadenas visibles viven en el
 * catálogo (`es.json`) y se leen por clave; los números y las fechas se formatean
 * en la localidad activa. La estructura está lista para añadir inglés: hoy el
 * único catálogo es `es`.
 */
describe("catálogo de traducciones (RF-40)", () => {
  it("lee las cadenas por clave, en español por defecto", () => {
    expect(defaultLocale).toBe("es");
    expect(getLocale()).toBe("es");
    expect(t("nav.home")).toBe("Inicio");
    expect(t("state.empty.library.title")).toBe("Tu biblioteca está vacía");
  });

  it("interpola parámetros entre llaves", () => {
    expect(t("state.empty.search.message", { query: "dragón" })).toBe(
      "Ningún resultado para «dragón».",
    );
  });

  it("falla ruidosamente si falta una clave o un parámetro (error de programación)", () => {
    expect(() => t("no.existe.esta.clave")).toThrow(/no\.existe\.esta\.clave/);
    expect(() => t("state.empty.search.message")).toThrow(/query/);
  });

  it("la estructura admite más idiomas aunque hoy solo exista español", () => {
    expect(supportedLocales).toEqual(["es"]);
    expect(Object.keys(catalogs)).toEqual(["es"]);
    // Añadir inglés es rellenar un catálogo, no tocar componentes. Hoy tanto el
    // tipo como el guardia de ejecución lo rechazan:
    // @ts-expect-error «en» todavía no tiene catálogo registrado.
    expect(() => setLocale("en")).toThrow(/en/);
    expect(getLocale()).toBe("es");
  });

  it("el catálogo no tiene claves vacías ni mal formadas", () => {
    const keys = catalogKeys();
    expect(keys.length).toBeGreaterThan(20);
    const catalog = catalogs[defaultLocale] ?? {};
    for (const key of keys) {
      expect(catalog[key]?.trim().length, `clave vacía: ${key}`).toBeGreaterThan(0);
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/);
    }
  });
});

describe("formatos locales (RNF-11)", () => {
  it("los números usan el separador de miles y decimales de la localidad", () => {
    expect(localeTag()).toBe("es-ES");
    // En español el agrupado de miles empieza a partir de cinco cifras.
    expect(formatNumber(1000)).toBe("1000");
    expect(formatNumber(12345.6)).toBe("12.345,6");
    expect(formatNumber(0.5)).toBe("0,5");
  });

  it("las fechas se formatean en la localidad activa", () => {
    const date = new Date(Date.UTC(2026, 9, 20));
    expect(formatDate(date, { timeZone: "UTC" })).toBe("20/10/2026");
  });
});
