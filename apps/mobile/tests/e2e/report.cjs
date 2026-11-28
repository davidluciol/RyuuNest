// F103 — hoja «Mandar reporte» en la galería (Expo web), a 426 y 1440 px:
// se abre desde el aviso de error, enseña el texto ya limpio, los dos canales
// con su aviso (GitHub prioritario, correo más lento), adjunta el registro solo
// al marcarlo y muestra el fallo si no se puede abrir la app. Sin desbordes,
// áreas ≥48, consola limpia y cero peticiones externas (RNF-5).
// Ejecutar con Metro sirviendo la web:
//   GALLERY_URL=http://127.0.0.1:8082 node apps/mobile/tests/e2e/report.cjs
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://127.0.0.1:8082";
const shots = process.env.SHOTS_DIR || path.resolve(__dirname, "../../../../docs/capturasF103");

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
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (/^https?:$/.test(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
          external.push(url.href);
        }
      });

      await page.goto(`${baseURL}/_dev/gallery`, { waitUntil: "networkidle", timeout: 240000 });

      // Desde el aviso de error de la galería.
      const report = page.getByRole("button", { name: "Mandar reporte" }).first();
      await report.scrollIntoViewIfNeeded();
      await report.click();
      const sheet = page.getByTestId("sheet-report");
      await sheet.waitFor({ state: "visible" });

      const preview = page.getByTestId("report-preview");
      const text = await preview.innerText();
      assert.match(text, /\[fp:[0-9a-f]{12}\] TIMEOUT en m-ejemplo 0\.2/);
      assert.ok(text.includes("[url]"), "la URL del sitio sale tachada");
      assert.ok(!text.includes("sitio-falso.test"), "sin dominio del sitio");
      assert.ok(!text.includes("Registro"), "el registro no va sin marcarlo");

      await page.getByText("La atención será prioritaria", { exact: false }).waitFor();
      await page.getByText("Será más lenta, pero lo atenderemos", { exact: false }).waitFor();

      await page.getByTestId("report-details").fill("Se quedó cargando en el capítulo 3");
      await page.getByRole("checkbox").last().click();
      const withLog = await preview.innerText();
      assert.ok(withLog.includes("Se quedó cargando en el capítulo 3"));
      assert.ok(withLog.includes("Registro (últimas entradas)"));

      for (const id of ["report-send-github", "report-send-email"]) {
        const box = await page.getByTestId(id).boundingBox();
        assert.ok(box && box.height >= 48 && box.width >= 48, `${id} ≥ 48`);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      assert.equal(overflow, 0, "sin desborde horizontal");
      await page.screenshot({ path: path.join(shots, `report-${width}.png`) });

      await page.getByTestId("report-send-email").click();
      await page.getByTestId("report-send-failed").waitFor({ state: "visible" });

      assert.deepEqual(errors, [], "consola limpia");
      assert.deepEqual(external, [], "cero peticiones externas");
      console.log(`OK ${width} px`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
