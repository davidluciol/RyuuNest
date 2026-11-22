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

/**
 * T33 — enlace profundo `ryuunest://add-repo?url=…` (SPEC §7.2, AC-8): solo puede abrir
 * la confirmación, nunca instalar ni registrar nada.
 *
 * Hoy la app declara el esquema (`app.json`) pero **no maneja ningún enlace entrante**:
 * Expo Router manda `ryuunest://add-repo` a su pantalla de ruta inexistente y no pasa
 * nada. La guarda de abajo falla si alguien añade un manejador, para que lo conecte a
 * `openAddRepo(url)` (la hoja con la URL puesta) y amplíe esta prueba.
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

  it("ninguna ruta ni oyente atiende enlaces entrantes (si aparece uno, debe pasar por openAddRepo)", () => {
    const files = sourceFiles();
    const routes = Object.keys(files).filter((file) => /^app\/.*add-repo/.test(file));
    const listeners = Object.entries(files)
      .filter(([, code]) =>
        /Linking\.(addEventListener|getInitialURL)|\buse(Linking)?URL\(/.test(code),
      )
      .map(([file]) => file);

    expect(Object.keys(files).length).toBeGreaterThan(0);
    expect(routes).toEqual([]);
    expect(listeners).toEqual([]);
  });
});
