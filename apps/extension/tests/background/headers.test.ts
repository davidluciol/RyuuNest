import { describe, expect, it } from "vitest";

import {
  buildHeaderRule,
  classifyHeaders,
  createHeaderRules,
  type HeaderRule,
  type SessionRulesApi,
} from "../../src/background/headers";

describe("classifyHeaders", () => {
  it("deja pasar las cabeceras normales en minúsculas", () => {
    const { fetchHeaders, ruleHeaders, dropped } = classifyHeaders({
      Accept: "text/html",
      "X-Custom": "1",
    });
    expect(fetchHeaders).toEqual({ accept: "text/html", "x-custom": "1" });
    expect(ruleHeaders).toEqual({});
    expect(dropped).toEqual([]);
  });

  it("manda Referer, Origin y User-Agent a las reglas (fetch no puede ponerlas)", () => {
    const { fetchHeaders, ruleHeaders } = classifyHeaders({
      Referer: "https://sitio.org/",
      origin: "https://sitio.org",
      "USER-AGENT": "Mozilla/5.0",
      accept: "*/*",
    });
    expect(ruleHeaders).toEqual({
      referer: "https://sitio.org/",
      origin: "https://sitio.org",
      "user-agent": "Mozilla/5.0",
    });
    expect(fetchHeaders).toEqual({ accept: "*/*" });
  });

  it.each([
    "cookie",
    "Cookie2",
    "host",
    "content-length",
    "connection",
    "proxy-authorization",
    "sec-fetch-mode",
    "accept-encoding",
  ])("descarta la cabecera prohibida %s (sin cookies: credenciales fuera)", (name) => {
    const { fetchHeaders, ruleHeaders, dropped } = classifyHeaders({ [name]: "x", accept: "*/*" });
    expect(fetchHeaders).toEqual({ accept: "*/*" });
    expect(ruleHeaders).toEqual({});
    expect(dropped).toEqual([name.toLowerCase()]);
  });

  it("descarta nombres o valores que no son una cabecera válida", () => {
    const { fetchHeaders, dropped } = classifyHeaders({
      "mala cabecera": "x",
      "x-ok": "valor\r\nx-inyectada: 1",
      accept: "*/*",
    });
    expect(fetchHeaders).toEqual({ accept: "*/*" });
    expect(dropped).toEqual(["mala cabecera", "x-ok"]);
  });
});

describe("buildHeaderRule", () => {
  const url = "https://cdn.sitio.org/imagenes/p1.jpg?v=1+2&x=(a)";
  const rule = buildHeaderRule(7, url, { referer: "https://sitio.org/", "user-agent": "UA" });

  it("modifica solo las cabeceras pedidas, solo en peticiones del fondo", () => {
    expect(rule.id).toBe(7);
    expect(rule.action).toEqual({
      type: "modifyHeaders",
      requestHeaders: [
        { header: "referer", operation: "set", value: "https://sitio.org/" },
        { header: "user-agent", operation: "set", value: "UA" },
      ],
    });
    expect(rule.condition.resourceTypes).toEqual(["xmlhttprequest"]);
    expect(rule.condition.tabIds).toEqual([-1]);
    expect(rule.condition.isUrlFilterCaseSensitive).toBe(true);
  });

  it("casa exactamente con esa URL y con ninguna otra", () => {
    const regex = new RegExp(rule.condition.regexFilter);
    expect(regex.test(url)).toBe(true);
    expect(regex.test(`${url}&otro=1`)).toBe(false);
    expect(regex.test(url.replace("p1", "p2"))).toBe(false);
    expect(regex.test(`https://otro.org/?u=${url}`)).toBe(false);
  });
});

describe("createHeaderRules", () => {
  function fakeApi(initial: HeaderRule[] = []) {
    const rules = new Map<number, HeaderRule>(initial.map((rule) => [rule.id, rule]));
    const calls: Array<{ addRules?: HeaderRule[]; removeRuleIds?: number[] }> = [];
    const api: SessionRulesApi = {
      updateSessionRules: async (options) => {
        calls.push(options);
        for (const id of options.removeRuleIds ?? []) rules.delete(id);
        for (const rule of options.addRules ?? []) {
          if (rules.has(rule.id)) throw new Error(`id repetido ${rule.id}`);
          rules.set(rule.id, rule);
        }
      },
      getSessionRules: async () => [...rules.values()],
    };
    return { api, rules, calls };
  }

  it("sin cabeceras de regla no toca la API", async () => {
    const { api, calls } = fakeApi();
    const release = await createHeaderRules(api).apply("https://a.org/", {});
    await release();
    expect(calls).toEqual([]);
  });

  it("instala la regla y la retira al terminar", async () => {
    const { api, rules } = fakeApi();
    const release = await createHeaderRules(api).apply("https://a.org/x", {
      referer: "https://a.org/",
    });
    expect(rules.size).toBe(1);
    await release();
    expect(rules.size).toBe(0);
  });

  it("reparte ids distintos a peticiones simultáneas", async () => {
    const { api, rules } = fakeApi();
    const headerRules = createHeaderRules(api);
    const releases = await Promise.all([
      headerRules.apply("https://a.org/1", { referer: "https://a.org/" }),
      headerRules.apply("https://a.org/2", { referer: "https://a.org/" }),
      headerRules.apply("https://a.org/3", { referer: "https://a.org/" }),
    ]);
    expect(new Set(rules.keys()).size).toBe(3);
    await Promise.all(releases.map((release) => release()));
    expect(rules.size).toBe(0);
  });

  it("reset borra las reglas que quedaron de una sesión anterior", async () => {
    const stale = buildHeaderRule(1, "https://viejo.org/", { referer: "https://viejo.org/" });
    const { api, rules } = fakeApi([stale]);
    const headerRules = createHeaderRules(api);
    await headerRules.reset();
    expect(rules.size).toBe(0);
    // y el contador no choca con lo que había
    const release = await headerRules.apply("https://nuevo.org/", {
      referer: "https://nuevo.org/",
    });
    expect(rules.size).toBe(1);
    await release();
  });
});
