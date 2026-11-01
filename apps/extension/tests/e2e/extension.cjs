// F26 — e2e de la extensión REAL cargada en Chromium (no en Chrome de marca: desde la
// 137 ignora --load-extension). Una página "de la app" servida en http://localhost:5173
// (por intercepción de ruta) habla con la extensión por window.postMessage, y la
// extensión hace las peticiones a un servidor local.
//
// Un permiso opcional no se puede conceder sin un clic humano, así que el e2e usa una
// COPIA de dist con host_permissions solo para 127.0.0.1; "localhost" queda sin conceder
// y sirve para comprobar que sin autorización no hay petición (SPEC §7.2).
//
// Requiere `pnpm --filter @ryuunest/extension build` antes. PLAYWRIGHT_MODULE apunta al
// paquete playwright del entorno; CHROMIUM_PATH (opcional) al Chromium con el que lanzar.
const assert = require("node:assert/strict");
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
          res.end("no está");
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, hits, port: server.address().port }));
  });
}

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

(async () => {
  // Copia de dist con 127.0.0.1 ya concedido (solo para esta prueba).
  const extDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryuunest-ext-"));
  fs.cpSync(dist, extDir, { recursive: true });
  const manifestPath = path.join(extDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  // Mismo patrón que concede la página de opciones (originPatternFor): http y https.
  manifest.host_permissions = ["*://127.0.0.1/*"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const { server, hits, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ryuunest-profile-"));

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: findChromium(),
    headless: true,
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  });
  try {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker", { timeout: 15000 });
    const extensionId = new URL(worker.url()).host;

    await context.route(`${APP}/**`, (route) =>
      route.fulfill({ contentType: "text/html", body: APP_PAGE }),
    );
    await context.route("http://localhost:9999/**", (route) =>
      route.fulfill({ contentType: "text/html", body: APP_PAGE }),
    );

    const page = await context.newPage();
    await page.goto(`${APP}/`);
    const rpc = (message) => page.evaluate((m) => window.rpc(m), message);
    const get = (url, headers = {}) => rpc({ type: "http.request", url, method: "GET", headers });

    // 1. El content script responde en el origen de la app.
    const pong = await rpc({ type: "ping" });
    assert.equal(pong.type, "pong");
    assert.equal(pong.extensionVersion, "0.0.0");

    // 2. Petición autorizada: estado, cabeceras en minúsculas, sin set-cookie, texto.
    const echo = await get(`${base}/echo`, { Accept: "application/json" });
    assert.equal(echo.type, "http.response", JSON.stringify(echo));
    assert.equal(echo.status, 200);
    assert.equal(echo.encoding, "text");
    assert.equal(echo.headers["x-uno"], "1");
    assert.equal(echo.headers["set-cookie"], undefined, "la extensión no reenvía set-cookie");
    const seen = JSON.parse(echo.body);
    assert.equal(seen.accept, "application/json");

    // 3. Referer, User-Agent y Origin llegan al sitio (declarativeNetRequest).
    const withHeaders = await get(`${base}/echo`, {
      Referer: "https://sitio-de-prueba.example/capitulo/1",
      "User-Agent": "RyuuNest-E2E/1.0",
      Origin: "https://sitio-de-prueba.example",
    });
    const seenHeaders = JSON.parse(withHeaders.body);
    assert.equal(seenHeaders.referer, "https://sitio-de-prueba.example/capitulo/1");
    assert.equal(seenHeaders.userAgent, "RyuuNest-E2E/1.0");
    assert.equal(seenHeaders.origin, "https://sitio-de-prueba.example");

    // ...y la regla se retira: la siguiente petición ya no las lleva.
    const after = JSON.parse((await get(`${base}/echo`)).body);
    assert.notEqual(after.referer, "https://sitio-de-prueba.example/capitulo/1");
    assert.notEqual(after.userAgent, "RyuuNest-E2E/1.0");

    // 4. Sin cookies, aunque el navegador tenga una del sitio.
    const cookiePage = await context.newPage();
    await cookiePage.goto(`${base}/cookie`);
    assert.ok(
      (await context.cookies(base)).some((c) => c.name === "sid"),
      "el navegador tiene la cookie",
    );
    await cookiePage.close();
    assert.equal(JSON.parse((await get(`${base}/echo`, { Cookie: "falsa=1" })).body).cookie, null);

    // 5. Binario en base64 exacto; texto con charset; redirecciones; POST con cuerpo.
    const img = await get(`${base}/img`);
    assert.equal(img.encoding, "base64");
    assert.deepEqual(Buffer.from(img.body, "base64"), PNG);
    const latin = await get(`${base}/latin1`);
    assert.equal(latin.encoding, "text");
    assert.equal(latin.body, "caf\u00e9");
    const redirected = await get(`${base}/redirect`);
    assert.ok(redirected.url.endsWith("/echo"), `URL final ${redirected.url}`);
    const post = await rpc({
      type: "http.request",
      url: `${base}/echo`,
      method: "POST",
      headers: {},
      body: '{"q":"dragón"}',
    });
    assert.equal(JSON.parse(post.body).method, "POST");
    assert.equal(JSON.parse(post.body).body, '{"q":"dragón"}');

    // 6. Un 404 del sitio es una respuesta, no un fallo.
    const missing = await get(`${base}/no-existe`);
    assert.equal(missing.type, "http.response");
    assert.equal(missing.status, 404);

    // 7. SIN AUTORIZACIÓN NO HAY PETICIÓN (SPEC §7.2): localhost no está concedido.
    const before = hits["/secreto"] || 0;
    const denied = await get(`http://localhost:${port}/secreto`);
    assert.equal(denied.type, "error");
    assert.equal(denied.code, "DOMAIN_NOT_AUTHORIZED");
    assert.equal(denied.domain, "localhost");
    assert.equal(hits["/secreto"] || 0, before, "el servidor no debe recibir ninguna petición");

    // ...y el host quedó anotado como pendiente para la página de opciones.
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    const pendingHosts = await optionsPage.evaluate(
      async () => (await chrome.storage.local.get("pendingHosts")).pendingHosts,
    );
    assert.deepEqual(pendingHosts, ["localhost"]);
    const granted = await optionsPage.evaluate(
      async () => (await chrome.permissions.getAll()).origins,
    );
    assert.ok(
      granted.includes("*://127.0.0.1/*"),
      `permisos concedidos: ${JSON.stringify(granted)}`,
    );
    assert.ok(!granted.includes("*://localhost/*"), "localhost no debe estar concedido");
    await optionsPage.close();

    // 8. options.open abre la página de opciones de la extensión.
    const opened = context.waitForEvent("page", { timeout: 10000 });
    const ack = await rpc({ type: "options.open", domain: "cdn.sitio.example" });
    assert.equal(ack.type, "ack");
    const newPage = await opened;
    await newPage.waitForLoadState();
    assert.ok(
      newPage.url().startsWith(`chrome-extension://${extensionId}/options.html`),
      newPage.url(),
    );
    await newPage.close();

    // 9. En un origen que no es el de la app nadie contesta (ni siquiera el ping).
    const other = await context.newPage();
    await other.goto("http://localhost:9999/");
    await assert.rejects(
      () => other.evaluate(() => window.rpc({ type: "ping" }, 1500)),
      /sin respuesta/,
    );

    // 10. Un mensaje mal formado (esquema file:) se descarta sin respuesta y sin petición.
    await assert.rejects(
      () => rpc({ type: "http.request", url: "file:///etc/passwd", method: "GET", headers: {} }),
      /sin respuesta/,
    );

    console.log("extension e2e OK");
  } finally {
    await context.close();
    server.close();
    fs.rmSync(extDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
