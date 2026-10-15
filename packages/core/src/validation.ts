/**
 * Resultado de una validación, compartido con `module-sdk`.
 *
 * El núcleo **no** valida manifests ni índices: el SPEC §5.1 deja el validador en el SDK
 * y el núcleo no puede importarlo (P-37). Pero sí necesita la **forma** del resultado,
 * porque los validadores entran inyectados (`RepoIndexValidator` en T12,
 * `ManifestValidator` en T13).
 */

/** Un problema de validación: dónde está (`path`) y por qué (`message`). */
export interface ValidationIssue {
  path: string;
  message: string;
}

/** Resultado: o el valor tipado, o la lista de problemas. */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };
