import type { SourceModule } from "./sourcesData";

/**
 * F16 — presentación pura de Fuentes, sin React ni red: qué insignias lleva
 * una fila, qué acción ofrece y la comprobación de la URL de un repo (RF-2)
 * antes de pedirla. Probada en `tests/screens/sourcesView.test.ts`.
 */

/** Señales de una fila, de más a menos urgente. */
export type ModuleBadge = "error" | "update" | "orphan" | "disabled" | "script" | "nsfw";

/** Tope de señales por fila (V8/V9 de `DESIGN_RULES.md`: máximo dos). */
export const MAX_ROW_BADGES = 2;

/**
 * Insignias de la fila con el tope aplicado: manda lo urgente (error,
 * actualización, repo quitado) y después lo informativo. Un módulo solo
 * disponible no lleva señales de estado de instalación (V13).
 */
export function moduleBadges(module: SourceModule): ModuleBadge[] {
  const installed = module.status === "installed";
  const badges: ModuleBadge[] = [];

  if (installed && module.lastError !== undefined) badges.push("error");
  if (installed && module.updateTo !== undefined) badges.push("update");
  if (installed && module.orphan) badges.push("orphan");
  if (installed && !module.enabled) badges.push("disabled");
  if (module.runtime === "script") badges.push("script");
  if (module.nsfw) badges.push("nsfw");

  return badges.slice(0, MAX_ROW_BADGES);
}

/** Acción de la fila: instalar un disponible o gestionar uno instalado. */
export function moduleRowAction(module: SourceModule): "install" | "manage" {
  return module.status === "installed" ? "manage" : "install";
}

export type RepoUrlCheck =
  { ok: true; url: string } | { ok: false; reason: "empty" | "invalid" | "not-https" };

/** Valida la URL antes de pedirla; el núcleo vuelve a exigir HTTPS (RF-2). */
export function validateRepoUrl(input: string): RepoUrlCheck {
  const value = input.trim();
  if (value === "") return { ok: false, reason: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "not-https" };

  return { ok: true, url: value };
}
