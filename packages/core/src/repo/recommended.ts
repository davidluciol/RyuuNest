/**
 * F44 — «Recomendados» (P-179): `recommended.json` del repo oficial, una lista de
 * repositorios que el autor aprueba o recomienda. Solo se descarga al abrir
 * Portales o a petición del usuario (RNF-5) y **no instala nada**: añadir uno pasa
 * por «Añadir repositorio» con confirmación manual.
 *
 * Misma tolerancia que el índice de repo (T38): una entrada rota se descarta con
 * aviso; solo un archivo que no es una lista lo invalida.
 */
import { ModuleError } from "../contract/errors.js";
import type { Http } from "../ports/http.js";
import { httpErrorCode, httpErrorMessage } from "../ports/httpStatus.js";
import type { ValidationResult } from "../validation.js";
import { describeIssues } from "../validation.js";

/** Repositorio recomendado. */
export interface RecommendedRepo {
  name: string;
  /** URL HTTPS de su `index.json` (RF-2). */
  indexUrl: string;
  description: string;
  nsfw: boolean;
}

export interface RecommendedList {
  repos: RecommendedRepo[];
  /** Entradas descartadas, con ruta y motivo. */
  warnings: string[];
}

function entryProblem(entry: unknown, path: string): string | undefined {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return `${path}: Debe ser un objeto`;
  }
  const { name, indexUrl, description, nsfw } = entry as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") return `${path}.name: Requerido`;
  if (typeof indexUrl !== "string" || !indexUrl.startsWith("https://")) {
    return `${path}.indexUrl: Debe ser una URL HTTPS`;
  }
  if (typeof description !== "string") return `${path}.description: Debe ser texto`;
  if (typeof nsfw !== "boolean") return `${path}.nsfw: Debe ser true o false`;
  return undefined;
}

export function parseRecommended(value: unknown): ValidationResult<RecommendedList> {
  if (!Array.isArray(value)) {
    return { ok: false, issues: [{ path: "", message: "Debe ser una lista" }] };
  }
  const repos: RecommendedRepo[] = [];
  const warnings: string[] = [];
  value.forEach((entry: unknown, index) => {
    const problem = entryProblem(entry, `[${index}]`);
    if (problem !== undefined) {
      warnings.push(problem);
      return;
    }
    const { name, indexUrl, description, nsfw } = entry as RecommendedRepo;
    repos.push({ name, indexUrl, description, nsfw });
  });
  return { ok: true, value: { repos, warnings } };
}

/** Descarga y valida `recommended.json`. Lanza `ModuleError` (red, HTTP o `PARSE`). */
export async function fetchRecommended(http: Http, url: string): Promise<RecommendedRepo[]> {
  const response = await http.request(url);
  if (response.status < 200 || response.status >= 300) {
    throw new ModuleError(
      httpErrorCode(response.status),
      httpErrorMessage(response.status, "Recomendados", url),
      { url, status: response.status },
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(await response.text());
  } catch {
    throw new ModuleError("PARSE", `recommended.json no es JSON válido: ${url}`, { url });
  }
  const result = parseRecommended(value);
  if (!result.ok) {
    throw new ModuleError("PARSE", `recommended.json inválido: ${describeIssues(result.issues)}`, {
      url,
    });
  }
  return result.value.repos;
}
