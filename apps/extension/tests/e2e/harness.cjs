// F26 — montaje común de los e2e de la extensión REAL: Chromium de Playwright (Chrome de
// marca ignora --load-extension desde la 137), una copia de dist con hosts ya concedidos,
// un servidor local y una página «de la app» en http://localhost:5173 (intercepción de ruta).
//
// Un permiso opcional no se puede conceder sin un clic humano, así que el e2e concede de
// antemano solo 127.0.0.1 en la COPIA; el resto de hosts sirve para probar «sin
// autorización no hay petición» (SPEC §7.2).
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const dist = path.resolve(__dirname, "../../dist");
const APP = "http://localhost:5173";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const own = chromium.executablePath();
  if (fs.existsSync(own)) return own;
  const base =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
  const candidates = fs.existsSync(base)
    ? fs
        .readdirSync(base)
        .filter((name) => /^chromium-\d+$/.test(name))
        .sort()
        .reverse()
    : [];
  for (const name of candidates) {
    for (const rel of ["chrome-win64/chrome.exe", "chrome-linux/chrome", "chrome-linux64/chrome"]) {
      const full = path.join(base, name, rel);
      if (fs.existsSync(full)) return full;
    }
  }
  throw new Error("No encuentro un Chromium (define CHROMIUM_PATH)");
}

function startServer() {
  const hits = {};
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    hits[url.pathname] = (hits[url.pathname] || 0) + 1;
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      switch (url.pathname) {
        case "/echo":
          res.writeHead(200, {
            "content-type": "application/json",
            "set-cookie": "s=1",
            "x-uno": "1",
          });
          res.end(
            JSON.stringify({
              method: req.method,
              referer: req.headers.referer ?? null,
              userAgent: req.headers["user-agent"] ?? null,
              origin: req.headers.origin ?? null,
              cookie: req.headers.cookie ?? null,
              accept: req.headers.accept ?? null,
              body,
            }),
          );
          return;
        case "/img":
          res.writeHead(200, { "content-type": "image/png" });
          res.end(PNG);
          return;
        case "/latin1":
          res.writeHead(200, { "content-type": "text/html; charset=iso-8859-1" });
          res.end(Buffer.from("caf\u00e9", "latin1"));
          return;
        case "/redirect":
          res.writeHead(302, { location: "/echo" });
          res.end();
          return;
        case "/cookie":
          res.writeHead(200, { "content-type": "text/html", "set-cookie": "sid=abc; Path=/" });
          res.end("<p>cookie</p>");
          return;
        default:
          res.writeHead(404, { "content-type": "text/plain" });
          res.end("no est\u00e1");
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, hits, port: server.address().port }));
  });
}

/** Cliente mínimo del protocolo dentro de la página de la app (hace de web). */
const APP_PAGE = `<!doctype html><html><body><script>
window.rpc = (message, timeoutMs = 3000) => new Promise((resolve, reject) => {
  const id = String(Math.random());
  const timer = setTimeout(() => { window.removeEventListener("message", on); reject(new Error("sin respuesta")); }, timeoutMs);
  const on = (e) => {
    if (e.source !== window || !e.data || e.data.id !== id) return;
    if (!["pong", "ack", "http.response", "error"].includes(e.data.type)) return;
    clearTimeout(timer); window.removeEventListener("message", on); resolve(e.data);
  };
  window.addEventListener("message", on);
  window.postMessage({ channel: "ryuunest.extension", version: 1, id, ...message }, location.origin);
});
</script></body></html>`;

/**
 * Arranca todo; `cleanup()` lo deja limpio.
 *  - `grantHosts`: patrones concedidos de antemano en la COPIA de la extensión.
 *  - `stubApp`: sirve una página mínima en http://localhost:5173 (por defecto sí). Con
 *    `false` no se intercepta nada: la «app» es la web real servida aparte (bridge.cjs).
 *  - `extraArgs`: flags extra para Chromium (p. ej. --ignore-certificate-errors).
 */
async function setup({ grantHosts = ["*://127.0.0.1/*"], stubApp = true, extraArgs = [] } = {}) {
  const extDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryuunest-ext-"));
  fs.cpSync(dist, extDir, { recursive: true });
  const manifestPath = path.join(extDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.host_permissions = grantHosts;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const { server, hits, port } = await startServer();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryuunest-profile-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: findChromium(),
    headless: true,
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, ...extraArgs],
  });

  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extensionId = new URL(worker.url()).host;

  if (stubApp) {
    await context.route(`${APP}/**`, (route) =>
      route.fulfill({ contentType: "text/html", body: APP_PAGE }),
    );
    await context.route("http://localhost:9999/**", (route) =>
      route.fulfill({ contentType: "text/html", body: APP_PAGE }),
    );
  }

  return {
    context,
    extensionId,
    hits,
    port,
    base: `http://127.0.0.1:${port}`,
    APP,
    PNG,
    /** Abre la página «de la app» y devuelve utilidades para hablar con la extensión. */
    async openApp() {
      const page = await context.newPage();
      await page.goto(`${APP}/`);
      const rpc = (message) => page.evaluate((m) => window.rpc(m), message);
      const get = (url, headers = {}) => rpc({ type: "http.request", url, method: "GET", headers });
      return { page, rpc, get };
    },
    async cleanup() {
      await context.close();
      server.close();
      fs.rmSync(extDir, { recursive: true, force: true });
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

module.exports = { setup };
