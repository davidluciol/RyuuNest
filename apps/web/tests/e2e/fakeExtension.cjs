// F27 — doble de la extensión de navegador para los e2e de la web que NO necesitan la
// extensión real. Habla el protocolo de `@ryuunest/extension-protocol` (SPEC §10) dentro
// de la propia página, como haría el content script + el fondo, y hace las peticiones con
// el `fetch` de la página: así `context.route(...)` sigue interceptando la red de los
// repos y sitios falsos, igual que antes de F27.
//
// La extensión REAL se prueba en `bridge.cjs` (AC-10). Aquí solo se simula.
//
//   installFakeExtension(context)                          → extensión presente, todo autorizado
//   installFakeExtension(context, { authorizedHosts: [...] }) → solo esos hosts; el resto falla
//                                                              con DOMAIN_NOT_AUTHORIZED
//   (sin llamar)                                           → la web ve que falta la extensión
//
// La página expone `window.__fakeExtension = { requests, options }` para las aserciones.
async function installFakeExtension(context, { authorizedHosts = null } = {}) {
  await context.addInitScript(
    ({ authorizedHosts: authorized }) => {
      const CHANNEL = "ryuunest.extension";
      const VERSION = 1;
      const TEXTUAL = /^(text\/|application\/(json|xml|xhtml\+xml|javascript)|.*\+(json|xml))/i;
      const state = { requests: [], options: [] };
      window.__fakeExtension = state;

      const reply = (id, body) =>
        window.postMessage({ channel: CHANNEL, version: VERSION, id, ...body }, location.origin);

      const toBase64 = (bytes) => {
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        return btoa(binary);
      };

      window.addEventListener("message", async (event) => {
        if (event.source !== window || event.origin !== location.origin) return;
        const message = event.data;
        if (!message || message.channel !== CHANNEL || message.version !== VERSION) return;
        if (typeof message.id !== "string") return;

        if (message.type === "ping") {
          reply(message.id, { type: "pong", extensionVersion: "e2e-fake" });
          return;
        }
        if (message.type === "options.open") {
          state.options.push(message.domain ?? null);
          reply(message.id, { type: "ack" });
          return;
        }
        if (message.type !== "http.request") return;

        const host = new URL(message.url).hostname;
        state.requests.push({ url: message.url, method: message.method, headers: message.headers });

        if (authorized !== null && !authorized.includes(host)) {
          reply(message.id, {
            type: "error",
            code: "DOMAIN_NOT_AUTHORIZED",
            message: `Falta autorizar ${host}`,
            domain: host,
          });
          return;
        }

        try {
          const response = await fetch(message.url, {
            method: message.method,
            headers: message.headers,
            body: message.body,
            credentials: "omit",
          });
          const bytes = new Uint8Array(await response.arrayBuffer());
          const contentType = response.headers.get("content-type") ?? "";
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });
          reply(message.id, {
            type: "http.response",
            status: response.status,
            headers,
            url: response.url || message.url,
            ...(TEXTUAL.test(contentType)
              ? { encoding: "text", body: new TextDecoder().decode(bytes) }
              : { encoding: "base64", body: toBase64(bytes) }),
          });
        } catch {
          reply(message.id, {
            type: "error",
            code: "NETWORK",
            message: `No se pudo pedir ${host}`,
          });
        }
      });
    },
    { authorizedHosts },
  );
}

module.exports = { installFakeExtension };
