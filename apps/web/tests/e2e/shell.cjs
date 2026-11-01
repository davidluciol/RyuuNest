// F24 — marco del cliente web servido por `vite preview`: en 1440 px hay riel
// fijo de 240 px con las 5 pestañas; en 426 px, cabecera + barra inferior. Sin
// errores de consola, sin desbordamiento horizontal y sin peticiones externas
// (RNF-5: fuentes y tokens son locales).
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/shell.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [1440, 426]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await installFakeExtension(context);
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
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

      await page.goto(`${baseURL}/`);
      await page.getByTestId("screen-home").waitFor({ state: "visible" });

      // Sin desbordamiento horizontal.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      assert.equal(overflow, 0, `desbordamiento horizontal a ${width} px: ${overflow}px`);

      // El tema llega por los tokens generados (bg de Dragon Night = #0B0E14).
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      assert.equal(bg, "rgb(11, 14, 20)", `fondo del tema a ${width} px: ${bg}`);

      // Las fuentes son las locales empaquetadas (cargadas vía @font-face propio).
      await page.evaluate(() => document.fonts.ready);
      const families = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight}`));
      assert.ok(families.some((f) => f.startsWith("Manrope")), `Manrope cargada a ${width} px: ${families}`);
      assert.ok(families.some((f) => f.startsWith("Inter")), `Inter cargada a ${width} px: ${families}`);

      for (const id of ["home", "library", "discover", "sources", "settings"]) {
        await page.getByTestId(`destination-${id}`).waitFor({ state: "visible" });
      }

      if (width >= 1024) {
        const rail = page.locator(".rail");
        await rail.waitFor({ state: "visible" });
        const railWidth = await rail.evaluate((el) => el.getBoundingClientRect().width);
        assert.equal(Math.round(railWidth), 240, `riel de 240 px a ${width}: ${railWidth}`);
        assert.equal(await page.locator(".bottom-nav").count(), 0, "sin barra inferior en escritorio");
      } else {
        await page.locator(".bottom-nav").waitFor({ state: "visible" });
        assert.equal(await page.locator(".rail").count(), 0, "sin riel por debajo de 1024 px");
      }

      // Navegación real con react-router: cada pestaña monta su pantalla (estado vacío real).
      await page.getByTestId("destination-discover").click();
      await page.getByTestId("screen-discover").waitFor({ state: "visible" });
      assert.equal(new URL(page.url()).pathname, "/discover");
      await page.getByTestId("destination-library").click();
      await page.getByTestId("screen-library").waitFor({ state: "visible" });
      assert.equal(new URL(page.url()).pathname, "/library");

      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(external, [], `peticiones externas a ${width} px: ${external}`);
      await context.close();
      console.log(`OK ${width} px`);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
