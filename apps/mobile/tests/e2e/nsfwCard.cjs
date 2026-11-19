// F94 — tarjeta NSFW de Tesoros en la galería: borde naranja + insignia «18+» (no solo color).
// Contra Metro (`expo start --web --localhost --port 8081`); la galería es solo de desarrollo.
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
      const badge = page.getByTestId("library-card-nsfw").first();
      await badge.waitFor({ state: "visible", timeout: 60000 });
      assert.equal((await badge.innerText()).trim(), "18+", `insignia 18+ @${width}`);
      const nsfwCard = page.getByRole("button", { name: /Sombras de medianoche, contenido para adultos/ });
      await nsfwCard.scrollIntoViewIfNeeded();
      const border = await nsfwCard.evaluate((card) => {
        const cover = card.querySelector('[data-testid="library-card-nsfw"]').parentElement;
        const style = getComputedStyle(cover);
        return { color: style.borderTopColor, width: style.borderTopWidth };
      });
      assert.deepEqual(border, { color: "rgb(255, 107, 26)", width: "2px" }, `borde naranja @${width}`);
      const normal = await page
        .getByRole("button", { name: "El dragón de ceniza", exact: true })
        .first()
        .evaluate((card) => getComputedStyle(card.firstElementChild).borderTopColor);
      assert.notEqual(normal, "rgb(255, 107, 26)", `la tarjeta normal no cambia @${width}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `sin overflow @${width}`,
      );
      assert.deepEqual(errors, [], `sin errores de consola @${width}`);
      if (process.env.F94_SHOT) await page.screenshot({ path: `${process.env.F94_SHOT}-${width}.png` });
      await page.close();
    }
    console.log("nsfwCard e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
