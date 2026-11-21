import { describe, expect, it, vi } from "vitest";

import type { BackupService } from "../../src/screens/settings/backup/backupData";
import { createBackupController } from "../../src/screens/settings/backup/backupController";
import {
  backupFlowReducer,
  INITIAL_BACKUP_FLOW,
  type BackupFlow,
  type BackupFlowAction,
} from "../../src/screens/settings/backup/backupFlow";
import { createSampleBackupService } from "../../src/screens/settings/backup/sampleBackupService";

/**
 * F21 — flujo y controlador del respaldo en Ajustes (RF-37/RF-38), probados
 * sin React sobre el servicio de ejemplo: exportar avisa, importar abre la
 * hoja de modo, reemplazar pasa por la confirmación explícita, un rechazo se
 * muestra como diálogo sin tocar datos y las sugerencias nunca instalan nada
 * solas (AC-8).
 */

function setup(service: BackupService = createSampleBackupService()) {
  let flow: BackupFlow = INITIAL_BACKUP_FLOW;
  const getFlow = () => flow;
  const dispatch = (action: BackupFlowAction) => {
    flow = backupFlowReducer(flow, action);
  };
  const notify = vi.fn<(message: string | null) => void>();
  const goToSources = vi.fn<() => void>();
  const onApplied = vi.fn<() => void>();
  const controller = createBackupController({ service, getFlow, dispatch, notify, goToSources, onApplied });
  return { controller, getFlow, notify, goToSources, onApplied, service };
}

/** Abre la hoja de modo directamente (como haría `importBackup` tras elegir). */
function openImportMode(flow: BackupFlow, text: string): BackupFlow {
  return backupFlowReducer(flow, { type: "open-import-mode", text });
}

const SAMPLE_TEXT = JSON.stringify({ format: "ryuunest-backup", version: 1 });

describe("backupFlowReducer", () => {
  it("nace sin hoja y cada apertura guarda lo que necesita", () => {
    expect(INITIAL_BACKUP_FLOW).toEqual({ sheet: "none" });

    const withText = backupFlowReducer(INITIAL_BACKUP_FLOW, {
      type: "open-import-mode",
      text: SAMPLE_TEXT,
    });
    expect(withText).toMatchObject({ sheet: "import-mode", text: SAMPLE_TEXT, busy: false });

    const replace = backupFlowReducer(withText, { type: "open-replace-confirm" });
    expect(replace).toMatchObject({ sheet: "replace-confirm", text: SAMPLE_TEXT });

    const suggestions = backupFlowReducer(INITIAL_BACKUP_FLOW, {
      type: "open-suggestions",
      suggestions: { repos: [], modules: [] },
    });
    expect(suggestions).toMatchObject({ sheet: "suggestions", confirmedRepos: [] });
  });

  it("replace-confirm solo se abre desde import-mode (no se cuela con otro texto)", () => {
    const flow = backupFlowReducer(INITIAL_BACKUP_FLOW, { type: "open-replace-confirm" });
    expect(flow).toEqual(INITIAL_BACKUP_FLOW);
  });

  it("submit marca ocupada, fail deja el error y done/close cierran", () => {
    let flow = openImportMode(INITIAL_BACKUP_FLOW, SAMPLE_TEXT);
    flow = backupFlowReducer(flow, { type: "submit" });
    expect(flow).toMatchObject({ busy: true, error: null });

    flow = backupFlowReducer(flow, { type: "fail", message: "falló" });
    expect(flow).toMatchObject({ busy: false, error: "falló" });

    expect(backupFlowReducer(flow, { type: "done" })).toEqual({ sheet: "none" });
    expect(backupFlowReducer(flow, { type: "close" })).toEqual({ sheet: "none" });
  });

  it("confirm-repo acumula los repos confirmados sin repetir", () => {
    let flow = backupFlowReducer(INITIAL_BACKUP_FLOW, {
      type: "open-suggestions",
      suggestions: { repos: [], modules: [] },
    });
    flow = backupFlowReducer(flow, { type: "confirm-repo", url: "https://a.test/index.json" });
    flow = backupFlowReducer(flow, { type: "confirm-repo", url: "https://a.test/index.json" });
    flow = backupFlowReducer(flow, { type: "confirm-repo", url: "https://b.test/index.json" });
    expect(flow).toMatchObject({
      confirmedRepos: ["https://a.test/index.json", "https://b.test/index.json"],
    });
  });
});

describe("controlador · exportar (RF-37, F21a)", () => {
  it("exporta el texto, lo comparte y avisa de éxito", async () => {
    const service = createSampleBackupService();
    const shareText = vi.spyOn(service, "shareText");
    const exportText = vi.spyOn(service, "exportText");
    const { controller, notify } = setup(service);

    await controller.exportBackup();

    expect(exportText).toHaveBeenCalledOnce();
    expect(shareText).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith("Respaldo exportado");
  });

  it("si falla la exportación o el compartir, avisa y no abre hoja", async () => {
    const service = createSampleBackupService();
    vi.spyOn(service, "exportText").mockRejectedValue(new Error("sin espacio"));
    const { controller, notify, getFlow } = setup(service);

    await controller.exportBackup();

    expect(getFlow()).toEqual({ sheet: "none" });
    expect(notify).toHaveBeenCalledWith("No se pudo exportar el respaldo: sin espacio");
  });
});

describe("controlador · importar (RF-38, F21b)", () => {
  it("tras elegir el archivo se abre la hoja de modo con el texto", async () => {
    const service = createSampleBackupService();
    vi.spyOn(service, "pickText").mockResolvedValue({ text: SAMPLE_TEXT, name: "respaldo.json" });
    const { controller, getFlow } = setup(service);

    await controller.importBackup();

    expect(getFlow()).toMatchObject({ sheet: "import-mode", text: SAMPLE_TEXT, busy: false });
  });

  it("si el usuario cancela el selector, avisa y no abre nada", async () => {
    const service = createSampleBackupService();
    vi.spyOn(service, "pickText").mockResolvedValue(null);
    const { controller, getFlow, notify } = setup(service);

    await controller.importBackup();

    expect(getFlow()).toEqual({ sheet: "none" });
    expect(notify).toHaveBeenCalledWith("No se eligió ningún archivo");
  });

  it("fusionar aplica el texto, avisa, llama onApplied y abre las sugerencias", async () => {
    const service = createSampleBackupService();
    const applyText = vi.spyOn(service, "applyText");
    let flow = openImportMode(INITIAL_BACKUP_FLOW, SAMPLE_TEXT);
    const dispatch = (action: BackupFlowAction) => {
      flow = backupFlowReducer(flow, action);
    };
    const notify = vi.fn<(message: string | null) => void>();
    const onApplied = vi.fn<() => void>();
    const controller = createBackupController({
      service,
      getFlow: () => flow,
      dispatch,
      notify,
      goToSources: () => {},
      onApplied,
    });

    await controller.applyImport("merge");

    expect(applyText).toHaveBeenCalledWith(SAMPLE_TEXT, "merge");
    expect(notify).toHaveBeenCalledWith("Respaldo importado");
    expect(onApplied).toHaveBeenCalledOnce();
    expect(flow).toMatchObject({
      sheet: "suggestions",
      suggestions: {
        repos: [{ url: "https://repositorio-ejemplo.test/index.json" }],
        modules: [{ id: "m-ejemplo-a" }],
      },
      confirmedRepos: [],
    });
  });

  it("reemplazar pasa por la confirmación explícita antes de aplicar", async () => {
    const service = createSampleBackupService();
    const applyText = vi.spyOn(service, "applyText");
    let flow = openImportMode(INITIAL_BACKUP_FLOW, SAMPLE_TEXT);
    const dispatch = (action: BackupFlowAction) => {
      flow = backupFlowReducer(flow, action);
    };
    const controller = createBackupController({
      service,
      getFlow: () => flow,
      dispatch,
      notify: () => {},
      goToSources: () => {},
    });

    controller.askReplace();
    expect(flow).toMatchObject({ sheet: "replace-confirm", text: SAMPLE_TEXT });

    await controller.applyImport("replace");
    expect(applyText).toHaveBeenCalledWith(SAMPLE_TEXT, "replace");
    // Tras aplicar, la hoja de reemplazo se cierra y se abren las sugerencias.
    expect(flow).toMatchObject({ sheet: "suggestions" });
  });

  it("un rechazo del núcleo abre el diálogo de error sin tocar datos", async () => {
    const service = createSampleBackupService();
    vi.spyOn(service, "applyText").mockResolvedValue({
      ok: false,
      reason: "INVALID",
      message: "El respaldo no es válido: format: debe ser \"ryuunest-backup\"",
      issues: [{ path: "format", message: "debe ser \"ryuunest-backup\"" }],
    });
    let flow = openImportMode(INITIAL_BACKUP_FLOW, "{}");
    const dispatch = (action: BackupFlowAction) => {
      flow = backupFlowReducer(flow, action);
    };
    const controller = createBackupController({
      service,
      getFlow: () => flow,
      dispatch,
      notify: () => {},
      goToSources: () => {},
    });

    await controller.applyImport("merge");

    expect(flow).toMatchObject({
      sheet: "import-error",
      reason: "INVALID",
      issues: [{ path: "format", message: 'debe ser "ryuunest-backup"' }],
    });
  });
});

describe("controlador · sugerencias (F21c, AC-8)", () => {
  it("confirmRepo registra el repo y lo marca confirmado; nada se instala solo", async () => {
    const service = createSampleBackupService();
    const confirmRepo = vi.spyOn(service, "confirmRepo");
    let flow = backupFlowReducer(INITIAL_BACKUP_FLOW, {
      type: "open-suggestions",
      suggestions: {
        repos: [{ url: "https://repo-ejemplo.test/index.json", name: "Repo de ejemplo" }],
        modules: [],
      },
    });
    const dispatch = (action: BackupFlowAction) => {
      flow = backupFlowReducer(flow, action);
    };
    const controller = createBackupController({
      service,
      getFlow: () => flow,
      dispatch,
      notify: () => {},
      goToSources: () => {},
    });

    await controller.confirmRepo("https://repo-ejemplo.test/index.json");

    expect(confirmRepo).toHaveBeenCalledWith("https://repo-ejemplo.test/index.json");
    expect(flow).toMatchObject({
      sheet: "suggestions",
      confirmedRepos: ["https://repo-ejemplo.test/index.json"],
    });
    // El servicio de ejemplo no instala módulos al confirmar un repo.
    expect(service.state.confirmedRepos).toEqual(["https://repo-ejemplo.test/index.json"]);
  });

  it("si falla añadir el repo, la hoja avisa con la clave fija y no lo marca", async () => {
    const service = createSampleBackupService();
    vi.spyOn(service, "confirmRepo").mockRejectedValue(new Error("índice caído"));
    let flow = backupFlowReducer(INITIAL_BACKUP_FLOW, {
      type: "open-suggestions",
      suggestions: {
        repos: [{ url: "https://repo-ejemplo.test/index.json", name: "Repo de ejemplo" }],
        modules: [],
      },
    });
    const dispatch = (action: BackupFlowAction) => {
      flow = backupFlowReducer(flow, action);
    };
    const controller = createBackupController({
      service,
      getFlow: () => flow,
      dispatch,
      notify: () => {},
      goToSources: () => {},
    });

    await controller.confirmRepo("https://repo-ejemplo.test/index.json");

    expect(flow).toMatchObject({ sheet: "suggestions", confirmedRepos: [], error: "" });
  });

  it("goToSources navega a Fuentes y cierra la hoja", () => {
    const { controller, getFlow, goToSources } = setup();
    controller.goToSources();
    expect(goToSources).toHaveBeenCalledOnce();
    expect(getFlow()).toEqual({ sheet: "none" });
  });
});
