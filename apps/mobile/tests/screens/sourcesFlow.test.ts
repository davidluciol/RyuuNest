import { describe, expect, it } from "vitest";

import type { InstallPreview, UpdatePreview } from "@ryuunest/core";

import {
  INITIAL_SOURCES_FLOW,
  canConfirmInstall,
  sourcesFlowReducer,
  type SourcesFlow,
} from "../../src/screens/sources/sourcesFlow";

/**
 * F16 — flujo de hojas de Fuentes como máquina de estados pura: qué hoja está
 * abierta, cuándo se puede confirmar (RF-4: script exige la reforzada) y cómo
 * se vuelve atrás sin dejar restos. Sin React ni red.
 */

const preview = (overrides: Partial<InstallPreview> = {}): InstallPreview => ({
  id: "m",
  name: "M",
  version: "1.0.0",
  runtime: "declarative",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  permissions: { domains: ["ejemplo.test"] },
  repoId: "https://repo.test/index.json",
  sha256: "a".repeat(64),
  size: 10,
  reinforced: false,
  ...overrides,
});

const updatePreview = (overrides: Partial<UpdatePreview> = {}): UpdatePreview => ({
  moduleId: "m",
  currentVersion: "1.0.0",
  available: true,
  nextVersion: "1.1.0",
  reasons: ["Amplía permisos a: cdn.test"],
  needsConfirmation: true,
  reinforced: false,
  ...overrides,
});

function run(...actions: Parameters<typeof sourcesFlowReducer>[1][]): SourcesFlow {
  return actions.reduce(sourcesFlowReducer, INITIAL_SOURCES_FLOW);
}

describe("sourcesFlowReducer", () => {
  it("arranca sin hoja abierta", () => {
    expect(INITIAL_SOURCES_FLOW).toEqual({ sheet: "none" });
  });

  it("abre y cierra la hoja de añadir repositorio", () => {
    expect(run({ type: "open-add-repo" })).toEqual({ sheet: "add-repo", error: null });
    expect(run({ type: "open-add-repo" }, { type: "close" })).toEqual({ sheet: "none" });
  });

  it("un fallo al añadir el repo se queda en la hoja con su mensaje", () => {
    const state = run(
      { type: "open-add-repo" },
      { type: "submit-add-repo" },
      { type: "fail", message: "HTTPS obligatorio" },
    );

    expect(state).toEqual({ sheet: "add-repo", error: "HTTPS obligatorio" });
  });

  it("abre la confirmación de instalación con la vista previa", () => {
    const p = preview();

    expect(run({ type: "open-install", preview: p })).toEqual({
      sheet: "install",
      preview: p,
      busy: false,
      error: null,
    });
  });

  it("mientras trabaja marca busy y no admite cerrar a medias", () => {
    const busy = run({ type: "open-install", preview: preview() }, { type: "submit-install" });

    expect(busy).toMatchObject({ sheet: "install", busy: true });
    expect(sourcesFlowReducer(busy, { type: "close" })).toEqual(busy);
  });

  it("un fallo de instalación quita busy y muestra el error sin cerrar la hoja", () => {
    const state = run(
      { type: "open-install", preview: preview() },
      { type: "submit-install" },
      { type: "fail", message: "hash incorrecto" },
    );

    expect(state).toMatchObject({ sheet: "install", busy: false, error: "hash incorrecto" });
  });

  it("al terminar bien cierra la hoja", () => {
    const state = run(
      { type: "open-install", preview: preview() },
      { type: "submit-install" },
      { type: "done" },
    );

    expect(state).toEqual({ sheet: "none" });
  });

  it("abre la gestión de un módulo y desde ella la confirmación de actualización", () => {
    const manage = run({ type: "open-manage", moduleId: "m" });
    expect(manage).toEqual({ sheet: "manage", moduleId: "m", busy: false, error: null });

    const update = sourcesFlowReducer(manage, {
      type: "open-update",
      moduleId: "m",
      preview: updatePreview(),
    });
    expect(update).toEqual({
      sheet: "update",
      moduleId: "m",
      preview: updatePreview(),
      busy: false,
      error: null,
    });
  });

  it("confirmar la desinstalación pide una segunda confirmación antes de borrar", () => {
    const state = run({ type: "open-manage", moduleId: "m" }, { type: "ask-uninstall" });

    expect(state).toEqual({ sheet: "uninstall", moduleId: "m", busy: false, error: null });
  });

  it("volver desde la desinstalación regresa a la gestión del módulo", () => {
    const state = run(
      { type: "open-manage", moduleId: "m" },
      { type: "ask-uninstall" },
      { type: "back" },
    );

    expect(state).toEqual({ sheet: "manage", moduleId: "m", busy: false, error: null });
  });

  it("acciones fuera de contexto se ignoran (no crean estados imposibles)", () => {
    expect(run({ type: "submit-install" })).toEqual(INITIAL_SOURCES_FLOW);
    expect(run({ type: "fail", message: "x" })).toEqual(INITIAL_SOURCES_FLOW);
    expect(run({ type: "ask-uninstall" })).toEqual(INITIAL_SOURCES_FLOW);
  });
});

describe("canConfirmInstall (RF-4, confirmación reforzada)", () => {
  it("un declarativo se confirma con un toque normal", () => {
    expect(canConfirmInstall(preview(), { reinforced: false })).toBe(true);
  });

  it("un script no se confirma con un toque normal", () => {
    const script = preview({ runtime: "script", reinforced: true });

    expect(canConfirmInstall(script, { reinforced: false })).toBe(false);
  });

  it("un script se confirma tras mantener pulsado", () => {
    const script = preview({ runtime: "script", reinforced: true });

    expect(canConfirmInstall(script, { reinforced: true })).toBe(true);
  });
});

describe("quitar un repositorio (RF-8)", () => {
  it("pide confirmación con el repo elegido", () => {
    expect(run({ type: "ask-remove-repo", repoId: "r" })).toEqual({
      sheet: "remove-repo",
      repoId: "r",
      busy: false,
      error: null,
    });
  });

  it("mientras quita no se cierra a medias y un fallo deja la hoja abierta", () => {
    const busy = run({ type: "ask-remove-repo", repoId: "r" }, { type: "submit-remove-repo" });

    expect(busy).toMatchObject({ sheet: "remove-repo", busy: true });
    expect(sourcesFlowReducer(busy, { type: "close" })).toEqual(busy);
    expect(sourcesFlowReducer(busy, { type: "fail", message: "x" })).toMatchObject({
      busy: false,
      error: "x",
    });
  });

  it("volver cierra la hoja", () => {
    expect(run({ type: "ask-remove-repo", repoId: "r" }, { type: "back" })).toEqual({
      sheet: "none",
    });
  });
});
