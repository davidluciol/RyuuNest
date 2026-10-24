import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ModuleApi } from "../../../src/contract/types";
import { ModuleHost } from "../../../src/host/ModuleHost";
import { StubHttp, type StubHttpRoute } from "../../../src/ports/fakes";
import type { Http } from "../../../src/ports/http";
import type { ScriptFactory, ScriptLoader } from "../../../src/ports/scriptLoader";
import { ScriptRuntime } from "../../../src/runtimes/ScriptRuntime";

export const BASE = "https://zonatmo.com";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, "../../../../test-site/fixtures/tmo");
const MODULE_DIR = resolve(HERE, "../../../../../modules/tmo");

export function fixture(name: string): string {
  return readFileSync(resolve(FIXTURES, name), "utf8");
}

export function moduleSource(): string {
  return readFileSync(resolve(MODULE_DIR, "module.js"), "utf8");
}

export function manifestJson(): unknown {
  return JSON.parse(readFileSync(resolve(MODULE_DIR, "manifest.json"), "utf8")) as unknown;
}

/** Carga el código fuente del módulo como un módulo ES real (URL `data:`). */
export class DataUrlScriptLoader implements ScriptLoader {
  async load(source: string): Promise<ScriptFactory> {
    const url = `data:text/javascript;base64,${Buffer.from(source, "utf8").toString("base64")}`;
    const loaded = (await import(/* @vite-ignore */ url)) as { default: ScriptFactory };
    return loaded.default;
  }
}

/** Sitio falso de TMO: las rutas que usa el módulo, con las fixtures. */
export function tmoRoutes(): Record<string, StubHttpRoute> {
  return {
    [`${BASE}/populars`]: { body: fixture("populars.html") },
    [`${BASE}/latest_uploads?uploads_mode=thumbnail`]: { body: fixture("latest.html") },
    [`${BASE}/library?title=drag%C3%B3n&pg=1`]: { body: fixture("library-page1.html") },
    [`${BASE}/library?title=drag%C3%B3n&pg=2`]: { body: fixture("library-page2.html") },
    [`${BASE}/library?title=drag%C3%B3n&pg=3`]: { body: fixture("library-empty.html") },
    [`${BASE}/library?title=nada&pg=1`]: { body: fixture("library-empty.html") },
    [`${BASE}/library/manga/101/dragon-de-ceniza`]: { body: fixture("series.html") },
    [`${BASE}/view_uploads/9003`]: {
      body: fixture("viewer-paginated.html"),
      finalUrl: `${BASE}/viewer/abc123/paginated`,
    },
    [`${BASE}/view_uploads/9004?lang=es`]: {
      body: fixture("viewer-paginated.html"),
      finalUrl: `${BASE}/viewer/def456/paginated`,
    },
    [`${BASE}/viewer/abc123/cascade`]: { body: fixture("viewer-cascade.html") },
    [`${BASE}/viewer/def456/cascade`]: { body: fixture("viewer-cascade.html") },
  };
}

export interface TmoApiOptions {
  http?: Http;
  timeoutMs?: number;
}

export function makeHost(options: TmoApiOptions = {}): ModuleHost {
  return new ModuleHost({
    http: options.http ?? new StubHttp(tmoRoutes()),
    clock: { now: () => Date.now() },
    permissions: { domains: ["zonatmo.com"] },
    minDelayMs: 0,
    timeoutMs: options.timeoutMs ?? 2_000,
  });
}

/** Monta la `ModuleApi` del módulo TMO tal como lo haría la app (T18/T20). */
export function makeTmoApi(options: TmoApiOptions = {}): Promise<ModuleApi> {
  return new ScriptRuntime({
    host: makeHost(options),
    loader: new DataUrlScriptLoader(),
    source: moduleSource(),
  }).createApi();
}
