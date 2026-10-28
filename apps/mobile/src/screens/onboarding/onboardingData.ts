import type { SourcesData } from "../sources/sourcesData";

/**
 * F12 — datos del primer uso (SPEC §11.8, AC-1): la marca de completado (tabla
 * `setting`) y cuándo se considera primer uso. La sesión (`useOnboardingData`)
 * combina esto con el servicio real.
 */

/** Ajuste (tabla `setting`) que marca el primer uso como completado. */
export const ONBOARDING_COMPLETED_SETTING = ["onboarding", "completed"].join(".");

/**
 * Primer uso: nada añadido aún — sin repos y sin módulos instalados (RF-1). Un
 * usuario con módulos huérfanos ya usó la app y no vuelve a ver el flujo.
 */
export function isFirstUseData(data: SourcesData): boolean {
  return data.repos.length === 0 && data.modules.every((module) => module.status !== "installed");
}
