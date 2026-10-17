/**
 * Runtime declarativo (SPEC §6.6, T16).
 *
 * Un módulo `declarative` describe con selectores CSS dónde está cada dato
 * (`index.json`) y el núcleo construye la `ModuleApi`. La única puerta hacia el
 * exterior es el `Host` (permisos de dominio, tiempo límite y concurrencia, SPEC
 * §6.5), así que el runtime no hace red por su cuenta.
 *
 * El formato se cierra en esta fase (ver `tasks/plan.md` y la decisión P-50).
 */
import type {
  Chapter,
  ChapterPages,
  Host,
  HtmlDocument,
  HtmlElement,
  ImageRef,
  MediaKind,
  ModuleApi,
  Page,
  Release,
  SeriesDetails,
  SeriesStatus,
  SeriesSummary,
} from "../contract/types.js";
import { ModuleError } from "../contract/errors.js";
import { moduleErrorFromStatus } from "./errorMapping.js";
import {
  applyTransforms,
  joinValues,
  regexCapture,
  transformArgs,
  transformName,
  type TransformContext,
  type TransformSpec,
} from "./transforms.js";

/** Cómo se extrae y transforma un campo. */
export interface DeclarativeFieldSpec {
  /** Selector CSS dentro del ámbito del campo. Si falta, se usa el propio ámbito. */
  selector?: string;
  /** Atributo del que se lee el valor. Si falta, se usa el texto. */
  attr?: string;
  /** Expresión regular aplicada al texto del elemento (primer grupo). */
  regex?: string;
  /** Si es `true`, el campo devuelve una lista en vez de un valor. */
  all?: boolean;
  /** Transformaciones, aplicadas en orden (SPEC §6.6). */
  transform?: readonly TransformSpec[];
}

/** Cómo se decide si hay página siguiente. */
export interface DeclarativeHasNext {
  selector: string;
  /** `true` (por defecto): hay siguiente si el selector coincide. `false`: al revés. */
  exists?: boolean;
}

/** Un método de listado (`popular`, `latest` o `search`). */
export interface DeclarativeListMethod {
  url: string;
  /** Selector de la tarjeta de cada serie. */
  list: string;
  fields: Record<string, DeclarativeFieldSpec>;
  hasNext?: DeclarativeHasNext;
}

/** Capítulos y releases de la ficha de una serie. */
export interface DeclarativeChaptersSpec {
  list: string;
  fields: Record<string, DeclarativeFieldSpec>;
  releases: { list: string; fields: Record<string, DeclarativeFieldSpec> };
}

/** El método `details`. */
export interface DeclarativeDetailsMethod {
  url: string;
  fields: Record<string, DeclarativeFieldSpec>;
  chapters: DeclarativeChaptersSpec;
}

/** El método `pages`. */
export interface DeclarativePagesMethod {
  url: string;
  images: DeclarativeFieldSpec;
  title?: DeclarativeFieldSpec;
}

/** Configuración declarativa completa (`index.json`). */
export interface DeclarativeConfig {
  popular?: DeclarativeListMethod;
  latest?: DeclarativeListMethod;
  search?: DeclarativeListMethod;
  details?: DeclarativeDetailsMethod;
  pages?: DeclarativePagesMethod;
}

/** Opciones del runtime. */
export interface DeclarativeRuntimeOptions {
  config: DeclarativeConfig;
  host: Host;
  /** URL base del módulo (`manifest.baseUrl`). */
  baseUrl: string;
}

const MEDIA_KINDS = ["manga", "manhua", "manhwa", "comic"] as const satisfies readonly MediaKind[];
const SERIES_STATUSES = [
  "ongoing",
  "completed",
  "hiatus",
  "cancelled",
  "unknown",
] as const satisfies readonly SeriesStatus[];

function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

function isSeriesStatus(value: string): value is SeriesStatus {
  return (SERIES_STATUSES as readonly string[]).includes(value);
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "si", "sí"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  return undefined;
}

/** Contexto del ámbito al leer un campo, para poder señalar el selector del fallo. */
interface ReadOptions {
  /** Selector del ámbito; se usa cuando el campo no trae selector propio. */
  scopeSelector?: string;
  url: string;
}

function parseError(message: string, selector: string | undefined, url: string): ModuleError {
  return new ModuleError("PARSE", message, selector === undefined ? { url } : { url, selector });
}

function isHtmlElement(node: HtmlDocument | HtmlElement): node is HtmlElement {
  return "attr" in node;
}

/** Devuelve la primera transformación `join` de una lista, si la hay. */
function findJoin(specs: readonly TransformSpec[] | undefined): TransformSpec | undefined {
  return specs?.find((spec) => transformName(spec) === "join");
}

export class DeclarativeRuntime {
  readonly #config: DeclarativeConfig;
  readonly #host: Host;
  readonly #context: TransformContext;

  constructor(options: DeclarativeRuntimeOptions) {
    this.#config = options.config;
    this.#host = options.host;
    this.#context = { baseUrl: options.baseUrl };
  }

  /** Construye la `ModuleApi` con los métodos que la configuración define. */
  createApi(): ModuleApi {
    const api: ModuleApi = {
      search: async (query, page) =>
        this.#list(this.#require(this.#config.search, "search"), { query }, page),
      details: async (seriesId) =>
        this.#details(this.#require(this.#config.details, "details"), seriesId),
      pages: async (chapterId, releaseId) =>
        this.#pages(this.#require(this.#config.pages, "pages"), chapterId, releaseId),
    };

    const popular = this.#config.popular;
    if (popular !== undefined) {
      api.popular = async (page) => this.#list(popular, {}, page);
    }
    const latest = this.#config.latest;
    if (latest !== undefined) {
      api.latest = async (page) => this.#list(latest, {}, page);
    }
    return api;
  }

  #require<T>(value: T | undefined, name: string): T {
    if (value === undefined) {
      throw new ModuleError("UNSUPPORTED", `El módulo declarativo no define «${name}»`);
    }
    return value;
  }

  /* ---------------------------------------------------------------- */
  /* Métodos del contrato                                             */
  /* ---------------------------------------------------------------- */

  async #list(
    config: DeclarativeListMethod,
    vars: { query?: string },
    page: number,
  ): Promise<Page<SeriesSummary>> {
    const url = this.#fill(config.url, {
      page: String(page),
      ...(vars.query === undefined ? {} : { query: encodeURIComponent(vars.query) }),
    });
    const document = await this.#document(url);
    const options: ReadOptions = { scopeSelector: config.list, url };
    const items = this.#select(document, config.list).map((element) =>
      this.#summary(element, config, options),
    );
    return { items, hasNext: this.#hasNext(document, config) };
  }

  async #details(config: DeclarativeDetailsMethod, seriesId: string): Promise<SeriesDetails> {
    const url = this.#fill(config.url, { id: encodeURIComponent(seriesId) });
    const document = await this.#document(url);
    const options: ReadOptions = { url };
    const value = (name: string): string => this.#read(document, config.fields[name]);
    const list = (name: string): string[] => this.#readList(document, config.fields[name]);

    const title = this.#required(value("title"), "title", config.fields["title"], options);
    const coverUrl = value("cover");
    const description = value("description");
    const rawStatus = value("status");
    const kind = value("kind");
    const nsfw = parseBoolean(value("nsfw"));

    const chapterElements = this.#select(document, config.chapters.list);
    if (chapterElements.length === 0) {
      throw parseError("No se encontró ningún capítulo", config.chapters.list, url);
    }

    const details: SeriesDetails = {
      id: seriesId,
      title,
      genres: list("genres"),
      altTitles: list("altTitles"),
      status: isSeriesStatus(rawStatus) ? rawStatus : "unknown",
      extra: {},
      chapters: chapterElements.map((element) => this.#chapter(element, config.chapters, url)),
      ...(coverUrl === "" ? {} : { cover: { url: coverUrl } }),
      ...(description === "" ? {} : { description }),
      ...(isMediaKind(kind) ? { kind } : {}),
      ...(nsfw === undefined ? {} : { nsfw }),
    };
    return details;
  }

  async #pages(
    config: DeclarativePagesMethod,
    chapterId: string,
    releaseId: string,
  ): Promise<ChapterPages> {
    const url = this.#fill(config.url, {
      chapterId: encodeURIComponent(chapterId),
      releaseId: encodeURIComponent(releaseId),
    });
    const document = await this.#document(url);
    const imagesSpec: DeclarativeFieldSpec = { ...config.images, all: true };
    const urls = this.#readList(document, imagesSpec);
    if (urls.length === 0) {
      throw parseError("No se encontró ninguna imagen", config.images.selector, url);
    }

    const title = this.#read(document, config.title);
    const images: ImageRef[] = urls.map((imageUrl) => ({ url: imageUrl }));
    return { ...(title === "" ? {} : { title }), images };
  }

  /* ---------------------------------------------------------------- */
  /* Extracción de campos                                             */
  /* ---------------------------------------------------------------- */

  #summary(scope: HtmlElement, config: DeclarativeListMethod, options: ReadOptions): SeriesSummary {
    const fields = config.fields;
    const id = this.#required(this.#read(scope, fields["id"]), "id", fields["id"], options);
    const title = this.#required(
      this.#read(scope, fields["title"]),
      "title",
      fields["title"],
      options,
    );
    const coverUrl = this.#read(scope, fields["cover"]);
    const kind = this.#read(scope, fields["kind"]);
    const hint = this.#read(scope, fields["hint"]);
    const nsfw = parseBoolean(this.#read(scope, fields["nsfw"]));
    const badges = this.#readList(scope, fields["badges"]);

    return {
      id,
      title,
      ...(coverUrl === "" ? {} : { cover: { url: coverUrl } }),
      ...(isMediaKind(kind) ? { kind } : {}),
      ...(nsfw === undefined ? {} : { nsfw }),
      ...(badges.length === 0 ? {} : { badges }),
      ...(hint === "" ? {} : { hint }),
    };
  }

  #chapter(scope: HtmlElement, config: DeclarativeChaptersSpec, url: string): Chapter {
    const options: ReadOptions = { scopeSelector: config.list, url };
    const fields = config.fields;
    const id = this.#required(this.#read(scope, fields["id"]), "id", fields["id"], options);
    const title = this.#required(
      this.#read(scope, fields["title"]),
      "title",
      fields["title"],
      options,
    );
    const numberRaw = this.#read(scope, fields["number"]);
    const number = Number(numberRaw);

    const releaseElements = this.#select(scope, config.releases.list);
    if (releaseElements.length === 0) {
      throw parseError("No se encontró ninguna release", config.releases.list, url);
    }

    return {
      id,
      title,
      ...(numberRaw === "" || Number.isNaN(number) ? {} : { number }),
      releases: releaseElements.map((element) => this.#release(element, config.releases, url)),
    };
  }

  #release(scope: HtmlElement, config: DeclarativeChaptersSpec["releases"], url: string): Release {
    const options: ReadOptions = { scopeSelector: config.list, url };
    const fields = config.fields;
    const id = this.#required(this.#read(scope, fields["id"]), "id", fields["id"], options);
    const group = this.#read(scope, fields["group"]);
    const publishedAt = this.#read(scope, fields["publishedAt"]);

    return {
      id,
      ...(group === "" ? {} : { group }),
      ...(publishedAt === "" ? {} : { publishedAt }),
    };
  }

  /** Primer valor de un campo (cadena vacía si el campo no está o no coincide). */
  #read(scope: HtmlDocument | HtmlElement, spec: DeclarativeFieldSpec | undefined): string {
    if (spec === undefined) {
      return "";
    }
    return this.#readList(scope, spec)[0] ?? "";
  }

  /** Todos los valores de un campo (incluye `join` si el campo lo pide). */
  #readList(scope: HtmlDocument | HtmlElement, spec: DeclarativeFieldSpec | undefined): string[] {
    if (spec === undefined) {
      return [];
    }

    const elements = this.#elements(scope, spec);
    const joinSpec = findJoin(spec.transform);
    const transforms = spec.transform?.filter((item) => transformName(item) !== "join");
    const values = elements.map((element) =>
      applyTransforms(this.#rawValue(element, spec), transforms, this.#context),
    );

    if (joinSpec !== undefined) {
      return [joinValues(values, String(transformArgs(joinSpec)[0] ?? ""))];
    }
    return spec.all === true ? values : values.slice(0, 1);
  }

  #rawValue(element: HtmlElement, spec: DeclarativeFieldSpec): string {
    const raw = spec.attr === undefined ? element.text() : (element.attr(spec.attr) ?? "");
    return spec.regex === undefined ? raw : regexCapture(raw, spec.regex);
  }

  #required(
    value: string,
    field: string,
    spec: DeclarativeFieldSpec | undefined,
    options: ReadOptions,
  ): string {
    if (value !== "") {
      return value;
    }
    throw parseError(
      `No se pudo extraer el campo «${field}»`,
      spec?.selector ?? options.scopeSelector,
      options.url,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Red, HTML y plantillas                                           */
  /* ---------------------------------------------------------------- */

  async #document(url: string): Promise<HtmlDocument> {
    const response = await this.#host.fetch(url);
    if (response.status !== 200) {
      throw moduleErrorFromStatus(url, response.status);
    }
    return this.#host.html(await response.text());
  }

  #hasNext(document: HtmlDocument, config: DeclarativeListMethod): boolean {
    const hasNext = config.hasNext;
    if (hasNext === undefined) {
      return false;
    }
    const matches = this.#select(document, hasNext.selector).length > 0;
    return hasNext.exists === false ? !matches : matches;
  }

  #select(scope: HtmlDocument | HtmlElement, selector: string): HtmlElement[] {
    try {
      return scope.select(selector);
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError("PARSE", `Selector no válido: ${selector}`, { selector });
    }
  }

  /** Elementos de un campo: los del selector, o el propio ámbito si no hay selector. */
  #elements(scope: HtmlDocument | HtmlElement, spec: DeclarativeFieldSpec): HtmlElement[] {
    if (spec.selector !== undefined) {
      return this.#select(scope, spec.selector);
    }
    if (isHtmlElement(scope)) {
      return [scope];
    }
    throw new ModuleError(
      "INTERNAL",
      "Un campo sin «selector» necesita un elemento como ámbito",
      {},
    );
  }

  #fill(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/gu, (match, key: string) => {
      if (key === "baseUrl") {
        return this.#context.baseUrl;
      }
      const value = vars[key];
      if (value === undefined) {
        throw new ModuleError(
          "UNSUPPORTED",
          `Variable desconocida en la plantilla de URL: ${match}`,
        );
      }
      return value;
    });
  }
}
