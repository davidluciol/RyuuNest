import { describe, expect, it } from "vitest";

import type { Archive, Clock, Http, SecureLock, Storage } from "../../src/ports";
import { FakeArchive, FixedClock, MemoryStorage, NoopSecureLock, StubHttp } from "../../src/ports";

describe("puertos · adaptadores falsos", () => {
  it("MemoryStorage guarda, lee, borra y lista por prefijo", async () => {
    const storage: Storage = new MemoryStorage();

    await storage.set("a", "1");
    await storage.set("ab", "2");
    await storage.set("b", "3");

    expect(await storage.get("a")).toBe("1");
    expect(await storage.get("z")).toBeUndefined();

    await storage.delete("a");

    expect(await storage.get("a")).toBeUndefined();
    expect((await storage.keys()).sort()).toEqual(["ab", "b"]);
    expect(await storage.keys("a")).toEqual(["ab"]);
  });

  it("StubHttp responde las rutas configuradas (200/404) y registra las peticiones", async () => {
    const stub = new StubHttp({
      "https://ejemplo.com/a": { status: 200, body: "<h1>hola</h1>" },
    });
    const http: Http = stub;

    const ok = await http.request("https://ejemplo.com/a");
    expect(ok.status).toBe(200);
    expect(ok.headers).toEqual({});
    expect(await ok.text()).toBe("<h1>hola</h1>");

    const missing = await http.request("https://ejemplo.com/x");
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("");

    expect(stub.requests.map((entry) => entry.url)).toEqual([
      "https://ejemplo.com/a",
      "https://ejemplo.com/x",
    ]);
  });

  it("StubHttp devuelve las cabeceras configuradas", async () => {
    const http: Http = new StubHttp({
      "https://ejemplo.com/img": { headers: { Referer: "https://ejemplo.com" } },
    });

    const response = await http.request("https://ejemplo.com/img");

    expect(response.status).toBe(200);
    expect(response.headers).toEqual({ Referer: "https://ejemplo.com" });
  });

  it("FakeArchive devuelve las entradas configuradas", async () => {
    const archive: Archive = new FakeArchive([
      { path: "manifest.json", data: new Uint8Array([1]) },
      { path: "index.js", data: new Uint8Array([2, 3]) },
    ]);

    const entries = await archive.unzip(new Uint8Array());

    expect(entries.map((entry) => entry.path)).toEqual(["manifest.json", "index.js"]);
  });

  it("FixedClock avanza manualmente", () => {
    const fixed = new FixedClock(1_000);
    const clock: Clock = fixed;

    expect(clock.now()).toBe(1_000);

    fixed.advance(500);
    expect(clock.now()).toBe(1_500);

    fixed.set(42);
    expect(clock.now()).toBe(42);
  });

  it("NoopSecureLock no está disponible y no autentica", async () => {
    const lock: SecureLock = new NoopSecureLock();

    expect(await lock.isAvailable()).toBe(false);
    expect(await lock.authenticate("Desbloquear para instalar")).toBe(false);
  });
});
