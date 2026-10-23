import { describe, expect, it } from "vitest";

import {
  FOLDER_CARD_ICON_SIZE,
  folderCardColors,
  folderCardStyle,
} from "../../src/components/folderCardStyles";

/**
 * F13 — tarjeta de carpeta ("Tesoros Guardados", SPEC §11.10, V1/V4/V6):
 * fondo `surface`, radio 12, borde `border`, icono monocromo `text-secondary`
 * en cuadrado de 36 px (V4: un icono por significado, sin color por carpeta),
 * contador de obras en pill `elevated`, nombre y descripción. Área táctil
 * mínima de 48 dp (RNF-7). Un solo acceso a carpetas por pantalla (V6).
 */
describe("folderCardStyle (tarjeta de carpeta)", () => {
  it("fondo surface, radio 12, borde border, sin sombra", () => {
    const style = folderCardStyle();
    expect(style.backgroundColor).toBe("#141923");
    expect(style.borderRadius).toBe(12);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe("#263147");
    expect(style.elevation).toBe(0);
    expect(style.shadowOpacity).toBe(0);
  });

  it("relleno interno de 16 px (múltiplo de 4)", () => {
    expect(folderCardStyle().padding).toBe(16);
  });

  it("área táctil mínima de 48 dp (RNF-7)", () => {
    expect(folderCardStyle().minHeight).toBeGreaterThanOrEqual(48);
  });

  it("icono en cuadrado de 36 px con radio 8", () => {
    expect(FOLDER_CARD_ICON_SIZE).toBe(36);
    expect(folderCardStyle().iconBorderRadius).toBe(8);
  });

  it("separación interna de 12 px entre elementos", () => {
    expect(folderCardStyle().gap).toBe(12);
  });
});

describe("folderCardColors (paleta, V1/V4)", () => {
  it("nombre en text-primary, descripción en text-secondary", () => {
    const colors = folderCardColors();
    expect(colors.name).toBe("#F2F0EA");
    expect(colors.description).toBe("#9BA5B5");
  });

  it("icono monocromo en text-secondary (V4: sin color por carpeta)", () => {
    const colors = folderCardColors();
    expect(colors.icon).toBe("#9BA5B5");
    expect(colors.icon).not.toBe("#35C98A");
  });

  it("fondo del icono en elevated, contador en pill elevated", () => {
    const colors = folderCardColors();
    expect(colors.iconBackground).toBe("#1B2230");
    expect(colors.countBackground).toBe("#1B2230");
    expect(colors.countText).toBe("#9BA5B5");
  });
});
