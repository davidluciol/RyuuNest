import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { moduleRowStyle, moduleRowTextColors } from "../../src/components/moduleRowStyles";
import {
  repoCardStyle,
  repoCardTextColors,
  repoSyncButtonStyle,
} from "../../src/components/repoCardStyles";
import { sheetBackdropStyle } from "../../src/components/sheetModalStyles";

/**
 * F16 — estilos puros de los componentes de Fuentes: tarjeta de repositorio,
 * fila de módulo y velo de la hoja modal. Todo desde `ui-tokens` (sin
 * literales), áreas táctiles de 48 dp (RNF-7) y profundidad por superficie,
 * sin sombra (V11).
 */
describe("repoCardStyle", () => {
  it("es una tarjeta plana de superficie con radio de tarjeta", () => {
    expect(repoCardStyle()).toMatchObject({
      backgroundColor: "#141923",
      borderRadius: 12,
      elevation: 0,
      shadowOpacity: 0,
    });
  });

  it("el botón de sincronizar mide 48 × 48 (RNF-7)", () => {
    expect(repoSyncButtonStyle()).toMatchObject({ width: 48, height: 48 });
  });

  it("el nombre va en texto principal y la URL en secundario", () => {
    expect(repoCardTextColors()).toEqual({ name: "#F2F0EA", url: "#9BA5B5" });
  });
});

describe("moduleRowStyle", () => {
  it("es una fila plana con área táctil mínima de 48 dp", () => {
    expect(moduleRowStyle()).toMatchObject({
      backgroundColor: "#141923",
      borderRadius: 12,
      minHeight: 48,
      elevation: 0,
      shadowOpacity: 0,
    });
  });

  it("nombre en principal, metadatos en secundario y error con el color de error", () => {
    expect(moduleRowTextColors()).toEqual({
      name: "#F2F0EA",
      meta: "#9BA5B5",
      error: "#F06A6A",
    });
  });
});

describe("sheetBackdropStyle", () => {
  it("es un velo oscuro semitransparente que ocupa la pantalla y deja la hoja abajo", () => {
    expect(sheetBackdropStyle()).toMatchObject({ flex: 1, justifyContent: "flex-end" });
    expect(sheetBackdropStyle().backgroundColor).toMatch(/^rgba\(11, 14, 20, 0\.64\)$/);
  });
});

describe("hoja de gestión de módulo (F38)", () => {
  it("«Desinstalar» va aparte de «Activar/Desactivar», con separación de ancho de zona táctil", () => {
    const src = readFileSync(
      path.resolve(process.cwd(), "src/screens/sources/SourcesSheets.tsx"),
      "utf8",
    );
    expect(src).toMatch(/destructiveZone:\s*\{[^}]*marginTop:\s*spacing\.xl/);
    expect(src).toMatch(/style=\{styles\.destructiveZone\}[\s\S]*?sources\.manage\.uninstall/);
  });
});
