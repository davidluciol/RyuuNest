import { ModuleError } from "@ryuunest/core";
import { describe, expect, it } from "vitest";

import {
  createOnboardingController,
  type OnboardingStep,
} from "../../src/screens/onboarding/onboardingController";
import { createSampleSourcesService } from "../../src/screens/sources/sampleSourcesService";
import {
  EMPTY_SOURCES_DATA,
  SAMPLE_SOURCES_DATA,
} from "../../src/screens/sources/sourcesFixtures";
import {
  INITIAL_SOURCES_FLOW,
  sourcesFlowReducer,
  type SourcesFlowAction,
} from "../../src/screens/sources/sourcesFlow";
import type { SourcesService } from "../../src/screens/sources/sourcesData";

/**
 * F12 — controlador del primer uso (SPEC §11.8): pasos 1→2→3, añadir el repo
 * con validación de URL e instalar módulos con la **misma confirmación de
 * Fuentes** (hoja y mantener pulsado, AC-8). Sin React: la sesión real le da
 * servicio, flujo y recarga.
 */

const REPO_URL = "https://repo.ejemplo.org/indice.json";
const SAMPLE_REPO_ID = SAMPLE_SOURCES_DATA.repos[0]?.id ?? "";

function harness(service: SourcesService = createSampleSourcesService(EMPTY_SOURCES_DATA)) {
  let flow = INITIAL_SOURCES_FLOW;
  const steps: OnboardingStep[] = [];
  let completions = 0;
  const controller = createOnboardingController({
    service,
    getFlow: () => flow,
    dispatch: (action: SourcesFlowAction) => {
      flow = sourcesFlowReducer(flow, action);
    },
    reload: async () => {},
    notify: () => {},
    setStep: (step) => {
      steps.push(step);
    },
    complete: async () => {
      completions += 1;
    },
  });
  return {
    service,
    controller,
    steps,
    flow: () => flow,
    get completions() {
      return completions;
    },
  };
}

describe("createOnboardingController · pasos (SPEC §11.8)", () => {
  it("«Empezar» pasa al paso 2 y deja el flujo listo para los errores de la URL", () => {
    const { controller, steps, flow } = harness();

    controller.start();

    expect(steps).toEqual([2]);
    expect(flow().sheet).toBe("add-repo");
  });

  it("una URL no válida no avanza y deja su error en el paso 2", async () => {
    const { controller, steps, flow } = harness();
    controller.start();

    await controller.submitRepo("no-es-una-url");

    expect(steps).toEqual([2]);
    const rejected = flow();
    expect(rejected.sheet).toBe("add-repo");
    if (rejected.sheet !== "add-repo") throw new Error("unreachable");
    expect(rejected.error).toBe("Esa URL no es válida.");
  });

  it("añade el repo sugerido y pasa al paso 3", async () => {
    const { service, controller, steps, flow } = harness();
    controller.start();

    await controller.submitRepo(REPO_URL);

    expect(steps).toEqual([2, 3]);
    expect(flow().sheet).toBe("none");
    expect((await service.load()).repos).toHaveLength(1);
  });

  it("si añadir el repo falla, el error queda en el paso 2 y no avanza", async () => {
    const sample = createSampleSourcesService(EMPTY_SOURCES_DATA);
    const failing: SourcesService = {
      ...sample,
      addRepo: async () => {
        throw new ModuleError("NETWORK", "Sin red para descargar el índice");
      },
    };
    const { controller, steps, flow } = harness(failing);
    controller.start();

    await controller.submitRepo(REPO_URL);

    expect(steps).toEqual([2]);
    const failed = flow();
    if (failed.sheet !== "add-repo") throw new Error("unreachable");
    expect(failed.error).toBe("Sin red para descargar el índice");
  });
});

describe("createOnboardingController · instalar con la confirmación de Fuentes (AC-8)", () => {
  it("cancelar la hoja no instala nada; confirmar sí (RF-4, AC-8)", async () => {
    const { service, controller, flow } = harness();
    controller.start();
    await controller.submitRepo(REPO_URL);

    await controller.openInstall(SAMPLE_REPO_ID, "portal-duna");
    const opened = flow();
    expect(opened.sheet).toBe("install");
    if (opened.sheet !== "install") throw new Error("unreachable");
    expect(opened.preview.name).toBe("Portal Duna");

    controller.close();
    expect((await service.load()).modules.find((m) => m.id === "portal-duna")).toMatchObject({
      status: "available",
    });

    await controller.openInstall(SAMPLE_REPO_ID, "portal-duna");
    await controller.confirmInstall(false);

    expect((await service.load()).modules.find((m) => m.id === "portal-duna")).toMatchObject({
      status: "installed",
      enabled: true,
    });
  });

  it("un módulo script exige la confirmación reforzada de Fuentes", async () => {
    const { service, controller, flow } = harness();
    controller.start();
    await controller.submitRepo(REPO_URL);

    await controller.openInstall(SAMPLE_REPO_ID, "portal-cenit");
    const cenit = flow();
    if (cenit.sheet !== "install") throw new Error("unreachable");
    expect(cenit.preview.reinforced).toBe(true);

    await controller.confirmInstall(false);
    const refused = flow();
    if (refused.sheet !== "install") throw new Error("unreachable");
    expect(refused.error).toContain("reforzada");
    expect((await service.load()).modules.find((m) => m.id === "portal-cenit")).toMatchObject({
      status: "available",
    });

    await controller.openInstall(SAMPLE_REPO_ID, "portal-cenit");
    await controller.confirmInstall(true);

    expect((await service.load()).modules.find((m) => m.id === "portal-cenit")).toMatchObject({
      status: "installed",
    });
  });
});

describe("createOnboardingController · terminar", () => {
  it("«Saltar» completa el primer uso sin añadir ni instalar nada", async () => {
    const session = harness();

    await session.controller.skip();

    expect(session.completions).toBe(1);
    expect((await session.service.load()).repos).toEqual([]);
  });

  it("«Ir a leer» completa el primer uso tras instalar", async () => {
    const session = harness();
    session.controller.start();
    await session.controller.submitRepo(REPO_URL);

    await session.controller.finish();

    expect(session.completions).toBe(1);
  });
});
