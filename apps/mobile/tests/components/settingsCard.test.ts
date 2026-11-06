import { readFileSync } from "node:fs";
import path from "node:path";

import { contrastRatio, contentMaxWidth, dragonNightColors, radii } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import {
  contentColumnStyle,
  settingsCardDividerStyle,
  settingsCardStyle,
} from "../../src/components/cardStyles";

/**
 * F34.2 — secciones de Ajustes como tarjetas `surface` con borde y separadores
 * (`ajustes_pantalla/screen.png`), dentro de una columna centrada de 720 dp en
 * escritorio, y un solo patrón de aviso (`Toast`, sin el bloque rojo ad hoc).
 */
const c = dragonNightColors;

describe("settingsCardStyle", () => {
  it("tarjeta surface con borde y esquinas card, sin sombra", () => {
    const s = settingsCardStyle();
    expect(s.backgroundColor).toBe(c.surface);
    expect(s.borderColor).toBe(c.border);
    expect(s.borderWidth).toBe(1);
    expect(s.borderRadius).toBe(radii.card);
    expect(s.overflow).toBe("hidden");
  });

  it("el separador usa el color border y 1 dp", () => {
    expect(settingsCardDividerStyle()).toEqual({ height: 1, backgroundColor: c.border });
  });

  it("la tarjeta se distingue del fondo", () => {
    expect(contrastRatio(c.surface, c.bg)).toBeGreaterThan(1);
  });
});

describe("contentColumnStyle", () => {
  it("no limita el ancho en móvil y centra una columna de 720 en escritorio", () => {
    expect(contentMaxWidth).toBe(720);
    expect(contentColumnStyle()).toEqual({
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
    });
  });
});

describe("un solo patrón de aviso", () => {
  it("Ajustes ya no pinta el bloque rojo ad hoc y usa NoticeToast", () => {
    const src = readFileSync(
      path.resolve(process.cwd(), "src/screens/settings/SettingsScreen.tsx"),
      "utf8",
    );
    expect(src).not.toContain("noticeText");
    expect(src).toContain("NoticeToast");
  });
});
