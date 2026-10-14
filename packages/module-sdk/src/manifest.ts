/**
 * Validación del manifest de un módulo (SPEC §6.1).
 *
 * Devuelve o el manifest tipado o una lista de problemas con **ruta y motivo**.
 */
import type { MediaKind, ModuleManifest } from "@ryuunest/core";

import { compareSemver, isSemver } from "./semver.js";
import {
  childPath,
  indexedPath,
  ID_PATTERN,
  isAbsoluteUrl,
  isNonEmptyString,
  isRecord,
  IssueCollector,
  type ValidationResult,
} from "./validation.js";

/** Tipos de obra del contrato (SPEC §6.1, D-13). */
export const MEDIA_KINDS = [
  "manga",
  "manhua",
  "manhwa",
  "comic",
] as const satisfies readonly MediaKind[];

export const MODULE_RUNTIMES = ["declarative", "script"] as const;
export const MODULE_CAPABILITIES = ["popular", "latest", "search"] as const;

export interface ValidateOptions {
  /** Versión de la app, para comprobar `minAppVersion` contra ella. */
  appVersion?: string;
}

export function validateManifest(
  value: unknown,
  options: ValidateOptions = {},
): ValidationResult<ModuleManifest> {
  const issues = new IssueCollector();

  if (!isRecord(value)) {
    issues.add("", "El manifest debe ser un objeto");
    return issues.result<ModuleManifest>(value);
  }

  validateModuleFields(value, "", issues, options);

  if (!isAbsoluteUrl(value["baseUrl"])) {
    issues.add("baseUrl", "Debe ser una URL absoluta");
  }
  validateEnumArray(value["capabilities"], "capabilities", MODULE_CAPABILITIES, issues, false);
  requireString(value["entry"], "entry", issues);

  return issues.result<ModuleManifest>(value);
}

/**
 * Campos que comparten el manifest (SPEC §6.1) y cada entrada del índice de repo
 * (SPEC §6.7). `prefix` es `""` para el manifest o `modules[n]` para una entrada.
 */
export function validateModuleFields(
  value: Record<string, unknown>,
  prefix: string,
  issues: IssueCollector,
  options: ValidateOptions,
): void {
  validateId(value["id"], childPath(prefix, "id"), issues);
  requireString(value["name"], childPath(prefix, "name"), issues);
  validateSemver(value["version"], childPath(prefix, "version"), issues);

  if (value["apiVersion"] !== 1) {
    issues.add(childPath(prefix, "apiVersion"), "Debe ser 1");
  }

  validateEnum(value["runtime"], MODULE_RUNTIMES, childPath(prefix, "runtime"), issues);
  validateEnumArray(value["kinds"], childPath(prefix, "kinds"), MEDIA_KINDS, issues, true);
  requireString(value["lang"], childPath(prefix, "lang"), issues);

  if (typeof value["nsfw"] !== "boolean") {
    issues.add(childPath(prefix, "nsfw"), "Debe ser un booleano");
  }

  validatePermissions(value["permissions"], childPath(prefix, "permissions"), issues);

  validateOptionalString(value, "author", prefix, issues);
  validateOptionalString(value, "homepage", prefix, issues);
  validateOptionalString(value, "license", prefix, issues);
  validateMinAppVersion(
    value["minAppVersion"],
    childPath(prefix, "minAppVersion"),
    options,
    issues,
  );
}

function requireString(value: unknown, path: string, issues: IssueCollector): void {
  if (!isNonEmptyString(value)) {
    issues.add(path, "Requerido: cadena no vacía");
  }
}

function validateId(value: unknown, path: string, issues: IssueCollector): void {
  if (!isNonEmptyString(value)) {
    issues.add(path, "Requerido: cadena no vacía");
    return;
  }
  if (!ID_PATTERN.test(value)) {
    issues.add(path, "Solo minúsculas, dígitos y guiones ([a-z0-9-])");
  }
}

function validateSemver(value: unknown, path: string, issues: IssueCollector): void {
  if (!isSemver(value)) {
    issues.add(path, "Debe ser una versión semver (p. ej. 1.0.0)");
  }
}

function validateEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: IssueCollector,
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.add(path, `Debe ser uno de: ${allowed.join(", ")}`);
  }
}

function validateEnumArray(
  value: unknown,
  path: string,
  allowed: readonly string[],
  issues: IssueCollector,
  requireAtLeastOne: boolean,
): void {
  if (!Array.isArray(value)) {
    issues.add(path, "Debe ser una lista");
    return;
  }
  if (requireAtLeastOne && value.length === 0) {
    issues.add(path, "Debe tener al menos un valor");
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !allowed.includes(item)) {
      issues.add(indexedPath(path, index), `Debe ser uno de: ${allowed.join(", ")}`);
    }
  });
}

function validatePermissions(value: unknown, path: string, issues: IssueCollector): void {
  if (!isRecord(value)) {
    issues.add(path, "Requerido: objeto con { domains }");
    return;
  }

  const domains = value["domains"];
  if (!Array.isArray(domains) || domains.length === 0) {
    issues.add(childPath(path, "domains"), "Debe ser una lista con al menos un dominio");
    return;
  }

  domains.forEach((domain, index) => {
    if (!isNonEmptyString(domain)) {
      issues.add(indexedPath(childPath(path, "domains"), index), "Debe ser una cadena no vacía");
    }
  });
}

function validateOptionalString(
  value: Record<string, unknown>,
  key: string,
  prefix: string,
  issues: IssueCollector,
): void {
  const raw = value[key];
  if (raw !== undefined && !isNonEmptyString(raw)) {
    issues.add(childPath(prefix, key), "Si se indica, debe ser una cadena no vacía");
  }
}

function validateMinAppVersion(
  value: unknown,
  path: string,
  options: ValidateOptions,
  issues: IssueCollector,
): void {
  if (value === undefined) {
    return;
  }
  if (!isSemver(value)) {
    issues.add(path, "Debe ser una versión semver (p. ej. 1.0.0)");
    return;
  }
  if (options.appVersion !== undefined && compareSemver(options.appVersion, value) < 0) {
    issues.add(path, `Requiere la app ${value} y la app instalada es ${options.appVersion}`);
  }
}

/** `baseUrl`, `capabilities` y `entry` solo existen en el manifest, no en el índice. */
