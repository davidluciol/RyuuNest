import { describe, expect, it } from "vitest";

import { createSampleSourcesService } from "../../src/screens/sources/sampleSourcesService";
import {
  createSourcesController,
  type SourcesController,
} from "../../src/screens/sources/sourcesController";
import {
  INITIAL_SOURCES_FLOW,
  sourcesFlowReducer,
  type SourcesFlow,
} from "../../src/screens/sources/sourcesFlow";
import { EMPTY_SOURCES_DATA, SAMPLE_SOURCES_DATA } from "../../src/screens/sources/sourcesFixtures";
import type { SourcesService } from "../../src/screens/sources/sourcesData";

/**
 * F16 — controlador de Fuentes: une el servicio con la máquina de estados de
 * las hojas. Se prueba con el reductor real y el servicio en memoria, sin
 * React: qué hoja queda abierta, cuándo se recarga la lista y qué aviso sale
 * cuando algo falla.
 */

const REPO = SAMPLE_SOURCES_DATA.repos[0]?.id ?? "";

function setup(service: SourcesService = createSampleSourcesService()) {
  let flow: SourcesFlow = INITIAL_SOURCES_FLOW;
  let reloads = 0;
  const notices: Array<string | null> = [];
  const controller: SourcesController = createSourcesController({
    service,
    getFlow: () => flow,
    dispatch: (action) => {
      flow = sourcesFlowReducer(flow, action);
    },
    reload: async () => {
      reloads += 1;
    },
    notify: (message) => notices.push(message),
  });
  return {
    controller,
    service,
    flow: () => flow,
    reloads: () => reloads,
    notices,
  };
}

describe("añadir repositorio", () => {
  it("abre la hoja y, con una URL HTTPS válida, añade, recarga y cierra", async () => {
    const app = setup(createSampleSourcesService(EMPTY_SOURCES_DATA));

    app.controller.openAddRepo();
    expect(app.flow()).toEqual({ sheet: "add-repo", error: null });

    await app.controller.submitAddRepo("https://repo.ejemplo.org/indice.json");

    expect(app.flow()).toEqual({ sheet: "none" });
    expect(app.reloads()).toBe(1);
    expect((await app.service.load()).repos).toHaveLength(1);
  });

  it("una URL vacía, inválida o sin HTTPS se queda en la hoja con su mensaje y no toca la red", async () => {
    const app = setup(createSampleSourcesService(EMPTY_SOURCES_DATA));
    app.controller.openAddRepo();

    await app.controller.submitAddRepo("   ");
    expect(app.flow()).toEqual({ sheet: "add-repo", error: "Escribe la URL del repositorio." });

    await app.controller.submitAddRepo("no es una url");
    expect(app.flow()).toEqual({ sheet: "add-repo", error: "Esa URL no es válida." });

    await app.controller.submitAddRepo("http://repo.test/index.json");
    expect(app.flow()).toEqual({
      sheet: "add-repo",
      error: "El repositorio debe usar HTTPS.",
    });
    expect(app.reloads()).toBe(0);
  });

  it("si el servicio falla, la hoja sigue abierta con el motivo", async () => {
    const service = createSampleSourcesService(EMPTY_SOURCES_DATA);
    service.addRepo = async () => {
      throw new Error("índice inválido");
    };
    const app = setup(service);
    app.controller.openAddRepo();

    await app.controller.submitAddRepo("https://repo.test/index.json");

    expect(app.flow()).toEqual({ sheet: "add-repo", error: "índice inválido" });
  });
});

describe("instalar", () => {
  it("abre la confirmación con la vista previa y no instala todavía (AC-8)", async () => {
    const app = setup();

    await app.controller.openInstall(REPO, "portal-duna");

    expect(app.flow()).toMatchObject({ sheet: "install", preview: { id: "portal-duna" } });
    const module = (await app.service.load()).modules.find((m) => m.id === "portal-duna");
    expect(module?.status).toBe("available");
  });

  it("confirmar instala, recarga y cierra", async () => {
    const app = setup();
    await app.controller.openInstall(REPO, "portal-duna");

    await app.controller.confirmInstall(false);

    expect(app.flow()).toEqual({ sheet: "none" });
    expect(app.reloads()).toBe(1);
    expect((await app.service.load()).modules.find((m) => m.id === "portal-duna")?.status).toBe(
      "installed",
    );
  });

  it("un script no se instala con la confirmación normal y la hoja muestra el motivo", async () => {
    const app = setup();
    await app.controller.openInstall(REPO, "portal-cenit");

    await app.controller.confirmInstall(false);

    expect(app.flow()).toMatchObject({ sheet: "install", busy: false });
    expect((app.flow() as { error: string | null }).error).toContain("reforzada");
    expect((await app.service.load()).modules.find((m) => m.id === "portal-cenit")?.status).toBe(
      "available",
    );
  });

  it("un script se instala con la confirmación reforzada", async () => {
    const app = setup();
    await app.controller.openInstall(REPO, "portal-cenit");

    await app.controller.confirmInstall(true);

    expect(app.flow()).toEqual({ sheet: "none" });
    expect((await app.service.load()).modules.find((m) => m.id === "portal-cenit")?.status).toBe(
      "installed",
    );
  });

  it("si la vista previa falla no abre ninguna hoja y avisa", async () => {
    const app = setup();

    await app.controller.openInstall(REPO, "no-existe");

    expect(app.flow()).toEqual({ sheet: "none" });
    expect(app.notices.at(-1)).toContain("no existe");
  });

  it("confirmar sin una hoja de instalación abierta no hace nada", async () => {
    const app = setup();

    await app.controller.confirmInstall(true);

    expect(app.reloads()).toBe(0);
  });
});

describe("gestionar, actualizar y desinstalar", () => {
  it("activar y desactivar recarga y deja abierta la gestión", async () => {
    const app = setup();
    app.controller.openManage("portal-aurora");

    await app.controller.setEnabled("portal-aurora", false);

    expect(app.flow()).toMatchObject({ sheet: "manage", moduleId: "portal-aurora" });
    expect(app.reloads()).toBe(1);
    expect((await app.service.load()).modules.find((m) => m.id === "portal-aurora")?.enabled).toBe(
      false,
    );
  });

  it("actualizar abre la confirmación con la versión nueva y al confirmar aplica", async () => {
    const app = setup();
    app.controller.openManage("portal-aurora");

    await app.controller.openUpdate("portal-aurora");
    expect(app.flow()).toMatchObject({
      sheet: "update",
      preview: { currentVersion: "1.2.0", nextVersion: "1.3.0" },
    });

    await app.controller.confirmUpdate(false);

    expect(app.flow()).toEqual({ sheet: "none" });
    expect((await app.service.load()).modules.find((m) => m.id === "portal-aurora")?.version).toBe(
      "1.3.0",
    );
  });

  it("desinstalar pide una segunda confirmación y solo entonces borra", async () => {
    const app = setup();
    app.controller.openManage("portal-aurora");

    app.controller.askUninstall();
    expect(app.flow()).toMatchObject({ sheet: "uninstall", moduleId: "portal-aurora" });
    expect((await app.service.load()).modules.find((m) => m.id === "portal-aurora")?.status).toBe(
      "installed",
    );

    await app.controller.confirmUninstall();

    expect(app.flow()).toEqual({ sheet: "none" });
    expect((await app.service.load()).modules.find((m) => m.id === "portal-aurora")?.status).toBe(
      "available",
    );
  });
});

describe("repositorios: sincronizar y quitar (RF-8)", () => {
  it("sincronizar recarga y no abre hojas", async () => {
    const app = setup();

    await app.controller.syncRepo(REPO);

    expect(app.reloads()).toBe(1);
    expect(app.flow()).toEqual({ sheet: "none" });
  });

  it("si sincronizar falla, avisa y no recarga", async () => {
    const app = setup();

    await app.controller.syncRepo("https://otro.test/index.json");

    expect(app.reloads()).toBe(0);
    expect(app.notices.at(-1)).toContain("no está registrado");
  });

  it("quitar pide confirmación y conserva los módulos instalados", async () => {
    const app = setup();

    app.controller.askRemoveRepo(REPO);
    expect(app.flow()).toMatchObject({ sheet: "remove-repo", repoId: REPO });
    expect((await app.service.load()).repos).toHaveLength(1);

    await app.controller.confirmRemoveRepo();

    expect(app.flow()).toEqual({ sheet: "none" });
    const data = await app.service.load();
    expect(data.repos).toEqual([]);
    expect(data.modules.map((m) => m.id).sort()).toEqual(["portal-aurora", "portal-brasa"]);
  });
});

describe("avisos y cierre", () => {
  it("un aviso se puede descartar", async () => {
    const app = setup();
    await app.controller.syncRepo("https://otro.test/index.json");

    app.controller.dismissNotice();

    expect(app.notices.at(-1)).toBeNull();
  });

  it("volver y cerrar actúan sobre la hoja abierta", () => {
    const app = setup();
    app.controller.openManage("portal-aurora");
    app.controller.askUninstall();

    app.controller.back();
    expect(app.flow()).toMatchObject({ sheet: "manage" });

    app.controller.close();
    expect(app.flow()).toEqual({ sheet: "none" });
  });
});
