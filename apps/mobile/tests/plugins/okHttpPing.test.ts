import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { addOkHttpFactory } = require("../../plugins/withOkHttpPing.js") as {
  addOkHttpFactory: (source: string) => string;
};

// Forma de `MainApplication.kt` que genera el prebuild de Expo.
const MAIN_APPLICATION = `class MainApplication : Application(), ReactApplication {
  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
`;

describe("withOkHttpPing (G6)", () => {
  it("registra la fábrica de OkHttp justo tras super.onCreate()", () => {
    const out = addOkHttpFactory(MAIN_APPLICATION);
    const factory = out.indexOf("OkHttpClientProvider.setOkHttpClientFactory");

    expect(factory).toBeGreaterThan(out.indexOf("super.onCreate()"));
    expect(factory).toBeLessThan(out.indexOf("loadReactNative(this)"));
  });

  it("detecta conexiones muertas con ping y conserva caché y cookies del builder de RN", () => {
    const out = addOkHttpFactory(MAIN_APPLICATION);

    expect(out).toContain("createClientBuilder(this)");
    expect(out).toMatch(/\.pingInterval\(\d+, java\.util\.concurrent\.TimeUnit\.SECONDS\)/);
    expect(out).toMatch(/\.connectTimeout\(\d+,/);
    expect(out).toMatch(/\.readTimeout\(\d+,/);
  });

  it("conserva la cookie del módulo junto a las del tarro (FanFox +18, Models #30)", () => {
    // OkHttp (BridgeInterceptor) sustituye la cabecera Cookie por la del tarro si este tiene
    // cookies del dominio: el `isAdult=1` del módulo se perdía. Se aparta y se vuelve a unir.
    const out = addOkHttpFactory(MAIN_APPLICATION);
    const app = out.indexOf(".addInterceptor(");
    const network = out.indexOf(".addNetworkInterceptor(");

    expect(app).toBeGreaterThan(-1);
    expect(network).toBeGreaterThan(app);
    expect(out).toContain('"X-RyuuNest-Cookie"');
    expect(out).toContain('removeHeader("Cookie")');
    expect(out).toContain('"$own; $jar"');
  });

  it("es idempotente", () => {
    const once = addOkHttpFactory(MAIN_APPLICATION);

    expect(addOkHttpFactory(once)).toBe(once);
  });

  it("falla si no encuentra el ancla, en vez de compilar sin el arreglo", () => {
    expect(() => addOkHttpFactory("class MainApplication {}")).toThrow(/super\.onCreate/);
  });
});
