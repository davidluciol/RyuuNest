// F97 — Aventuras: una serie con la etiqueta «Seinen» (o hentai/josei) lleva el borde naranja de
// F94 y la insignia «18+» (no solo color); las demás no. En la galería, contra Metro (8081).
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.GALLERY_URL || "http://localhost:8081";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000 });
      const card = page.getByRole("button", { name: /Sombras de Arcano, contenido para adultos/ }).first();
      await card.waitFor({ state: "attached", timeout: 60000 });
      await card.scrollIntoViewIfNeeded();
      const border = await card.evaluate((el) => {
        const cover = el.querySelector('[data-testid="library-card-nsfw"]').parentElement;
        const style = getComputedStyle(cover);
        return { color: style.borderTopColor, width: style.borderTopWidth };
      });
      assert.deepEqual(border, { color: "rgb(255, 107, 26)", width: "2px" }, `borde naranja @${width}`);
      const normal = page.getByRole("button", { name: "La forja perdida", exact: true }).first();
      await normal.waitFor({ state: "attached" });
      assert.equal(await normal.locator('[data-testid="library-card-nsfw"]').count(), 0, `sin insignia @${width}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `sin overflow @${width}`,
      );
      assert.deepEqual(errors, [], `sin errores de consola @${width}`);
      await page.close();
    }
    console.log("discoverNsfw e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
