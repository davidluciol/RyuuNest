import { describe, expect, it } from "vitest";

import type { ModuleErrorCode } from "../../src/contract/errors";
import { ModuleError } from "../../src/contract/errors";
import { ModuleHost, type ModuleHostOptions } from "../../src/host/ModuleHost";
import type { Clock } from "../../src/ports/clock";
import type { Http, HttpResponse } from "../../src/ports/http";

const realClock: Clock = { now: () => Date.now() };
const noopLogger = (): void => {};

/** `Http` controlable: mide concurrencia y tiempos de inicio. */
class TrackingHttp implements Http {
  active = 0;
  maxActive = 0;
  readonly starts: Array<{ url: string; at: number }> = [];

  constructor(private readonly behavior: { delayMs?: number; never?: boolean } = {}) {}

  async request(url: string): Promise<HttpResponse> {
    this.starts.push({ url, at: Date.now() });
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);

    try {
      if (this.behavior.never === true) {
        await new Promise<void>(() => {});
      } else if (this.behavior.delayMs !== undefined) {
        await new Promise<void>((resolve) => setTimeout(resolve, this.behavior.delayMs));
      }
      return { status: 200, headers: {}, text: async () => "ok" };
    } finally {
      this.active -= 1;
    }
  }
}

function makeHost(
  options: {
    http?: Http;
    domains?: string[];
    timeoutMs?: number;
    maxConcurrent?: number;
    minDelayMs?: number;
    logger?: ModuleHostOptions["logger"];
  } = {},
): ModuleHost {
  return new ModuleHost({
    http: options.http ?? new TrackingHttp(),
    clock: realClock,
    permissions: { domains: options.domains ?? ["ejemplo.com"] },
    timeoutMs: options.timeoutMs ?? 15_000,
    maxConcurrent: options.maxConcurrent ?? 4,
    minDelayMs: options.minDelayMs ?? 0,
    logger: options.logger ?? noopLogger,
  });
}

async function captureError(
  promise: Promise<unknown>,
  code: ModuleErrorCode,
): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(error).toBeInstanceOf(ModuleError);
  const moduleError = error as ModuleError;
  expect(moduleError.code).toBe(code);
  return moduleError;
}

describe("host · permisos de dominio", () => {
  it("permite el dominio exacto y sus subdominios", async () => {
    const host = makeHost({ domains: ["ejemplo.com"] });

    const exact = await host.fetch("https://ejemplo.com/serie/1");
    expect(exact.status).toBe(200);
    expect(await exact.text()).toBe("ok");

    await expect(host.fetch("https://cdn.ejemplo.com/portada.jpg")).resolves.toBeDefined();
  });

  it("rechaza con ModuleError un dominio fuera de permisos", async () => {
    const host = makeHost({ domains: ["ejemplo.com"] });

    const error = await captureError(host.fetch("https://otro.com/x"), "UNSUPPORTED");

    expect(error.details).toEqual({ url: "https://otro.com/x" });
  });
});

describe("host · tiempo límite", () => {
  it("una petición que excede el tiempo límite produce TIMEOUT", async () => {
    const host = makeHost({ http: new TrackingHttp({ never: true }), timeoutMs: 20 });

    const error = await captureError(host.fetch("https://ejemplo.com/lento"), "TIMEOUT");

    expect(error.details).toEqual({ url: "https://ejemplo.com/lento" });
  });
});

describe("host · concurrencia y pausa mínima", () => {
  it("no supera el máximo de peticiones simultáneas", async () => {
    const http = new TrackingHttp({ delayMs: 30 });
    const host = makeHost({ http, maxConcurrent: 2 });

    await Promise.all([1, 2, 3, 4].map((n) => host.fetch(`https://ejemplo.com/${n}`)));

    expect(http.starts).toHaveLength(4);
    expect(http.maxActive).toBe(2);
  });

  it("respeta la pausa mínima entre peticiones al mismo dominio", async () => {
    const http = new TrackingHttp();
    const host = makeHost({ http, minDelayMs: 40 });

    await host.fetch("https://ejemplo.com/1");
    await host.fetch("https://ejemplo.com/2");

    const [first, second] = http.starts;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second!.at - first!.at).toBeGreaterThanOrEqual(35);
  });
});

describe("host · html con selectores CSS", () => {
  const host = makeHost();

  it("permite select, find, attr y text", () => {
    const document = host.html(
      '<div class="list"><h1>RyuuNest</h1><a href="/serie/1">Serie 1</a></div>',
    );

    expect(document.select(".list")).toHaveLength(1);
    expect(document.find("div")).toHaveLength(1);
    expect(document.find("h1")[0]?.text()).toBe("RyuuNest");
    expect(document.select("a")[0]?.attr("href")).toBe("/serie/1");
    expect(document.select("a")[0]?.text()).toBe("Serie 1");
    expect(document.select("a")[0]?.attr("data-missing")).toBeUndefined();
  });

  it("permite buscar dentro de un elemento", () => {
    const document = host.html("<ul><li>a</li><li>b</li></ul>");

    const list = document.select("ul")[0];
    expect(list).toBeDefined();
    expect(list!.select("li").map((item) => item.text())).toEqual(["a", "b"]);
  });
});

describe("host · log y settings", () => {
  it("reenvía log al logger inyectado", () => {
    const logs: Array<{ level: string; message: string; data?: unknown }> = [];
    const host = makeHost({
      logger: (level, message, data) => {
        logs.push(data === undefined ? { level, message } : { level, message, data });
      },
    });

    host.log("info", "hola", { a: 1 });
    host.log("warn", "sin datos");

    expect(logs).toEqual([
      { level: "info", message: "hola", data: { a: 1 } },
      { level: "warn", message: "sin datos" },
    ]);
  });

  it("settings guarda y lee valores por módulo", () => {
    const host = makeHost();

    expect(host.settings.get("theme")).toBeUndefined();
    host.settings.set("theme", "dragon-night");
    expect(host.settings.get("theme")).toBe("dragon-night");
  });
});
