// F14c — Biblioteca en web: sin SQLite local usa los datos de ejemplo, sin errores ni dominios externos.
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/library.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(`${baseURL}/library`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").waitFor({ state: "visible" });
      // F52: «Gemas» (vista de todo, elegida al inicio) y «Favoritos» como tarjetas de carpeta ≥48.
      // react-native-web no expone `selected` como atributo: se lee el borde `accent` (#35C98A).
      const elegida = async (card) =>
        (await card.evaluate((el) => getComputedStyle(el).borderTopColor)) === "rgb(53, 201, 138)";
      const gemas = page.getByRole("button", { name: /^Gemas, 3 obras(, Carpeta dinámica)?$/ });
      const favoritos = page.getByRole("button", { name: /^Favoritos, 0 obras(, Carpeta dinámica)?$/ });
      await gemas.waitFor({ state: "visible" });
      await favoritos.waitFor({ state: "visible" });
      assert.equal(await elegida(gemas), true, `Gemas elegida @${width}`);
      for (const card of [gemas, favoritos]) {
        const box = await card.boundingBox();
        assert.ok(box && box.width >= 48 && box.height >= 48, `área táctil de carpeta @${width}`);
      }
      // Nombres de carpeta completos (T7): ninguno recortado con «…» mientras quepa.
      for (const nombre of ["Lectura Nocturna"]) {
        const recortado = await page
          .getByText(nombre, { exact: true })
          .first()
          .evaluate((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        assert.equal(recortado, false, `«${nombre}» recortado @${width}`);
      }
      // Corrección carpetas: el nombre y el icono quedan dentro de la tarjeta (antes se salían).
      const tarjeta = page.getByRole("button", { name: /^Lectura Nocturna, \d+ obras/ });
      const cajaCarpeta = await tarjeta.boundingBox();
      const nombre = await page.getByText("Lectura Nocturna", { exact: true }).first().boundingBox();
      assert.ok(cajaCarpeta && nombre && nombre.y + nombre.height <= cajaCarpeta.y + cajaCarpeta.height + 1, `nombre dentro de la tarjeta @${width}`);
      assert.ok(cajaCarpeta.height >= 48 && nombre.height > 0, `tarjeta contiene el nombre visible @${width}`);
      await favoritos.click();
      assert.equal(await elegida(favoritos), true, `Favoritos elegida @${width}`);
      assert.equal(await elegida(gemas), false, `Gemas ya no @${width}`);
      await gemas.click();
      assert.equal(await elegida(gemas), true, `Gemas vuelve @${width}`);
      // F53: botón flotante «+», hoja «Nueva carpeta», errores de nombre y alta con etiquetas.
      const fab = page.getByTestId("library-new-folder");
      await fab.waitFor({ state: "visible" });
      const fabBox = await fab.boundingBox();
      assert.ok(fabBox && fabBox.width >= 48 && fabBox.height >= 48, `FAB ≥ 48 @${width}`);
      assert.ok(fabBox.y + fabBox.height <= 900, `FAB dentro de la pantalla @${width}`);
      await fab.click();
      const sheet = page.getByTestId("new-folder-sheet");
      await sheet.waitFor({ state: "visible" });
      await page.getByTestId("new-folder-create").click();
      assert.match(await page.getByTestId("new-folder-error").innerText(), /nombre/i, `error de nombre vacío @${width}`);
      await page.getByTestId("new-folder-name").fill("gemas");
      await page.getByTestId("new-folder-create").click();
      assert.match(await page.getByTestId("new-folder-error").innerText(), /ya tienes/i, `error de nombre repetido @${width}`);
      await page.getByTestId("new-folder-name").fill("Mis acción");
      await page.getByTestId("new-folder-tags").getByRole("button", { name: "Acción", exact: true }).click();
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-sheet-${width}.png` : undefined });
      await page.getByTestId("new-folder-create").click();
      await sheet.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: /^Mis acción, \d+ obras(, Carpeta dinámica)?$/ }).waitFor({ state: "visible" });
      // F93: «Gestionar»: lista con rayo, editar (renombrar y volver manual) y eliminar con confirmación.
      const manage = page.getByTestId("library-manage-folders");
      const manageBox = await manage.boundingBox();
      assert.ok(manageBox && manageBox.height >= 48 && manageBox.width >= 48, `Gestionar ≥ 48 @${width}`);
      await manage.click();
      const gestion = page.getByTestId("manage-folders-sheet");
      await gestion.waitFor({ state: "visible" });
      await gestion.getByRole("button", { name: "Editar Favoritos" }).waitFor({ state: "hidden" }); // del sistema: sin acciones
      const fila = gestion.locator('[data-testid^="manage-folder-"]').filter({ hasText: "Mis acción" });
      assert.equal(await fila.getByTestId("manage-folder-dynamic").count(), 1, `rayo en la dinámica @${width}`);
      await page.waitForTimeout(400); // fin de la animación de la hoja
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-gestionar-${width}.png` : undefined });
      await gestion.getByRole("button", { name: "Editar Mis acción", exact: true }).click();
      await sheet.waitFor({ state: "visible" });
      assert.equal(await page.getByTestId("new-folder-name").inputValue(), "Mis acción", `edición parte del nombre @${width}`);
      await page.getByTestId("new-folder-name").fill("gemas");
      await page.getByTestId("new-folder-create").click();
      assert.match(await page.getByTestId("new-folder-error").innerText(), /ya tienes/i, `edición rechaza repetidos @${width}`);
      await page.getByTestId("new-folder-name").fill("Mis acción 2");
      await page.getByTestId("new-folder-tags").getByRole("button", { name: "Acción", exact: true }).click(); // vuelve manual
      await page.getByTestId("new-folder-create").click();
      await sheet.waitFor({ state: "hidden" });
      await gestion.waitFor({ state: "visible" });
      const editada = gestion.locator('[data-testid^="manage-folder-"]').filter({ hasText: "Mis acción 2" });
      await editada.waitFor({ state: "visible" });
      assert.equal(await editada.getByTestId("manage-folder-dynamic").count(), 0, `ya no es dinámica @${width}`);
      await gestion.getByRole("button", { name: "Eliminar Mis acción 2", exact: true }).click();
      const confirmar = page.getByTestId("library-delete-folder-confirm");
      await confirmar.waitFor({ state: "visible" });
      await page.getByTestId("library-delete-folder-submit").click();
      await confirmar.waitFor({ state: "hidden" });
      await gestion.waitFor({ state: "visible" });
      await editada.waitFor({ state: "hidden" });
      await gestion.getByRole("button", { name: "Cerrar", exact: true }).click();
      await gestion.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `gestionar sin overflow @${width}`);

      // F55: búsqueda en tiempo real por palabras y filtro por categoría (alguna de las marcadas).
      const buscador = page.getByPlaceholder("Buscar en tus tesoros…");
      const oculta = (titulo) => page.getByRole("button", { name: titulo, exact: true }).waitFor({ state: "hidden" });
      await buscador.fill("CENIZA dragon");
      await page.getByRole("button", { name: "El dragón de ceniza", exact: true }).waitFor({ state: "visible" });
      await oculta("Crónicas del Cielo"); // tras la pausa del debounce
      await buscador.fill("");
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });
      const categorias = page.getByTestId("library-filters");
      await categorias.getByRole("button", { name: "Seinen", exact: true }).click();
      await page.getByRole("button", { name: "El dragón de ceniza", exact: true }).waitFor({ state: "visible" });
      await oculta("Crónicas del Cielo");
      await categorias.getByRole("button", { name: "Acción", exact: true }).click(); // alguna de las marcadas
      await page.getByRole("button", { name: "La ruta de las sombras", exact: true }).waitFor({ state: "visible" });
      await buscador.fill("dragon");
      await page.getByRole("button", { name: "El dragón de ceniza", exact: true }).waitFor({ state: "visible" });
      await oculta("La ruta de las sombras");
      await buscador.fill("");
      await categorias.getByRole("button", { name: "Seinen", exact: true }).click();
      await categorias.getByRole("button", { name: "Acción", exact: true }).click();
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });

      // F56: vacío de búsqueda, con texto solo y con filtros activos (el dragón sin tesoros).
      await buscador.fill("zzz-no-existe");
      await page.getByText("El dragón rebuscó todo su tesoro", { exact: true }).waitFor({ state: "visible" });
      await page.getByRole("img", { name: /dragón rebuscando/ }).waitFor({ state: "visible" });
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-vacio-${width}.png` : undefined });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `vacío sin overflow @${width}`);
      await page.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });
      await categorias.getByRole("button", { name: "Acción", exact: true }).click();
      await buscador.fill("zzz-no-existe");
      await page.getByText("Ni una gema con esos filtros", { exact: true }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Quitar filtros", exact: true }).click();
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });
      assert.equal(await buscador.inputValue(), "", `Quitar filtros limpia el texto @${width}`);

      // F57: hoja de filtros (tipo, fuente) con nombre visible de la fuente; Limpiar los quita.
      await page.getByRole("button", { name: "Tipo", exact: true }).click();
      const hoja = page.getByTestId("filter-sheet");
      await hoja.waitFor({ state: "visible" });
      await hoja.getByTestId("filter-sheet-kinds").getByRole("button", { name: "Manhwa", exact: true }).click();
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });
      await oculta("El dragón de ceniza");
      await hoja.getByTestId("filter-sheet-sources").getByRole("button", { name: "m-ejemplo-a", exact: true }).waitFor({ state: "visible" });
      await page.getByTestId("filter-sheet-clear").click();
      await page.getByTestId("filter-sheet-done").click();
      await hoja.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Crónicas del Cielo", exact: true }).waitFor({ state: "visible" });

      // F58: menú de orden (hoja con los tres órdenes) en lugar de ciclar al pulsar.
      await page.getByRole("button", { name: "Orden: Nombre", exact: true }).click();
      const orden = page.getByTestId("sort-sheet");
      await orden.waitFor({ state: "visible" });
      await orden.getByRole("button", { name: "Fecha de adición", exact: true }).click();
      await orden.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Orden: Fecha de adición", exact: true }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Orden: Fecha de adición", exact: true }).click();
      await orden.getByRole("button", { name: "Nombre", exact: true }).click();
      await orden.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Orden: Nombre", exact: true }).waitFor({ state: "visible" });

      // F54: menú de la serie (pulsación larga y «⋮» con foco): favoritos, mover, mover y crear, eliminar.
      const contar = async (nombre) => {
        const boton = page.getByRole("button", { name: new RegExp(`^${nombre}, \\\d+ obras(, Carpeta dinámica)?$`) });
        await boton.scrollIntoViewIfNeeded();
        return Number((await boton.getAttribute("aria-label")).match(/(\d+) obras(, Carpeta dinámica)?$/)[1]);
      };
      const serie = page.getByRole("button", { name: "El dragón de ceniza", exact: true });
      const menu = page.getByTestId("series-menu");
      const favoritosAntes = await contar("Favoritos");
      const nocturnaAntes = await contar("Lectura Nocturna");
      const gemasAntes = await contar("Gemas");
      await serie.scrollIntoViewIfNeeded();
      const caja = await serie.boundingBox();
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 3);
      await page.mouse.down();
      await page.waitForTimeout(700);
      await page.mouse.up();
      await menu.waitFor({ state: "visible" });
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-menu-${width}.png` : undefined });
      await page.getByTestId("series-menu-favorite").click();
      await menu.waitFor({ state: "hidden" });
      assert.equal(await contar("Favoritos"), favoritosAntes + 1, `Añadir a favoritos @${width}`);
      assert.equal(await contar("Lectura Nocturna"), nocturnaAntes - 1, `sale de su carpeta @${width}`);

      // Teclado: el «⋮» solo se ve con el foco y abre el mismo menú.
      const opacidad = (el) => el.evaluate((n) => getComputedStyle(n).opacity);
      const puntos = page.getByRole("button", { name: "Menú de El dragón de ceniza" });
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      assert.equal(await opacidad(puntos), "0", `⋮ oculto sin foco @${width}`);
      await puntos.focus();
      assert.equal(await opacidad(puntos), "1", `⋮ visible con foco @${width}`);
      await page.keyboard.press("Enter");
      await menu.waitFor({ state: "visible" });
      assert.equal(await page.getByTestId("series-menu-favorite").count(), 0, `ya está en Favoritos @${width}`);
      await page.getByTestId("series-menu-move").click();
      await page.getByRole("button", { name: /^Lectura Nocturna$/ }).click();
      await menu.waitFor({ state: "hidden" });
      assert.equal(await contar("Favoritos"), favoritosAntes, `Mover saca de Favoritos @${width}`);

      await puntos.focus();
      await page.keyboard.press("Enter");
      await page.getByTestId("series-menu-move-create").click();
      await page.getByTestId("new-folder-name").fill("Recién movidas");
      await page.getByTestId("new-folder-create").click();
      await page.getByRole("button", { name: /^Recién movidas, 1 obras(, Carpeta dinámica)?$/ }).waitFor({ state: "visible" });
      await page.getByTestId("new-folder-sheet").waitFor({ state: "hidden" });

      await puntos.focus();
      await page.keyboard.press("Enter");
      await page.getByTestId("series-menu-remove").click();
      await page.getByTestId("library-remove-confirm-submit").click();
      assert.equal(await contar("Gemas"), gemasAntes - 1, `Eliminar quita de Tesoros @${width}`);
      assert.equal(await serie.count(), 0, `la serie ya no está @${width}`);
      await page.screenshot({ path: process.env.F52_SHOT ? `${process.env.F52_SHOT}-${width}.png` : undefined });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("library e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
