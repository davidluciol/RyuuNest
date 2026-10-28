// F18 — lector: modos, zonas táctiles, controles, progreso y siguiente capítulo.
// Se verifica con el bundle web y datos ficticios (módulo de ejemplo sobre test-site, páginas SVG
// locales). Comprueba a 426 y 1440 px: sin desbordamiento, sin errores de consola y sin
// peticiones a dominios externos (RNF-5).
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
const READER = `${baseURL}/reader/m-ejemplo-a/dragon-de-ceniza`;

async function tapAt(page, canvasTestId, fx, fy) {
  const box = await page.getByTestId(canvasTestId).boundingBox();
  assert.ok(box, `${canvasTestId} sin caja`);
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
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

      // 1. Abre el capítulo 1: manhwa → vertical continuo; controles visibles (RF-18, RF-22).
      await page.goto(`${READER}/ch-1?release=r-oficial`);
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.getByTestId("reader-vertical").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });
      await page.getByText("Pág. 1 / 3").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Cerrar lector" }).waitFor({ state: "visible" });

      // Barras: elevated al 95 % y sin transiciones (RF-22, Regla 4).
      const bar = page.getByTestId("reader-top-bar");
      assert.equal(
        await bar.evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgba(27, 34, 48, 0.95)",
        `fondo de la barra @${width}`,
      );
      assert.equal(
        await bar.evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
        `la barra no anima @${width}`,
      );
      const close = await page.getByRole("button", { name: "Cerrar lector" }).boundingBox();
      assert.ok(close && close.width >= 48 && close.height >= 48, `área táctil de cerrar @${width}`);

      // 2. El centro oculta y vuelve a mostrar los controles (RF-19).
      await tapAt(page, "reader-canvas", 0.5, 0.5);
      await page.getByTestId("reader-top-bar").waitFor({ state: "detached" });
      await tapAt(page, "reader-canvas", 0.5, 0.5);
      await page.getByTestId("reader-top-bar").waitFor({ state: "visible" });

      // 3. Cambia a paginado D→I desde la hoja de modo (RF-22) y se recuerda por serie (RF-18).
      await page.getByRole("button", { name: "Modo de lectura" }).click();
      await page.getByText("Paginado D → I · Manga").click();
      await page.getByTestId("reader-paged").waitFor({ state: "visible" });
      await page.getByText("Pág. 1 / 3").waitFor({ state: "visible" });

      // Con D→I las laterales se invierten: la izquierda avanza y la derecha retrocede (RF-19).
      await tapAt(page, "reader-canvas", 0.1, 0.5);
      await page.getByText("Pág. 2 / 3").waitFor({ state: "visible" });
      await tapAt(page, "reader-canvas", 0.9, 0.5);
      await page.getByText("Pág. 1 / 3").waitFor({ state: "visible" });

      // 4. Al pasar de la última página aparece la tarjeta de siguiente capítulo (RF-21).
      const next = page.getByRole("button", { name: "Página siguiente" });
      await next.click();
      await next.click();
      await page.getByText("Pág. 3 / 3").waitFor({ state: "visible" });
      await next.click();
      await page.getByText("Fin del capítulo 1").waitFor({ state: "visible" });
      // La tarjeta queda entre las barras, no tapada por ellas.
      const card = await page.getByTestId("reader-end-card").boundingBox();
      const topBar = await page.getByTestId("reader-top-bar").boundingBox();
      const bottomBar = await page.getByTestId("reader-bottom-bar").boundingBox();
      assert.ok(card && topBar && bottomBar, `cajas de la tarjeta y las barras @${width}`);
      assert.ok(card.y >= topBar.y + topBar.height, `la tarjeta no puede quedar bajo la barra superior @${width}`);
      assert.ok(card.y + card.height <= bottomBar.y, `la tarjeta no puede quedar bajo la barra inferior @${width}`);
      await page.getByRole("button", { name: "Siguiente: capítulo 2" }).click();
      await page.getByText("Pág. 1 / 4").waitFor({ state: "visible" });
      await page.getByTestId("reader-paged").waitFor({ state: "visible" });

      // 5. El selector de capítulo salta a otro capítulo, conservando el modo de la serie.
      await page.getByRole("button", { name: "Seleccionar capítulo" }).click();
      await page.getByText("Capítulo 3: Capítulo 3").click();
      await page.getByText("Pág. 1 / 2").waitFor({ state: "visible" });
      await page.getByTestId("reader-paged").waitFor({ state: "visible" });

      // 6. Cerrar guarda el progreso: la ficha ofrece continuar en el capítulo 3.
      await page.getByRole("button", { name: "Cerrar lector" }).click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByText(/Continuar cap\. 3/).waitFor({ state: "visible" });

      // 7. Reabrir el capítulo 2 en frío lleva a la página exacta guardada (RF-20, ejemplo: 3 de 4).
      await page.goto(`${READER}/ch-2?release=r-oficial`);
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.getByText("Pág. 3 / 4").waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("reader e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
