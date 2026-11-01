import { originPatternFor, parseRequest } from "@ryuunest/extension-protocol";

import { ext } from "../browser";
import { APP_ORIGINS, REQUEST_TIMEOUT_MS } from "../config";
import { createPendingHosts } from "../domains";
import { handleMessage, type HandlerDeps } from "./handler";
import { createHeaderRules, type SessionRulesApi } from "./headers";

/**
 * F26 — cableado del fondo (service worker en Chrome/Edge, página de eventos en
 * Firefox). Aquí solo se conectan las APIs del navegador a `handleMessage`; la
 * lógica y sus invariantes están probadas en `handler.ts`.
 */

const pending = createPendingHosts({
  get: async (key) => (await ext.storage.local.get(key))[key],
  set: (key, value) => ext.storage.local.set({ [key]: value }),
});

// Los tipos de `chrome` modelan acciones y tipos de recurso como enums; en el cable son las mismas cadenas.
const sessionRules: SessionRulesApi = {
  updateSessionRules: (options) =>
    ext.declarativeNetRequest.updateSessionRules(
      options as unknown as chrome.declarativeNetRequest.UpdateRuleOptions,
    ),
  getSessionRules: () => ext.declarativeNetRequest.getSessionRules(),
};
const headerRules = createHeaderRules(sessionRules);

// Las reglas de sesión sobreviven al reinicio del fondo: se barren antes de atender nada.
const ready = headerRules.reset().catch(() => {});

const deps: HandlerDeps = {
  appOrigins: APP_ORIGINS,
  extensionVersion: ext.runtime.getManifest().version,
  fetch: (url, init) => fetch(url, init),
  hasHostPermission: (host) => ext.permissions.contains({ origins: [originPatternFor(host)] }),
  rememberPendingHost: (host) => pending.add(host),
  headerRules,
  async openOptions(domain) {
    if (domain !== undefined) await pending.add(domain);
    await ext.runtime.openOptionsPage();
  },
  timeoutMs: REQUEST_TIMEOUT_MS,
};

function senderOrigin(sender: chrome.runtime.MessageSender): string | undefined {
  if (sender.origin !== undefined) return sender.origin;
  if (sender.url === undefined) return undefined;
  try {
    return new URL(sender.url).origin;
  } catch {
    return undefined;
  }
}

ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const request = parseRequest(message);
  if (request === null) return false;
  void ready
    .then(() => handleMessage(request, { origin: senderOrigin(sender) }, deps))
    .then(sendResponse)
    .catch(() => sendResponse(undefined));
  return true;
});

ext.action.onClicked.addListener(() => {
  void ext.runtime.openOptionsPage();
});
