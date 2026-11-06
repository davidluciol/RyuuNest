// F34.3 — ancho más estrecho de referencia (273 px) en el export web de la app móvil:
//  - las etiquetas de la barra inferior no se solapan ni se salen de la pantalla;
//  - ningún título de tarjeta de Biblioteca queda recortado (T7: sin «…»);
//  - sin desborde horizontal, sin errores de consola ni peticiones externas.
// Corre contra el export servido: node apps/mobile/tests/e2e/serve.cjs (8082)
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [273, 426]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
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
      await page.goto(`${baseURL}/library`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });
      await page.waitForTimeout(300);

      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const labels = [...document.querySelectorAll('[data-testid="nav-label"]')].map((el) => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent, left: r.left, right: r.right };
        });
        const overlaps = [];
        labels.forEach((a, i) => {
          if (a.left < -0.5 || a.right > vw + 0.5) overlaps.push(`${a.text} fuera de pantalla`);
          const b = labels[i + 1];
          if (b && a.right > b.left + 0.5) overlaps.push(`${a.text} solapa con ${b.text}`);
        });
        // Título recortado: el contenido mide más que la caja (line-clamp).
        const clipped = [
          ...document.querySelectorAll("[data-testid='screen-library'] div[dir='auto']"),
        ]
          .filter(
            (el) =>
              el.scrollHeight > el.clientHeight + 1 &&
              getComputedStyle(el).webkitLineClamp !== "none",
          )
          .map((el) => (el.textContent || "").trim());
        return {
          labelCount: labels.length,
          overlaps,
          clipped,
          overflow: document.documentElement.scrollWidth - vw,
        };
      });
      assert.equal(result.labelCount, 5, `etiquetas de la barra @${width}`);
      assert.deepEqual(
        result.overlaps,
        [],
        `barra inferior @${width}: ${result.overlaps.join("; ")}`,
      );
      assert.deepEqual(
        result.clipped,
        [],
        `títulos recortados @${width}: ${result.clipped.join(" | ")}`,
      );
      assert.ok(result.overflow <= 0, `desborde horizontal de ${result.overflow}px @${width}`);
      assert.deepEqual(errors, [], `errores de consola @${width}: ${errors.join(" | ")}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      console.log(`narrow @${width}: barra y títulos OK`);
      await context.close();
    }
    console.log("narrow273 e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
