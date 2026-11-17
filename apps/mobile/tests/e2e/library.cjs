// F14c — Biblioteca en web: sin SQLite local usa los datos de ejemplo, sin errores ni dominios externos.
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/library.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
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
      await page.goto(`${baseURL}/library`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").waitFor({ state: "visible" });
      // F52: «Gemas» (vista de todo, elegida al inicio) y «Favoritos» como tarjetas de carpeta ≥48.
      // react-native-web no expone `selected` como atributo: se lee el borde `accent` (#35C98A).
      const elegida = async (card) =>
        (await card.evaluate((el) => getComputedStyle(el).borderTopColor)) === "rgb(53, 201, 138)";
      const gemas = page.getByRole("button", { name: /^Gemas, 48 obras$/ });
      const favoritos = page.getByRole("button", { name: /^Favoritos, 24 obras$/ });
      await gemas.waitFor({ state: "visible" });
      await favoritos.waitFor({ state: "visible" });
      assert.equal(await elegida(gemas), true, `Gemas elegida @${width}`);
      for (const card of [gemas, favoritos]) {
        const box = await card.boundingBox();
        assert.ok(box && box.width >= 48 && box.height >= 48, `área táctil de carpeta @${width}`);
      }
      // Nombres de carpeta completos (T7): ninguno recortado con «…» mientras quepa.
      for (const nombre of ["Lectura Nocturna", "Completados"]) {
        const recortado = await page
          .getByText(nombre, { exact: true })
          .first()
          .evaluate((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        assert.equal(recortado, false, `«${nombre}» recortado @${width}`);
      }
      await favoritos.click();
      assert.equal(await elegida(favoritos), true, `Favoritos elegida @${width}`);
      assert.equal(await elegida(gemas), false, `Gemas ya no @${width}`);
      await gemas.click();
      assert.equal(await elegida(gemas), true, `Gemas vuelve @${width}`);
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-${width}.png` : undefined });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("library e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
