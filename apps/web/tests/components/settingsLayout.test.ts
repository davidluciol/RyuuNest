import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F34.2 — Ajustes web: botones con verbo corto (no repiten la etiqueta de la
 * fila), filas de una tarjeta separadas por una línea `border` y Fuentes en la
 * misma columna de 720 px que Ajustes y Diagnóstico.
 */
const src = path.resolve(process.cwd(), "src/screens");
const tsx = readFileSync(path.join(src, "settings/SettingsScreen.tsx"), "utf8");
const settingsCss = readFileSync(path.join(src, "settings/settings.css"), "utf8");
const sourcesCss = readFileSync(path.join(src, "sources/sources.css"), "utf8");

describe("Ajustes web (F34.2)", () => {
  it("los botones usan verbos cortos del catálogo", () => {
    expect(tsx).toContain('label={t("settings.backup.exportAction")}');
    expect(tsx).toContain('label={t("settings.backup.importAction")}');
    expect(tsx).toContain('label={t("settings.cache.clearAction")}');
    expect(tsx).not.toContain('label={t("settings.cache.clear")}');
  });

  it("cada botón conserva la etiqueta larga como nombre accesible", () => {
    expect(tsx).toContain('ariaLabel={t("settings.cache.clear")}');
    expect(tsx).toContain('ariaLabel={t("settings.backup.export")}');
    expect(tsx).toContain('ariaLabel={t("settings.backup.import")}');
  });

  it("las filas de una tarjeta se separan con una línea border", () => {
    expect(settingsCss).toMatch(
      /\.settings-card > \.settings-row \+ \.settings-row[^{]*\{[^}]*border-top:\s*1px solid var\(--color-border\)/,
    );
  });

  it("Fuentes usa la columna de 720 px (15 × space-2xl)", () => {
    expect(sourcesCss).toMatch(
      /\.sources-screen\s*\{[^}]*max-width:\s*calc\(var\(--space-2xl\) \* 15\)/,
    );
  });
});
