// Acerca de (AB3) y F74 en la web servida por `vite preview`: Ajustes → Acerca de
// → volver; versión, enlaces en pestaña nueva (`noopener`), sección Artistas
// oculta sin artistas, pestañas con los iconos nuevos. A 426 y 1440 px: sin
// desborde, áreas ≥ 48, consola limpia y cero peticiones externas (RNF-5).
// Ejecutar: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/about.cjs
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
const OUT = path.resolve(__dirname, "../../../../docs/capturasAB2");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.setDefaultTimeout(30000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(`${baseURL}/settings`);
      await page.getByTestId("settings-about").click();
      await page.getByTestId("screen-about").waitFor();
      assert.match(await page.getByTestId("about-version").innerText(), /^Versión \d+\.\d+\.\d+$/);
      assert.equal(await page.getByTestId("about-artists").count(), 0, "sin artistas no hay sección");

      for (const name of ["Código fuente", "Licencia"]) {
        const link = page.getByRole("link", { name });
        assert.equal(await link.getAttribute("target"), "_blank");
        assert.match(await link.getAttribute("rel"), /noopener/);
        const box = await link.boundingBox();
        assert.ok(box.height >= 48, `${name} < 48 px`);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(overflow, false, "desborde horizontal");
      await page.screenshot({ path: path.join(OUT, `web-acerca-de-${width}.png`), fullPage: true });

      await page.getByTestId("about-back").click();
      await page.getByTestId("settings-about").waitFor();
      await page.screenshot({ path: path.join(OUT, `web-pestanas-${width}.png`) });

      assert.deepEqual(external, [], "peticiones externas");
      assert.deepEqual(errors, [], "errores de consola");
      await page.close();
    }
    console.log("about e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
