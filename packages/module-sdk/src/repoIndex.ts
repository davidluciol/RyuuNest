/**
 * Validación del índice de repositorio (SPEC §6.7).
 *
 * La **forma** del índice es parte del contrato y vive en el núcleo (`@ryuunest/core`,
 * P-37); aquí queda el validador (SPEC §5.1) y se reexportan los tipos para que el API
 * público del SDK no cambie.
 *
 * Cada entrada se valida como el manifest, más los campos del paquete
 * (`package`, `sha256`, `size`).
 */
import type { IncompatibleModuleEntry, RepoIndex, RepoModuleEntry } from "@ryuunest/core";
import { describeIssues, REPO_INDEX_FORMAT, REPO_INDEX_VERSION } from "@ryuunest/core";

import {
  MEDIA_KINDS,
  MODULE_RUNTIMES,
  validateModuleFields,
  type ValidateOptions,
} from "./manifest.js";
import { compareSemver, isSemver } from "./semver.js";
import {
  childPath,
  ID_PATTERN,
  isIsoDate,
  isNonEmptyString,
  isRecord,
  IssueCollector,
  SHA256_PATTERN,
  type ValidationResult,
} from "./validation.js";

export type { RepoIndex, RepoModuleEntry } from "@ryuunest/core";
export { REPO_INDEX_FORMAT, REPO_INDEX_VERSION };

export function validateRepoIndex(
  value: unknown,
  options: ValidateOptions = {},
): ValidationResult<RepoIndex> {
  const issues = new IssueCollector();

  if (!isRecord(value)) {
    issues.add("", "El índice de repo debe ser un objeto");
    return issues.result<RepoIndex>(value);
  }

  if (value["format"] !== REPO_INDEX_FORMAT) {
    issues.add("format", `Debe ser "${REPO_INDEX_FORMAT}"`);
  }
  if (value["version"] !== REPO_INDEX_VERSION) {
    issues.add("version", `Debe ser ${REPO_INDEX_VERSION}`);
  }
  if (!isNonEmptyString(value["name"])) {
    issues.add("name", "Requerido: cadena no vacía");
  }
  if (!isIsoDate(value["updatedAt"])) {
    issues.add("updatedAt", "Debe ser una fecha ISO 8601");
  }

  const modules = value["modules"];
  if (!Array.isArray(modules)) {
    issues.add("modules", "Debe ser una lista");
    return issues.result<RepoIndex>(value);
  }

  // T38 (R3): la tolerancia es por entrada. Las incompatibles se listan aparte y las
  // rotas se descartan con aviso; solo la cabecera invalida el índice entero.
  const compatible: RepoModuleEntry[] = [];
  const incompatible: IncompatibleModuleEntry[] = [];
  const warnings: string[] = [];

  modules.forEach((entry, index) => {
    const prefix = `modules[${index}]`;
    const reason = incompatibility(entry, options);
    if (reason !== undefined) {
      const id = isRecord(entry) ? entry["id"] : undefined;
      if (isRecord(entry) && isNonEmptyString(id) && ID_PATTERN.test(id)) {
        const name = isNonEmptyString(entry["name"]) ? { name: entry["name"] } : {};
        incompatible.push({ id, ...name, reason });
        return;
      }
      warnings.push(`${prefix}.id: Requerido para listar un módulo no compatible`);
      return;
    }

    const entryIssues = new IssueCollector();
    validateRepoModule(entry, prefix, entryIssues);
    if (entryIssues.issues.length > 0) {
      warnings.push(describeIssues(entryIssues.issues, 1));
    } else {
      compatible.push(entry as RepoModuleEntry);
    }
  });

  if (issues.issues.length > 0) {
    return issues.result<RepoIndex>(value);
  }
  return {
    ok: true,
    value: { ...(value as unknown as RepoIndex), modules: compatible, incompatible, warnings },
  };
}

/**
 * Motivo por el que esta app no puede usar la entrada, o `undefined` si es de la 1.x.
 * Solo mira lo que cambiaría en una versión futura: `apiVersion`, `runtime`, `kinds`
 * (valores desconocidos) y `minAppVersion` frente a la app.
 */
function incompatibility(entry: unknown, options: ValidateOptions): string | undefined {
  if (!isRecord(entry)) return undefined;
  const { apiVersion, runtime, kinds, minAppVersion } = entry;

  if (typeof apiVersion === "number" && Number.isInteger(apiVersion) && apiVersion !== 1) {
    return `apiVersion ${apiVersion} (esta app entiende la 1)`;
  }
  if (typeof runtime === "string" && !(MODULE_RUNTIMES as readonly string[]).includes(runtime)) {
    return `runtime "${runtime}" desconocido`;
  }
  if (Array.isArray(kinds)) {
    const unknown = kinds.find(
      (kind) => typeof kind === "string" && !(MEDIA_KINDS as readonly string[]).includes(kind),
    );
    if (unknown !== undefined) return `kinds "${String(unknown)}" desconocido`;
  }
  if (
    isSemver(minAppVersion) &&
    options.appVersion !== undefined &&
    compareSemver(options.appVersion, minAppVersion) < 0
  ) {
    return `Requiere la app ${minAppVersion} y la app instalada es ${options.appVersion}`;
  }
  return undefined;
}

function validateRepoModule(
  value: unknown,
  prefix: string,
  issues: IssueCollector,
): void {
  if (!isRecord(value)) {
    issues.add(prefix, "Cada módulo debe ser un objeto");
    return;
  }

  // Sin `appVersion`: la compatibilidad con la app ya se decidió en `incompatibility`.
  validateModuleFields(value, prefix, issues, {});

  if (!isNonEmptyString(value["package"])) {
    issues.add(childPath(prefix, "package"), "Requerido: ruta del paquete .zip");
  }

  const sha256 = value["sha256"];
  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) {
    issues.add(childPath(prefix, "sha256"), "Debe ser un SHA-256 hexadecimal de 64 caracteres");
  }

  const size = value["size"];
  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
    issues.add(childPath(prefix, "size"), "Debe ser un entero positivo (bytes)");
  }
}
