// F25 — lector web de punta a punta: con el módulo demo instalado (ver
// discover.cjs), abrir /reader/demo/s-1/ch-1 muestra las páginas del capítulo
// en vertical (las imágenes salen de sitio.test interceptado), el indicador
// avanza al hacer scroll, el progreso se guarda con retraso y al recargar
// reabre en la página exacta (RF-20); al llegar al final aparece la tarjeta
// del siguiente capítulo. Una imagen rota muestra su reintento (RF-23).
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/reader.cjs
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { zipSync, strToU8 } = require("fflate");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
// Imagen de prueba 100×100 (SVG): cada página ocupa ~ancho de columna, así el
// scroll y el IntersectionObserver son deterministas.
const PAGE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#1B2230"/></svg>',
);

const MODULE_JS = `
export default function create(host) {
  return {
    search: async () => ({ items: [], hasNext: false }),
    details: async (id) => ({
      id, title: "Dragón de prueba", genres: [], status: "ongoing", altTitles: [], extra: {},
      chapters: [
        { id: "ch-2", title: "Cap. 2", number: 2, releases: [{ id: "r-1", group: "Oficial" }] },
        { id: "ch-1", title: "Cap. 1", number: 1, releases: [{ id: "r-1", group: "Oficial" }] },
      ],
    }),
    pages: async (chapterId) => ({
      images: [1, 2, 3].map((n) => ({ url: "https://sitio.test/img/" + chapterId + "-" + n + ".png" })),
    }),
  };
}
`;

const MANIFEST = {
  id: "demo",
  name: "Demo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  entry: "module.js",
  baseUrl: "https://sitio.test/",
  capabilities: ["search"],
  permissions: { domains: ["sitio.test"] },
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
};

function cors(body, contentType, extra = {}) {
  return {
    status: 200,
    headers: { "content-type": contentType, "access-control-allow-origin": "*", ...extra },
    body,
  };
}

async function installDemo(page, index, zip) {
  await page.goto(`${baseURL}/sources`);
  await page.getByTestId("screen-sources").waitFor({ state: "visible" });
  await page.getByTestId("sources-add-repo").click();
  await page.getByTestId("add-repo-url").fill("https://repo.test/index.json");
  await page.getByTestId("add-repo-submit").click();
  await page.getByTestId("module-demo").waitFor({ state: "visible" });
  await page.getByTestId("module-action-demo").click();
  await page.getByTestId("install-dialog").waitFor({ state: "visible" });
  const confirm = page.getByTestId("install-confirm");
  const box = await confirm.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1700);
  await page.mouse.up();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="module-action-demo"]')?.textContent?.includes("Gestionar"),
    { timeout: 30000 },
  );
}

(async () => {
  const zip = zipSync({
    "manifest.json": strToU8(JSON.stringify(MANIFEST)),
    "module.js": strToU8(MODULE_JS),
  });
  const sha256 = crypto.createHash("sha256").update(zip).digest("hex");
  const index = {
    format: "ryuunest-repo",
    version: 1,
    name: "Repo demo",
    updatedAt: "2026-11-01T00:00:00.000Z",
    modules: [
      {
        id: "demo", name: "Demo", version: "1.0.0", apiVersion: 1, runtime: "script",
        kinds: ["manga"], lang: "es", nsfw: false,
        permissions: { domains: ["sitio.test"] },
        package: "packages/demo.zip", sha256, size: zip.length,
      },
    ],
  };

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of (process.env.WIDTHS || "1440,426").split(",").map(Number)) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        // Los «Failed to load resource» son la imagen rota deliberada (RF-23).
        if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
          errors.push(message.text());
        }
      });
      let breakSecondImage = false;
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.host === "repo.test" && url.pathname === "/index.json") return route.fulfill(cors(JSON.stringify(index), "application/json"));
        if (url.host === "repo.test" && url.pathname === "/packages/demo.zip") {
          return route.fulfill({ status: 200, headers: { "content-type": "application/zip", "access-control-allow-origin": "*" }, body: Buffer.from(zip) });
        }
        if (url.host === "sitio.test" && url.pathname.startsWith("/img/")) {
          if (breakSecondImage && url.pathname.endsWith("-2.png")) return route.abort();
          return route.fulfill(cors(PAGE_SVG, "image/svg+xml"));
        }
        if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "repo.test", "sitio.test", "raw.githubusercontent.com"].includes(url.host === new URL(baseURL).host ? "127.0.0.1" : url.host)) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await installDemo(page, index, zip);

      // La página 2 (índice 1) falla desde el principio: reintento individual (RF-23).
      breakSecondImage = true;

      // Abrir el capítulo 1 directamente (modo vertical por defecto).
      await page.goto(`${baseURL}/reader/demo/s-1/ch-1`);
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.getByTestId("reader-vertical").waitFor({ state: "visible" });
      await page.getByTestId("reader-image-0").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="reader-indicator"]')?.textContent?.includes("1 / 3"),
        { timeout: 15000 },
      );

      // Modo paginado (determinista para avanzar página a página).
      await page.getByTestId("reader-mode").click();
      await page.getByTestId("reader-paged").waitFor({ state: "visible" });

      // Avanzar a la página 2: la imagen está rota → reintento individual (RF-23).
      await page.locator(".reader-zone-right").click();
      await page.getByTestId("reader-image-error-1").waitFor({ state: "visible" });
      breakSecondImage = false;
      await page.getByTestId("reader-image-retry-1").click();
      await page.getByTestId("reader-image-1").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="reader-indicator"]')?.textContent?.includes("2 / 3"),
        { timeout: 15000 },
      );

      // Espera el guardado diferido (800 ms) y recarga: reabre en la página exacta (RF-20).
      await page.waitForTimeout(1500);
      await page.reload();
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="reader-indicator"]')?.textContent?.includes("2 / 3"),
        { timeout: 15000 },
      );

      // Avanzar a la última página (el modo paginado ya persistió): tarjeta de siguiente capítulo (RF-21).
      await page.locator(".reader-zone-right").click();
      await page.waitForFunction(
        () => document.querySelector('[data-testid="reader-indicator"]')?.textContent?.includes("3 / 3"),
        { timeout: 15000 },
      );
      await page.getByTestId("reader-endcard").waitFor({ state: "visible" });
      await page.getByTestId("reader-next-chapter").click();
      await page.waitForFunction(() => location.pathname.endsWith("/reader/demo/s-1/ch-2"), { timeout: 15000 });
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });

      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(external, [], `peticiones externas no interceptadas a ${width} px: ${external}`);
      await context.close();
      console.log(`OK ${width} px`);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
