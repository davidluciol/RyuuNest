import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { catalogKeys } from "@ryuunest/i18n";

import { APP_LINKS, APP_VERSION, THIRD_PARTY_CREDITS } from "../../src/about/appInfo";

/**
 * Acerca de (AB2) — datos de la app que comparten móvil y web: versión (la de
 * `app.json`), enlaces al repositorio y créditos de recursos de terceros, que
 * deben coincidir con `docs/ASSETS.md`.
 */
const ROOT = path.resolve(import.meta.dirname, "../..");

describe("datos de «Acerca de»", () => {
  it("la versión es la de app.json", () => {
    const appJson = JSON.parse(readFileSync(path.join(ROOT, "app.json"), "utf8")) as {
      expo: { version: string };
    };
    expect(APP_VERSION).toBe(appJson.expo.version);
  });

  it("código fuente (el repositorio) y licencia (el LICENSE GPL-3.0 del repositorio), con texto en el catálogo", () => {
    const keys = catalogKeys();
    expect(APP_LINKS.map((link) => link.id)).toEqual(["source", "license"]);
    expect(APP_LINKS[0]?.url).toBe("https://github.com/davidluciol/RyuuNest");
    expect(APP_LINKS[1]?.url).toBe("https://github.com/davidluciol/RyuuNest/blob/master/LICENSE");
    expect(readFileSync(path.resolve(ROOT, "../../LICENSE"), "utf8")).toContain("GNU GENERAL PUBLIC LICENSE");
    for (const link of APP_LINKS) expect(keys).toContain(link.labelKey);
  });

  it("cada crédito aparece registrado en docs/ASSETS.md", () => {
    const assets = readFileSync(path.resolve(ROOT, "../../docs/ASSETS.md"), "utf8");
    expect(THIRD_PARTY_CREDITS.length).toBeGreaterThan(0);
    for (const credit of THIRD_PARTY_CREDITS) {
      expect(assets, credit.name).toContain(`**${credit.name}**`);
      expect(assets, `${credit.name}: ${credit.license}`).toContain(credit.license);
    }
  });
});
