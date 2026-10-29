import { describe, expect, it, vi } from "vitest";

import { createDiagnosticsController } from "../../src/screens/settings/diagnostics/diagnosticsController";
import type { DiagnosticsService } from "../../src/screens/settings/diagnostics/diagnosticsData";
import {
  diagnosticsFlowReducer,
  INITIAL_DIAGNOSTICS_FLOW,
  type DiagnosticsFlow,
  type DiagnosticsFlowAction,
  type DiagnosticsNotice,
} from "../../src/screens/settings/diagnostics/diagnosticsFlow";
import { createSampleDiagnosticsService } from "../../src/screens/settings/diagnostics/sampleDiagnosticsService";

/**
 * F30 — flujo y controlador de Diagnóstico, sin React y sobre el servicio de
 * ejemplo: elegir formato, desplegar detalles, confirmar antes de borrar y
 * avisar el resultado (éxito o fallo) sin tocar nada más.
 */

function setup(service: DiagnosticsService = createSampleDiagnosticsService()) {
  let flow: DiagnosticsFlow = INITIAL_DIAGNOSTICS_FLOW;
  const dispatch = (action: DiagnosticsFlowAction) => {
    flow = diagnosticsFlowReducer(flow, action);
  };
  const notify = vi.fn<(notice: DiagnosticsNotice | null) => void>();
  const reload = vi.fn<() => Promise<void>>(async () => {});
  const controller = createDiagnosticsController({
    service,
    getFlow: () => flow,
    dispatch,
    notify,
    reload,
  });
  return { controller, getFlow: () => flow, notify, reload, service };
}

describe("diagnosticsFlowReducer", () => {
  it("nace en texto, sin detalles abiertos ni confirmación", () => {
    expect(INITIAL_DIAGNOSTICS_FLOW).toEqual({
      format: "text",
      expanded: [],
      confirmClear: false,
      busy: false,
    });
  });

  it("cambia de formato", () => {
    expect(
      diagnosticsFlowReducer(INITIAL_DIAGNOSTICS_FLOW, { type: "set-format", format: "json" }).format,
    ).toBe("json");
  });

  it("despliega y pliega un detalle por id", () => {
    const open = diagnosticsFlowReducer(INITIAL_DIAGNOSTICS_FLOW, { type: "toggle-detail", id: 7 });
    expect(open.expanded).toEqual([7]);

    const both = diagnosticsFlowReducer(open, { type: "toggle-detail", id: 9 });
    expect(both.expanded).toEqual([7, 9]);

    expect(diagnosticsFlowReducer(both, { type: "toggle-detail", id: 7 }).expanded).toEqual([9]);
  });

  it("pide y cancela la confirmación de borrado", () => {
    const asking = diagnosticsFlowReducer(INITIAL_DIAGNOSTICS_FLOW, { type: "ask-clear" });
    expect(asking.confirmClear).toBe(true);
    expect(diagnosticsFlowReducer(asking, { type: "cancel-clear" }).confirmClear).toBe(false);
  });

  it("una operación en curso bloquea y se libera", () => {
    const busy = diagnosticsFlowReducer(INITIAL_DIAGNOSTICS_FLOW, { type: "busy", busy: true });
    expect(busy.busy).toBe(true);
    expect(diagnosticsFlowReducer(busy, { type: "busy", busy: false }).busy).toBe(false);
  });
});

describe("createDiagnosticsController", () => {
  it("exportar con el formato elegido avisa del éxito", async () => {
    const { controller, notify, service } = setup();
    const exportReport = vi.spyOn(service, "exportReport");
    controller.setFormat("json");

    await controller.exportReport();

    expect(exportReport).toHaveBeenCalledWith("json");
    expect(notify).toHaveBeenLastCalledWith({ message: "Informe exportado", severity: "info" });
  });

  it("copiar avisa del éxito", async () => {
    const { controller, notify, service } = setup();
    const copyReport = vi.spyOn(service, "copyReport");

    await controller.copyReport();

    expect(copyReport).toHaveBeenCalledWith("text");
    expect(notify).toHaveBeenLastCalledWith({ message: "Informe copiado", severity: "info" });
  });

  it("un fallo al exportar avisa con severidad de error y libera los controles", async () => {
    const service = createSampleDiagnosticsService();
    vi.spyOn(service, "exportReport").mockRejectedValue(new Error("sin caché"));
    const { controller, notify, getFlow } = setup(service);

    await controller.exportReport();

    expect(notify).toHaveBeenLastCalledWith({
      message: "No se pudo exportar el informe",
      severity: "error",
    });
    expect(getFlow().busy).toBe(false);
  });

  it("borrar pide confirmación primero y no borra hasta confirmar", async () => {
    const { controller, getFlow, service } = setup();
    const clear = vi.spyOn(service, "clear");

    controller.askClear();

    expect(getFlow().confirmClear).toBe(true);
    expect(clear).not.toHaveBeenCalled();
  });

  it("cancelar cierra la confirmación sin borrar", async () => {
    const { controller, getFlow, service } = setup();
    const clear = vi.spyOn(service, "clear");
    controller.askClear();

    controller.cancelClear();

    expect(getFlow().confirmClear).toBe(false);
    expect(clear).not.toHaveBeenCalled();
  });

  it("confirmar borra, recarga la lista y avisa", async () => {
    const { controller, getFlow, notify, reload, service } = setup();
    controller.askClear();

    await controller.confirmClear();

    expect(await service.list()).toEqual([]);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(getFlow().confirmClear).toBe(false);
    expect(notify).toHaveBeenLastCalledWith({ message: "Registro borrado", severity: "info" });
  });

  it("un fallo al borrar avisa, cierra la confirmación y conserva el registro", async () => {
    const service = createSampleDiagnosticsService();
    vi.spyOn(service, "clear").mockRejectedValue(new Error("disco lleno"));
    const { controller, getFlow, notify } = setup(service);
    controller.askClear();

    await controller.confirmClear();

    expect(notify).toHaveBeenLastCalledWith({
      message: "No se pudo borrar el registro",
      severity: "error",
    });
    expect(getFlow().confirmClear).toBe(false);
    expect((await service.list()).length).toBeGreaterThan(0);
  });
});

describe("createSampleDiagnosticsService", () => {
  it("trae cuatro eventos de ejemplo coherentes, el más reciente primero", async () => {
    const events = await createSampleDiagnosticsService().list();

    expect(events).toHaveLength(4);
    expect(events.map((event) => event.level)).toEqual(["error", "warn", "error", "info"]);
    expect([...events].sort((a, b) => b.at - a.at)).toEqual(events);
  });

  it("su informe usa el mismo formato que el núcleo", async () => {
    const service = createSampleDiagnosticsService();

    expect(JSON.parse(await service.report("json"))).toMatchObject({ format: "ryuunest-log" });
    expect(await service.report("text")).toContain("[error] module.timeout");
  });
});
