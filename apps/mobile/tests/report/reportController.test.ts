import { describe, expect, it, vi } from "vitest";

import { REPORT_EMAIL, REPORT_GITHUB_REPO } from "../../src/about/appInfo";
import {
  createReportController,
  type ReportControllerDeps,
} from "../../src/report/reportController";

/**
 * F103 — «Mandar reporte» (P-198): una capa global, como la verificación de
 * F100. El usuario ve el texto final y lo envía a mano por GitHub o por correo;
 * nada sale sin pulsar un botón (RNF-5).
 */
const request = { code: "TIMEOUT", message: "Sin respuesta tras 30123 ms", moduleId: "m440" };

function setup(overrides: Partial<ReportControllerDeps> = {}) {
  const openUrl = vi.fn(async (_url: string) => {});
  const deps: ReportControllerDeps = {
    appVersion: "1.0.0",
    platform: "android 34",
    now: () => "2026-11-27T22:00:00.000Z",
    loadLog: async () => ["entrada vieja", "entrada nueva"],
    openUrl,
    ...overrides,
  };
  return { controller: createReportController(deps), openUrl };
}

describe("reportController", () => {
  it("empieza cerrado y abrir muestra el reporte con los datos obligatorios", async () => {
    const { controller } = setup();
    expect(controller.getState().phase).toBe("idle");
    await controller.open(request);
    const state = controller.getState();
    expect(state.phase).toBe("open");
    const preview = controller.preview();
    expect(preview?.title).toMatch(/^\[fp:[0-9a-f]{12}\] TIMEOUT en m440/);
    for (const text of ["1.0.0", "android 34", "2026-11-27T22:00:00.000Z"]) {
      expect(preview?.body).toContain(text);
    }
  });

  it("el registro solo entra si el usuario lo marca", async () => {
    const { controller } = setup();
    await controller.open(request);
    expect(controller.preview()?.body).not.toContain("entrada nueva");
    controller.setIncludeLog(true);
    expect(controller.preview()?.body).toContain("entrada nueva");
  });

  it("los detalles del usuario entran limpios", async () => {
    const { controller } = setup();
    await controller.open(request);
    controller.setDetails("Me pasó en https://m440.in/manga/x");
    const body = controller.preview()?.body ?? "";
    expect(body).toContain("Me pasó en [url]");
    expect(body).not.toContain("m440.in");
  });

  it("nada se abre hasta pulsar un canal; GitHub abre issues/new del repo y cierra", async () => {
    const { controller, openUrl } = setup();
    await controller.open(request);
    expect(openUrl).not.toHaveBeenCalled();
    await controller.send("github");
    expect(openUrl).toHaveBeenCalledOnce();
    expect(openUrl.mock.calls[0]?.[0].startsWith(`${REPORT_GITHUB_REPO}/issues/new?`)).toBe(true);
    expect(controller.getState().phase).toBe("idle");
  });

  it("correo abre mailto a la dirección del proyecto", async () => {
    const { controller, openUrl } = setup();
    await controller.open(request);
    await controller.send("email");
    expect(openUrl.mock.calls[0]?.[0].startsWith(`mailto:${REPORT_EMAIL}?`)).toBe(true);
  });

  it("si no se puede abrir el canal, la hoja sigue abierta con el error", async () => {
    const { controller } = setup({
      openUrl: async () => {
        throw new Error("sin app de correo");
      },
    });
    await controller.open(request);
    await controller.send("email");
    const state = controller.getState();
    expect(state.phase).toBe("open");
    expect(state.phase === "open" && state.sendFailed).toBe(true);
  });

  it("sin registro disponible (web) se puede mandar igual", async () => {
    const { controller } = setup({ loadLog: async () => [] });
    await controller.open(request);
    controller.setIncludeLog(true);
    expect(controller.preview()?.body).not.toContain("Registro");
  });

  it("cerrar descarta el borrador", async () => {
    const { controller } = setup();
    await controller.open(request);
    controller.setDetails("algo");
    controller.close();
    expect(controller.getState().phase).toBe("idle");
    expect(controller.preview()).toBeNull();
  });
});

describe("canales del proyecto (P-198)", () => {
  it("GitHub del repo oficial y el correo elegido por el humano", () => {
    expect(REPORT_GITHUB_REPO).toBe("https://github.com/davidluciol/RyuuNest");
    expect(REPORT_EMAIL).toBe("potigameplays@gmail.com");
  });
});
