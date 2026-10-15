/** Utilidades de validación compartidas (sin dependencias). */
import type { ValidationIssue, ValidationResult } from "@ryuunest/core";

/** La forma del resultado es del contrato: vive en el núcleo y se reexporta aquí. */
export type { ValidationIssue, ValidationResult };

/** Acumula los problemas durante una validación. */
export class IssueCollector {
  readonly issues: ValidationIssue[] = [];

  add(path: string, message: string): void {
    this.issues.push({ path, message });
  }

  result<T>(value: unknown): ValidationResult<T> {
    if (this.issues.length > 0) {
      return { ok: false, issues: this.issues };
    }
    return { ok: true, value: value as T };
  }
}

/** Ruta hija: `id` o `modules[0].id`. */
export function childPath(prefix: string, key: string): string {
  return prefix === "" ? key : `${prefix}.${key}`;
}

/** Ruta de un elemento indexado: `kinds[1]`. */
export function indexedPath(prefix: string, index: number): string {
  return `${prefix}[${index}]`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\/[^\s]+$/i;

/** Comprueba que sea una URL absoluta, sin depender de la Web API `URL`. */
export function isAbsoluteUrl(value: unknown): boolean {
  return typeof value === "string" && ABSOLUTE_URL.test(value);
}

/** Comprueba que sea una cadena ISO 8601 que `Date` sabe interpretar. */
export function isIsoDate(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export const ID_PATTERN = /^[a-z0-9-]+$/;
export const SHA256_PATTERN = /^[a-f0-9]{64}$/;
