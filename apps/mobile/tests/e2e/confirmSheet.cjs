// F34.2 — ConfirmSheet (`confirmar_accion_dragon_night`): hoja inferior en móvil (426 px) con las
// acciones apiladas y la acción primero; diálogo centrado en escritorio (1440 px) con «Cancelar» a
// la izquierda. La acción va en amarillo (`warning`), nunca en rojo.
// Corre contra Metro: node apps/mobile/tests/e2e/confirmSheet.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://localhost:8081";
const output = path.resolve(__dirname, "../../../../docs/capturasF34");
const WARNING = "rgb(245, 196, 81)";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    await fs.mkdir(output, { recursive: true });
    for (const [width, presentation] of [
      [426, "sheet"],
      [1440, "dialog"],
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000, waitUntil: "domcontentloaded" });
      await page.getByTestId("gallery-show-confirm").click();

      const confirm = page.getByTestId("gallery-confirm");
      await confirm.waitFor({ state: "visible" });
      const submit = confirm.getByTestId("gallery-confirm-submit");
      const cancel = confirm.getByTestId("gallery-confirm-cancel");
      await confirm.getByText("respaldo-2026-11-01.json").waitFor({ state: "visible" });

      // La acción es amarilla (texto y borde), sin relleno.
      const colors = await submit.evaluate((el) => {
        const style = getComputedStyle(el);
        return { border: style.borderTopColor, text: getComputedStyle(el.querySelector("div,span")).color };
      });
      assert.equal(colors.border, WARNING, `borde de la acción @${width}`);
      assert.equal(colors.text, WARNING, `texto de la acción @${width}`);

      const box = await confirm.boundingBox();
      const submitBox = await submit.boundingBox();
      const cancelBox = await cancel.boundingBox();
      assert.ok(box && submitBox && cancelBox, `cajas @${width}`);
      assert.ok(submitBox.height >= 48 && cancelBox.height >= 48, `áreas táctiles @${width}`);

      if (presentation === "sheet") {
        // Hoja: anclada abajo, ancho completo y acciones apiladas (acción arriba).
        assert.ok(Math.abs(box.x) <= 1 && Math.abs(box.width - width) <= 2, `hoja a ancho completo @${width}`);
        assert.ok(box.y + box.height >= 900 - 2, `hoja anclada abajo @${width}`);
        assert.ok(submitBox.y < cancelBox.y, `la acción va antes que «Cancelar» @${width}`);
        assert.ok(Math.abs(submitBox.x - cancelBox.x) <= 1, `acciones apiladas @${width}`);
      } else {
        // Diálogo: centrado, ancho máximo 480 y «Cancelar» a la izquierda de la acción.
        assert.ok(box.width <= 480 + 1, `ancho máximo del diálogo @${width}`);
        assert.ok(Math.abs(box.x + box.width / 2 - width / 2) <= 2, `diálogo centrado @${width}`);
        assert.ok(cancelBox.x < submitBox.x, `«Cancelar» antes que la acción @${width}`);
        assert.ok(Math.abs(cancelBox.y - submitBox.y) <= 1, `acciones en una fila @${width}`);
      }

      await page.screenshot({ path: path.join(output, `confirmacion-${width}.png`) });
      await cancel.click();
      await confirm.waitFor({ state: "detached" });
      await context.close();
    }
    console.log("confirmSheet e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
