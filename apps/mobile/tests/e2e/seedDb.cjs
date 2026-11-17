// F49b — siembra la base real de la web de Expo (sql.js en IndexedDB) antes de cargar la página.
// Genera con el núcleo (migraciones) y sql.js, en Node, una base con 3 obras y una carpeta, y la
// escribe en IndexedDB solo si aún no hay nada (así recargar no la pisa: prueba la persistencia).
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "../../../..");
const DB = { name: "ryuunest-expo-web", store: "bytes", key: "ryuunest.db" };

/** Obras de ejemplo: la primera con progreso y en la carpeta «Lectura Nocturna». */
const SEED = {
  folder: { id: 7, name: "Lectura Nocturna" },
  series: [
    { id: "dragon-de-ceniza", title: "El dragón de ceniza", kind: "manga", folder: 7, tags: ["Seinen"], progress: { chapterId: "ch-2", release: "r-oficial", title: "Capítulo 2", page: 2, total: 4, at: 900 }, at: 100 },
    { id: "cronicas-cielo", title: "Crónicas del Cielo", kind: "manhwa", folder: null, tags: ["Terror"], progress: { chapterId: "c3", title: "Capítulo 3", page: 2, total: 20, at: 500 }, at: 200 },
    { id: "ruta-sombras", title: "La ruta de las sombras", kind: "manhua", folder: null, tags: ["Acción"], progress: null, at: 300 },
  ],
};

let cached; // por opciones

/**
 * Bytes SQLite con el esquema migrado y los datos de `SEED`. `onboarded: false` deja la base sin la
 * marca de primer uso completado (para probar el onboarding).
 */
async function buildSeedBytes({ onboarded = true } = {}) {
  const cacheKey = String(onboarded);
  cached ??= {};
  if (cached[cacheKey]) return cached[cacheKey];
  const { openWebDatabase, createMemoryByteStore } = await import(
    pathToFileURL(path.join(root, "packages/web-db/dist/index.js")).href
  );
  const byteStore = createMemoryByteStore();
  const { driver, flush } = await openWebDatabase({ byteStore, persistDelayMs: 0 });
  // Sin esto la primera visita a Portales registra el repo oficial y descarga su índice (red).
  await driver.run("INSERT INTO setting (key, value) VALUES ('sources.officialRepoDismissed', 'true')");
  if (onboarded) await driver.run("INSERT INTO setting (key, value) VALUES ('onboarding.completed', 'true')");
  await driver.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (?, ?, ?, ?)", [SEED.folder.id, SEED.folder.name, 1, 1]);
  for (const s of SEED.series) {
    await driver.run(
      "INSERT INTO series (module_id, series_id, title, title_norm, kind, nsfw, status, updated_at) VALUES ('m-ejemplo-a', ?, ?, ?, ?, 0, 'ongoing', ?)",
      [s.id, s.title, s.title.toLowerCase(), s.kind, s.at],
    );
    await driver.run(
      "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES ('m-ejemplo-a', ?, ?, ?, ?)",
      [s.id, s.folder, s.at, s.at],
    );
    if (s.progress) {
      await driver.run(
        "INSERT INTO progress (module_id, series_id, chapter_id, release_id, chapter_title, page_index, page_total, updated_at) VALUES ('m-ejemplo-a', ?, ?, ?, ?, ?, ?, ?)",
        [s.id, s.progress.chapterId, s.progress.release ?? null, s.progress.title, s.progress.page, s.progress.total, s.progress.at],
      );
    }
  }
  // El capítulo 1 de la serie de ejemplo ya está leído.
  await driver.run("INSERT INTO chapter_read (module_id, series_id, chapter_id, read_at) VALUES ('m-ejemplo-a', 'dragon-de-ceniza', 'ch-1', 1)");
  // Etiquetas (géneros) con el almacén del núcleo.
  const { SeriesStore } = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
  const store = new SeriesStore({ driver, clock: { now: () => 1 } });
  for (const s of SEED.series) await store.setTags("m-ejemplo-a", s.id, s.tags);
  await flush();
  cached[cacheKey] = Array.from(await byteStore.load());
  return cached[cacheKey];
}

/** Antes de cargar cualquier página del contexto, deja la base sembrada en IndexedDB (si no existía). */
async function seedContext(context, options) {
  const bytes = await buildSeedBytes(options);
  await context.addInitScript(
    ({ db, bytes }) => {
      if (window.__ryuunestSeeded) return;
      window.__ryuunestSeeded = true;
      // La app espera a esta promesa: ver `window.__ryuunestSeedReady` no hace falta; IndexedDB
      // serializa las transacciones, y la escritura va antes de que la app abra su lectura.
      const req = indexedDB.open(db.name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(db.store);
      req.onsuccess = () => {
        const tx = req.result.transaction(db.store, "readwrite");
        const store = tx.objectStore(db.store);
        const get = store.get(db.key);
        get.onsuccess = () => {
          if (get.result === undefined) store.put(new Uint8Array(bytes), db.key);
        };
      };
    },
    { db: DB, bytes },
  );
}

/** `browser.newContext(options)` ya sembrado. */
async function newSeededContext(browser, options, seed) {
  const context = await browser.newContext(options);
  await seedContext(context, seed);
  return context;
}

/**
 * Deja la base de la página tal como la siembra `seedContext` (pisa lo guardado) y la recarga:
 * para volver al progreso de ejemplo en mitad de un recorrido.
 */
async function resetSeed(page, url, options) {
  const bytes = await buildSeedBytes(options);
  await page.evaluate(
    ({ db, bytes }) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open(db.name, 1);
        req.onsuccess = () => {
          const tx = req.result.transaction(db.store, "readwrite");
          tx.objectStore(db.store).put(new Uint8Array(bytes), db.key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
    { db: DB, bytes },
  );
  await page.goto(url);
}

/** Portadas del sitio falso de Aventuras (F48): se sirven en local, nunca salen a la red (RNF-5). */
function fulfillFakeCover(route, url) {
  if (url.host !== "sitio-html.test" || !/^\/img\/.+\.svg$/.test(url.pathname)) return false;
  route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="#263147"/></svg>',
  });
  return true;
}

module.exports = { fulfillFakeCover, seedContext, newSeededContext, resetSeed, SEED };
