// F27 — AC-10 de punta a punta con TODO REAL: la web construida (WEB_URL, por defecto
// http://localhost:4173, un origen que la extensión acepta), la extensión REAL cargada en
// Chromium y un servidor HTTPS local que hace de repo y de sitio. Se lee un capítulo desde
// el navegador y se comprueba que las peticiones salen por la extensión:
//
//   · la página nunca habla con el servidor (todas las peticiones salen del fondo de la extensión);
//   · el repo y el .zip llegan íntegros (el instalador verifica el SHA-256: base64 exacto);
//   · el módulo `script` corre en un Web Worker y su host.fetch cruza worker → hilo principal → extensión;
//   · las imágenes del capítulo exigen `Referer` (403 si falta) y se piden con cabeceras por la
//     extensión (declarativeNetRequest): se ven en el lector;
//   · sin autorización no hay petición: al primer uso, raw.githubusercontent.com (repo oficial) sale
//     como dominio por autorizar y «Abrir extensión» abre la página de opciones de la extensión.
//
// Un permiso opcional no se puede conceder sin un clic humano: el e2e concede de antemano
// solo 127.0.0.1 en una COPIA de la extensión (ver harness.cjs). El servidor HTTPS usa un
// certificado autofirmado generado al vuelo con `openssl` (nada se guarda en el repo).
//
// Requiere: `pnpm --filter @ryuunest/extension build`, `pnpm --filter @ryuunest/web build` y
// la web servida (`pnpm --filter @ryuunest/web preview`). PLAYWRIGHT_MODULE → paquete playwright.
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");

const { zipSync, strToU8 } = require("fflate");

const { setup } = require("../../../extension/tests/e2e/harness.cjs");

const WEB = process.env.WEB_URL || "http://localhost:4173";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function selfSignedCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ryuunest-cert-"));
  const key = path.join(dir, "key.pem");
  const cert = path.join(dir, "cert.pem");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "1",
      "-subj",
      "/CN=127.0.0.1",
      "-addext",
      "subjectAltName=IP:127.0.0.1",
    ],
    { stdio: "pipe" },
  );
  const material = { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
  fs.rmSync(dir, { recursive: true, force: true });
  return material;
}

/** Repo + sitio en un servidor HTTPS; anota lo que recibe para las aserciones. */
function startSite() {
  const hits = {};
  const forbiddenImages = [];
  const imageReferers = [];
  const cookies = [];
  let port = 0;
  let zip;
  let index;

  const siteReferer = () => `https://127.0.0.1:${port}/site/`;

  const server = https.createServer(selfSignedCert(), (req, res) => {
    const url = new URL(req.url, "https://x");
    hits[url.pathname] = (hits[url.pathname] || 0) + 1;
    if (req.headers.cookie) cookies.push(req.headers.cookie);
    const json = (body) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === "/repo/index.json") return json(index);
    if (url.pathname === "/repo/packages/demo.zip") {
      res.writeHead(200, { "content-type": "application/zip" });
      return res.end(Buffer.from(zip));
    }
    if (url.pathname === "/site/api/search") {
      return json({
        items: [{ id: "s-1", title: "Dragón de prueba", kind: "manga", hint: "1 capítulo" }],
      });
    }
    if (url.pathname === "/site/api/series/s-1") {
      return json({
        id: "s-1",
        title: "Dragón de prueba",
        genres: [],
        status: "ongoing",
        altTitles: [],
        extra: {},
        chapters: [
          { id: "ch-1", title: "Cap. 1", number: 1, releases: [{ id: "r-1", group: "Oficial" }] },
        ],
      });
    }
    if (url.pathname === "/site/api/chapter/ch-1/pages") {
      return json({
        images: [1, 2, 3].map((n) => ({
          url: `https://127.0.0.1:${port}/site/img/${n}.png`,
          // Sin este Referer el sitio responde 403: solo la extensión puede ponerlo.
          headers: { Referer: siteReferer() },
        })),
      });
    }
    if (url.pathname.startsWith("/site/img/")) {
      imageReferers.push(req.headers.referer ?? null);
      if (req.headers.referer !== siteReferer()) {
        forbiddenImages.push(url.pathname);
        res.writeHead(403, { "content-type": "text/plain" });
        return res.end("hotlink");
      }
      res.writeHead(200, { "content-type": "image/png" });
      return res.end(PNG);
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("no está");
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      const base = `https://127.0.0.1:${port}`;

      const moduleJs = `
export default function create(host) {
  const get = async (path) => JSON.parse(await (await host.fetch("${base}/site" + path)).text());
  return {
    search: async (query, page) => ({
      items: (await get("/api/search?q=" + encodeURIComponent(query) + "&p=" + page)).items,
      hasNext: false,
    }),
    popular: async () => ({ items: [], hasNext: false }),
    latest: async () => ({ items: [], hasNext: false }),
    details: async (id) => get("/api/series/" + id),
    pages: async (chapterId) => get("/api/chapter/" + chapterId + "/pages"),
  };
}
`;
      const manifest = {
        id: "demo",
        name: "Demo",
        version: "1.0.0",
        apiVersion: 1,
        runtime: "script",
        entry: "module.js",
        baseUrl: `${base}/site/`,
        capabilities: ["search", "popular", "latest"],
        permissions: { domains: ["127.0.0.1"] },
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
      };
      zip = zipSync({
        "manifest.json": strToU8(JSON.stringify(manifest)),
        "module.js": strToU8(moduleJs),
      });
      index = {
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
            permissions: { domains: ["127.0.0.1"] },
            package: "packages/demo.zip",
            sha256: crypto.createHash("sha256").update(zip).digest("hex"),
            size: zip.length,
          },
        ],
      };
      resolve({ server, base, hits, forbiddenImages, imageReferers, cookies });
    });
  });
}

(async () => {
  const site = await startSite();
  const env = await setup({
    grantHosts: ["*://127.0.0.1/*"],
    stubApp: false,
    extraArgs: ["--ignore-certificate-errors"],
  });
  try {
    const page = await env.context.newPage();
    page.setDefaultTimeout(30000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const errors = [];
    const pageToSite = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (new URL(request.url()).hostname === "127.0.0.1") pageToSite.push(request.url());
    });

    // 1) Primer uso: el repo oficial (GitHub raw) no está autorizado → aviso con el dominio.
    await page.goto(`${WEB}/sources`);
    await page.getByTestId("screen-sources").waitFor({ state: "visible" });
    const notice = page.getByTestId("extension-notice");
    await notice.waitFor({ state: "visible" });
    assert.match(await notice.innerText(), /Autoriza «raw\.githubusercontent\.com»/);

    // «Abrir extensión» abre las opciones REALES de la extensión, que lista ese dominio.
    const opened = env.context.waitForEvent("page", { timeout: 15000 });
    await page.getByTestId("extension-notice-action").click();
    const options = await opened;
    await options.waitForLoadState();
    assert.ok(
      options.url().startsWith(`chrome-extension://${env.extensionId}/options.html`),
      options.url(),
    );
    await options.getByTestId("domain-row-pending-raw.githubusercontent.com").waitFor();
    await options.close();
    await page.bringToFront();
    await page.getByTestId("extension-notice-close").click();

    // 2) Añadir el repo (HTTPS local) e instalar el módulo `script` (mantener pulsado, AC-8).
    // Sin repos (el oficial no se pudo añadir) Fuentes muestra el estado vacío y su única acción.
    await page
      .getByTestId("sources-empty")
      .getByRole("button", { name: "Añadir repositorio" })
      .click();
    await page.getByTestId("add-repo-url").fill(`${site.base}/repo/index.json`);
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

    // 3) Descubrir: la búsqueda cruza worker → hilo principal → extensión → sitio.
    await page.goto(`${WEB}/discover`);
    await page.getByTestId("discover-module-demo").waitFor({ state: "visible" });
    await page.getByTestId("discover-search").fill("dragon");
    await page.getByTestId("discover-search-submit").click();
    await page.getByTestId("discover-entry-s-1").waitFor({ state: "visible" });

    // 4) AC-10: se lee un capítulo desde el navegador. Las imágenes exigen Referer.
    await page.goto(`${WEB}/reader/demo/s-1/ch-1`);
    await page.getByTestId("screen-reader").waitFor({ state: "visible" });
    await page.getByTestId("reader-image-0").waitFor({ state: "visible" });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="reader-indicator"]')?.textContent?.includes("1 / 3"),
      { timeout: 20000 },
    );
    const naturalWidth = await page.$eval(
      "[data-testid='reader-image-0']",
      (img) => img.naturalWidth,
    );
    assert.ok(naturalWidth > 0, "la imagen del capítulo se decodificó");
    await page.screenshot({
      path: path.resolve(__dirname, "../../../../docs/capturasF27/lector-con-extension.png"),
    });

    // --- Las peticiones salieron por la extensión ---
    assert.deepEqual(
      pageToSite,
      [],
      `la página habló directo con el sitio: ${pageToSite.join(", ")}`,
    );
    for (const route of [
      "/repo/index.json",
      "/repo/packages/demo.zip",
      "/site/api/search",
      "/site/api/series/s-1",
      "/site/api/chapter/ch-1/pages",
      "/site/img/1.png",
    ]) {
      assert.ok(
        (site.hits[route] || 0) >= 1,
        `el servidor no recibió ${route}: ${JSON.stringify(site.hits)}`,
      );
    }
    // El Referer exigido llegó en todas las imágenes (declarativeNetRequest) y nunca hubo 403.
    assert.deepEqual(site.forbiddenImages, [], "alguna imagen llegó sin el Referer exigido");
    assert.ok(site.imageReferers.length >= 1);
    assert.deepEqual(site.cookies, [], "la extensión no debe enviar cookies");

    assert.deepEqual(errors, [], `errores de consola: ${errors.join(" | ")}`);
    console.log("bridge e2e OK (AC-10)");
  } finally {
    await env.cleanup();
    site.server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
