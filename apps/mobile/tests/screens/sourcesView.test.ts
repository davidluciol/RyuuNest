import { describe, expect, it } from "vitest";

import type { SourceModule } from "../../src/screens/sources/sourcesData";
import {
  MAX_ROW_BADGES,
  moduleBadges,
  moduleRowAction,
  validateRepoUrl,
} from "../../src/screens/sources/sourcesView";

/**
 * F16 — presentación pura de Fuentes: qué insignias lleva una fila (tope de
 * dos señales, como V8/V9 en `DESIGN_RULES.md`), qué acción ofrece y la
 * comprobación de la URL antes de tocar la red (RF-2).
 */

function row(overrides: Partial<SourceModule> = {}): SourceModule {
  return {
    id: "m",
    name: "M",
    status: "available",
    version: "1.0.0",
    runtime: "declarative",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    domains: ["ejemplo.test"],
    repoId: "https://repo.test/index.json",
    enabled: false,
    orphan: false,
    ...overrides,
  };
}

describe("moduleBadges", () => {
  it("un módulo disponible y declarativo no lleva insignias", () => {
    expect(moduleBadges(row())).toEqual([]);
  });

  it("script y NSFW se muestran cuando no hay nada más urgente", () => {
    expect(moduleBadges(row({ runtime: "script", nsfw: true }))).toEqual(["script", "nsfw"]);
  });

  it("un módulo instalado y desactivado lo indica", () => {
    expect(moduleBadges(row({ status: "installed", enabled: false }))).toEqual(["disabled"]);
  });

  it("uno instalado y activo no dice «desactivado»", () => {
    expect(moduleBadges(row({ status: "installed", enabled: true }))).toEqual([]);
  });

  it("prioriza error, actualización y sin repositorio sobre lo demás", () => {
    const all = row({
      status: "installed",
      enabled: false,
      runtime: "script",
      nsfw: true,
      lastError: "falló",
      updateTo: "2.0.0",
      orphan: true,
    });

    expect(moduleBadges(all)).toEqual(["error", "update"]);
  });

  it("nunca pasa del tope de señales por fila", () => {
    const all = row({
      status: "installed",
      runtime: "script",
      nsfw: true,
      lastError: "x",
      updateTo: "2.0.0",
      orphan: true,
    });

    expect(moduleBadges(all).length).toBeLessThanOrEqual(MAX_ROW_BADGES);
    expect(MAX_ROW_BADGES).toBe(2);
  });

  it("un disponible nunca muestra señales de instalado", () => {
    const badges = moduleBadges(row({ status: "available", enabled: false, orphan: true }));

    expect(badges).not.toContain("disabled");
    expect(badges).not.toContain("orphan");
  });
});

describe("moduleRowAction", () => {
  it("un módulo disponible se instala", () => {
    expect(moduleRowAction(row({ status: "available" }))).toBe("install");
  });

  it("uno instalado se gestiona", () => {
    expect(moduleRowAction(row({ status: "installed" }))).toBe("manage");
  });
});

describe("validateRepoUrl (RF-2)", () => {
  it("acepta una URL HTTPS y la recorta", () => {
    expect(validateRepoUrl("  https://repo.test/index.json  ")).toEqual({
      ok: true,
      url: "https://repo.test/index.json",
    });
  });

  it("rechaza vacío", () => {
    expect(validateRepoUrl("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("rechaza HTTP y esquemas distintos de HTTPS", () => {
    expect(validateRepoUrl("http://repo.test/index.json")).toEqual({
      ok: false,
      reason: "not-https",
    });
    expect(validateRepoUrl("ftp://repo.test/index.json")).toEqual({
      ok: false,
      reason: "not-https",
    });
  });

  it("rechaza lo que no es una URL", () => {
    expect(validateRepoUrl("esto no es una url")).toEqual({ ok: false, reason: "invalid" });
  });
});
