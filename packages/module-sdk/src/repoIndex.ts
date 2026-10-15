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
import type { RepoIndex } from "@ryuunest/core";
import { REPO_INDEX_FORMAT, REPO_INDEX_VERSION } from "@ryuunest/core";

import { validateModuleFields, type ValidateOptions } from "./manifest.js";
import {
  childPath,
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

  modules.forEach((entry, index) => {
    validateRepoModule(entry, `modules[${index}]`, issues, options);
  });

  return issues.result<RepoIndex>(value);
}

function validateRepoModule(
  value: unknown,
  prefix: string,
  issues: IssueCollector,
  options: ValidateOptions,
): void {
  if (!isRecord(value)) {
    issues.add(prefix, "Cada módulo debe ser un objeto");
    return;
  }

  validateModuleFields(value, prefix, issues, options);

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
