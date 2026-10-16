import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FixedClock, StubHttp } from "../../src/ports/fakes";
import {
  DeclarativeRuntime,
  type DeclarativeConfig,
  type DeclarativeDetailsMethod,
  type DeclarativeListMethod,
  type DeclarativePagesMethod,
  type DeclarativeRuntimeOptions,
} from "../../src/runtimes/DeclarativeRuntime";

/**
 * Runtime declarativo (SPEC §6.6, T16).
 *
 * Un módulo declarativo describe con selectores dónde está cada dato y el núcleo
 * construye la `ModuleApi`. Aquí el `Http` es un doble (`StubHttp`) con HTML que
 * copia la forma del sitio falso de `@ryuunest/test-site`; el E2E contra el sitio
 * falso real es T17.
 */

const BASE_URL = "https://sitio-html.test";

/** Config de prueba con los cinco métodos presentes (sin opcionales). */
interface TestConfig extends DeclarativeConfig {
  popular: DeclarativeListMethod;
  search: DeclarativeListMethod;
  details: DeclarativeDetailsMethod;
  pages: DeclarativePagesMethod;
}

/** Ficha de una serie, con un capítulo de dos releases. */
const DETAIL_HTML = `<!doctype html>
<html lang="es"><body>
  <article class="serie-detalle" data-serie-id="dragon-de-ceniza">
    <img class="detalle-portada" src="/img/dragon-de-ceniza.svg" alt="">
    <h1 class="detalle-titulo">  El dragón de ceniza  </h1>
    <p class="detalle-descripcion">  Una cartógrafa hereda un dragón.  </p>
    <ul class="detalle-generos">
      <li class="genero">Fantasía</li>
      <li class="genero">Aventura</li>
    </ul>
    <ul class="detalle-titulos-alt"><li class="titulo-alt">Ash Dragon</li></ul>
    <span class="detalle-estado" data-estado="ongoing">En curso</span>
    <ul class="capitulos">
      <li class="capitulo" data-chapter-id="ch-1" data-numero="1">
        <span class="capitulo-titulo"> Capítulo 1 </span>
        <ul class="releases">
          <li class="release" data-release-id="r-oficial" data-published-at="2026-09-01T10:00:00Z">
            <span class="release-grupo">Equipo Ryuu</span>
          </li>
          <li class="release" data-release-id="r-alt" data-published-at="2026-09-02T18:30:00Z">
            <span class="release-grupo">Escuadrón Noche</span>
          </li>
        </ul>
      </li>
    </ul>
  </article>
</body></html>`;

function listHtml(options: { next?: string } = {}): string {
  const pager =
    options.next === undefined
      ? ""
      : `<nav class="pager"><a class="next" href="${options.next}">Siguiente</a></nav>`;
  return `<!doctype html>
<html lang="es"><body>
  <ul class="serie-list">
    <li class="serie-card">
      <a class="serie-link" href="/serie/dragon-de-ceniza">
        <img class="serie-cover" src="/img/dragon-de-ceniza.svg" alt="">
        <h3 class="serie-title">  El dragón de ceniza  </h3>
      </a>
      <span class="serie-kind">manhwa</span>
      <span class="serie-hint">hace 2 h · Equipo Ryuu</span>
    </li>
  </ul>
  ${pager}
</body></html>`;
}

const PAGES_HTML = `<!doctype html>
<html lang="es"><body>
  <div class="lector" data-chapter-id="ch-1" data-release-id="r-oficial">
    <img class="pagina" src="/img/ch-1-1.svg" alt="">
    <img class="pagina" src="/img/ch-1-2.svg" alt="">
  </div>
</body></html>`;

/** Campos de una tarjeta de la lista (el mismo bloque para popular y search). */
const LIST_FIELDS: DeclarativeListMethod["fields"] = {
  id: { selector: "a.serie-link", attr: "href", transform: ["path"] },
  title: { selector: "h3.serie-title", transform: ["trim"] },
  cover: { selector: "img.serie-cover", attr: "src", transform: ["absoluteUrl"] },
  kind: { selector: "span.serie-kind", transform: ["trim"] },
  hint: { selector: "span.serie-hint", transform: ["trim"] },
};

/** Config equivalente a la plantilla declarativa del SDK (SPEC §6.6). */
function makeConfig(): TestConfig {
  return {
    popular: {
      url: "{baseUrl}/popular?page={page}",
      list: "ul.serie-list > li.serie-card",
      fields: LIST_FIELDS,
      hasNext: { selector: "nav.pager a.next", exists: true },
    },
    search: {
      url: "{baseUrl}/search?q={query}&page={page}",
      list: "ul.serie-list > li.serie-card",
      fields: LIST_FIELDS,
      hasNext: { selector: "nav.pager a.next", exists: true },
    },
    details: {
      url: "{baseUrl}/serie/{id}",
      fields: {
        title: { selector: "h1.detalle-titulo", transform: ["trim"] },
        cover: { selector: "img.detalle-portada", attr: "src", transform: ["absoluteUrl"] },
        description: { selector: "p.detalle-descripcion", transform: ["trim"] },
        genres: { selector: "ul.detalle-generos > li.genero", all: true, transform: ["trim"] },
        altTitles: {
          selector: "ul.detalle-titulos-alt > li.titulo-alt",
          all: true,
          transform: ["trim"],
        },
        status: { selector: "span.detalle-estado", attr: "data-estado" },
      },
      chapters: {
        list: "ul.capitulos > li.capitulo",
        fields: {
          id: { attr: "data-chapter-id" },
          title: { selector: "span.capitulo-titulo", transform: ["trim"] },
          number: { attr: "data-numero", transform: ["number"] },
        },
        releases: {
          list: "ul.releases > li.release",
          fields: {
            id: { attr: "data-release-id" },
            group: { selector: "span.release-grupo", transform: ["trim"] },
            publishedAt: { attr: "data-published-at" },
          },
        },
      },
    },
    pages: {
      url: "{baseUrl}/leer/{chapterId}/{releaseId}",
      images: { selector: "div.lector > img.pagina", attr: "src", transform: ["absoluteUrl"] },
    },
  };
}

const ROUTES: Record<string, { body?: string; status?: number }> = {
  [`${BASE_URL}/popular?page=1`]: { body: listHtml({ next: "/popular?page=2" }) },
  [`${BASE_URL}/popular?page=2`]: { body: listHtml() },
  [`${BASE_URL}/search?q=ceniza&page=1`]: { body: listHtml() },
  [`${BASE_URL}/serie/dragon-de-ceniza`]: { body: DETAIL_HTML },
  [`${BASE_URL}/leer/ch-1/r-oficial`]: { body: PAGES_HTML },
};

function makeRuntime(
  config: DeclarativeConfig,
  routes: Record<string, { body?: string; status?: number }> = ROUTES,
): { runtime: DeclarativeRuntime; http: StubHttp } {
  const http = new StubHttp(routes);
  const host = new ModuleHost({
    http,
    clock: new FixedClock(1_000),
    permissions: { domains: ["sitio-html.test"] },
    minDelayMs: 0,
    timeoutMs: 1_000,
  });
  const options: DeclarativeRuntimeOptions = { config, host, baseUrl: BASE_URL };
  return { runtime: new DeclarativeRuntime(options), http };
}

function rejection(promise: Promise<unknown> | undefined): Promise<unknown> {
  if (promise === undefined) {
    throw new Error("El método no está disponible en la configuración de prueba");
  }
  return promise.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
}

describe("DeclarativeRuntime · listados", () => {
  it("popular(1) devuelve un Page<SeriesSummary> con los campos extraídos", async () => {
    const { runtime } = makeRuntime(makeConfig());
    const page = await runtime.createApi().popular?.(1);

    expect(page?.hasNext).toBe(true);
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]).toEqual({
      id: "dragon-de-ceniza",
      title: "El dragón de ceniza",
      cover: { url: `${BASE_URL}/img/dragon-de-ceniza.svg` },
      kind: "manhwa",
      hint: "hace 2 h · Equipo Ryuu",
    });
  });

  it("la última página no tiene siguiente (hasNext === false)", async () => {
    const { runtime } = makeRuntime(makeConfig());
    const page = await runtime.createApi().popular?.(2);

    expect(page?.hasNext).toBe(false);
    expect(page?.items).toHaveLength(1);
  });

  it("search codifica la consulta en la URL", async () => {
    const { runtime, http } = makeRuntime(makeConfig());
    await runtime.createApi().search("ceniza", 1);

    expect(http.requests.map((request) => request.url)).toContain(
      `${BASE_URL}/search?q=ceniza&page=1`,
    );
  });

  it("no expone los métodos que la configuración no define", () => {
    const { popular: _popular, ...rest } = makeConfig();
    const { runtime } = makeRuntime(rest);

    expect(runtime.createApi().popular).toBeUndefined();
  });

  it("calcula hasNext con exists:false (siguiente mientras NO haya enlace)", async () => {
    const base = makeConfig();
    const config: DeclarativeConfig = {
      ...base,
      popular: { ...base.popular, hasNext: { selector: "nav.pager a.next", exists: false } },
    };
    const { runtime } = makeRuntime(config);

    // La página 1 trae enlace «siguiente» → con exists:false, hasNext debe ser false.
    expect((await runtime.createApi().popular?.(1))?.hasNext).toBe(false);
  });
});

describe("DeclarativeRuntime · details", () => {
  it("produce un SeriesDetails completo", async () => {
    const { runtime } = makeRuntime(makeConfig());
    const details = await runtime.createApi().details("dragon-de-ceniza");

    expect(details.id).toBe("dragon-de-ceniza");
    expect(details.title).toBe("El dragón de ceniza");
    expect(details.cover).toEqual({ url: `${BASE_URL}/img/dragon-de-ceniza.svg` });
    expect(details.description).toBe("Una cartógrafa hereda un dragón.");
    expect(details.genres).toEqual(["Fantasía", "Aventura"]);
    expect(details.altTitles).toEqual(["Ash Dragon"]);
    expect(details.status).toBe("ongoing");
    expect(details.extra).toEqual({});
    expect(details.chapters).toHaveLength(1);
    expect(details.chapters[0]?.number).toBe(1);
    expect(details.chapters[0]?.releases).toEqual([
      { id: "r-oficial", group: "Equipo Ryuu", publishedAt: "2026-09-01T10:00:00Z" },
      { id: "r-alt", group: "Escuadrón Noche", publishedAt: "2026-09-02T18:30:00Z" },
    ]);
  });

  it("cae a status 'unknown' si el valor no es del contrato", async () => {
    const body = DETAIL_HTML.replace('data-estado="ongoing"', 'data-estado="En curso"');
    const { runtime } = makeRuntime(makeConfig(), {
      ...ROUTES,
      [`${BASE_URL}/serie/dragon-de-ceniza`]: { body },
    });

    expect((await runtime.createApi().details("dragon-de-ceniza")).status).toBe("unknown");
  });
});

describe("DeclarativeRuntime · pages", () => {
  it("devuelve las imágenes con URL absoluta", async () => {
    const { runtime } = makeRuntime(makeConfig());
    const pages = await runtime.createApi().pages("ch-1", "r-oficial");

    expect(pages.images).toEqual([
      { url: `${BASE_URL}/img/ch-1-1.svg` },
      { url: `${BASE_URL}/img/ch-1-2.svg` },
    ]);
  });

  it("extrae con regex el src de un atributo style", async () => {
    const base = makeConfig();
    const config: DeclarativeConfig = {
      ...base,
      pages: {
        url: "{baseUrl}/leer/{chapterId}/{releaseId}",
        images: {
          selector: "div.lector > div.pagina",
          attr: "style",
          regex: "url\\(['\"]?(.*?)['\"]?\\)",
        },
      },
    };
    const body = `<div class="lector"><div class="pagina" style="background-image: url('/img/a.png')"></div></div>`;
    const { runtime } = makeRuntime(config, {
      [`${BASE_URL}/leer/ch-1/r-oficial`]: { body },
    });

    const pages = await runtime.createApi().pages("ch-1", "r-oficial");
    expect(pages.images).toEqual([{ url: "/img/a.png" }]);
  });
});

describe("DeclarativeRuntime · errores", () => {
  it("un selector de campo roto produce PARSE con details.selector", async () => {
    const base = makeConfig();
    const broken: DeclarativeConfig = {
      ...base,
      details: {
        ...base.details,
        fields: { ...base.details.fields, title: { selector: "h1.no-existe" } },
      },
    };
    const { runtime } = makeRuntime(broken);

    const error = await rejection(runtime.createApi().details("dragon-de-ceniza"));

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).details?.selector).toBe("h1.no-existe");
  });

  it("un selector de lista roto produce PARSE con el selector de la tarjeta", async () => {
    const base = makeConfig();
    const broken: DeclarativeConfig = {
      ...base,
      popular: {
        ...base.popular,
        fields: { ...base.popular.fields, title: { selector: "h3.no-existe" } },
      },
    };
    const { runtime } = makeRuntime(broken);

    const error = await rejection(runtime.createApi().popular?.(1));

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).details?.selector).toBe("h3.no-existe");
  });

  it("una respuesta 404 produce ModuleError NOT_FOUND", async () => {
    const { runtime } = makeRuntime(makeConfig(), {});

    const error = await rejection(runtime.createApi().popular?.(1));

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("NOT_FOUND");
    expect((error as ModuleError).details?.status).toBe(404);
  });
});
