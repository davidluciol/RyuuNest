// QAw3 — intercalar entre servidores: dos módulos instalados y cambio de fuente en Descubrir.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/qaw3.cjs
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");
const { zipSync, strToU8 } = require("fflate");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";

/** Módulo mínimo: todo su contenido lleva el prefijo de su id, para detectar mezclas. */
function moduleJs(prefix) {
  return `
export default function create() {
  const item = (id, title) => ({ id: "${prefix}-" + id, title, kind: "manga" });
  return {
    search: async () => ({ items: [item("cat", "Catálogo ${prefix}")], hasNext: false }),
    popular: async () => ({ items: [item("pop", "Popular ${prefix}")], hasNext: false }),
    latest: async () => ({ items: [item("lat", "Último ${prefix}")], hasNext: false }),
    details: async () => { throw new Error("no usado"); },
    pages: async () => { throw new Error("no usado"); },
  };
}
`;
}

const manifestOf = (id, name) => ({
  id,
  name,
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
});

function zipOf(id, name) {
  const zip = zipSync({
    "manifest.json": strToU8(JSON.stringify(manifestOf(id, name))),
    "module.js": strToU8(moduleJs(id)),
  });
  return { zip, sha256: crypto.createHash("sha256").update(zip).digest("hex") };
}

async function installModule(page, id) {
  await page.getByTestId(`module-${id}`).waitFor({ state: "visible" });
  await page.getByTestId(`module-action-${id}`).click();
  await page.getByTestId("install-dialog").waitFor({ state: "visible" });
  const box = await page.getByTestId("install-confirm").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1700);
  await page.mouse.up();
  await page.waitForFunction(
    (moduleId) =>
      document
        .querySelector(`[data-testid="module-action-${moduleId}"]`)
        ?.textContent?.includes("Gestionar"),
    id,
    { timeout: 30000 },
  );
}

(async () => {
  const packages = { uno: zipOf("uno", "Módulo uno"), dos: zipOf("dos", "Módulo dos") };
  const index = {
    format: "ryuunest-repo",
    version: 1,
    name: "Repo QAw3",
    updatedAt: "2026-11-01T00:00:00.000Z",
    modules: Object.entries(packages).map(([id, { zip, sha256 }]) => ({
      id,
      name: id === "uno" ? "Módulo uno" : "Módulo dos",
      version: "1.0.0",
      apiVersion: 1,
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
      permissions: { domains: ["sitio.test"] },
      package: `packages/${id}.zip`,
      sha256,
      size: zip.length,
    })),
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
        const cors = { "access-control-allow-origin": "*" };
        if (url.host === "repo.test" && url.pathname === "/index.json") {
          return route.fulfill({
            status: 200,
            headers: { ...cors, "content-type": "application/json" },
            body: JSON.stringify(index),
          });
        }
        const pkg = /^\/packages\/(uno|dos)\.zip$/.exec(url.pathname);
        if (url.host === "repo.test" && pkg) {
          return route.fulfill({
            status: 200,
            headers: { ...cors, "content-type": "application/zip" },
            body: Buffer.from(packages[pkg[1]].zip),
          });
        }
        if (
          ["http:", "https:"].includes(url.protocol) &&
          url.host !== new URL(baseURL).host &&
          url.host !== "repo.test" &&
          url.host !== "raw.githubusercontent.com"
        ) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      // 1) La aplicación abre en Inicio.
      await page.goto(baseURL);
      await page.getByTestId("screen-home").waitFor({ state: "visible" });

      // 2) Sin módulos: se instalan los 2 desde Fuentes.
      await page.goto(`${baseURL}/sources`);
      await page.getByTestId("screen-sources").waitFor({ state: "visible" });
      await page.getByTestId("sources-add-repo").click();
      await page.getByTestId("add-repo-url").fill("https://repo.test/index.json");
      await page.getByTestId("add-repo-submit").click();
      await installModule(page, "uno");
      await installModule(page, "dos");

      // 3) Descubrir carga por defecto un módulo (el que el registro lista primero).
      await page.goto(`${baseURL}/discover`);
      await page.getByTestId("screen-discover").waitFor({ state: "visible" });
      const popular = page.getByText(/^Popular (uno|dos)$/);
      await popular.waitFor({ state: "visible" });
      const first = (await popular.innerText()).endsWith("uno") ? "uno" : "dos";
      const second = first === "uno" ? "dos" : "uno";

      // 4) Cambiar de módulo con el selector: carga el 2.º y no queda nada del 1.º.
      await page.getByTestId(`discover-module-${second}`).click();
      await page.getByText(`Popular ${second}`).waitFor({ state: "visible" });
      await page.getByText(`Catálogo ${second}`).waitFor({ state: "visible" });
      assert.equal(
        await page.getByText(new RegExp(`^(Popular|Último|Catálogo) ${first}$`)).count(),
        0,
        "quedan series del módulo anterior",
      );
      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(external, [], `peticiones externas a ${width} px: ${external}`);

      // 5) Volver al 1.º tampoco mezcla.
      await page.getByTestId(`discover-module-${first}`).click();
      await page.getByText(`Popular ${first}`).waitFor({ state: "visible" });
      assert.equal(
        await page.getByText(new RegExp(`^(Popular|Último|Catálogo) ${second}$`)).count(),
        0,
        "quedan series del otro módulo",
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
