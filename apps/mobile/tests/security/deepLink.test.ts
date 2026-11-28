import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createSampleSourcesService } from "../../src/screens/sources/sampleSourcesService";
import { createSourcesController } from "../../src/screens/sources/sourcesController";
import {
  INITIAL_SOURCES_FLOW,
  sourcesFlowReducer,
  type SourcesFlow,
} from "../../src/screens/sources/sourcesFlow";
import type { SourcesService } from "../../src/screens/sources/sourcesData";
import { addRepoLinkUrl } from "../../src/screens/sources/addRepoLink";

/**
 * T33 — enlace profundo `ryuunest://add-repo?url=…` (SPEC §7.2, AC-8): solo puede abrir
 * la confirmación, nunca instalar ni registrar nada.
 *
 * G5: Expo Router lleva `ryuunest://add-repo?url=…` a la ruta `app/add-repo.tsx`, que solo
 * redirige a Portales con la URL como parámetro; Portales la pasa a `openAddRepo(url)` (la
 * hoja con la URL puesta). No hay oyentes de `Linking`: la guarda de abajo falla si aparece
 * otra ruta u oyente, o si la ruta del enlace toca algo más que la redirección.
 */

const MUTATIONS = [
  "addRepo",
  "ensureOfficialRepo",
  "restoreOfficialRepo",
  "refreshRepo",
  "removeRepo",
  "previewInstall",
  "install",
  "setEnabled",
  "uninstall",
  "previewUpdate",
  "applyUpdate",
] as const;

/** Servicio en memoria que anota cada llamada que podría cambiar algo. */
function spiedService(): { service: SourcesService; calls: string[] } {
  const calls: string[] = [];
  const service = createSampleSourcesService();
  const spied: SourcesService = { ...service };
  for (const name of MUTATIONS) {
    const original = service[name] as (...args: never[]) => Promise<unknown>;
    (spied as unknown as Record<string, unknown>)[name] = (...args: never[]) => {
      calls.push(name);
      return original(...args);
    };
  }
  return { service: spied, calls };
}

/** Fuentes que empaqueta Metro: todo `.ts`/`.tsx` bajo `apps/mobile/src`. */
function sourceFiles(): Record<string, string> {
  const root = fileURLToPath(new URL("../../src", import.meta.url));
  const files: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) {
        files[path.relative(root, full).split(path.sep).join("/")] = readFileSync(full, "utf8");
      }
    }
  };
  walk(root);
  return files;
}

describe("seguridad · enlace profundo add-repo (AC-8)", () => {
  it("la entrada de un enlace abre la hoja con la URL puesta y no toca el servicio", async () => {
    const { service, calls } = spiedService();
    let flow: SourcesFlow = INITIAL_SOURCES_FLOW;
    let reloads = 0;
    const controller = createSourcesController({
      service,
      getFlow: () => flow,
      dispatch: (action) => {
        flow = sourcesFlowReducer(flow, action);
      },
      reload: async () => {
        reloads += 1;
      },
      notify: () => undefined,
    });
    const before = await service.load();

    controller.openAddRepo("https://repo.malicioso.example/index.json");

    expect(flow).toEqual({
      sheet: "add-repo",
      error: null,
      url: "https://repo.malicioso.example/index.json",
    });
    expect(calls).toEqual([]);
    expect(reloads).toBe(0);
    expect(await service.load()).toEqual(before);
  });

  it("solo la ruta add-repo atiende el enlace, sin oyentes, y únicamente redirige a Portales", () => {
    const files = sourceFiles();
    const routes = Object.keys(files).filter((file) => /^app\/.*add-repo/.test(file));
    const listeners = Object.entries(files)
      .filter(([, code]) =>
        /Linking\.(addEventListener|getInitialURL)|use(Linking)?URL\(/.test(code),
      )
      .map(([file]) => file);

    expect(routes).toEqual(["app/add-repo.tsx"]);
    expect(listeners).toEqual([]);
    const route = files["app/add-repo.tsx"] ?? "";
    expect(route).toMatch(/<Redirect\s/);
    expect(route).not.toMatch(/Service|install|addRepo\(|submitAddRepo/);
    // Portales recibe la URL y solo abre la hoja (openAddRepo), nunca la registra.
    const sources = files["app/(tabs)/sources.tsx"] ?? "";
    expect(sources).toMatch(/openAddRepo\(/);
    expect(sources).not.toMatch(/submitAddRepo|\.install\(/);
  });

  it("la URL del enlace se toma tal cual (la valida la hoja al confirmar); lo raro se descarta", () => {
    expect(addRepoLinkUrl(" https://repo.example/index.json ")).toBe("https://repo.example/index.json");
    expect(addRepoLinkUrl(["https://a.example/index.json", "https://b.example"])).toBe(
      "https://a.example/index.json",
    );
    expect(addRepoLinkUrl(undefined)).toBeNull();
    expect(addRepoLinkUrl("")).toBeNull();
    expect(addRepoLinkUrl(`https://x.example/${"a".repeat(3000)}`)).toBeNull();
  });
});
