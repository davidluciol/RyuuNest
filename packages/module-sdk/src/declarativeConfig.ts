/**
 * Validación del `index.json` de un módulo declarativo (T39, R2 del ADR-0003).
 *
 * La norma es `docs/declarative-format.md`. Devuelve la configuración tipada o los
 * problemas con **ruta y motivo**. Las claves desconocidas se ignoran (ADR-0003).
 */
import {
  DECLARATIVE_VARIABLES,
  TRANSFORM_NAMES,
  type DeclarativeConfig,
  type TransformName,
} from "@ryuunest/core";

import {
  childPath,
  indexedPath,
  isNonEmptyString,
  isRecord,
  IssueCollector,
  type ValidationResult,
} from "./validation.js";

type MethodName = keyof typeof DECLARATIVE_VARIABLES;

const LIST_METHODS = ["popular", "latest", "search"] as const satisfies readonly MethodName[];
const TEMPLATE_VARIABLE = /\{(\w+)(?::(\w+))?\}/gu;

export function validateDeclarativeConfig(value: unknown): ValidationResult<DeclarativeConfig> {
  const issues = new IssueCollector();
  if (!isRecord(value)) {
    issues.add("", "El index.json debe ser un objeto");
    return issues.result<DeclarativeConfig>(value);
  }

  for (const name of LIST_METHODS) {
    const method = value[name];
    if (method !== undefined) {
      validateList(method, name, issues);
    }
  }
  if (value["details"] !== undefined) {
    validateDetails(value["details"], issues);
  }
  if (value["pages"] !== undefined) {
    validatePages(value["pages"], issues);
  }

  return issues.result<DeclarativeConfig>(value);
}

function validateList(value: unknown, name: MethodName, issues: IssueCollector): void {
  if (!isRecord(value)) {
    issues.add(name, "Debe ser un objeto");
    return;
  }
  validateTemplate(value["url"], childPath(name, "url"), name, issues);
  requireString(value["list"], childPath(name, "list"), issues);
  validateFields(
    value["fields"],
    childPath(name, "fields"),
    { known: LIST_FIELDS, required: ["id", "title"] },
    issues,
  );

  const hasNext = value["hasNext"];
  if (hasNext !== undefined) {
    const path = childPath(name, "hasNext");
    if (!isRecord(hasNext)) {
      issues.add(path, "Debe ser un objeto { selector, exists? }");
    } else {
      requireString(hasNext["selector"], childPath(path, "selector"), issues);
      if (hasNext["exists"] !== undefined && typeof hasNext["exists"] !== "boolean") {
        issues.add(childPath(path, "exists"), "Debe ser un booleano");
      }
    }
  }
}

function validateDetails(value: unknown, issues: IssueCollector): void {
  if (!isRecord(value)) {
    issues.add("details", "Debe ser un objeto");
    return;
  }
  validateTemplate(value["url"], "details.url", "details", issues);
  validateFields(
    value["fields"],
    "details.fields",
    { known: DETAILS_FIELDS, required: ["title"], documentScope: true },
    issues,
  );

  const chapters = value["chapters"];
  if (!isRecord(chapters)) {
    issues.add("details.chapters", "Requerido: objeto { list, fields, releases }");
  } else {
    requireString(chapters["list"], "details.chapters.list", issues);
    validateFields(
      chapters["fields"],
      "details.chapters.fields",
      { known: ["id", "title", "number"], required: ["id", "title"] },
      issues,
    );
    const releases = chapters["releases"];
    if (!isRecord(releases)) {
      issues.add("details.chapters.releases", "Requerido: objeto { list, fields }");
    } else {
      requireString(releases["list"], "details.chapters.releases.list", issues);
      validateFields(
        releases["fields"],
        "details.chapters.releases.fields",
        { known: ["id", "group", "publishedAt"], required: ["id"] },
        issues,
      );
    }
  }

  if (value["extra"] !== undefined) {
    validateFields(value["extra"], "details.extra", { required: [], documentScope: true }, issues);
  }
}

function validatePages(value: unknown, issues: IssueCollector): void {
  if (!isRecord(value)) {
    issues.add("pages", "Debe ser un objeto");
    return;
  }
  validateTemplate(value["url"], "pages.url", "pages", issues);
  if (value["images"] === undefined) {
    issues.add("pages.images", "Requerido: campo de las imágenes");
  } else {
    validateField(value["images"], "pages.images", issues, true);
  }
  if (value["title"] !== undefined) {
    validateField(value["title"], "pages.title", issues, true);
  }

  const headers = value["imageHeaders"];
  if (headers === undefined) {
    return;
  }
  if (!isRecord(headers)) {
    issues.add("pages.imageHeaders", "Debe ser un objeto { cabecera: valor }");
    return;
  }
  for (const [name, header] of Object.entries(headers)) {
    validateTemplate(header, childPath("pages.imageHeaders", name), "pages", issues);
  }
}

/** Qué campos de un mapa se comprueban. */
interface FieldsRule {
  /** Nombres que lee el runtime; los demás se ignoran. Sin lista, se leen todos (`extra`). */
  known?: readonly string[];
  /** Los que exige el contrato. */
  required: readonly string[];
  /** Se leen sobre el documento entero: sin elemento como ámbito, `selector` es obligatorio. */
  documentScope?: boolean;
}

/** Nombres de campo que lee el runtime en cada sitio (`docs/declarative-format.md` §5–§6). */
const LIST_FIELDS = ["id", "title", "cover", "kind", "nsfw", "badges", "hint"];
const DETAILS_FIELDS = [
  "title",
  "cover",
  "description",
  "status",
  "kind",
  "nsfw",
  "genres",
  "altTitles",
];

function validateFields(
  value: unknown,
  path: string,
  rule: FieldsRule,
  issues: IssueCollector,
): void {
  if (!isRecord(value)) {
    issues.add(path, "Requerido: objeto { campo: especificación }");
    return;
  }
  for (const [name, spec] of Object.entries(value)) {
    if (rule.known === undefined || rule.known.includes(name)) {
      validateField(spec, childPath(path, name), issues, rule.documentScope === true);
    }
  }
  for (const name of rule.required) {
    if (value[name] === undefined) {
      issues.add(childPath(path, name), "Campo obligatorio");
    }
  }
}

function validateField(
  value: unknown,
  path: string,
  issues: IssueCollector,
  documentScope = false,
): void {
  if (!isRecord(value)) {
    issues.add(path, "Debe ser un objeto { selector?, attr?, regex?, all?, transform? }");
    return;
  }
  if (documentScope && value["selector"] === undefined) {
    issues.add(childPath(path, "selector"), "Requerido: se lee sobre el documento entero");
  }
  for (const key of ["selector", "attr"] as const) {
    if (value[key] !== undefined && !isNonEmptyString(value[key])) {
      issues.add(childPath(path, key), "Debe ser una cadena no vacía");
    }
  }
  if (value["regex"] !== undefined && !isValidRegex(value["regex"])) {
    issues.add(childPath(path, "regex"), "Expresión regular no válida");
  }
  if (value["all"] !== undefined && typeof value["all"] !== "boolean") {
    issues.add(childPath(path, "all"), "Debe ser un booleano");
  }

  const transforms = value["transform"];
  if (transforms === undefined) {
    return;
  }
  if (!Array.isArray(transforms)) {
    issues.add(childPath(path, "transform"), "Debe ser una lista");
    return;
  }
  transforms.forEach((spec: unknown, index) => {
    const problem = transformProblem(spec, value["all"] === true);
    if (problem !== undefined) {
      issues.add(indexedPath(childPath(path, "transform"), index), problem);
    }
  });
}

/** Motivo por el que una transformación no vale, o `undefined` si vale. */
function transformProblem(spec: unknown, all: boolean): string | undefined {
  const [name, ...args] = typeof spec === "string" ? [spec] : Array.isArray(spec) ? spec : [];
  if (!isTransformName(name)) {
    return `Transformación desconocida: ${String(name)}`;
  }
  const [first] = args;
  switch (name) {
    case "join":
      return all ? undefined : "«join» solo vale en un campo con «all: true»";
    case "regex":
    case "replace":
      return isValidRegex(first) ? undefined : `«${name}» necesita una expresión regular válida`;
    case "date":
      return typeof first === "string" && ["YYYY", "MM", "DD"].every((t) => first.includes(t))
        ? undefined
        : "«date» necesita un formato con YYYY, MM y DD";
    case "map":
      return isRecord(first) && Object.values(first).every((to) => typeof to === "string")
        ? undefined
        : "«map» necesita un objeto { valor del sitio: valor }";
    default:
      return undefined;
  }
}

/** Una plantilla (URL o cabecera) que solo usa las variables del método. */
function validateTemplate(
  value: unknown,
  path: string,
  method: MethodName,
  issues: IssueCollector,
): void {
  if (!isNonEmptyString(value)) {
    issues.add(path, "Requerido: cadena no vacía");
    return;
  }
  const allowed: readonly string[] = ["baseUrl", ...DECLARATIVE_VARIABLES[method]];
  for (const [match, key, modifier] of value.matchAll(TEMPLATE_VARIABLE)) {
    if (!allowed.includes(key ?? "") || (modifier !== undefined && modifier !== "raw")) {
      issues.add(path, `Variable no admitida aquí: ${match} (admite ${allowed.join(", ")})`);
      return;
    }
  }
}

function requireString(value: unknown, path: string, issues: IssueCollector): void {
  if (!isNonEmptyString(value)) {
    issues.add(path, "Requerido: cadena no vacía");
  }
}

function isTransformName(value: unknown): value is TransformName {
  return typeof value === "string" && (TRANSFORM_NAMES as readonly string[]).includes(value);
}

function isValidRegex(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
