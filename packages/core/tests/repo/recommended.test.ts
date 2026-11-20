import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { StubHttp } from "../../src/ports/fakes";
import { fetchRecommended, parseRecommended } from "../../src/repo/recommended";

/**
 * F44 — «Recomendados» (`recommended.json` del repo oficial): lista de
 * `{ name, indexUrl, description, nsfw }`. Fixture guardado, nunca red real.
 */

const FIXTURE = readFileSync(new URL("./fixtures/recommended.json", import.meta.url), "utf8");
const URL_ = "https://repo.example.com/recommended.json";

describe("parseRecommended", () => {
  it("acepta las entradas válidas y descarta las rotas con aviso", () => {
    const result = parseRecommended(JSON.parse(FIXTURE));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.repos).toEqual([
      {
        name: "Repo de ejemplo",
        indexUrl: "https://repo.example.com/index.json",
        description: "Módulos de prueba",
        nsfw: false,
      },
      {
        name: "Repo adulto",
        indexUrl: "https://adultos.example.com/index.json",
        description: "Solo para mayores",
        nsfw: true,
      },
    ]);
    expect(result.value.warnings).toHaveLength(2);
    expect(result.value.warnings[0]).toContain("[2].indexUrl");
    expect(result.value.warnings[1]).toContain("[3].name");
  });

  it("rechaza lo que no es una lista", () => {
    const result = parseRecommended({ repos: [] });
    expect(result.ok).toBe(false);
  });

  it("acepta una lista vacía", () => {
    expect(parseRecommended([])).toEqual({ ok: true, value: { repos: [], warnings: [] } });
  });
});

describe("fetchRecommended", () => {
  it("descarga y valida el archivo", async () => {
    const http = new StubHttp({ [URL_]: { body: FIXTURE } });
    const repos = await fetchRecommended(http, URL_);
    expect(repos.map((repo) => repo.name)).toEqual(["Repo de ejemplo", "Repo adulto"]);
    expect(http.requests).toEqual([{ url: URL_ }]);
  });

  it("lanza ModuleError si la respuesta no es 2xx", async () => {
    await expect(fetchRecommended(new StubHttp({}), URL_)).rejects.toBeInstanceOf(ModuleError);
  });

  it("lanza PARSE si no es JSON o no es una lista", async () => {
    const bad = new StubHttp({ [URL_]: { body: "{no json" } });
    await expect(fetchRecommended(bad, URL_)).rejects.toMatchObject({ code: "PARSE" });
    const notList = new StubHttp({ [URL_]: { body: "{}" } });
    await expect(fetchRecommended(notList, URL_)).rejects.toMatchObject({ code: "PARSE" });
  });
});
