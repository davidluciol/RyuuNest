// Contra Metro (`expo start --web --localhost --port 8081`); la galería es solo de desarrollo.
// Acerca de (AB1/AB2): tarjetas de artista y pantalla con artistas en 426 y 1440 px — sin desborde, botones de red
// ≥ 48×48, enlace no https descartado, consola limpia y cero peticiones externas (RNF-5).
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.GALLERY_URL || "http://localhost:8081";
const OUT = path.resolve(__dirname, "../../../../docs/capturasAB1");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
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
      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000 });
      const one = page.getByTestId("gallery-artist-una-red");
      const many = page.getByTestId("gallery-artist-varias-redes");
      await many.scrollIntoViewIfNeeded({ timeout: 120000 });

      const links = many.getByRole("link");
      assert.equal(await one.getByRole("link").count(), 1);
      assert.equal(await links.count(), 5, "el enlace http de ArtStation se descarta");
      for (let i = 0; i < (await links.count()); i += 1) {
        const box = await links.nth(i).boundingBox();
        assert.ok(box && box.width >= 48 && box.height >= 48, `botón ${i} < 48×48`);
      }
      await many.getByRole("link", { name: "Abrir Telegram de Otra artista de ejemplo" }).waitFor();

      const cardBox = await many.boundingBox();
      for (let i = 0; i < (await links.count()); i += 1) {
        const box = await links.nth(i).boundingBox();
        assert.ok(box.x >= cardBox.x && box.x + box.width <= cardBox.x + cardBox.width + 1, "red fuera de la tarjeta");
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(overflow, false, "desborde horizontal");

      await many.screenshot({ path: path.join(OUT, `artista-varias-${width}.png`) });
      await one.screenshot({ path: path.join(OUT, `artista-una-${width}.png`) });

      // AB2: la pantalla «Acerca de» de la galería muestra la sección con los 2 artistas.
      const about = page.getByTestId("about-artists");
      await about.scrollIntoViewIfNeeded();
      await about.getByTestId("about-artist-una-red").waitFor();
      await about.getByTestId("about-artist-varias-redes").waitFor();
      await page.getByTestId("screen-about").screenshot({ path: path.join(OUT, `../capturasAB2/galeria-acerca-de-${width}.png`) });
      assert.deepEqual(external, [], "peticiones externas");
      assert.deepEqual(errors, [], "errores de consola");
      await page.close();
    }
    console.log("artistCard e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
