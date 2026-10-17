/**
 * @ryuunest/test-site — sitios falsos y fixtures reutilizables (paquete, P-9).
 *
 * Incluye dos arquitecturas ficticias: (a) HTML + paginación numérica y
 * (b) JSON + paginación por cursor, para validar la generalidad del contrato.
 * También el arnés de contrato, que ejecuta cualquier `ModuleApi` contra ellas.
 *
 * Tareas: T10; segunda arquitectura y congelación de API en T32.
 */
export const TEST_SITE_VERSION = "0.0.0";

export {
  FIXTURE_DEFAULTS,
  FIXTURE_SERIES,
  findChapter,
  findSeries,
  normalizeText,
  searchFixtureSeries,
} from "./fixtures.js";
export type { FixtureChapter, FixtureDefaults, FixtureRelease, FixtureSeries } from "./fixtures.js";

export {
  createHtmlSite,
  createJsonApiSite,
  createSiteHttp,
  HTML_SELECTORS,
  HTML_SITE_BASE_URL,
  JSON_API_BASE_URL,
  JSON_API_IMAGE_HEADERS,
  TestSiteHttp,
} from "./sites.js";
export type { SiteName, TestRoute, TestSite } from "./sites.js";

export { EXAMPLE_DECLARATIVE } from "./exampleDeclarative.js";

export {
  createExampleScript,
  EXAMPLE_SCRIPT_ENTRY,
  EXAMPLE_SCRIPT_HTML,
  EXAMPLE_SCRIPT_JSON,
} from "./exampleScript.js";
export type { ExampleScriptSite } from "./exampleScript.js";

export { ContractError, runContract } from "./harness.js";
export type { ContractHarnessOptions, ContractReport } from "./harness.js";
