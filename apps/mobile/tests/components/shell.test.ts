import { describe, expect, it } from "vitest";

import {
  BOTTOM_NAV_DESTINATIONS,
  HEADER_HEIGHT,
  NAV_BAR_HEIGHT,
  bottomNavStyle,
  headerStyle,
  navItemColors,
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
  it("exactamente 5 destinos: Inicio, Biblioteca, Descubrir, Fuentes, Ajustes", () => {
    expect(BOTTOM_NAV_DESTINATIONS).toEqual([
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
