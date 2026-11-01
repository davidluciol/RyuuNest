import { describe, expect, it } from "vitest";

import { catalogKeys } from "@ryuunest/i18n";

import { extensionNotice } from "../../src/shell/extensionNoticeModel";

const keys = new Set(catalogKeys());

describe("extensionNotice", () => {
  it("no avisa de nada si no hay problema", () => {
    expect(extensionNotice({ state: "unknown", pendingDomains: [] })).toBeNull();
    expect(extensionNotice({ state: "ready", pendingDomains: [] })).toBeNull();
  });

  it("avisa de que falta la extensión y ofrece recargar", () => {
    const notice = extensionNotice({ state: "missing", pendingDomains: [] });
    expect(notice).toMatchObject({
      kind: "missing",
      messageKey: "extension.notice.missing",
      actionKey: "extension.notice.reload",
    });
  });

  it("con un dominio pendiente lo nombra y ofrece abrir la extensión", () => {
    const notice = extensionNotice({ state: "ready", pendingDomains: ["cdn.sitio.org"] });
    expect(notice).toMatchObject({
      kind: "domains",
      messageKey: "extension.notice.domain",
      params: { domain: "cdn.sitio.org" },
      actionKey: "extension.notice.open",
      domain: "cdn.sitio.org",
    });
  });

  it("con varios cuenta cuántos y abre la extensión en el primero", () => {
    const notice = extensionNotice({ state: "ready", pendingDomains: ["a.org", "b.org", "c.org"] });
    expect(notice).toMatchObject({
      kind: "domains",
      messageKey: "extension.notice.domains",
      params: { count: 3 },
      domain: "a.org",
    });
  });

  it("si falta la extensión, los dominios pendientes no importan", () => {
    const notice = extensionNotice({ state: "missing", pendingDomains: ["a.org"] });
    expect(notice?.kind).toBe("missing");
  });

  it("la clave de descarte cambia cuando cambia el aviso (para que un dominio nuevo vuelva a avisar)", () => {
    const one = extensionNotice({ state: "ready", pendingDomains: ["a.org"] });
    const two = extensionNotice({ state: "ready", pendingDomains: ["a.org", "b.org"] });
    const missing = extensionNotice({ state: "missing", pendingDomains: [] });
    expect(new Set([one?.dismissKey, two?.dismissKey, missing?.dismissKey]).size).toBe(3);
    expect(extensionNotice({ state: "ready", pendingDomains: ["a.org"] })?.dismissKey).toBe(
      one?.dismissKey,
    );
  });

  it("todas las claves de texto existen en el catálogo", () => {
    const notices = [
      extensionNotice({ state: "missing", pendingDomains: [] }),
      extensionNotice({ state: "ready", pendingDomains: ["a.org"] }),
      extensionNotice({ state: "ready", pendingDomains: ["a.org", "b.org"] }),
    ];
    for (const notice of notices) {
      expect(keys.has(notice?.messageKey ?? ""), notice?.messageKey).toBe(true);
      expect(keys.has(notice?.actionKey ?? ""), notice?.actionKey).toBe(true);
    }
  });
});
