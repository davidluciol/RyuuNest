import { describe, expect, it } from "vitest";

import { createMemoryByteStore } from "../../src/data/byteStore";

describe("ByteStore en memoria (doble de pruebas del de IndexedDB)", () => {
  it("empieza vacío y hace ida y vuelta de bytes", async () => {
    const store = createMemoryByteStore();
    expect(await store.load()).toBeUndefined();

    const bytes = new Uint8Array([9, 8, 7]);
    await store.save(bytes);
    expect(await store.load()).toEqual(bytes);
    // Copia defensiva: mutar el array guardado no corrompe el almacenado.
    bytes[0] = 0;
    expect(await store.load()).not.toEqual(bytes);
  });
});
