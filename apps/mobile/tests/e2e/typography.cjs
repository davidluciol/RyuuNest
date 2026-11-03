// F34.1 — ningún texto visible cae a una fuente no registrada: «Inter» y
// «Manrope» en bruto no existen como familias (web → serif, dispositivo →
// fuente del sistema); lo registrado son los archivos empaquetados
// («Inter-Regular», «Manrope-Bold»…). Recorre la galería y las pantallas a
// 426 y 1440 px y falla con el texto y la familia de cada infractor.
// Corre contra Metro: node apps/mobile/tests/e2e/typography.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://localhost:8081";
const routes = ["/_dev/gallery", "/", "/library", "/discover", "/sources", "/settings", "/diagnostics"];

function unregisteredTexts() {
  const registered = new Set(
    [...document.fonts].map((face) => face.family.replace(/^["']|["']$/g, "")),
  );
  const offenders = [];
  for (const element of document.querySelectorAll("body *")) {
    const own = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ")
      .trim();
    if (!own) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const family = style.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (!registered.has(family)) offenders.push({ text: own.slice(0, 40), family });
  }
  return offenders;
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const failures = [];
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      for (const route of routes) {
        await page.goto(`${baseURL}${route}`, { timeout: 120000, waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          () => [...document.fonts].length > 0 && document.fonts.status === "loaded",
          undefined,
          { timeout: 120000 },
        );
        await page.waitForTimeout(1500);
        const offenders = await page.evaluate(unregisteredTexts);
        for (const offender of offenders) failures.push({ route, width, ...offender });
      }
      await context.close();
    }
    assert.deepEqual(failures, [], "textos con una fuente no registrada");
    console.log("typography e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
