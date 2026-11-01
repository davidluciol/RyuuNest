// F25 — Ajustes y Diagnóstico en la web servida por `vite preview`, sobre la
// base real (sql.js + IndexedDB):
//  - los interruptores y el modo de lectura persisten tras recargar (IDB);
//  - en web no hay bloqueo del dispositivo: la protección queda desactivada;
//  - exportar respaldo descarga un JSON `ryuunest-backup` real;
//  - importar un archivo inválido muestra el rechazo y deja entrada en `log`;
//  - /diagnostics lista ese evento, exporta el informe (txt/json), copia y
//    borra el registro con confirmación.
// Sin errores de consola ni peticiones a dominios externos.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/settings.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
const REPO_HOST = "raw.githubusercontent.com";
const output = path.resolve(__dirname, "../../../../docs/capturasF24");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [1440, 426]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        acceptDownloads: true,
        permissions: ["clipboard-read", "clipboard-write"],
      });
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
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host && url.host !== REPO_HOST) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(`${baseURL}/settings`);
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });
      await page.getByTestId("settings-nsfw").waitFor({ state: "visible" });

      // Web sin bloqueo del dispositivo: la protección queda desactivada (SPEC §5.3).
      assert.equal(await page.getByTestId("settings-protection").isDisabled(), true, "protección desactivada sin bloqueo");
      // Sin repos (perfil nuevo): se ofrece restaurar el oficial (P-85) y, al
      // pulsar, se registra de verdad (descarga del índice, CORS abierto).
      await page.getByTestId("settings-restore-official").click();
      await page.getByTestId("settings-restore-official").waitFor({ state: "detached", timeout: 30000 });

      // NSFW persiste tras recargar.
      await page.getByTestId("settings-nsfw").click();
      await page.reload();
      await page.getByTestId("settings-nsfw").waitFor({ state: "visible" });
      assert.equal(await page.getByTestId("settings-nsfw").isChecked(), true, "NSFW persistido");

      // Modo de lectura por defecto persiste tras recargar.
      await page.getByTestId("settings-mode-paged-rtl").click();
      await page.reload();
      await page.getByTestId("settings-mode-paged-rtl").waitFor({ state: "visible" });
      assert.equal(
        await page.getByTestId("settings-mode-paged-rtl").getAttribute("aria-pressed"),
        "true",
        "modo paged-rtl persistido",
      );

      // Vaciar caché no muestra aviso de error.
      await page.getByTestId("settings-clear-cache").click();
      await page.waitForTimeout(500);
      assert.equal(await page.getByTestId("settings-notice").count(), 0, "sin aviso tras vaciar caché");

      // Exportar respaldo: descarga un JSON real con el repo oficial dentro.
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByTestId("settings-backup-export").click(),
      ]);
      assert.match(download.suggestedFilename(), /^ryuunest-respaldo-.*\.json$/);
      const backupPath = path.join(os.tmpdir(), download.suggestedFilename());
      await download.saveAs(backupPath);
      const backup = JSON.parse(await fs.readFile(backupPath, "utf8"));
      assert.equal(backup.format, "ryuunest-backup");
      assert.ok(backup.repos.some((repo) => repo.url.includes("RyuuNest-Models")), "respaldo con repo oficial");
      await fs.unlink(backupPath);

      // Importar un archivo inválido: hoja de modo → rechazo NOT_JSON (diálogo)
      // y entrada en el registro `log` (F31).
      const badPath = path.join(os.tmpdir(), "respaldo-malo.json");
      await fs.writeFile(badPath, "esto no es un respaldo", "utf8");
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByTestId("settings-backup-import").click(),
      ]);
      await chooser.setFiles(badPath);
      await page.getByTestId("backup-mode-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-merge").click();
      await page.getByTestId("backup-error-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-error-close").click();
      await fs.unlink(badPath);

      // Diagnóstico: lista el evento del rechazo, exporta txt/json, copia y borra.
      await page.getByTestId("settings-diagnostics").click();
      await page.getByTestId("screen-diagnostics").waitFor({ state: "visible" });
      await page.getByTestId("diagnostics-list").waitFor({ state: "visible" });
      const event = page.locator('[data-testid^="diagnostics-event-"]').first();
      await event.waitFor({ state: "visible" });
      const eventId = (await event.getAttribute("data-testid")).replace("diagnostics-event-", "");
      await event.click();
      await page.getByTestId(`diagnostics-detail-${eventId}`).waitFor({ state: "visible" });

      const [reportTxt] = await Promise.all([
        page.waitForEvent("download"),
        page.getByTestId("diagnostics-export").click(),
      ]);
      assert.match(reportTxt.suggestedFilename(), /^ryuunest-diagnostico-.*\.txt$/);
      const reportPath = path.join(os.tmpdir(), reportTxt.suggestedFilename());
      await reportTxt.saveAs(reportPath);
      const reportText = await fs.readFile(reportPath, "utf8");
      assert.ok(reportText.includes("backup.apply"), "informe con el evento del respaldo");
      await fs.unlink(reportPath);

      await page.getByTestId("diagnostics-format-json").click();
      const [reportJson] = await Promise.all([
        page.waitForEvent("download"),
        page.getByTestId("diagnostics-export").click(),
      ]);
      assert.match(reportJson.suggestedFilename(), /^ryuunest-diagnostico-.*\.json$/);

      await page.getByTestId("diagnostics-copy").click();
      await page.getByTestId("diagnostics-toast").waitFor({ state: "visible" });

      await page.getByTestId("diagnostics-clear").click();
      await page.getByTestId("diagnostics-confirm").waitFor({ state: "visible" });
      await page.getByTestId("diagnostics-confirm-submit").click();
      await page.getByTestId("diagnostics-empty").waitFor({ state: "visible" });

      await page.screenshot({ path: path.join(output, `settings-${width}.png`), fullPage: true });

      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(external, [], `peticiones externas no autorizadas a ${width} px: ${external}`);
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
