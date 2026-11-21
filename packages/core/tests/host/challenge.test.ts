import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import {
  CLEARANCE_FALLBACK_TTL_MS,
  MemoryClearanceStore,
  solveChallenge,
  type ChallengeBrowser,
  type ChallengeSolution,
} from "../../src/host/challenge";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FixedClock, StubHttp } from "../../src/ports/fakes";

const UA = "Mozilla/5.0 (Linux; Android 16; SM-S938B; wv) Chrome/140";

/** Navegador de prueba: registra las URLs abiertas y devuelve la solución fijada. */
class FakeBrowser implements ChallengeBrowser {
  readonly opened: string[] = [];
  constructor(private readonly solution: ChallengeSolution | null) {}
  async solve(url: string): Promise<ChallengeSolution | null> {
    this.opened.push(url);
    return this.solution;
  }
}

function setup(solution: ChallengeSolution | null = { cfClearance: "abc.123-xyz", userAgent: UA }) {
  const browser = new FakeBrowser(solution);
  const store = new MemoryClearanceStore();
  const clock = new FixedClock(1_000_000);
  const asked: string[] = [];
  const base = {
    domains: ["m440.in"],
    browser,
    store,
    clock,
  };
  return { browser, store, clock, asked, base };
}

describe("solveChallenge (F100)", () => {
  it("sin confirmación del usuario no abre el navegador ni guarda nada", async () => {
    const { browser, store, base } = setup();
    const ok = await solveChallenge("https://m440.in/manga-list", {
      ...base,
      confirm: async () => false,
    });
    expect(ok).toBe(false);
    expect(browser.opened).toEqual([]);
    expect(await store.get("m440.in")).toBeUndefined();
  });

  it("pide confirmación con el host y guarda cf_clearance, User-Agent y caducidad", async () => {
    const { browser, store, asked, base } = setup({
      cfClearance: "abc.123-xyz",
      userAgent: UA,
      expiresAt: 5_000_000,
    });
    const ok = await solveChallenge("https://m440.in/manga-list", {
      ...base,
      confirm: async (host) => {
        asked.push(host);
        return true;
      },
    });
    expect(ok).toBe(true);
    expect(asked).toEqual(["m440.in"]);
    expect(browser.opened).toEqual(["https://m440.in/manga-list"]);
    expect(await store.get("m440.in")).toEqual({
      cfClearance: "abc.123-xyz",
      userAgent: UA,
      expiresAt: 5_000_000,
    });
  });

  it("sin caducidad conocida usa la de respaldo", async () => {
    const { store, clock, base } = setup();
    await solveChallenge("https://m440.in/x", { ...base, confirm: async () => true });
    expect((await store.get("m440.in"))?.expiresAt).toBe(clock.now() + CLEARANCE_FALLBACK_TTL_MS);
  });

  it.each([
    ["dominio no declarado", "https://evil.example/"],
    ["dominio que solo termina igual", "https://notm440.in/"],
    ["http sin TLS", "http://m440.in/"],
    ["esquema raro", "javascript:alert(1)"],
    ["URL no válida", "no es una url"],
  ])("rechaza %s sin preguntar ni abrir el navegador", async (_name, url) => {
    const { browser, base } = setup();
    let askedUser = false;
    await expect(
      solveChallenge(url, {
        ...base,
        confirm: async () => {
          askedUser = true;
          return true;
        },
      }),
    ).rejects.toBeInstanceOf(ModuleError);
    expect(askedUser).toBe(false);
    expect(browser.opened).toEqual([]);
  });

  it("acepta subdominios del dominio declarado", async () => {
    const { store, base } = setup();
    expect(
      await solveChallenge("https://www.m440.in/", { ...base, confirm: async () => true }),
    ).toBe(true);
    expect(await store.get("www.m440.in")).toBeDefined();
  });

  it("si el usuario cierra el navegador (null) no guarda nada", async () => {
    const { store, base } = setup(null);
    expect(await solveChallenge("https://m440.in/", { ...base, confirm: async () => true })).toBe(
      false,
    );
    expect(await store.get("m440.in")).toBeUndefined();
  });

  it.each([
    ["cookie vacía", { cfClearance: "", userAgent: UA }],
    ["cookie con ; (inyecta otra cookie)", { cfClearance: "a; session=robada", userAgent: UA }],
    ["cookie con salto de línea", { cfClearance: "a\r\nX-Evil: 1", userAgent: UA }],
    ["User-Agent vacío", { cfClearance: "abc", userAgent: "" }],
    ["User-Agent con salto de línea", { cfClearance: "abc", userAgent: "UA\r\nCookie: x=1" }],
  ])("descarta una solución inválida: %s", async (_name, solution) => {
    const { store, base } = setup(solution);
    expect(await solveChallenge("https://m440.in/", { ...base, confirm: async () => true })).toBe(
      false,
    );
    expect(await store.get("m440.in")).toBeUndefined();
  });
});

describe("ModuleHost con verificaciones guardadas (F100)", () => {
  function makeHost(store: MemoryClearanceStore, clock: FixedClock, http: StubHttp) {
    return new ModuleHost({
      http,
      clock,
      permissions: { domains: ["m440.in", "otro.test"] },
      minDelayMs: 0,
      clearances: store,
    });
  }

  it("el módulo no ve solveChallenge en su host", () => {
    const host = makeHost(new MemoryClearanceStore(), new FixedClock(0), new StubHttp());
    expect("solveChallenge" in host).toBe(false);
  });

  it("envía cf_clearance y el mismo User-Agent al host verificado, sustituyendo los del módulo", async () => {
    const store = new MemoryClearanceStore();
    const clock = new FixedClock(1_000);
    await store.set("m440.in", { cfClearance: "tok", userAgent: UA, expiresAt: 2_000 });
    const http = new StubHttp();
    await makeHost(store, clock, http).fetch("https://m440.in/manga-list", {
      headers: {
        "user-agent": "Modulo/1.0",
        Cookie: "lang=es; cf_clearance=viejo",
        Referer: "https://m440.in/",
      },
    });
    const headers = http.requests[0]?.init?.headers ?? {};
    expect(headers).toEqual({
      Referer: "https://m440.in/",
      "User-Agent": UA,
      Cookie: "lang=es; cf_clearance=tok",
    });
  });

  it("no envía nada a otro host, a un subdominio distinto ni por http", async () => {
    const store = new MemoryClearanceStore();
    const clock = new FixedClock(1_000);
    await store.set("m440.in", { cfClearance: "tok", userAgent: UA, expiresAt: 2_000 });
    const http = new StubHttp();
    const host = makeHost(store, clock, http);
    await host.fetch("https://otro.test/");
    await host.fetch("https://cdn.m440.in/");
    await host.fetch("http://m440.in/");
    for (const request of http.requests) {
      expect(JSON.stringify(request.init?.headers ?? {})).not.toContain("tok");
    }
  });

  it("caducada: no la envía y la borra", async () => {
    const store = new MemoryClearanceStore();
    const clock = new FixedClock(2_000);
    await store.set("m440.in", { cfClearance: "tok", userAgent: UA, expiresAt: 2_000 });
    const http = new StubHttp();
    await makeHost(store, clock, http).fetch("https://m440.in/");
    expect(JSON.stringify(http.requests[0]?.init ?? {})).not.toContain("tok");
    expect(await store.get("m440.in")).toBeUndefined();
  });

  it("modo tarro (cfClearance null): solo fija el User-Agent y deja las cookies del módulo", async () => {
    const store = new MemoryClearanceStore();
    const clock = new FixedClock(1_000);
    await store.set("m440.in", { cfClearance: null, userAgent: UA, expiresAt: 2_000 });
    const http = new StubHttp();
    await makeHost(store, clock, http).fetch("https://m440.in/", {
      headers: { "User-Agent": "Modulo/1.0", Cookie: "lang=es" },
    });
    expect(http.requests[0]?.init?.headers).toEqual({ "User-Agent": UA, Cookie: "lang=es" });
  });
});

describe("solveChallenge en modo tarro (F100, Expo Go)", () => {
  it("guarda cfClearance null cuando el navegador no puede leer la cookie", async () => {
    const browser = new FakeBrowser({ cfClearance: null, userAgent: UA });
    const store = new MemoryClearanceStore();
    const ok = await solveChallenge("https://m440.in/", {
      domains: ["m440.in"],
      browser,
      store,
      clock: new FixedClock(0),
      confirm: async () => true,
    });
    expect(ok).toBe(true);
    expect((await store.get("m440.in"))?.cfClearance).toBeNull();
  });
});
