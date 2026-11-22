import { describe, expect, it } from "vitest";

import { isTvDevice, nextRailIndex, TV_SAFE_MARGINS } from "../../src/tv/tvShell";
import {
  RAIL_ICON_SIZE,
  RAIL_ITEM_MIN_HEIGHT,
  RAIL_LABEL,
  railNavStyle,
} from "../../src/components/shellStyles";

/**
 * F22 — densidad TV: riel lateral en lugar de la barra inferior (SPEC §11.10),
 * tamaños ×1,25 (SPEC §11.9), márgenes seguros y navegación con D-pad/teclado.
 */
describe("isTvDevice", () => {
  it("TV nativa por Platform.isTV", () => {
    expect(isTvDevice(true, undefined)).toBe(true);
  });

  it("TV por userAgent (web y simulación en Playwright)", () => {
    expect(isTvDevice(undefined, "Mozilla/5.0 (Linux; Android 9; MIBOX4 Build) SmartTV")).toBe(
      true,
    );
    expect(isTvDevice(false, "Mozilla/5.0 (X11; Linux) Android TV")).toBe(true);
  });

  it("teléfono, escritorio o sin datos: no es TV", () => {
    expect(isTvDevice(false, "Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile")).toBe(false);
    expect(isTvDevice(undefined, undefined)).toBe(false);
  });
});

describe("nextRailIndex (flechas/D-pad en el riel vertical)", () => {
  it("abajo y arriba mueven un destino", () => {
    expect(nextRailIndex(0, "ArrowDown", 5)).toBe(1);
    expect(nextRailIndex(3, "ArrowUp", 5)).toBe(2);
  });

  it("se detiene en los extremos, como el D-pad nativo", () => {
    expect(nextRailIndex(4, "ArrowDown", 5)).toBe(4);
    expect(nextRailIndex(0, "ArrowUp", 5)).toBe(0);
  });

  it("otras teclas o foco fuera del riel no se gestionan", () => {
    expect(nextRailIndex(1, "Tab", 5)).toBeNull();
    expect(nextRailIndex(-1, "ArrowDown", 5)).toBeNull();
  });
});

describe("riel lateral de TV", () => {
  it("márgenes seguros de TV de la rejilla de 4 px", () => {
    expect(TV_SAFE_MARGINS).toEqual({ paddingHorizontal: 48, paddingVertical: 32 });
  });

  it("nivel elevated, borde derecho border, sin sombra, ancho del riel existente", () => {
    expect(railNavStyle()).toMatchObject({
      backgroundColor: "#1B2230",
      borderRightColor: "#263147",
      borderRightWidth: 1,
      width: 240,
      elevation: 0,
      shadowOpacity: 0,
    });
  });

  it("tamaños ×1,25: área de 60, icono de 30 y etiqueta labelMd escalada", () => {
    expect(RAIL_ITEM_MIN_HEIGHT).toBe(60);
    expect(RAIL_ICON_SIZE).toBe(30);
    expect(RAIL_LABEL).toMatchObject({ fontSize: 15, lineHeight: 20 });
  });
});
