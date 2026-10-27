import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { createFflateArchive } from "../../src/data/fflateArchive";

/**
 * F16 — adaptador del puerto `Archive` (SPEC §5.3) sobre `fflate`. Solo
 * descomprime: los límites anti-bomba y zip-slip los aplica el instalador (T13).
 */

const text = (value: string) => new TextEncoder().encode(value);

describe("createFflateArchive", () => {
  it("devuelve cada archivo del zip con su ruta y su contenido", async () => {
    const zip = zipSync({
      "manifest.json": text('{"id":"a"}'),
      "index.json": text("{}"),
    });

    const entries = await createFflateArchive().unzip(zip);

    expect(entries.map((entry) => entry.path).sort()).toEqual(["index.json", "manifest.json"]);
    const manifest = entries.find((entry) => entry.path === "manifest.json");
    expect(new TextDecoder().decode(manifest?.data)).toBe('{"id":"a"}');
  });

  it("deja pasar rutas con `..` para que el instalador las rechace (zip-slip)", async () => {
    const zip = zipSync({ "../fuera.txt": text("x") });

    const entries = await createFflateArchive().unzip(zip);

    expect(entries.map((entry) => entry.path)).toEqual(["../fuera.txt"]);
  });

  it("no lista las carpetas como archivos", async () => {
    const zip = zipSync({ "carpeta/": new Uint8Array(), "carpeta/a.txt": text("a") });

    const entries = await createFflateArchive().unzip(zip);

    expect(entries.map((entry) => entry.path)).toEqual(["carpeta/a.txt"]);
  });

  it("rechaza datos que no son un zip", async () => {
    await expect(createFflateArchive().unzip(text("esto no es un zip"))).rejects.toThrow();
  });
});
