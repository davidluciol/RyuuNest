// F27 — avisos de la extensión en la web (Regla 5 de AGENTS), a 1440 y 426 px:
//  A) sin extensión: tras detectarla, un aviso con «Recargar», que se puede cerrar.
//  B) con extensión pero sin dominios autorizados: al abrir Fuentes, la app intenta añadir el
//     repo oficial (raw.githubusercontent.com); el aviso nombra el dominio y «Abrir
//     extensión» le pide a la extensión abrir sus opciones con ese dominio.
// Sin errores de consola, sin desbordamiento horizontal y sin peticiones externas.
// Extensión simulada en el navegador (fakeExtension.cjs); la REAL se prueba en bridge.cjs.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/extensionNotice.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
const shots = path.resolve(__dirname, "../../../../docs/capturasF27");

async function open(browser, width, { extension }) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  if (extension !== null) await installFakeExtension(context, extension);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  const external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  return { context, page, errors, external };
}

async function checkLayout(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.equal(overflow, 0, `${label}: desbordamiento horizontal de ${overflow}px`);
  const small = await page.$$eval("[data-testid='extension-notice'] button", (buttons) =>
    buttons
      .map((button) => {
        const box = button.getBoundingClientRect();
        return {
          label: button.getAttribute("aria-label") ?? button.textContent,
          w: box.width,
          h: box.height,
        };
      })
      .filter((box) => box.w < 48 || box.h < 48),
  );
  assert.deepEqual(small, [], `${label}: botones del aviso por debajo de 48x48`);
  // El mensaje no se recorta con «…» (DESIGN_RULES T7): se parte en líneas.
  const clipped = await page.$eval(
    "[data-testid='extension-notice'] .banner-message",
    (node) => node.scrollWidth > node.clientWidth,
  );
  assert.equal(clipped, false, `${label}: mensaje recortado`);
}

(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [1440, 426]) {
      // A) Sin extensión.
      {
        const { context, page, errors, external } = await open(browser, width, { extension: null });
        await page.goto(`${baseURL}/`);
        const notice = page.getByTestId("extension-notice");
        await notice.waitFor({ state: "visible" });
        assert.match(await notice.innerText(), /No se encuentra la extensión de RyuuNest/);
        assert.equal(await page.getByTestId("extension-notice-action").innerText(), "Recargar");
        await checkLayout(page, `A ${width}`);
        await page.screenshot({ path: path.join(shots, `aviso-falta-${width}.png`) });

        await page.getByTestId("extension-notice-close").click();
        await notice.waitFor({ state: "detached" });

        assert.deepEqual(errors, [], `A ${width}: errores de consola: ${errors.join(" | ")}`);
        assert.deepEqual(external, [], `A ${width}: peticiones externas: ${external.join(", ")}`);
        await context.close();
      }

      // B) Con extensión pero sin dominios autorizados.
      {
        const { context, page, errors, external } = await open(browser, width, {
          extension: { authorizedHosts: [] },
        });
        await page.goto(`${baseURL}/sources`);
        const notice = page.getByTestId("extension-notice");
        await notice.waitFor({ state: "visible" });
        assert.match(
          await notice.innerText(),
          /Autoriza «raw\.githubusercontent\.com» en la extensión para continuar\./,
        );
        assert.equal(
          await page.getByTestId("extension-notice-action").innerText(),
          "Abrir extensión",
        );
        await checkLayout(page, `B ${width}`);
        await page.screenshot({ path: path.join(shots, `aviso-dominio-${width}.png`) });

        await page.getByTestId("extension-notice-action").click();
        await page.waitForFunction(() => window.__fakeExtension.options.length > 0);
        assert.deepEqual(await page.evaluate(() => window.__fakeExtension.options), [
          "raw.githubusercontent.com",
        ]);

        await page.getByTestId("extension-notice-close").click();
        await notice.waitFor({ state: "detached" });

        assert.deepEqual(errors, [], `B ${width}: errores de consola: ${errors.join(" | ")}`);
        assert.deepEqual(external, [], `B ${width}: peticiones externas: ${external.join(", ")}`);
        await context.close();
      }
    }
    console.log("extensionNotice e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
