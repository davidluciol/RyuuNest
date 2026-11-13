// F25 — Descubrir web de punta a punta con un módulo `script` real ejecutado
// en el Web Worker: repo falso servido por intercepción de red (con CORS),
// instalación con confirmación reforzada, y búsqueda que cruza worker → host
// (RPC) → fetch real interceptado. Sin errores de consola ni dominios
// externos fuera de los interceptados.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/discover.cjs
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");
const { zipSync, strToU8 } = require("fflate");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";

const MODULE_JS = `
export default function create(host) {
  return {
    search: async (query, page) => {
      const response = await host.fetch("https://sitio.test/api/search?q=" + encodeURIComponent(query) + "&p=" + page);
      const data = JSON.parse(await response.text());
      return { items: data.items, hasNext: false };
    },
    popular: async () => ({ items: [{ id: "pop-1", title: "Popular de prueba", kind: "manga" }], hasNext: false }),
    latest: async () => ({ items: [{ id: "lat-1", title: "Lo último", kind: "manhwa" }], hasNext: false }),
    details: async (id) => ({ id, title: "Serie " + id, genres: ["Aventura"], status: "ongoing", altTitles: [], extra: {}, chapters: [{ id: "ch-1", title: "Cap. 1", number: 1, releases: [{ id: "r-1", group: "Oficial" }] }] }),
    pages: async () => ({ images: [{ url: "https://sitio.test/img/1.png" }] }),
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
  capabilities: ["search", "popular", "latest"],
  permissions: { domains: ["sitio.test"] },
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
};

function corsJson(body) {
  return {
    status: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
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
        id: "demo",
        name: "Demo",
        version: "1.0.0",
        apiVersion: 1,
        runtime: "script",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
        permissions: { domains: ["sitio.test"] },
        package: "packages/demo.zip",
        sha256,
        size: zip.length,
      },
    ],
  };

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [1440, 426]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await installFakeExtension(context);
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
        if (url.host === "repo.test" && url.pathname === "/index.json") {
          return route.fulfill(corsJson(index));
        }
        if (url.host === "repo.test" && url.pathname === "/packages/demo.zip") {
          return route.fulfill({
            status: 200,
            headers: { "content-type": "application/zip", "access-control-allow-origin": "*" },
            body: Buffer.from(zip),
          });
        }
        if (url.host === "sitio.test" && url.pathname === "/api/search") {
          return route.fulfill(
            corsJson({
              items: [
                { id: "s-dragon", title: "Dragón de prueba", kind: "manga", hint: "4 capítulos" },
              ],
            }),
          );
        }
        // Se permite el repo oficial (GitHub raw) para que la primera carga
        // añada el repo por defecto (P-85); el resto de dominios se abortan.
        if (
          ["http:", "https:"].includes(url.protocol) &&
          url.host !== new URL(baseURL).host &&
          url.host !== "repo.test" &&
          url.host !== "sitio.test" &&
          url.host !== "raw.githubusercontent.com"
        ) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      // 1) Fuentes: añadir el repo demo e instalar el módulo (script → mantener pulsado).
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
        () =>
          document
            .querySelector('[data-testid="module-action-demo"]')
            ?.textContent?.includes("Gestionar"),
        { timeout: 30000 },
      );

      // 2) Descubrir: el módulo instalado aparece y responde en el worker.
      await page.goto(`${baseURL}/discover`);
      await page.getByTestId("screen-discover").waitFor({ state: "visible" });
      await page.getByTestId("discover-module-demo").waitFor({ state: "visible" });
      // popular/latest (secciones del módulo)
      await page.getByText("Popular de prueba").waitFor({ state: "visible" });
      // búsqueda: search() del worker llama a host.fetch vía RPC
      await page.getByTestId("discover-search").fill("dragon");
      await page.getByTestId("discover-search-submit").click();
      await page.getByTestId("discover-entry-s-dragon").waitFor({ state: "visible" });
      await page.getByText("Dragón de prueba").waitFor({ state: "visible" });

      // 3) P-126: «Guardar» en la ficha crea la serie y la Biblioteca la lista, también tras recargar.
      await page.getByTestId("discover-entry-s-dragon").click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByTestId("series-favorite").click();
      await page.getByRole("button", { name: "Guardada" }).waitFor({ state: "visible" });
      await page.goto(`${baseURL}/library`);
      await page.getByTestId("library-card-s-dragon").waitFor({ state: "visible" });
      await page.reload();
      await page.getByTestId("library-card-s-dragon").waitFor({ state: "visible" });

      // 4) QAw1: buscarla en Biblioteca, abrirla y volver a ver su ficha completa.
      await page.getByTestId("library-search").fill("dragon");
      await page.getByTestId("library-card-s-dragon").waitFor({ state: "visible" });
      await page.getByTestId("library-search").fill("zzz");
      await page.getByTestId("library-card-s-dragon").waitFor({ state: "detached" });
      await page.getByTestId("library-search").fill("dragon");
      await page.getByTestId("library-card-s-dragon").click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByText("Serie s-dragon").first().waitFor({ state: "visible" });
      await page.getByTestId("series-chapter-ch-1").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Guardada" }).waitFor({ state: "visible" });

      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(
        external,
        [],
        `peticiones externas no interceptadas a ${width} px: ${external}`,
      );
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
