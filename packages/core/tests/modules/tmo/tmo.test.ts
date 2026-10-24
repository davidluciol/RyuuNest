import { afterEach, describe, expect, it, vi } from "vitest";

import { runContract } from "@ryuunest/test-site";

import { ModuleError, type ModuleErrorCode } from "../../../src/contract/errors";
import { StubHttp, type StubHttpRoute } from "../../../src/ports/fakes";
import type { Http, HttpResponse } from "../../../src/ports/http";
import { BASE, fixture, makeTmoApi, manifestJson, tmoRoutes } from "./tmoHarness";

/**
 * Port de `legacyModulos/logicTMO.py` a módulo script (T31, SPEC Apéndice A).
 *
 * El módulo (`modules/tmo/module.js`) se carga como lo haría la app, a través de
 * `ScriptRuntime`, y habla con un sitio TMO falso (fixtures sintéticas con series
 * inventadas) detrás del `ModuleHost` real: así se prueban a la vez los permisos, el
 * tiempo límite y el mapeo de errores.
 */

const SERIES_ID = "/library/manga/101/dragon-de-ceniza";
const SERIES_URL = `${BASE}${SERIES_ID}`;
const IMAGE_HEADERS = { Referer: `${BASE}/`, "User-Agent": expect.stringContaining("Mozilla/5.0") };

function withRoutes(extra: Record<string, StubHttpRoute>): StubHttp {
  return new StubHttp({ ...tmoRoutes(), ...extra });
}

async function failureOf(promise: Promise<unknown>): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ModuleError);
  return error as ModuleError;
}

async function expectCode(promise: Promise<unknown>, code: ModuleErrorCode): Promise<ModuleError> {
  const error = await failureOf(promise);
  expect(error.code).toBe(code);
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tmo · manifest", () => {
  it("declara un módulo script de ZonaTMO con permiso solo para su dominio", () => {
    expect(manifestJson()).toMatchObject({
      id: "tmo",
      apiVersion: 1,
      runtime: "script",
      entry: "module.js",
      baseUrl: BASE,
      capabilities: ["popular", "latest", "search"],
      permissions: { domains: ["zonatmo.com"] },
    });
  });
});

describe("tmo · popular, latest y search", () => {
  it("popular() lee /populars y mapea las tarjetas `div.element`", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    const page = await api.popular!(1);

    expect(http.requests.map((request) => request.url)).toEqual([`${BASE}/populars`]);
    expect(page.hasNext).toBe(false);
    expect(page.items).toEqual([
      {
        id: "/library/manga/101/dragon-de-ceniza",
        title: "El dragón de ceniza",
        cover: {
          url: "https://img.ryuunest.test/covers/dragon-de-ceniza.svg",
          headers: IMAGE_HEADERS,
        },
        kind: "manhwa",
        badges: ["★ 8.40", "Seinen"],
      },
      {
        id: "/library/manga/102/guardiana-del-nido",
        title: "La guardiana del nido",
        cover: {
          url: "https://img.ryuunest.test/covers/guardiana-del-nido.svg",
          headers: IMAGE_HEADERS,
        },
        kind: "manga",
        badges: ["★ 7.90", "Shoujo"],
      },
      {
        id: "/library/manga/103/noche-de-ambar",
        title: "Noche de ámbar",
        cover: { url: `${BASE}/covers/noche-de-ambar.svg`, headers: IMAGE_HEADERS },
        badges: ["★ 6.10"],
      },
    ]);
  });

  it("popular() y latest() solo tienen página 1: la 2 no pide nada", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    await expect(api.popular!(2)).resolves.toEqual({ items: [], hasNext: false });
    await expect(api.latest!(2)).resolves.toEqual({ items: [], hasNext: false });
    expect(http.requests).toEqual([]);
  });

  it("latest() lee las últimas subidas con el grupo y el tiempo en `hint`", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    const page = await api.latest!(1);

    expect(http.requests.map((request) => request.url)).toEqual([
      `${BASE}/latest_uploads?uploads_mode=thumbnail`,
    ]);
    expect(page.hasNext).toBe(false);
    expect(page.items.map((item) => item.title)).toEqual([
      "El dragón de ceniza",
      "La guardiana del nido",
    ]);
    expect(page.items[0]).toEqual({
      id: SERIES_ID,
      title: "El dragón de ceniza",
      cover: {
        url: "https://img.ryuunest.test/covers/dragon-de-ceniza.svg",
        headers: IMAGE_HEADERS,
      },
      kind: "manhwa",
      hint: "hace 2 h · Equipo Ryuu",
    });
  });

  it("search() codifica la consulta, usa `pg` y estima hasNext por si trae series", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    const first = await api.search("dragón", 1);
    const second = await api.search("dragón", 2);
    const third = await api.search("dragón", 3);

    expect(http.requests.map((request) => request.url)).toEqual([
      `${BASE}/library?title=drag%C3%B3n&pg=1`,
      `${BASE}/library?title=drag%C3%B3n&pg=2`,
      `${BASE}/library?title=drag%C3%B3n&pg=3`,
    ]);
    expect(first.items.map((item) => item.title)).toEqual(["El dragón de ceniza", "Draco de jade"]);
    expect(first.hasNext).toBe(true);
    expect(second.items.map((item) => item.kind)).toEqual(["manhua"]);
    expect(second.hasNext).toBe(true);
    expect(third).toEqual({ items: [], hasNext: false });
  });

  it("search() sin resultados devuelve una página vacía, no un error", async () => {
    const api = await makeTmoApi();

    await expect(api.search("nada", 1)).resolves.toEqual({ items: [], hasNext: false });
  });

  it("una tarjeta sin título o sin enlace es un fallo PARSE, no una lista vacía", async () => {
    const broken =
      '<div class="element"><a href="/library/manga/1/x"><div class="thumbnail"></div></a></div>';
    const api = await makeTmoApi({ http: withRoutes({ [`${BASE}/populars`]: { body: broken } }) });

    const error = await expectCode(api.popular!(1), "PARSE");

    expect(error.details?.url).toBe(`${BASE}/populars`);
  });
});

describe("tmo · details", () => {
  it("mapea la ficha: portada, textos, géneros, estado, extra y capítulos con releases", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    const details = await api.details(SERIES_ID);

    expect(http.requests.map((request) => request.url)).toEqual([SERIES_URL]);
    expect(details).toEqual({
      id: SERIES_ID,
      title: "El dragón de ceniza",
      cover: {
        url: "https://img.ryuunest.test/covers/dragon-de-ceniza.svg",
        headers: IMAGE_HEADERS,
      },
      description: "Una cartógrafa hereda un dragón de ceniza y un mapa que miente.",
      genres: ["Fantasía", "Aventura"],
      status: "ongoing",
      altTitles: ["Ash Dragon", "Ceniza y cartografía"],
      extra: { Lecturas: "12.4k", Favoritos: "980" },
      chapters: [
        {
          id: "Capítulo 3.00",
          title: "Capítulo 3.00",
          number: 3,
          releases: [
            { id: "/view_uploads/9003", group: "Equipo Ryuu", publishedAt: "2026-10-01" },
            { id: "/view_uploads/9004?lang=es", group: "Nido Scans" },
          ],
        },
        {
          id: "Capítulo 2.00",
          title: "Capítulo 2.00",
          number: 2,
          releases: [{ id: "/view_uploads/9002", group: "Equipo Ryuu", publishedAt: "2026-09-20" }],
        },
        {
          id: "Capítulo 1.00",
          title: "Capítulo 1.00",
          number: 1,
          releases: [{ id: "/view_uploads/9001", group: "Equipo Ryuu", publishedAt: "2026-09-10" }],
        },
      ],
    });
  });

  it("omite la fecha de una release si no es ISO 8601 y salta capítulos sin releases", async () => {
    const api = await makeTmoApi();

    const details = await api.details(SERIES_ID);

    const titles = details.chapters.map((chapter) => chapter.title);
    expect(titles).not.toContain("Extra sin ediciones");
    const secondRelease = details.chapters[0]?.releases[1];
    expect(secondRelease).not.toHaveProperty("publishedAt");
  });

  it.each([
    ["Finalizado", "completed"],
    ["Pausado", "hiatus"],
    ["Cancelado", "cancelled"],
    ["Algo nuevo", "unknown"],
  ])("traduce el estado «%s» a %s", async (text, expected) => {
    const body = fixture("series.html").replace("Publicándose", text);
    const api = await makeTmoApi({ http: withRoutes({ [SERIES_URL]: { body } }) });

    const details = await api.details(SERIES_ID);

    expect(details.status).toBe(expected);
  });

  it("una serie sin capítulos es válida (serie nueva)", async () => {
    const body = '<h1 class="element-title">Serie nueva</h1>';
    const api = await makeTmoApi({ http: withRoutes({ [SERIES_URL]: { body } }) });

    const details = await api.details(SERIES_ID);

    expect(details.title).toBe("Serie nueva");
    expect(details.chapters).toEqual([]);
    expect(details.status).toBe("unknown");
  });

  it("una página que no es una ficha es PARSE (la comprobación sí valida algo)", async () => {
    const api = await makeTmoApi({
      http: withRoutes({ [SERIES_URL]: { body: "<html><body><p>hola</p></body></html>" } }),
    });

    const error = await expectCode(api.details(SERIES_ID), "PARSE");

    expect(error.details?.selector).toContain("element-title");
  });

  it("si hay capítulos pero ninguno es usable, es PARSE y no una lista vacía", async () => {
    const body =
      '<h1 class="element-title">S</h1><ul><li class="upload-link"><a class="btn-collapse">C1</a><ul></ul></li></ul>';
    const api = await makeTmoApi({ http: withRoutes({ [SERIES_URL]: { body } }) });

    await expectCode(api.details(SERIES_ID), "PARSE");
  });

  it("un id que no es una ruta del sitio es NOT_FOUND y no toca la red", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    await expectCode(api.details("dragon-de-ceniza"), "NOT_FOUND");
    expect(http.requests).toEqual([]);
  });
});

describe("tmo · pages", () => {
  it("sigue la redirección, pide la versión `cascade` y devuelve todas las imágenes", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    const pages = await api.pages("Capítulo 3.00", "/view_uploads/9003");

    expect(http.requests.map((request) => request.url)).toEqual([
      `${BASE}/view_uploads/9003`,
      `${BASE}/viewer/abc123/cascade`,
    ]);
    expect(pages.images.map((image) => image.url)).toEqual([
      "https://img.ryuunest.test/pages/ch-3/001.svg",
      "https://img.ryuunest.test/pages/ch-3/002.svg",
      "https://img.ryuunest.test/pages/ch-3/003.svg",
      `${BASE}/pages/ch-3/004.svg`,
    ]);
    for (const image of pages.images) {
      expect(image.headers).toEqual(IMAGE_HEADERS);
    }
  });

  it("el título une el h1 y el h2 como texto (defecto 1 del Apéndice A.4)", async () => {
    const api = await makeTmoApi();

    const pages = await api.pages("Capítulo 3.00", "/view_uploads/9003");

    expect(pages.title).toBe("El dragón de ceniza Capítulo 3");
  });

  it("el Referer y el User-Agent viajan también en la petición del capítulo", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    await api.pages("Capítulo 3.00", "/view_uploads/9004?lang=es");

    expect(http.requests.map((request) => request.url)).toEqual([
      `${BASE}/view_uploads/9004?lang=es`,
      `${BASE}/viewer/def456/cascade`,
    ]);
    for (const request of http.requests) {
      expect(request.init?.headers).toMatchObject(IMAGE_HEADERS);
    }
  });

  it("sin redirección, o si ya llegó a `cascade`, no repite la petición", async () => {
    const http = withRoutes({
      [`${BASE}/view_uploads/9100`]: { body: fixture("viewer-cascade.html") },
      [`${BASE}/view_uploads/9101`]: {
        body: fixture("viewer-cascade.html"),
        finalUrl: `${BASE}/viewer/ghi789/cascade`,
      },
    });
    const api = await makeTmoApi({ http });

    const direct = await api.pages("c", "/view_uploads/9100");
    const cascade = await api.pages("c", "/view_uploads/9101");

    expect(direct.images).toHaveLength(4);
    expect(cascade.images).toHaveLength(4);
    expect(http.requests.map((request) => request.url)).toEqual([
      `${BASE}/view_uploads/9100`,
      `${BASE}/view_uploads/9101`,
    ]);
  });

  it("sin imágenes es PARSE (no un capítulo vacío)", async () => {
    const http = withRoutes({
      [`${BASE}/view_uploads/9200`]: { body: fixture("viewer-paginated.html") },
    });
    const api = await makeTmoApi({ http });

    const error = await expectCode(api.pages("c", "/view_uploads/9200"), "PARSE");

    expect(error.details?.selector).toContain("img-container");
  });

  it("una imagen sin `data-src` es PARSE", async () => {
    const body = '<div class="img-container"><img class="viewer-img" src="/placeholder.gif"></div>';
    const http = withRoutes({ [`${BASE}/view_uploads/9201`]: { body } });
    const api = await makeTmoApi({ http });

    await expectCode(api.pages("c", "/view_uploads/9201"), "PARSE");
  });

  it("una release que no es una ruta del sitio es NOT_FOUND y no toca la red", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    await expectCode(api.pages("c", "9003"), "NOT_FOUND");
    expect(http.requests).toEqual([]);
  });
});

describe("tmo · errores tipados (defectos 5 y 6 del Apéndice A.4)", () => {
  it.each([
    [404, "NOT_FOUND"],
    [403, "BLOCKED"],
    [401, "BLOCKED"],
    [429, "RATE_LIMITED"],
    [500, "NETWORK"],
  ] as const)("el estado %s se informa como %s con su causa", async (status, code) => {
    const http = withRoutes({ [SERIES_URL]: { status, body: "" } });
    const api = await makeTmoApi({ http });

    const error = await expectCode(api.details(SERIES_ID), code);

    expect(error.details).toEqual({ url: SERIES_URL, status });
  });

  it("el desafío anti-bot con estado 200 se informa como BLOCKED", async () => {
    const http = withRoutes({
      [SERIES_URL]: { body: fixture("challenge.html") },
      [`${BASE}/populars`]: { body: fixture("challenge.html") },
    });
    const api = await makeTmoApi({ http });

    await expectCode(api.details(SERIES_ID), "BLOCKED");
    await expectCode(api.popular!(1), "BLOCKED");
  });

  it("un fallo del capítulo redirigido también se tipa", async () => {
    const http = withRoutes({ [`${BASE}/viewer/abc123/cascade`]: { status: 429, body: "" } });
    const api = await makeTmoApi({ http });

    await expectCode(api.pages("c", "/view_uploads/9003"), "RATE_LIMITED");
  });
});

describe("tmo · tiempos límite y host (defectos 4 y 7)", () => {
  it("una petición que no responde acaba en TIMEOUT por el host", async () => {
    const hanging: Http = { request: () => new Promise<HttpResponse>(() => {}) };
    const api = await makeTmoApi({ http: hanging, timeoutMs: 25 });

    await expectCode(api.popular!(1), "TIMEOUT");
    await expectCode(api.details(SERIES_ID), "TIMEOUT");
  });

  it("solo usa `host.*`: ni `fetch` global ni otra red", async () => {
    const forbidden = vi.fn(() => {
      throw new Error("el módulo no debe usar fetch global");
    });
    vi.stubGlobal("fetch", forbidden);
    const api = await makeTmoApi();

    await api.popular!(1);
    await api.latest!(1);
    await api.search("dragón", 1);
    await api.details(SERIES_ID);
    await api.pages("c", "/view_uploads/9003");

    expect(forbidden).not.toHaveBeenCalled();
  });
});

describe("tmo · sin estado compartido (defecto 3)", () => {
  it("el Referer de pages() no se filtra a las demás peticiones", async () => {
    const http = new StubHttp(tmoRoutes());
    const api = await makeTmoApi({ http });

    await api.pages("c", "/view_uploads/9003");
    await api.popular!(1);
    await api.details(SERIES_ID);

    const withReferer = http.requests.filter(
      (request) => request.init?.headers?.["Referer"] !== undefined,
    );
    expect(withReferer.map((request) => request.url)).toEqual([
      `${BASE}/view_uploads/9003`,
      `${BASE}/viewer/abc123/cascade`,
    ]);
  });

  it("modificar las cabeceras devueltas no afecta a la siguiente llamada", async () => {
    const api = await makeTmoApi();

    const first = await api.pages("c", "/view_uploads/9003");
    const headers = first.images[0]?.headers;
    expect(headers).toBeDefined();
    headers!["Referer"] = "https://otro.test/";
    first.images[1]!.headers = {};

    const second = await api.pages("c", "/view_uploads/9003");

    expect(second.images.every((image) => image.headers?.["Referer"] === `${BASE}/`)).toBe(true);
  });

  it("dos instancias del módulo no comparten nada", async () => {
    const one = await makeTmoApi();
    const two = await makeTmoApi();

    const [a, b] = await Promise.all([
      one.details(SERIES_ID),
      two.pages("c", "/view_uploads/9003"),
    ]);

    expect(a.title).toBe("El dragón de ceniza");
    expect(b.images).toHaveLength(4);
  });
});

describe("tmo · contrato (arnés de test-site)", () => {
  it("pasa runContract con cabeceras de imagen y hasNext estimado", async () => {
    const api = await makeTmoApi();

    const report = await runContract(api, {
      capabilities: ["popular", "latest", "search"],
      seriesId: SERIES_ID,
      chapterId: "Capítulo 3.00",
      releaseIds: ["/view_uploads/9003", "/view_uploads/9004?lang=es"],
      searchQuery: "dragón",
      expectImageHeaders: { Referer: `${BASE}/` },
      estimatedHasNext: true,
    });

    expect(report.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(report.imageCounts).toEqual([4, 4]);
  });
});
