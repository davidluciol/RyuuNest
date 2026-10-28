import { describe, expect, it } from "vitest";

import {
  ONBOARDING_COMPLETED_SETTING,
  isFirstUseData,
} from "../../src/screens/onboarding/onboardingData";
import {
  EMPTY_SOURCES_DATA,
  SAMPLE_SOURCES_DATA,
} from "../../src/screens/sources/sourcesFixtures";

/**
 * F12 — la puerta del primer uso (AC-1): sin repos y sin módulos instalados,
 * el flujo sustituye a Inicio hasta que se completa (o se salta).
 */
describe("isFirstUseData (puerta del primer uso, F12)", () => {
  it("sin repos ni módulos instalados es primer uso (RF-1)", () => {
    expect(isFirstUseData(EMPTY_SOURCES_DATA)).toBe(true);
    expect(isFirstUseData(SAMPLE_SOURCES_DATA)).toBe(false);
  });

  it("un módulo instalado (aunque su repo ya no esté) no es primer uso", () => {
    const orphan = {
      ...EMPTY_SOURCES_DATA,
      modules: [SAMPLE_SOURCES_DATA.modules[0]].map((module) => ({ ...module, orphan: true })),
    };
    expect(isFirstUseData(orphan)).toBe(false);
  });

  it("la marca de completado vive en setting con la clave prevista", () => {
    expect(ONBOARDING_COMPLETED_SETTING).toBe("onboarding.completed");
  });
});
