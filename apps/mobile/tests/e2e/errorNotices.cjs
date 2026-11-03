// F34.1 — banner y diálogo de error alineados con
// `banner_inline_de_error_y_toast_dragon_night` y
// `di_logo_de_error_bloqueante_dragon_night`:
//  - banner: icono de alerta, etiqueta de código en pastilla, «Reintentar» con
//    icono y «Ver detalle» plegable;
//  - diálogo: título, etiqueta de código, mensaje, «Ver detalle técnico»
//    plegable, «Cerrar» y un único primario («Reintentar»); sin X extra.
// Corre contra Metro: node apps/mobile/tests/e2e/errorNotices.cjs
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

      // Banner inline de la galería.
      const banner = page.getByRole("alert").filter({ has: page.getByTestId("error-code-chip") });
      await banner.first().waitFor({ state: "visible", timeout: 120000 });
      await banner.first().scrollIntoViewIfNeeded();
      assert.equal(await banner.count(), 1, `un banner en la galería @${width}`);
      assert.equal(
        (await banner.getByTestId("error-code-chip").innerText()).trim(),
        "NETWORK",
        `etiqueta de código del banner @${width}`,
      );
      const retry = banner.getByRole("button", { name: "Reintentar", exact: true });
      assert.equal(await retry.locator("svg").count(), 1, `«Reintentar» con icono @${width}`);
      assert.ok(
        (await banner.locator("svg").count()) >= 3,
        `icono de alerta, reintentar y flecha del detalle @${width}`,
      );
      await banner.getByRole("button", { name: "Ver detalle", exact: true }).click();
      await banner.getByText(/^URL: /).waitFor({ state: "visible" });
      await banner.screenshot({ path: path.join(output, `banner-${width}.png`) });

      // Diálogo de error.
      await page.getByTestId("gallery-show-error-dialog").click();
      const dialog = page.getByTestId("gallery-error-dialog");
      await dialog.waitFor({ state: "visible" });
      const chip = dialog.getByTestId("error-code-chip");
      assert.equal((await chip.innerText()).trim(), "INVALID", `código del diálogo @${width}`);
      const detail = dialog.getByRole("button", { name: "Ver detalle técnico", exact: true });
      await detail.waitFor({ state: "visible" });
      assert.equal(
        await dialog.getByRole("button", { name: "Reintentar", exact: true }).count(),
        1,
        `un solo primario @${width}`,
      );
      assert.equal(
        await dialog.getByRole("button", { name: "Cerrar", exact: true }).count(),
        1,
        `«Cerrar» sin una X extra @${width}`,
      );
      assert.equal(
        await dialog.getByRole("button").count(),
        3,
        `solo detalle, cerrar y reintentar @${width}`,
      );
      await detail.click();
      await dialog.getByText("código: INVALID").waitFor({ state: "visible" });
      await page.screenshot({ path: path.join(output, `dialogo-${width}.png`) });
      await dialog.getByText("Cerrar", { exact: true }).click();
      await dialog.waitFor({ state: "detached" });
      await context.close();
    }
    console.log("errorNotices e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
