// F26 — e2e de la extensión REAL cargada en Chromium. Una página «de la app» servida en
// http://localhost:5173 habla con la extensión por window.postMessage, y la extensión hace
// las peticiones a un servidor local. Montaje común en harness.cjs.
//
// Requiere `pnpm --filter @ryuunest/extension build` antes. PLAYWRIGHT_MODULE apunta al
// paquete playwright del entorno; CHROMIUM_PATH (opcional) al Chromium con el que lanzar.
const assert = require("node:assert/strict");

const { setup } = require("./harness.cjs");

(async () => {
  const env = await setup();
  const { context, extensionId, hits, port, base, PNG } = env;
  try {
    const { rpc, get } = await env.openApp();

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
    assert.equal(JSON.parse(echo.body).accept, "application/json");

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
      body: '{"q":"drag\u00f3n"}',
    });
    assert.equal(JSON.parse(post.body).method, "POST");
    assert.equal(JSON.parse(post.body).body, '{"q":"drag\u00f3n"}');

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
    await env.cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
