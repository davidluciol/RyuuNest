// F26 — e2e de la página de opciones de la extensión REAL (Regla 5 de AGENTS): donde el
// usuario autoriza los dominios que la web pidió. El aviso de permisos del navegador no se
// puede pulsar desde Playwright, así que se sustituyen chrome.permissions.request/getAll/
// remove por dobles que anotan los orígenes pedidos y si había un gesto de usuario activo.
//
// Requiere `pnpm --filter @ryuunest/extension build` antes. PLAYWRIGHT_MODULE apunta al
// paquete playwright del entorno.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { setup } = require("./harness.cjs");

const shots = path.resolve(__dirname, "../../../../docs/capturasF26");

function permissionsDouble() {
  if (!location.protocol.startsWith("chrome-extension")) return;
  const realGetAll = chrome.permissions.getAll.bind(chrome.permissions);
  const extra = new Set();
  window.__e2e = { requests: [], removed: [], nextGrant: true };
  chrome.permissions.request = async (permissions) => {
    window.__e2e.requests.push({
      origins: permissions.origins,
      active: navigator.userActivation.isActive,
    });
    if (!window.__e2e.nextGrant) return false;
    for (const origin of permissions.origins ?? []) extra.add(origin);
    return true;
  };
  chrome.permissions.getAll = async () => {
    const all = await realGetAll();
    return { ...all, origins: [...(all.origins ?? []), ...extra] };
  };
  chrome.permissions.remove = async (permissions) => {
    window.__e2e.removed.push(permissions.origins);
    for (const origin of permissions.origins ?? []) extra.delete(origin);
    return true;
  };
}

async function audit(page, label) {
  // Sin desbordamiento horizontal.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.equal(overflow, 0, `${label}: desbordamiento horizontal de ${overflow}px`);

  // Áreas interactivas de al menos 48 × 48 (AGENTS §5).
  const small = await page.$$eval("button", (buttons) =>
    buttons
      .map((button) => {
        const box = button.getBoundingClientRect();
        return { text: button.textContent, width: box.width, height: box.height };
      })
      .filter((box) => box.width > 0 && (box.width < 48 || box.height < 48)),
  );
  assert.deepEqual(small, [], `${label}: botones por debajo de 48x48`);

  // Ningún texto importante cortado con «…» (DESIGN_RULES T7): los hosts se parten, no se recortan.
  const ellipsis = await page.$$eval("[data-testid^='domain-row-'] .domain-host", (nodes) =>
    nodes.filter((node) => node.scrollWidth > node.clientWidth).map((node) => node.textContent),
  );
  assert.deepEqual(ellipsis, [], `${label}: hosts recortados`);
}

(async () => {
  // Sin nada concedido de antemano: «Autorizados» debe empezar vacío.
  const env = await setup({ grantHosts: [] });
  const { context, extensionId } = env;
  fs.mkdirSync(shots, { recursive: true });
  try {
    await context.addInitScript(permissionsDouble);

    // La web pide tres dominios que nadie autorizó: quedan pendientes.
    const app = await env.openApp();
    for (const host of ["cdn.sitio.example", "otro.sitio.example"]) {
      const reply = await app.get(`https://${host}/imagen.jpg`);
      assert.equal(reply.code, "DOMAIN_NOT_AUTHORIZED");
    }

    const page = await context.newPage();
    const errors = [];
    const external = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:/.test(request.url())) external.push(request.url());
    });

    const optionsUrl = `chrome-extension://${extensionId}/options.html`;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(optionsUrl);
    await page.getByTestId("screen-options").waitFor({ state: "visible" });

    // A. Dos pendientes, ninguno autorizado, un único botón primario (V3).
    await page.getByTestId("domain-row-pending-cdn.sitio.example").waitFor();
    await page.getByTestId("domain-row-pending-otro.sitio.example").waitFor();
    await page.getByTestId("options-authorized-empty").waitFor();
    assert.equal(await page.locator(".btn-primary").count(), 1, "un solo botón primario");
    assert.match(
      await page.getByTestId("options-authorize-all").innerText(),
      /Autorizar todos \(2\)/,
    );

    // Fuentes locales cargadas (RNF-5) y sin peticiones externas.
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((font) => font.status === "loaded")
        .map((font) => font.family);
    });
    assert.ok(fonts.length > 0, "se cargaron las fuentes locales");
    await audit(page, "1440");
    await page.screenshot({ path: path.join(shots, "options-1440.png"), fullPage: true });

    await page.setViewportSize({ width: 426, height: 900 });
    await audit(page, "426");
    await page.screenshot({ path: path.join(shots, "options-426.png"), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });

    // Foco visible con teclado (el equivalente al D-pad en TV).
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? getComputedStyle(el).outlineStyle : "none";
    });
    assert.notEqual(outline, "none", "el foco por teclado debe ser visible");

    // B. «Autorizar todos»: un solo permiso con los dos hosts exactos y DENTRO de un gesto.
    await page.getByTestId("options-authorize-all").click();
    await page.getByTestId("domain-row-authorized-cdn.sitio.example").waitFor();
    await page.getByTestId("domain-row-authorized-otro.sitio.example").waitFor();
    await page.getByTestId("options-pending-empty").waitFor();
    const requests = await page.evaluate(() => window.__e2e.requests);
    assert.deepEqual(requests, [
      { origins: ["*://cdn.sitio.example/*", "*://otro.sitio.example/*"], active: true },
    ]);
    const pendingAfter = await page.evaluate(
      async () => (await chrome.storage.local.get("pendingHosts")).pendingHosts,
    );
    assert.deepEqual(pendingAfter, []);
    assert.equal(await page.getByTestId("options-authorize-all").count(), 0);

    // C. Revocar un dominio retira exactamente su permiso.
    await page.getByTestId("domain-action-authorized-cdn.sitio.example").click();
    await page
      .getByTestId("domain-row-authorized-cdn.sitio.example")
      .waitFor({ state: "detached" });
    assert.deepEqual(await page.evaluate(() => window.__e2e.removed), [
      ["*://cdn.sitio.example/*"],
    ]);
    await page.getByTestId("domain-row-authorized-otro.sitio.example").waitFor();

    // D. Si el usuario rechaza el aviso del navegador, el host sigue pendiente y se avisa.
    const reply = await app.get("https://tercero.sitio.example/imagen.jpg");
    assert.equal(reply.code, "DOMAIN_NOT_AUTHORIZED");
    await page.reload();
    await page.getByTestId("domain-row-pending-tercero.sitio.example").waitFor();
    await page.evaluate(() => {
      window.__e2e.nextGrant = false;
    });
    await page.getByTestId("domain-action-pending-tercero.sitio.example").click();
    await page.getByTestId("options-notice").waitFor({ state: "visible" });
    await page.getByTestId("domain-row-pending-tercero.sitio.example").waitFor();
    assert.equal(
      await page.locator(".btn-primary").count(),
      1,
      "con un solo pendiente, su botón es el primario",
    );

    assert.deepEqual(errors, [], `errores de consola: ${errors.join(" | ")}`);
    assert.deepEqual(external, [], `peticiones externas: ${external.join(", ")}`);

    console.log("options e2e OK");
  } finally {
    await env.cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
