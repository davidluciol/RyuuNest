// F34.1 — toast alineado con `banner_inline_de_error_y_toast_dragon_night`:
// punto de severidad, mensaje completo (sin tope de líneas ni «…»), acción
// opcional y cierre con icono, anunciado «Cerrar aviso» (no con el mensaje).
// Corre contra Metro: node apps/mobile/tests/e2e/toast.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://localhost:8081";
const output = path.resolve(__dirname, "../../../../docs/capturasF34");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    await fs.mkdir(output, { recursive: true });
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000, waitUntil: "domcontentloaded" });
      const toasts = page.getByRole("alert").filter({ has: page.getByTestId("toast-dot") });
      await toasts.first().waitFor({ state: "visible", timeout: 120000 });
      const count = await toasts.count();
      assert.ok(count >= 3, `muestras de toast @${width}: ${count}`);

      for (let index = 0; index < count; index += 1) {
        const toast = toasts.nth(index);
        assert.equal(await toast.getByTestId("toast-dot").count(), 1, `punto @${width} #${index}`);
        const close = toast.getByRole("button", { name: "Cerrar aviso", exact: true });
        assert.equal(await close.count(), 1, `cierre «Cerrar aviso» @${width} #${index}`);
        assert.equal(await close.locator("svg").count(), 1, `cierre con icono @${width} #${index}`);
        assert.equal(
          (await close.innerText()).trim(),
          "",
          `el cierre no usa un glifo de texto @${width} #${index}`,
        );
      }

      // T7: un mensaje largo se muestra completo, sin «…» (con acción y cierre solo quedan ~230 dp).
      const long = page.getByTestId("gallery-toast-long");
      await long.scrollIntoViewIfNeeded();
      const message = long.getByText(/^Se vació la caché/);
      const clipped = await message.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
      assert.equal(clipped, false, `mensaje largo recortado @${width}`);

      await long.screenshot({ path: path.join(output, `toast-${width}.png`) });
      await context.close();
    }
    console.log("toast e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
