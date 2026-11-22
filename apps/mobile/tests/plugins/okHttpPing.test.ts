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

  it("es idempotente", () => {
    const once = addOkHttpFactory(MAIN_APPLICATION);

    expect(addOkHttpFactory(once)).toBe(once);
  });

  it("falla si no encuentra el ancla, en vez de compilar sin el arreglo", () => {
    expect(() => addOkHttpFactory("class MainApplication {}")).toThrow(/super\.onCreate/);
  });
});
