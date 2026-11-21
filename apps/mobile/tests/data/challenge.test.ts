import { MemoryClearanceStore } from "@ryuunest/core";
import { describe, expect, it } from "vitest";

import { createChallengeController } from "../../src/data/challengeController";
import {
  createSecureClearanceStore,
  type SecureStoreLike,
} from "../../src/data/secureClearanceStore";

/**
 * F100 — verificación de Cloudflare en la app: el controlador une la hoja de
 * confirmación y el navegador visible con `solveChallenge` del núcleo, y el
 * almacén guarda la verificación en el almacén seguro del dispositivo.
 */

const UA = "Mozilla/5.0 (Linux; Android 16; wv)";

function setup(domains: readonly string[] | undefined = ["m440.in"]) {
  const store = new MemoryClearanceStore();
  const controller = createChallengeController({
    store,
    lookupDomains: async (moduleId) => (moduleId === "m440" ? domains : undefined),
    now: () => 0,
  });
  return { store, controller };
}

/** Espera a que el controlador llegue a la fase pedida. */
function phase(controller: ReturnType<typeof createChallengeController>, wanted: string) {
  return new Promise<void>((resolve) => {
    if (controller.getState().phase === wanted) return resolve();
    const stop = controller.subscribe(() => {
      if (controller.getState().phase === wanted) {
        stop();
        resolve();
      }
    });
  });
}

describe("createChallengeController", () => {
  it("pregunta primero, abre el navegador solo tras aceptar y guarda la verificación", async () => {
    const { store, controller } = setup();
    const result = controller.verify("m440", "https://m440.in/manga-list");

    await phase(controller, "confirm");
    expect(controller.getState()).toEqual({ phase: "confirm", host: "m440.in" });
    controller.answer(true);

    await phase(controller, "browse");
    expect(controller.getState()).toEqual({
      phase: "browse",
      host: "m440.in",
      url: "https://m440.in/manga-list",
      domains: ["m440.in"],
    });
    controller.finish({ cfClearance: "tok", userAgent: UA });

    expect(await result).toBe(true);
    expect(controller.getState()).toEqual({ phase: "idle" });
    expect((await store.get("m440.in"))?.cfClearance).toBe("tok");
  });

  it("si el usuario no acepta, no abre el navegador ni guarda nada", async () => {
    const { store, controller } = setup();
    const seen: string[] = [];
    controller.subscribe(() => seen.push(controller.getState().phase));
    const result = controller.verify("m440", "https://m440.in/");
    await phase(controller, "confirm");
    controller.answer(false);

    expect(await result).toBe(false);
    expect(seen).not.toContain("browse");
    expect(await store.get("m440.in")).toBeUndefined();
  });

  it("cerrar el navegador no guarda nada", async () => {
    const { store, controller } = setup();
    const result = controller.verify("m440", "https://m440.in/");
    await phase(controller, "confirm");
    controller.answer(true);
    await phase(controller, "browse");
    controller.finish(null);
    expect(await result).toBe(false);
    expect(await store.get("m440.in")).toBeUndefined();
  });

  it("una URL fuera de los dominios del módulo o un módulo desconocido no preguntan nada", async () => {
    const { controller } = setup();
    const seen: string[] = [];
    controller.subscribe(() => seen.push(controller.getState().phase));
    expect(await controller.verify("m440", "https://evil.example/")).toBe(false);
    expect(await controller.verify("otro", "https://m440.in/")).toBe(false);
    expect(seen).not.toContain("confirm");
  });

  it("sin almacén (web) no hace nada", async () => {
    const controller = createChallengeController({
      store: undefined,
      lookupDomains: async () => ["m440.in"],
    });
    expect(await controller.verify("m440", "https://m440.in/")).toBe(false);
    expect(controller.getState()).toEqual({ phase: "idle" });
  });

  it("una segunda verificación mientras hay otra en curso se rechaza", async () => {
    const { controller } = setup();
    const first = controller.verify("m440", "https://m440.in/");
    await phase(controller, "confirm");
    expect(await controller.verify("m440", "https://m440.in/")).toBe(false);
    controller.answer(false);
    expect(await first).toBe(false);
  });
});

function fakeSecureStore(): SecureStoreLike & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItemAsync: async (key) => items.get(key) ?? null,
    setItemAsync: async (key, value) => {
      items.set(key, value);
    },
    deleteItemAsync: async (key) => {
      items.delete(key);
    },
  };
}

describe("createSecureClearanceStore", () => {
  it("guarda y lee por host con una clave válida para SecureStore", async () => {
    const secure = fakeSecureStore();
    const store = createSecureClearanceStore(secure);
    const clearance = { cfClearance: "tok", userAgent: UA, expiresAt: 10 };
    await store.set("www.m440.in", clearance);
    expect([...secure.items.keys()]).toEqual(["cf_clearance.www.m440.in"]);
    expect(await store.get("www.m440.in")).toEqual(clearance);
    await store.delete("www.m440.in");
    expect(await store.get("www.m440.in")).toBeUndefined();
  });

  it("conserva el modo tarro (cfClearance null)", async () => {
    const store = createSecureClearanceStore(fakeSecureStore());
    await store.set("m440.in", { cfClearance: null, userAgent: UA, expiresAt: 10 });
    expect((await store.get("m440.in"))?.cfClearance).toBeNull();
  });

  it("un valor corrupto o con forma inesperada cuenta como ausente", async () => {
    const secure = fakeSecureStore();
    const store = createSecureClearanceStore(secure);
    secure.items.set("cf_clearance.a.test", "{no json");
    secure.items.set(
      "cf_clearance.b.test",
      JSON.stringify({ cfClearance: 1, userAgent: UA, expiresAt: 1 }),
    );
    expect(await store.get("a.test")).toBeUndefined();
    expect(await store.get("b.test")).toBeUndefined();
  });

  it("si el almacén seguro falla, se comporta como vacío (no rompe host.fetch)", async () => {
    const store = createSecureClearanceStore({
      getItemAsync: async () => {
        throw new Error("Keystore");
      },
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    });
    expect(await store.get("m440.in")).toBeUndefined();
  });
});
