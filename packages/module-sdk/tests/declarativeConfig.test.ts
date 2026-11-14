import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { EXAMPLE_DECLARATIVE } from "@ryuunest/test-site";

import { validateDeclarativeConfig } from "../src/index.js";

/**
 * Validador del `index.json` declarativo (T39, R2 del ADR-0003). Norma:
 * `docs/declarative-format.md`. Tolera claves desconocidas; los errores llevan ruta.
 */

const TEMPLATE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "declarative",
  "index.json",
);

type Config = Record<string, Record<string, unknown>>;

function example(): Config {
  return structuredClone(EXAMPLE_DECLARATIVE) as unknown as Config;
}

function paths(value: unknown): string[] {
  const result = validateDeclarativeConfig(value);
  return result.ok ? [] : result.issues.map((issue) => issue.path);
}

describe("validateDeclarativeConfig", () => {
  it("acepta la plantilla del SDK y el ejemplo del sitio falso", async () => {
    const template = JSON.parse(await readFile(TEMPLATE, "utf8")) as unknown;
    expect(validateDeclarativeConfig(template)).toMatchObject({ ok: true });
    expect(validateDeclarativeConfig(EXAMPLE_DECLARATIVE)).toMatchObject({ ok: true });
  });

  it("rechaza lo que no es un objeto", () => {
    expect(paths([])).toEqual([""]);
  });

  it("tolera claves desconocidas (ADR-0003: se ignoran)", () => {
    expect(paths({ ...example(), popluar: { url: 1 }, comentario: "x" })).toEqual([]);
  });

  it("exige los campos obligatorios con su ruta", () => {
    const config = example();
    delete (config["details"]?.["fields"] as Record<string, unknown>)["title"];
    delete config["search"]?.["list"];
    expect(paths(config)).toEqual(["search.list", "details.fields.title"]);
  });

  it("rechaza variables y modificadores que el método no tiene", () => {
    const config = example();
    config["search"] = { ...config["search"], url: "{baseUrl}/buscar/{id}" };
    config["details"] = { ...config["details"], url: "{baseUrl}{id:crudo}" };
    expect(paths(config)).toEqual(["search.url", "details.url"]);
  });

  it("admite {id:raw} y las variables de pages en imageHeaders", () => {
    const config = example();
    config["details"] = { ...config["details"], url: "{baseUrl}{id:raw}" };
    config["pages"] = {
      ...config["pages"],
      imageHeaders: { Referer: "{baseUrl}/leer/{chapterId}/{releaseId:raw}" },
    };
    expect(paths(config)).toEqual([]);
  });

  it("rechaza cabeceras de imagen que no son texto o usan otra variable", () => {
    const config = example();
    config["pages"] = { ...config["pages"], imageHeaders: { Referer: "{page}", "X-N": 1 } };
    expect(paths(config)).toEqual(["pages.imageHeaders.Referer", "pages.imageHeaders.X-N"]);
  });

  it("comprueba las transformaciones y sus argumentos", () => {
    const config = example();
    config["popular"] = {
      ...config["popular"],
      fields: {
        id: { selector: "a", transform: ["recortar"] },
        title: { selector: "h3", transform: [["join", ", "]] },
        hint: { selector: "span", transform: [["date", "MM/YYYY"]] },
        kind: { selector: "span", transform: [["map", "manga"]] },
        cover: { selector: "img", regex: "(" },
      },
    };
    expect(paths(config)).toEqual([
      "popular.fields.id.transform[0]",
      "popular.fields.title.transform[0]",
      "popular.fields.hint.transform[0]",
      "popular.fields.kind.transform[0]",
      "popular.fields.cover.regex",
    ]);
  });

  it("exige selector en los campos que se leen sobre el documento", () => {
    const config = example();
    config["details"] = {
      ...config["details"],
      fields: { ...(config["details"]?.["fields"] as object), title: { attr: "data-t" } },
      extra: { Autor: { attr: "data-autor" } },
    };
    config["pages"] = { ...config["pages"], images: { attr: "src" }, title: {} };
    expect(paths(config)).toEqual([
      "details.fields.title.selector",
      "details.extra.Autor.selector",
      "pages.images.selector",
      "pages.title.selector",
    ]);
  });

  it("ignora los nombres de campo que el runtime no lee", () => {
    const config = example();
    config["popular"] = {
      ...config["popular"],
      fields: { ...(config["popular"]?.["fields"] as object), comentario: "no es un campo" },
    };
    expect(paths(config)).toEqual([]);
  });

  it("valida details.extra como campos", () => {
    const config = example();
    config["details"] = {
      ...config["details"],
      extra: { Autor: { selector: "a.autor" }, Roto: "a.autor" },
    };
    expect(paths(config)).toEqual(["details.extra.Roto"]);
  });
});
