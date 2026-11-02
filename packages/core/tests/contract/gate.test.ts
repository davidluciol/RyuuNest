import { describe, expect, it } from "vitest";

import {
  createHtmlSite,
  createJsonApiSite,
  createSiteHttp,
  EXAMPLE_DECLARATIVE,
  EXAMPLE_SCRIPT_ENTRY,
  EXAMPLE_SCRIPT_HTML,
  EXAMPLE_SCRIPT_JSON,
  HTML_SITE_BASE_URL,
  JSON_API_BASE_URL,
  runContract,
} from "@ryuunest/test-site";

import type { ModuleManifest } from "../../src/contract/types";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock } from "../../src/ports/fakes";
import type { ModuleApiHandle } from "../../src/runtimes/ModuleRuntime";
import { createModuleApi } from "../../src/runtimes/ModuleRuntime";

/**
 * T35 — puerta funcional de cobertura del contrato (AC-11): la matriz
 * runtime × métodos del contrato (SPEC §6.3) se ejecuta aquí completa y el
 * CI falla si alguna celda deja de cumplirse. Es cobertura **funcional**
 * (decisión del humano, 2026-11-01): no se mide % de líneas ni se añade
 * ningún paquete de coverage.
 *
 * Se monta cada módulo por `createModuleApi`, el punto real de producción
 * (selección de runtime + `guardApi`), no los runtimes sueltos.
 */

/** Los cinco métodos del contrato (SPEC §6.3). */
const CONTRACT_METHODS = ["popular", "latest", "search", "details", "pages"] as const;

const CAPABILITIES = ["popular", "latest", "search"] as const;

function manifest(
  overrides: Partial<ModuleManifest> & Pick<ModuleManifest, "id" | "runtime" | "baseUrl" | "entry">,
): ModuleManifest {
  return {
    name: overrides.name ?? overrides.id,
    version: "1.0.0",
    apiVersion: 1,
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    capabilities: [...CAPABILITIES],
    permissions: { domains: [new URL(overrides.baseUrl).hostname] },
    ...overrides,
  };
}

function hostFor(baseUrl: string): ModuleHost {
  const site = baseUrl.startsWith(JSON_API_BASE_URL) ? createJsonApiSite() : createHtmlSite();
  return new ModuleHost({
    http: createSiteHttp(site),
    clock: new FixedClock(10_000),
    permissions: { domains: [new URL(baseUrl).hostname] },
    minDelayMs: 0,
    timeoutMs: 2_000,
  });
}

async function mountDeclarative(): Promise<ModuleApiHandle> {
  return createModuleApi({
    manifest: manifest({
      id: "gate-declarativo",
      runtime: "declarative",
      baseUrl: HTML_SITE_BASE_URL,
      entry: "index.json",
    }),
    entry: JSON.stringify(EXAMPLE_DECLARATIVE),
    host: hostFor(HTML_SITE_BASE_URL),
  });
}

async function mountScriptHtml(): Promise<ModuleApiHandle> {
  return createModuleApi({
    manifest: manifest({
      id: "gate-script-html",
      runtime: "script",
      baseUrl: HTML_SITE_BASE_URL,
      entry: EXAMPLE_SCRIPT_ENTRY,
    }),
    entry: EXAMPLE_SCRIPT_ENTRY,
    files: { [EXAMPLE_SCRIPT_ENTRY]: EXAMPLE_SCRIPT_ENTRY },
    host: hostFor(HTML_SITE_BASE_URL),
    loader: new FakeScriptLoader({ [EXAMPLE_SCRIPT_ENTRY]: EXAMPLE_SCRIPT_HTML }),
  });
}

async function mountScriptJson(): Promise<ModuleApiHandle> {
  return createModuleApi({
    manifest: manifest({
      id: "gate-script-json",
      runtime: "script",
      baseUrl: JSON_API_BASE_URL,
      entry: EXAMPLE_SCRIPT_ENTRY,
    }),
    entry: EXAMPLE_SCRIPT_ENTRY,
    files: { [EXAMPLE_SCRIPT_ENTRY]: EXAMPLE_SCRIPT_ENTRY },
    host: hostFor(JSON_API_BASE_URL),
    loader: new FakeScriptLoader({ [EXAMPLE_SCRIPT_ENTRY]: EXAMPLE_SCRIPT_JSON }),
  });
}

const RUNTIMES: ReadonlyArray<{ name: string; mount: () => Promise<ModuleApiHandle> }> = [
  { name: "declarativo (sitio HTML)", mount: mountDeclarative },
  { name: "script (sitio HTML)", mount: mountScriptHtml },
  { name: "script (sitio JSON con cursor)", mount: mountScriptJson },
];

describe("gate · cobertura del contrato (T35, AC-11)", () => {
  for (const runtime of RUNTIMES) {
    it(`${runtime.name} ejercita los cinco métodos del contrato sin fallos contenidos`, async () => {
      const handle = await runtime.mount();

      const report = await runContract(handle.api, { capabilities: [...CAPABILITIES] });

      expect(new Set(report.methods)).toEqual(new Set<string>(CONTRACT_METHODS));
      expect(report.imageCounts.every((count) => count > 0)).toBe(true);
      expect(handle.lastError()).toBeUndefined();
    });
  }

  it("la matriz exigida es exactamente los cinco métodos del contrato", () => {
    // Si alguien amplía o reduce el contrato, este gate obliga a revisar la
    // puerta a propósito: el CI falla hasta que la matriz se actualice aquí.
    expect([...CONTRACT_METHODS].sort()).toEqual(
      ["details", "latest", "pages", "popular", "search"].sort(),
    );
  });
});
