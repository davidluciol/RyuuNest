import type { ExtensionStatus } from "../ports/extensionStatus";

/**
 * F27 — qué avisa la interfaz según el estado de la extensión (lógica pura; el
 * componente `ExtensionNotice` solo la pinta). Dos avisos accionables:
 *  - falta la extensión → recargar la página (el content script solo se inyecta
 *    en las páginas que cargan después de instalarla);
 *  - hay dominios por autorizar → abrir la extensión, donde se concede el permiso.
 * Si falta la extensión, los dominios pendientes no importan.
 */
export type ExtensionNotice =
  | {
      kind: "missing";
      messageKey: "extension.notice.missing";
      actionKey: "extension.notice.reload";
      dismissKey: string;
    }
  | {
      kind: "domains";
      messageKey: "extension.notice.domain" | "extension.notice.domains";
      params: Record<string, string | number>;
      actionKey: "extension.notice.open";
      /** Dominio con el que se abren las opciones de la extensión. */
      domain: string;
      dismissKey: string;
    };

export function extensionNotice(status: ExtensionStatus): ExtensionNotice | null {
  if (status.state === "missing") {
    return {
      kind: "missing",
      messageKey: "extension.notice.missing",
      actionKey: "extension.notice.reload",
      dismissKey: "missing",
    };
  }

  const [first, ...rest] = status.pendingDomains;
  if (first === undefined) return null;

  return {
    kind: "domains",
    messageKey: rest.length === 0 ? "extension.notice.domain" : "extension.notice.domains",
    params: rest.length === 0 ? { domain: first } : { count: rest.length + 1 },
    actionKey: "extension.notice.open",
    domain: first,
    dismissKey: `domains:${[...status.pendingDomains].sort().join(",")}`,
  };
}
