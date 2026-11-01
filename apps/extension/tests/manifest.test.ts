import { describe, expect, it } from "vitest";

import manifestJson from "../manifest.json";
import { APP_ORIGINS } from "../src/config";

/**
 * F26 — puertas del manifiesto (SPEC §7.2 y §10): sin dominio autorizado no hay
 * petición, y solo el origen de la app habla con la extensión.
 */
interface Manifest {
  manifest_version: number;
  permissions?: string[];
  host_permissions?: string[];
  optional_host_permissions?: string[];
  content_scripts?: Array<{
    matches: string[];
    js: string[];
    run_at?: string;
    all_frames?: boolean;
  }>;
  background?: { service_worker?: string; scripts?: string[] };
  options_ui?: { page: string; open_in_tab?: boolean };
  externally_connectable?: unknown;
  web_accessible_resources?: unknown;
  browser_specific_settings?: { gecko?: { id?: string } };
  action?: unknown;
}

const manifest: Manifest = manifestJson;

describe("APP_ORIGINS", () => {
  it("son orígenes exactos (sin comodines, sin ruta)", () => {
    expect(APP_ORIGINS.length).toBeGreaterThan(0);
    for (const origin of APP_ORIGINS) {
      expect(new URL(origin).origin, origin).toBe(origin);
      expect(origin).not.toContain("*");
    }
  });
});

describe("manifest.json", () => {
  it("es Manifest V3", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it("no autoriza ningún dominio de entrada: todo es opcional y lo concede el usuario", () => {
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toEqual(["http://*/*", "https://*/*"]);
  });

  it("pide solo los permisos que usa", () => {
    expect([...(manifest.permissions ?? [])].sort()).toEqual(
      ["declarativeNetRequestWithHostAccess", "storage"].sort(),
    );
  });

  it("el content script solo se inyecta en los orígenes de la app, sin iframes", () => {
    expect(manifest.content_scripts).toHaveLength(1);
    const [script] = manifest.content_scripts ?? [];
    expect(script?.matches).toEqual(APP_ORIGINS.map((origin) => `${origin}/*`));
    expect(script?.js).toEqual(["content.js"]);
    expect(script?.run_at).toBe("document_start");
    expect(script?.all_frames ?? false).toBe(false);
  });

  it("ninguna otra página puede hablar con la extensión ni leer sus recursos", () => {
    expect(manifest.externally_connectable).toBeUndefined();
    expect(manifest.web_accessible_resources).toBeUndefined();
  });

  it("el fondo vale para Chrome (service worker) y para Firefox (scripts)", () => {
    expect(manifest.background).toEqual({
      service_worker: "background.js",
      scripts: ["background.js"],
    });
  });

  it("trae página de opciones (ahí se autorizan los dominios) y botón de la barra", () => {
    expect(manifest.options_ui).toEqual({ page: "options.html", open_in_tab: true });
    expect(manifest.action).toBeDefined();
  });

  it("fija el ID de Firefox decidido por el humano", () => {
    expect(manifest.browser_specific_settings?.gecko?.id).toBe("ryuunest@io.github.davidluciol");
  });
});
