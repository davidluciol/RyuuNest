import { describe, expect, it } from "vitest";

import { t } from "../../src/i18n";
import {
  BOTTOM_NAV_DESTINATIONS,
  HEADER_HEIGHT,
  NAV_BAR_HEIGHT,
  bottomNavStyle,
  headerStyle,
  navItemColors,
  navItemStyle,
} from "../../src/components/shellStyles";
import {
  SETTINGS_ROW_MIN_HEIGHT,
  settingsRowStyle,
  sheetStyle,
} from "../../src/components/sheetStyles";

/**
 * F07 — cabecera única, barra inferior de 5 destinos, fila de ajustes y
 * hojas/diálogos (SPEC §11.10, T1, V5, RNF-12). Sin sombras: la profundidad
 * es por niveles de superficie (elevated sobre bg).
 */
describe("headerStyle (cabecera única, V5)", () => {
  it("fondo elevated, sin sombra, altura de cabecera", () => {
    expect(headerStyle()).toMatchObject({ backgroundColor: "#1B2230" });
    expect(headerStyle().elevation).toBe(0);
    expect(headerStyle().shadowOpacity).toBe(0);
    expect(HEADER_HEIGHT).toBeGreaterThan(0);
  });
});

describe("barra inferior de 5 destinos (T1)", () => {
  it("exactamente 5 destinos, identificados por id y etiquetados por el catálogo (F10)", () => {
    expect(BOTTOM_NAV_DESTINATIONS).toEqual(["home", "library", "discover", "sources", "settings"]);
    // Las etiquetas visibles viven en el catálogo, no en el componente.
    expect(BOTTOM_NAV_DESTINATIONS.map((id) => t(`nav.${id}`))).toEqual([
      "Inicio",
      "Biblioteca",
      "Descubrir",
      "Fuentes",
      "Ajustes",
    ]);
  });

  it("elevated al 95 %, borde border, sin sombra (RNF-12)", () => {
    expect(bottomNavStyle()).toMatchObject({
      backgroundColor: "rgba(27, 34, 48, 0.95)",
      borderTopColor: "#263147",
      elevation: 0,
      shadowOpacity: 0,
    });
    expect(NAV_BAR_HEIGHT).toBeGreaterThanOrEqual(48);
  });

  it("destino activo en accent, inactivo en text-secondary", () => {
    expect(navItemColors(true)).toEqual({ icon: "#35C98A", text: "#35C98A" });
    expect(navItemColors(false)).toEqual({ icon: "#9BA5B5", text: "#9BA5B5" });
  });

  it("garantiza 48 × 48 sin hitSlop solapado y foco visible de 2 px", () => {
    expect(navItemStyle({ focused: false, pressed: false, disabled: false })).toMatchObject({
      minWidth: 48,
      minHeight: 48,
      outlineColor: "transparent",
    });
    expect(navItemStyle({ focused: true, pressed: false, disabled: false })).toMatchObject({
      outlineColor: "#35C98A",
      outlineWidth: 2,
      outlineOffset: 2,
    });
  });

  it("diferencia presionado y deshabilitado sin introducir colores nuevos", () => {
    expect(navItemStyle({ focused: false, pressed: true, disabled: false }).backgroundColor).toBe(
      "rgba(53, 201, 138, 0.1)",
    );
    expect(navItemStyle({ focused: false, pressed: false, disabled: true }).opacity).toBeLessThan(
      1,
    );
  });
});

describe("fila de ajustes y hojas/diálogos", () => {
  it("fila de ajustes: alto mínimo y relleno", () => {
    expect(SETTINGS_ROW_MIN_HEIGHT).toBeGreaterThanOrEqual(48);
    expect(settingsRowStyle().paddingHorizontal).toBe(16);
  });

  it("hoja: nivel elevated, esquinas superiores redondeadas, sin sombra", () => {
    const sheet = sheetStyle();
    expect(sheet.backgroundColor).toBe("#1B2230");
    expect(sheet.borderTopLeftRadius).toBeGreaterThan(0);
    expect(sheet.borderTopRightRadius).toBeGreaterThan(0);
    expect(sheet.borderBottomLeftRadius).toBe(0);
    expect(sheet.elevation).toBe(0);
    expect(sheet.shadowOpacity).toBe(0);
  });
});
