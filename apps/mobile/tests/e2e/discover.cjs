// F15 — Descubrir en web: se monta el módulo declarativo de `test-site` con el
// runtime real del núcleo, sin errores ni dominios externos. La búsqueda filtra
// en el propio módulo (RF-10) y el selector oculta el módulo NSFW (RF-35).
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/discover.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
// F48: portadas del sitio falso (`test-site`) servidas en local; el resto de hosts externos sigue abortado (RNF-5).
const FAKE_COVER_HOSTS = new Set(["sitio-html.test", "api-json.test"]);
const FAKE_COVER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="#263147"/></svg>';
const output = path.resolve(__dirname, "../../../../docs/capturasF15");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 1400 } });
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
        if (FAKE_COVER_HOSTS.has(url.host) && /^\/img\/.+\.svg$/.test(url.pathname)) {
          return route.fulfill({ status: 200, contentType: "image/svg+xml", body: FAKE_COVER_SVG });
        }
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(`${baseURL}/discover`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });

      // El runtime trae las series del sitio falso (no fixtures escritas a mano).
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });
      await page.getByText("Más recientes").waitFor({ state: "visible" });
      await page.getByText("Populares").waitFor({ state: "visible" });
      await page.getByText("Explorar catálogo").waitFor({ state: "visible" });

      // F48: las portadas del sitio falso se ven (no solo «sin errores»).
      await page.waitForFunction(
        () => {
          const covers = [...document.images].filter((img) => img.src.includes("sitio-html.test"));
          return covers.length > 0 && covers.every((img) => img.complete && img.naturalWidth > 0);
        },
        undefined,
        { timeout: 10000 },
      );

      // El selector muestra el módulo activo; B (NSFW) no está visible (RF-35).
      await page.getByRole("button", { name: "Cambiar de módulo" }).waitFor({ state: "visible" });
      assert.equal(await page.getByText("Módulo de ejemplo B").count(), 0);

      // F84: scroll infinito del catálogo; al agotarse sale el aviso de fin de lista.
      await page
        .getByTestId("discover-more-idle")
        .or(page.getByTestId("discover-more-end"))
        .waitFor({ state: "attached" });
      const scrollToEnd = () =>
        page.evaluate(() => {
          for (const el of document.querySelectorAll("div")) {
            if (
              el.scrollHeight > el.clientHeight + 50 &&
              getComputedStyle(el).overflowY !== "visible"
            ) {
              el.scrollTop = el.scrollHeight;
            }
          }
        });
      for (let i = 0; i < 6 && (await page.getByTestId("discover-more-end").count()) === 0; i++) {
        await scrollToEnd();
        await page.waitForTimeout(400);
      }
      await page.getByTestId("discover-more-end").waitFor({ state: "attached" });
      assert.equal(await page.getByRole("button", { name: "Siguiente" }).count(), 0);

      // Búsqueda dentro del módulo (RF-10).
      await page.getByPlaceholder("Buscar obras…").fill("quimera");
      await page.keyboard.press("Enter");
      await page.getByText("Buscó por todas partes").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Explorar de nuevo" }).click();
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await fs.mkdir(output, { recursive: true });
      if (width === 426) {
        await page.screenshot({ path: path.join(output, "descubrir-426.png"), fullPage: true });
      }
      if (width === 1440) {
        await page.screenshot({ path: path.join(output, "descubrir-1440.png"), fullPage: true });
      }
      await context.close();
    }
    console.log("discover e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
