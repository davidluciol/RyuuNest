import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { unzipSync } from "fflate";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HTML_SITE_BASE_URL } from "@ryuunest/test-site";

import { main, type CliIo } from "../src/cli.js";
import { validateManifest } from "../src/index.js";

/**
 * Especificación del CLI del SDK (SPEC §13): `create`, `validate`, `test` y `pack`.
 * Se escribe antes que la implementación (TDD).
 */

interface TestIo extends CliIo {
  outText(): string;
  errText(): string;
}

function createTestIo(cwd: string): TestIo {
  let out = "";
  let err = "";
  return {
    cwd,
    out: (text) => {
      out += text;
    },
    err: (text) => {
      err += text;
    },
    outText: () => out,
    errText: () => err,
  };
}

function readJson(path: string): Promise<Record<string, unknown>> {
  return readFile(path, "utf8").then((text) => JSON.parse(text) as Record<string, unknown>);
}

function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
}

let scratch = "";

beforeEach(async () => {
  scratch = join(tmpdir(), `ryuunest-cli-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(scratch, { recursive: true });
});

afterEach(async () => {
  await rm(scratch, { recursive: true, force: true });
});

describe("cli · create", () => {
  it("crea un módulo declarativo válido, listo para el arnés", async () => {
    const io = createTestIo(scratch);
    expect(await main(["create", "demo"], io)).toBe(0);

    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    expect(manifest).toMatchObject({
      id: "demo",
      version: "0.1.0",
      apiVersion: 1,
      runtime: "declarative",
      entry: "index.json",
      lang: "es",
      nsfw: false,
    });
    expect(validateManifest(manifest).ok).toBe(true);

    expect(await readText(join(scratch, "demo", "index.json"))).toContain("ul.serie-list");
    expect(io.outText()).toContain("demo");
    expect(io.outText()).toContain(join(scratch, "demo"));
  });

  it("apunta por defecto al sitio falso de pruebas", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const manifest = await readJson(join(scratch, "demo", "manifest.json"));

    expect(manifest.baseUrl).toBe(HTML_SITE_BASE_URL);
    expect(manifest.permissions).toEqual({ domains: ["sitio-html.test"] });
  });

  it("personaliza nombre, base y dominio", async () => {
    await main(
      [
        "create",
        "demo",
        "--name",
        "Mi Sitio",
        "--base-url",
        "https://otro.test/portal",
        "--domain",
        "otro.test",
      ],
      createTestIo(scratch),
    );

    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    expect(manifest.name).toBe("Mi Sitio");
    expect(manifest.baseUrl).toBe("https://otro.test/portal");
    expect(manifest.permissions).toEqual({ domains: ["otro.test"] });
  });

  it("deduce el dominio del `--base-url` cuando no se indica", async () => {
    await main(
      ["create", "demo", "--base-url", "https://lector.test:8443/x"],
      createTestIo(scratch),
    );
    const manifest = await readJson(join(scratch, "demo", "manifest.json"));

    expect(manifest.permissions).toEqual({ domains: ["lector.test"] });
  });

  it("--dir elige la carpeta destino", async () => {
    expect(
      await main(["create", "demo", "--dir", join("sub", "carpeta")], createTestIo(scratch)),
    ).toBe(0);

    const manifest = await readJson(join(scratch, "sub", "carpeta", "manifest.json"));
    expect(manifest.id).toBe("demo");
  });

  it("rechaza un identificador fuera de [a-z0-9-]", async () => {
    const io = createTestIo(scratch);
    expect(await main(["create", "Demo!"], io)).toBe(1);
    expect(io.errText()).toContain("[a-z0-9-]");
  });

  it("rechaza una plantilla desconocida", async () => {
    const io = createTestIo(scratch);
    expect(await main(["create", "demo", "--template", "magia"], io)).toBe(1);
    expect(io.errText()).toContain("magia");
  });

  it("no sobrescribe un destino existente sin --force", async () => {
    await main(["create", "demo"], createTestIo(scratch));

    const blocked = createTestIo(scratch);
    expect(await main(["create", "demo"], blocked)).toBe(1);
    expect(blocked.errText()).toContain("--force");

    expect(await main(["create", "demo", "--force"], createTestIo(scratch))).toBe(0);
  });

  it("la plantilla declarativa sigue la forma del SPEC §6.6", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const config = await readJson(join(scratch, "demo", "index.json"));

    for (const method of ["popular", "latest", "search", "details", "pages"]) {
      expect(config[method], `falta ${method}`).toBeDefined();
    }
    expect(config["search"]).toMatchObject({ url: expect.stringContaining("{query}") });
    expect(config["pages"]).toMatchObject({ images: expect.anything() });
  });

  it("la plantilla script usa solo host.*", async () => {
    expect(await main(["create", "demo", "--template", "script"], createTestIo(scratch))).toBe(0);

    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    expect(manifest).toMatchObject({ runtime: "script", entry: "module.js" });
    expect(validateManifest(manifest).ok).toBe(true);

    const source = await readText(join(scratch, "demo", "module.js"));
    expect(source).toContain("export default function create(host)");
    expect(source).toContain("host.fetch");
    expect(source).not.toMatch(/(?<!host\.)\bfetch\(/);
    expect(source).not.toMatch(/\bXMLHttpRequest\b/);
    expect(source).not.toMatch(/\brequire\(/);
    expect(source).not.toMatch(/\bimport\s*\(/);
  });
});

describe("cli · validate", () => {
  it("devuelve 0 con un manifest válido", async () => {
    await main(["create", "demo"], createTestIo(scratch));

    const io = createTestIo(scratch);
    expect(await main(["validate", "demo"], io)).toBe(0);
    expect(io.outText()).toContain("válido");
    expect(io.errText()).toBe("");
  });

  it("devuelve 1 con los problemas y su ruta", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    await writeFile(
      join(scratch, "demo", "manifest.json"),
      JSON.stringify({ ...manifest, apiVersion: 2, permissions: { domains: [] } }),
      "utf8",
    );

    const io = createTestIo(scratch);
    expect(await main(["validate", "demo"], io)).toBe(1);
    expect(io.errText()).toContain("apiVersion");
    expect(io.errText()).toContain("permissions.domains");
  });

  it("comprueba `minAppVersion` contra la versión de la app", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    await writeFile(
      join(scratch, "demo", "manifest.json"),
      JSON.stringify({ ...manifest, minAppVersion: "99.0.0" }),
      "utf8",
    );

    const tooNew = createTestIo(scratch);
    expect(await main(["validate", "demo"], tooNew)).toBe(1);
    expect(tooNew.errText()).toContain("minAppVersion");

    expect(await main(["validate", "demo", "--app-version", "99.0.0"], createTestIo(scratch))).toBe(
      0,
    );
  });

  it("avisa si falta el manifest o el JSON está roto", async () => {
    const missing = createTestIo(scratch);
    expect(await main(["validate", "no-existe"], missing)).toBe(1);
    expect(missing.errText()).toContain("No se pudo leer");

    await mkdir(join(scratch, "roto"), { recursive: true });
    await writeFile(join(scratch, "roto", "manifest.json"), "{ no soy json", "utf8");
    const broken = createTestIo(scratch);
    expect(await main(["validate", "roto"], broken)).toBe(1);
    expect(broken.errText()).toContain("JSON");
  });
});

describe("cli · test", () => {
  it("ejecuta el arnés de contrato contra el sitio falso", async () => {
    await main(["create", "demo", "--template", "script"], createTestIo(scratch));

    const io = createTestIo(scratch);
    expect(await main(["test", "demo"], io)).toBe(0);
    expect(io.outText()).toContain("Contrato OK");
    expect(io.outText()).toContain("pages");
  });

  it("no deja archivos temporales en la carpeta del módulo", async () => {
    await main(["create", "demo", "--template", "script"], createTestIo(scratch));
    await main(["test", "demo"], createTestIo(scratch));

    const after = (await readdir(join(scratch, "demo"))).sort();
    expect(after).toEqual(["README.md", "manifest.json", "module.js"]);
  });

  it("informa cuando el módulo no cumple el contrato", async () => {
    await main(["create", "demo", "--template", "script"], createTestIo(scratch));
    await writeFile(
      join(scratch, "demo", "module.js"),
      "export default function create() { return { details: async () => ({}) }; }",
      "utf8",
    );

    const io = createTestIo(scratch);
    expect(await main(["test", "demo"], io)).toBe(1);
    expect(io.errText()).toContain("search()");
  });

  it("informa si la entrada no exporta create(host)", async () => {
    await main(["create", "demo", "--template", "script"], createTestIo(scratch));
    await writeFile(join(scratch, "demo", "module.js"), "export const otraCosa = 1;", "utf8");

    const io = createTestIo(scratch);
    expect(await main(["test", "demo"], io)).toBe(1);
    expect(io.errText()).toContain("create(host)");
  });

  it("omite los módulos declarativos hasta que exista el runtime (T16)", async () => {
    await main(["create", "demo"], createTestIo(scratch));

    const io = createTestIo(scratch);
    expect(await main(["test", "demo"], io)).toBe(0);
    expect(io.outText()).toContain("T16");
  });
});

describe("cli · pack", () => {
  it("genera un .zip con sha256 y tamaño verificables", async () => {
    await main(["create", "demo", "--template", "script"], createTestIo(scratch));

    const io = createTestIo(scratch);
    expect(await main(["pack", "demo"], io)).toBe(0);

    const payload = JSON.parse(io.outText()) as {
      file: string;
      sha256: string;
      size: number;
      files: string[];
    };
    expect(payload.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.files).toEqual(["README.md", "manifest.json", "module.js"]);

    const bytes = await readFile(payload.file);
    expect(bytes.length).toBe(payload.size);
    expect(bytesToHex(sha256(bytes))).toBe(payload.sha256);
    expect(Object.keys(unzipSync(bytes)).sort()).toEqual(payload.files);
  });

  it("--out elige el archivo de salida", async () => {
    await main(["create", "demo"], createTestIo(scratch));

    const io = createTestIo(scratch);
    const out = join(scratch, "dist", "paquete.zip");
    expect(await main(["pack", "demo", "--out", out], io)).toBe(0);

    const payload = JSON.parse(io.outText()) as { file: string };
    expect(payload.file).toBe(out);
    expect(await readFile(out)).toBeInstanceOf(Uint8Array);
  });

  it("no incluye un .zip anterior que esté dentro del módulo", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const inner = join(scratch, "demo", "demo-0.1.0.zip");

    await main(["pack", "demo", "--out", inner], createTestIo(scratch));

    const io = createTestIo(scratch);
    expect(await main(["pack", "demo", "--out", inner], io)).toBe(0);
    const payload = JSON.parse(io.outText()) as { files: string[] };
    expect(payload.files).not.toContain("demo-0.1.0.zip");
  });

  it("no empaqueta un manifest inválido", async () => {
    await main(["create", "demo"], createTestIo(scratch));
    const manifest = await readJson(join(scratch, "demo", "manifest.json"));
    await writeFile(
      join(scratch, "demo", "manifest.json"),
      JSON.stringify({ ...manifest, id: "MAYÚSCULAS" }),
      "utf8",
    );

    const io = createTestIo(scratch);
    expect(await main(["pack", "demo"], io)).toBe(1);
    expect(io.errText()).toContain("id");
  });
});

describe("cli · ayuda y errores de uso", () => {
  it("sin argumentos muestra la ayuda", async () => {
    const io = createTestIo(scratch);
    expect(await main([], io)).toBe(0);
    expect(io.outText()).toContain("create");
    expect(io.outText()).toContain("pack");
  });

  it("rechaza un comando desconocido", async () => {
    const io = createTestIo(scratch);
    expect(await main(["borrar-todo"], io)).toBe(1);
    expect(io.errText()).toContain("Comando desconocido");
  });

  it("avisa si `create` no recibe identificador", async () => {
    const io = createTestIo(scratch);
    expect(await main(["create"], io)).toBe(1);
    expect(io.errText()).toContain("identificador");
  });
});
