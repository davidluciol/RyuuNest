# todo.md — RyuuNest (solo pendientes) · 2026-11-12

> Historial completo de lo hecho → `tasks/todo.archive.md` (podado el 2026-11-12: aquí solo queda lo pendiente). Contexto → `tasks/plan.md`.
> **Identificadores sin renumerar** (decisión del humano, 2026-11-12): los códigos T/F/QAw siguen siendo válidos en `MEMORY.md`, `tasks/Analisis.md`, ADR-0003 y el SPEC.
> **Al iniciar sesión leer `tasks/complexity.md` §1 (reglas).** Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
> Comandos: `pnpm -r typecheck` · `pnpm -r test` · `pnpm -r build` · `pnpm lint` · `pnpm --filter @ryuunest/core test`.
> Tracker: `bd` local → GitHub Issues cuando exista el repo (P-12). Etiqueta: `[tipo · complejidad · nivel]`. 🧍 = paso humano (no inventar mediciones).

**Hecho hasta hoy:** Fases 0–7 del núcleo (T01–T30b, T32a/T32b, T37), endurecimiento T34/T35/T36, Fase 6a completa (F01–F10), móvil F11–F21 y F29/F30/FB2 hechas (F34 casi completa), web F24/F25 y extensión F26/F27 hechas, F28 parte web, recorridos F32/F33 hechos. Detalle en `todo.archive.md`.

**Orden recomendado:** ~~T38~~ ✅ → ~~T39~~ ✅ → ~~T40~~ ✅ → ~~T41~~ ✅ (cierre API 1.0; falta la revisión 🧍 del Checkpoint I) · T33 en paralelo · F31 (Playwright por pantalla) · F40 → F45 → F41/F42 → F43 → F44 (propuestas de F33, pendientes de aprobar) · F22/F23 (TV) · pulidos F35–F39 y QAw1–3 · **F48 → F46 → F47** (datos reales en Inicio y portadas) · F49 (base local en la web de Expo, alternativa A) · verificaciones 🧍 al final de cada tarea.

---

## Cierre Fase 0

### T05 cierre `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope de imágenes medido; marcar T05 ✅
- Aparte (no bloquea): MiBox 4 pospuesta (P-43); revalidar RNF-1 en release.

---

## Cierre de la API 1.0 (ADR-0003, aceptado 2026-10-29)

Orden: ~~T37~~ ✅ → ~~T38~~ ✅ → ~~T39~~ ✅ → ~~T40~~ ✅ → ~~T41~~ ✅. Cada tarea: TDD (rojo → verde), un commit por corte, rama propia. Todas parten de `docs/decisions/ADR-0003-congelacion-api-1.0.md`; los tres módulos publicados de `RyuuNest-Models` son la regresión (ninguno debe necesitar cambios, salvo que T40 lo decida).

### T38 Compatibilidad hacia delante ejecutable (R3) `[BE · Intermedia · N4]`

Dep: T37 · M · `packages/module-sdk/src/{repoIndex,manifest,cli}.ts`, `packages/core/src/{contract/repoIndex,repo/RepoRegistry}.ts`, `apps/mobile/{app.json,src/screens/sources/useSourcesData.ts}`

- [x] Índice tolerante **por entrada**: `apiVersion`, `runtime` o `kinds` desconocidos marcan la entrada «no compatible» y no invalidan el repo; las rotas se descartan con aviso
- [x] `minAppVersion?` opcional en `RepoModuleEntry` (aditivo) y la app oculta/etiqueta lo incompatible antes de descargar
- [x] `app.json` con versión real y la app la pasa al validador (`Constants.expoConfig?.version`); `minAppVersion` se aplica de verdad
- [x] El CLI no comprueba `minAppVersion` salvo con `--app-version`
- [x] Pruebas: un índice con un módulo `apiVersion: 2` sigue listando los de v1
> **Hecho (2026-11-14, `feature/T38-compatibilidad-hacia-delante`):** `app.json` en 0.1.0; `validateRepoIndex` devuelve `modules` (compatibles) + `incompatible` + `warnings`; `RepoRegistry.listIncompatible`; `SourcesData.incompatible` (sin etiqueta visual: queda para una tarea de UI).
- Verif: `pnpm -r test` + 🧍 corregir en `RyuuNest-Models` la frase «un campo de más o de menos lo rechaza» de su `AGENTS.md`

### T39 Formato declarativo cerrado y comprobable (R2, D2) `[BE · Alta · N4]`

Dep: T38 · L (dividir en 2 PRs si pasa de ~5 archivos por corte) · `docs/declarative-format.md`, `packages/core/src/runtimes/{DeclarativeRuntime,transforms}.ts`, `packages/module-sdk/src/*`, `packages/module-sdk/templates/declarative/*`

- [x] `pages.imageHeaders` (mapa de cabeceras con `{baseUrl}`, `{chapterId}`, `{releaseId}`) rellena `ImageRef.headers`; el lector ya las aplica
- [x] Serie sin capítulos devuelve `chapters: []` en vez de `PARSE` (L2)
- [x] `validateDeclarativeConfig` en `module-sdk`, usado por `ryuunest-module validate`
- [x] `ryuunest-module test` ejecuta el arnés también con módulos declarativos (retirar la omisión de `cli.test.ts`)
- [x] `docs/declarative-format.md` normativo a partir del Anexo B del ADR; SPEC §6.6 lo enlaza
- [x] L3–L6 del ADR (extra, fechas, id sin codificar, mapas de `status`/`kind`): decidir aquí cuáles entran; el resto queda como aditivo → **entran los cuatro** (decisión del humano)
- Verif: `pnpm -r test` + contrato declarativo con `imageHeaders`
> **Hecho (2026-11-14, `feature/T39-formato-declarativo`):** `extra`, `date`, `{x:raw}` y `map` además de L1/L2; todo «desde la app 0.2.0» (la plantilla declara `minAppVersion`). Detalle en `MEMORY.md` P-144.

### T40 Ejecución y empaquetado de módulos `script` (R1, D1 = A) `[BE · Alta · N4 → N5]`

Dep: T38 · L · `packages/core/src/ports/scriptLoader.ts`, `runtimes/{ScriptRuntime,ModuleRuntime}.ts`, `apps/mobile/src/data/moduleMounter.ts`, cargador de plataforma (nuevo)

> **Ya hecho (2026-11-06, `fix/urgente-fuentes-modulos-repo`):** el spike de dispositivo con `zonatmo` confirma que Hermes admite `new Function` (P-83 corregido); la app móvil tiene `createFunctionScriptLoader` y Descubrir lista módulos `script`. Falta lo de abajo.

- [x] `ScriptLoader.load` recibe el paquete (ruta → texto) y la ruta de entrada; el montador deja de pasar solo `manifest.entry`
- [x] Contrato a autores documentado: módulo ES, `export default create(host)`, solo imports relativos dentro del paquete, sin `import()` ni paquetes, entorno ECMAScript estándar (SPEC §6.5) → SPEC §6.5 con las formas admitidas + README de la plantilla `script`
- [x] 🧍 **Spike de `m440` y `yupmanga`** en el dispositivo (el de `zonatmo` ya pasó); si falla: marcar `script` como experimental (plan C del ADR), anotar la decisión y reabrir D1; escalar a N5 → **hecho (2026-11-14, S25 Ultra, Expo Go, agent-device):** M440 0.1.0 (listas, ficha de 378 capítulos con la lista cifrada, capítulo de 18 páginas con imágenes) y YupManga 0.1.1 instalado por `InstallFlow` (listas, ficha de 7 capítulos, capítulo de 152 páginas con imágenes). Portadas en blanco en ambos (F35). M440 se actualizó a 0.2.0 después, en T43.
- [x] Desbloquear en la app los módulos `script` (`createInstalledMounter` deja de lanzar `UNSUPPORTED`): Descubrir y Lector montan con `createFunctionScriptLoader`
- [x] `ryuunest-module test` carga los `script` con el mismo cargador que la app (decisión del humano)
- Verif: pruebas del cargador con paquetes de varios archivos + 🧍 spike en el dispositivo
> **Hecho (2026-11-14, `feature/T40-modulos-script`):** CLI con el cargador de la app; los tres módulos publicados (zonatmo 0.3.0, m440 0.2.0, yupmanga 0.1.1) cargan con `createFunctionScriptLoader` en Node. «script» deja de ser experimental (decisión del humano); el spike de M440/YupManga pasó en el dispositivo. Detalle en `MEMORY.md` P-145.

### T41 Puerta del 2.º sitio real: `zonatmo` y `m440` en la app (D3) `[Ops · Baja · N2]` 🧍

Dep: T39, T40 · S · sin código (salvo ajustes que salgan)

- [x] Ambos módulos pasan su arnés con fixtures propias (repo `RyuuNest-Models`) — la regla «un capítulo con dos releases» se relaja con la opción **opt-in** `singleReleasePerChapter` de `runContract` (decisión del humano); m440 la usa, zonatmo no la necesita
- [x] Se instalan por `InstallFlow` en el dispositivo y ejecutan `popular` o `latest`, `search`, `details` y `pages`, y se ve una imagen en el lector
- [x] Ningún cambio de tipos del modelo de datos; si hace falta uno, se reabre el ADR
- Verif: 🧍 prueba en el dispositivo (S25 Ultra; POCO si vuelve a estar disponible)
> **Hecho (2026-11-14, `feature/T41-puerta-segundo-sitio` + rama `test/T41-arnes-fixtures-propias` en `RyuuNest-Models`):** `runContract` acepta `singleReleasePerChapter`; los tests de zonatmo y m440 en `RyuuNest-Models` llaman al arnés con sus fixtures (m440 añade ficha con capítulos cifrados y capítulo, datos inventados). En el S25 Ultra (Expo Go, agent-device, red real): ZonaTMO 0.3.0 instalado por `InstallFlow`, listas, búsqueda «dragon», ficha de 30 capítulos y lector de 80 páginas con imagen; M440 0.2.0 listas, búsqueda «kobayashi», ficha de 186 capítulos y lector de 17 páginas con imagen. Portadas de M440 en blanco (F35, causa en la app). Detalle en `MEMORY.md` P-147.

### 🚩 Checkpoint I `[Ops · Baja · N1]`

- [x] 🧍 Módulos reales buscan, listan capítulos y entregan imágenes en sitios reales (= T41, 2026-11-14) · [x] Contrato pasa con 2 arquitecturas (T32a) · [ ] API 1.0 congelable (T37–T41 hechas; lo decide el humano en la revisión) · [ ] 🧍 Revisión

---

## Fase 9 — Endurecimiento (pendiente)

### T33 Pruebas de seguridad `[Sec · Alta · N4]`

Dep: T13 · M · `core/tests/security/*.test.ts` · sin dependencia del cierre de la API (en paralelo)

- [ ] Cada amenaza de SPEC §7.2 (zip-slip, bomba, hash, manifest, respaldo malicioso) tiene una prueba que falla si se quita la mitigación
- [ ] Un deep link `ryuunest://add-repo?url=…` solo abre la confirmación, no instala (AC-8)
- [ ] Límites de tamaño/archivos cubiertos
- Verif: `pnpm --filter @ryuunest/core test -- security` + revisar correspondencia amenaza↔prueba

### 🚩 Checkpoint J — Fin de la Parte 1 `[Ops · Baja · N1]`

- [ ] Suite y CI en verde · [ ] Cobertura del contrato completa · [ ] 🧍 Revisión → cierre formal de la Parte 1

### FA1 Arte final del dragón `[Ops · Baja · N1]` 🧍 (sin dependencias; antes de v1.0 pública)

- [ ] 🧍 Arte original con licencia compatible GPL-3.0; sustituir `apps/mobile/assets/placeholder/*`
- [ ] `ASSETS.md` y `README` de placeholder actualizados; retirar marca TEMPORAL
- Verif: `apps/mobile/tests/placeholder.test.ts` en verde + galería con Playwright (RNF-5)

---

## Fase 6b — Pendientes de la interfaz móvil

### F17 Cierre de la ficha de serie `[FE · Baja · N2]`

Dep: F32 (hallazgo) · S · `apps/mobile/src/screens/series/*`

- [x] Favorito (ya persistía, P-126) y **release preferida** (se guarda por grupo en `series_pref`, P-151) sobreviven a un reinicio — rama `fix/F17-ficha-persistente`
- [ ] **Carpeta:** no hay selector de carpeta en la ficha (`onFolderLongPress` vacío); queda como tarea aparte (hoja con `Folders.list` + «Sin carpeta» → `Favorites.move`)
- [ ] Comprobar en el dispositivo que el reinicio conserva favorito y release (la ficha no tiene aún selector de release: el chip solo repite la actual)
- Verif: Vitest con SQLite real · 🧍 S25 Ultra
- Nota: la parte web de la ficha entra en F41 (propuesta de F33).

### F31 Integrar errores en las pantallas — verificación restante `[FE · Baja · N2]`

Dep: hecha la integración (errorLog, ErrorState, ErrorBanner, registro en `log`) · S · `apps/mobile/src/screens/*`

- [x] Integración en Descubrir, Fuentes, Respaldo y lector, con registro en `log` (hecha 2026-10-31; detalle en `todo.archive.md`)
- [x] Playwright por pantalla: `screenErrors.cjs` cubre los errores visibles de la ficha y el lector a 426 y 1440 px (Fuentes y Respaldo ya en `sources.cjs`/`backup.cjs`; Descubrir web no puede fallar con los datos de ejemplo, lo cubre `apps/web/tests/e2e/discover.cjs`, F39) — rama `test/F31-e2e-errores-por-pantalla`
- Verif: `apps/mobile/tests/e2e/*.cjs` en verde

### F34 Correcciones UX/UI transversales — restante `[FE · Intermedia · N3]`

> F34.1 (bloqueantes), F34.2 (importantes) y casi todo F34.3 están hechos (2026-11-03 → 2026-11-06; detalle en `todo.archive.md`).

- [ ] **Inicio al 200 %**: recortes en «Continuar la Aventura», el botón «Continuar cap. 41» y las insignias (hallazgo de F34.3, fuera de su alcance)
- Verif: `focusAndScale.cjs` + `fontScale.test.ts` en verde · 🧍 S25 Ultra con `font_scale 2.0`

### Tareas propuestas por F33 (pendientes de aprobar; detalle en `tasks/Analisis.md` §7). Orden decidido: F40 → F45 → F41/F42 → F43 → F44

- **F40** Inicio con datos reales, estado vacío propio (instalar un módulo + botón a Fuentes) y paridad web/nativo. **F45** Dos avisos NSFW (al instalar y al abrir por primera vez, explicando qué es NSFW) y primer uso sin jerga. **F41** Descubrir, Biblioteca y ficha (web con portada y sinopsis; incluye la ficha web de F17). **F42** Portales y Ajustes (permisos con icono de aviso, «disponibles» visible). **F43** Lector, Diagnóstico y escritorio. **F44** «Recomendados» como índice remoto (requiere actualizar RNF-5 en el SPEC).

---

## Fase 7 — TV

### F22 Riel lateral + navegación espacial + foco `[FE · Alta · N4]`

Dep: P-B · M · `apps/mobile/src/tv/*`

- [ ] Foco siempre visible (anillo 2 px `accent`, separación 2 px); escala 1,25×; márgenes seguros; navegación completa con D-pad (incluye el ítem pendiente de F33: revisar navegación con teclado/D-pad y legibilidad en densidad TV)
- Verif: Playwright (foco con teclado) · 🧍 recorrer los 5 destinos en la MiBox 4

### F23 Lector para TV (D-pad) `[FE · Alta · N4]`

Dep: F22, F18, F19 · M · `apps/mobile/src/screens/reader/tv/*`

- [ ] Todas las acciones del lector solo con control remoto (AC-9); controles grandes; sin animaciones
- Verif: 🧍 leer un capítulo completo en la MiBox 4 (AC-9, AC-6)

### 🚩 Checkpoint P-C `[Ops · Baja · N1]`

- [ ] AC-9 · [ ] 🧍 Revisión

---

## Fase 8 — Web + extensión (pendientes)

### F25 Pantallas web — restante `[FE · Baja · N2]`

- [x] Pantallas de la v1 sobre base real (sql.js + IndexedDB, P-113), módulos `script` en Web Worker (P-114) — hecho en `feature/F24-F25-web-client`; detalle en `todo.archive.md`
- [x] **Subir react a 19.3.1+ y react-router a 8** (P-110): ADR-0002 fija react 19.2.3 por Expo SDK 57; al subir react, react-router 8 pasa a ser compatible. Sin tocar Expo: solo `apps/web`. — hecho: react/react-dom 19.3.1 en `apps/web` y `apps/extension`, react-router 8.5.1, `resolve.dedupe` de react en la web (mobile-src sigue en 19.2.3). Lint, typecheck, tests y e2e web en verde salvo `reader.cjs` a 426 px, intermitente también en `HEAD` (preexistente).
- Verif: `pnpm -r test` + e2e web en verde

### F26/F27 Extensión y puente — restante `[FE/BE · Baja · N2]`

- [x] Extensión MV3 con permisos por dominio y puente web ↔ extensión hechos en `feature/F26-F27-extension-bridge`; AC-10 con e2e real — detalle en `todo.archive.md`
- [ ] 🧍 Cargar la extensión **en Chrome y en Firefox** y autorizar un dominio con el aviso real del navegador (Playwright no puede pulsar ese aviso; ver `apps/extension/README.md`)
- [ ] 🧍 Leer un capítulo con la extensión instalada en tu navegador y con un sitio real (AC-10; cierra Checkpoint P-D)
- [ ] Pendiente (no bloquea): iconos de la extensión (no hay arte; el manifiesto va sin `icons`), origen de producción de la PWA (hoy solo `localhost`, P-116) y ficha de publicación en las tiendas.

### 🚩 Checkpoint P-D `[Ops · Baja · N1]`

- [x] AC-10 con e2e de la extensión real · [ ] 🧍 AC-10 en tu navegador · [ ] 🧍 Revisión

---

## Pendientes que dejó el recorrido F32 (2026-11-08, S25 Ultra)

### F35 Portadas en blanco de M440 y YupManga `[FE/Ops · Intermedia · N3]`

Dep: F32 · S · S25 Ultra con red real

- [x] Reproducir con prueba en rojo: la `imageRef` de la portada llega a `LibraryCard` con `Referer`/`User-Agent` (P-137), ZonaTMO sí carga y M440/YupManga no; averiguar si falla el módulo (cabeceras o dominio no declarado en `permissions.domains`) o la app (expo-image con cabeceras) → **es de la app**: el `Image` de React Native no envía `source.headers` en Android
- [x] Si es del módulo, corregir en `RyuuNest-Models` (otro repo) y subir versión; si es de la app, arreglar con test y verificar en el teléfono
- [x] Comprobar portadas en Descubrir (listas y catálogo) y ficha → visibles en el S25 Ultra: listas de M440 y YupManga, cuadrícula de búsqueda/catálogo de M440 («alya») y fichas de M440 y YupManga (la de YupManga usa `og:image` con la cookie de la sesión). **Guarida/Tesoros:** no muestran portadas de ningún módulo (las tarjetas no reciben `cover` y la biblioteca solo guarda `cover_url`, sin cabeceras): queda como pregunta al humano (P-148)
- Verif: 🧍 S25 Ultra (portadas visibles en M440 y YupManga).
> **Hecho (2026-11-14, `fix/F35-portadas-cabeceras`):** `LibraryCard` y `SeriesScreen` pintan con `expo-image` (como el lector); `remoteImageUsage.test.ts` impide volver al `Image` de React Native salvo recursos locales y tres tarjetas que aún no reciben portadas remotas (la lista solo mengua). Detalle en `MEMORY.md` P-148.

### T43 Capacidades `home`/`list`/`filters` rompen instalar y actualizar módulos `[BE · Intermedia · N3]`

Dep: T40 · S · `packages/core/src/contract/types.ts`, `runtimes/{contractShape,ModuleRuntime,ScriptRuntime}.ts`, `packages/module-sdk/src/manifest.ts`, SPEC §6.1/§6.3

> Origen (2026-11-14): al probar «Gestionar» en el S25 Ultra, el panel sí abre y ofrece «Actualizar a v0.2.0» (el fallo que se sospechaba no existe), pero actualizar M440 0.1.0 → 0.2.0 fallaba con «Manifest inválido: capabilities[5..7]». M440 0.2.0 y ZonaTMO 0.3.0 declaran `home`, `list` y `filters` (contrato dinámico de `RyuuNest-Models`, `AGENTS.md` §7) y el validador solo admitía cinco valores.

- [x] `ModuleCapability` y `MODULE_CAPABILITIES` admiten `home`, `list` y `filters` (decisión del humano: añadirlas al contrato)
- [x] `ModuleApi` con `home?()`, `list?(sectionId, page)`, `filters?()` y `search(query, page, filters?)`; `ScriptRuntime` y `guardApi` los pasan y validan la forma mínima
- [x] SPEC §6.1 y §6.3
- [x] 🧍→ hecho con agent-device: M440 se actualiza a 0.2.0 en el S25 Ultra y sus listas cargan
- [ ] Fuera de alcance: usar `home`/`list`/`filters` en la app (UI de Descubrir con secciones y filtros) — tarea aparte
- Verif: `pnpm -r test` + actualización real en el dispositivo
> **Hecho (2026-11-14, `fix/T43-capacidades-home-list-filters`):** ver `MEMORY.md` P-146.

### T42 YupManga: el «reto del lector» cambió de formato `[Ops · Intermedia · N3]` 🧍

Dep: T40 · S · repo `RyuuNest-Models`

- [ ] El capítulo falla con `UNSUPPORTED` («el reto del lector cambió de formato»; selector `\[([0-9,]+)\];var [\w$]+=String\.fromCharCode\(([0-9,]+)\);`). Guardar una fixture HTML del reto actual (nunca el sitio real en pruebas), ajustar el módulo y subir versión + índice con SHA-256.
- [ ] Abrir un capítulo de YupManga en el teléfono y ver al menos una imagen.
- [ ] Revisar `m440.in`: dio `TIMEOUT` durante la sesión (sitio intermitente); decidir si el módulo necesita reintentos o un mensaje mejor.
- Verif: 🧍 S25 Ultra; el arnés del módulo en verde.

### F36 Detalle de error sin «…» en la URL `[FE · Baja · N2]`

Dep: F29 · XS

- [x] «Ver detalle» de `ErrorState` ya no limita a una línea y parte la URL (`wordBreak: break-all`); `LogEventRow`, banner y diálogo ya envolvían — rama `fix/F36-detalle-error-url-completa`. Falta 🧍 verlo en el S25 con un error de imagen real.
- Verif: S25 Ultra con el error de imagen del lector (red cortada).

### F37 Repetir F32 en la MiBox 4 y el POCO F5 Pro `[FE/QA · Baja · N2]` 🧍

Dep: F32 · S · dispositivos

- [ ] Repetir el recorrido de F32 en la MiBox 4 (piso de rendimiento, Android 9, 2 GB) y en el POCO F5 Pro cuando haya módulo y red; anotar diferencias frente al S25 Ultra.
- [ ] Medir la memoria del lector con `adb shell dumpsys meminfo` durante la precarga (fija `READER_IMAGE_BUDGET_MB`, P-90) y AC-6 (60 páginas verticales sin cierres) en la MiBox 4.
- Verif: 🧍 dispositivos.

### F38 Búsqueda y estados de Descubrir: pulido `[FE · Baja · N2]`

Dep: F32 · XS

- [x] Con consulta se ocultan «Más recientes/Populares» y hay botón «Buscar» (decisión del humano, P-151); en el S25 un toque basta (`keyboardShouldPersistTaps="handled"`). Rama `fix/F38-descubrir-busqueda-hoja-modulo`.
- [ ] Sin confirmar: `discover.tsx` llama a `refreshModules` al recuperar el foco; no se probó en el teléfono instalar/desinstalar en Portales y volver.
- [x] «Desinstalar» queda separado de «Activar/Desactivar» (margen `spacing.xl`; ya pedía confirmación aparte). Visto en el S25.
- Verif: S25 Ultra.

### F39 Equivalencias web de los arreglos de F32 `[FE · Baja · N2]`

Dep: F32 · XS

- [x] `apps/web/tests/e2e/discover.cjs` cubre «el módulo falla → elegir otro» y que un 2.º módulo instalado en Fuentes aparece al volver a Descubrir (la ruta monta de nuevo) — rama `test/F39-equivalencias-web`
- [ ] Sin decidir: el error de imagen del lector web solo muestra el título; valorar el mismo mensaje por tipo que en móvil.
- Verif: Playwright a 1440/426 px.

---

## Datos reales en Inicio y portadas (salieron de F35, 2026-11-14)

Orden (decisión del humano): **F48 → F46 → F47**; F49 espera tu elección de alternativa. Cada una con su rama (`fix/` o `feature/`), TDD y PR propio.

### F48 e2e `discover.cjs` en verde: portadas del sitio falso servidas en local `[QA · Baja · N2]`

Dep: — · S · `apps/mobile/tests/e2e/discover.cjs` (y los e2e que pinten portadas de `test-site`)

> Origen (P-148): desde que Descubrir pinta portadas (P-137), las del sitio falso apuntan a `https://sitio-html.test/img/*.svg`; el e2e aborta todo lo externo y eso deja `ERR_FAILED` en consola y entradas en `external`. Falla igual en `master`.

- [x] Rojo: el e2e comprueba que las portadas del sitio falso **se ven** (no solo que no hay errores)
- [x] El e2e atiende `sitio-html.test` y `api-json.test` con `route.fulfill` (un SVG en línea; `test-site` no tiene SVG en disco); cualquier otro host sigue abortado y contado (RNF-5 intacto) — rama `test/F48-e2e-descubrir-portadas-locales`
- [x] `library`, `series` y `home` pasan sin cambios
- Verif: `discover.cjs` en verde a 426 y 1440 px, 2–3 ejecuciones seguidas

### F46 Inicio (Guarida) con datos reales locales `[FE · Intermedia · N3]`

Dep: F48 · M · `apps/mobile/src/app/(tabs)/index.tsx`, `src/screens/home/{homeData,useHomeData}.ts` (nuevos), `HomeScreen.tsx`

> Origen (decisión del humano, 2026-11-14): Inicio usa siempre `SAMPLE_HOME_DATA`; debe mostrar lo guardado en el dispositivo, como ya hace Tesoros (`libraryData.ts`).

- [ ] Rojo: `loadHomeData(driver)` arma «Continuar leyendo», recientes y carpetas desde el núcleo (progreso, `browseLibrary`, `Folders`) sobre una base en memoria
- [ ] La ruta usa `resolveHomeData` con el mismo patrón que Tesoros: nativo → base real; web de Expo → reserva de ejemplo hasta F49
- [ ] Base vacía → estado vacío de Inicio que lleva a Portales (P-141 punto 1); sin secciones vacías a medias
- [ ] «Continuar» reanuda en el capítulo y la página guardados; refresca al volver a la pestaña (como `useDiscoverData`)
- [ ] Galería y `homeFixtures` siguen con datos de ejemplo (solo para la galería)
- Verif: Vitest + 🧍 S25 Ultra (leer unas páginas → Guarida lo muestra en «Continuar»); retoma QAw2 en el móvil

### F47 Portadas con cabeceras en Guarida y Tesoros `[BE/FE · Intermedia · N4]`

Dep: F46 · M · `packages/core/src/{library/SeriesStore,library/queries,storage/migrations}.ts`, `apps/mobile/src/screens/{home,library}/*`

> Origen (P-148, decisión del humano: opción a): Tesoros y Guarida no pasan `cover` a las tarjetas y `series.cover_url` no guarda las cabeceras, así que M440/YupManga saldrían en blanco aunque se pasara.

- [ ] Rojo (núcleo): `saveFromDetails` guarda `cover.headers` y `browseLibrary` las devuelve junto a `coverUrl`
- [ ] Migración **aditiva** (columna nueva, p. ej. `cover_headers` en JSON); las filas viejas siguen válidas sin cabeceras
- [ ] Respaldo: comprobar si `series` viaja en el respaldo (SPEC); si viaja, decidir si las cabeceras van con él (preguntar antes)
- [ ] `LibraryCard` en Tesoros y las tarjetas de Guarida (`ContinueCard`, `RecentCard`) reciben `{ uri, headers }`; al pasar a `expo-image` salen de `PENDING` en `remoteImageUsage.test.ts`
- [ ] Las cabeceras se refrescan al abrir la ficha (cookies que caducan, YupManga)
- Verif: `pnpm -r test` + 🧍 S25 Ultra: portadas de ZonaTMO, M440 y YupManga en Guarida y Tesoros

### F49 Base de datos local en la web de Expo (`apps/mobile` en el navegador) `[FE/Arq · Alta · N4]`

Dep: F46 · M–L · `apps/mobile/src/data/appDatabase.ts` (hoy devuelve `null` en web) · **decidido: alternativa A** (P-150)

> Origen (2026-11-14): en la web de Expo no hay SQLite, así que Tesoros (y Guarida tras F46) usan datos de ejemplo de reserva, y la ficha y el lector usan `sessionSqlDriver` (en memoria, solo las sentencias que conoce). El humano pide una base local real y evaluar alternativas.

| Opción | Cómo | A favor | En contra |
|---|---|---|---|
| **A. `sql.js` + IndexedDB, como `apps/web` (recomendada)** | Llevar `webDatabase.ts`/`byteStore.ts` de F25 a un paquete compartido (p. ej. `packages/web-db`) y usarlo en `appDatabase.ts` de web | SQLite real con `migrate`: **todo el núcleo funciona igual que en el teléfono**; ya probado en este repo (F25); persistente; sin cabeceras especiales | Añadir `sql.js` 1.15.2 (ya fijada en el monorepo) a `apps/mobile` → **pide tu permiso**; cargar el `.wasm` con Metro (asset local, sin CDN); ~670 KB más en web (`sql-wasm.wasm`) |
| B. `expo-sqlite` en web | Mismo `expoSqlDriver` que en nativo; config de Metro para `wasm` y cabeceras COOP/COEP | Sin dependencia nueva; un solo driver para todo | **Alpha** según la doc de Expo 57; exige COOP/COEP en Metro, en `serve.cjs` de los e2e y en cualquier hosting; `SharedArrayBuffer` |
| C. JSON en IndexedDB/localStorage | Ampliar `sessionSqlDriver` para que persista en JSON | Simple de entender, sin wasm | Hay que **imitar a mano cada sentencia SQL** del núcleo; cada consulta nueva lo rompe; ya hoy rechaza lo que no conoce; no sirve para filtros/orden/cursores de `browseLibrary` sin reescribirlos |
| D. Sembrar datos solo en pruebas | La web sigue sin base; los e2e importan un respaldo o interceptan | Cero código de producción | No da datos reales a quien use la web de Expo; solo arregla la verificación |
| E. Dejar la web de Expo como banco de pruebas | La web real es `apps/web` (ya con base real, P-113); `apps/mobile` en web solo sirve a la galería y a Playwright | Cero trabajo; evita duplicar `apps/web` | La web de Expo nunca mostrará datos reales; dos clientes web con comportamiento distinto |

**Recomendación: A.** Es la única que da el núcleo completo (migraciones, consultas, cursores, respaldo) sin imitar SQL y sin depender de algo en alpha, y ya funciona en `apps/web`. B es la segunda opción si prefieres no añadir dependencias, asumiendo el riesgo del alpha y las cabeceras. C (la idea del JSON) parece más simple pero es la que más se rompe con el tiempo.

- [x] 🧍 Elegir alternativa → **A** (2026-11-14): `sql.js` 1.15.2 + IndexedDB, extraído de `apps/web` a un paquete compartido (p. ej. `packages/web-db`) que usan `apps/web` y la web de `apps/mobile`; `sql.js` autorizada en `apps/mobile` con la versión ya fijada (P-150)
- [ ] Rojo: `openAppDatabase()` en web devuelve un driver que pasa `migrate` y persiste entre recargas (prueba con `ByteStore` en memoria)
- [ ] Retirar la reserva de ejemplo de Tesoros/Guarida en web y `sessionSqlDriver` donde quede sustituido
- Verif: Playwright: guardar una serie, recargar la página y verla en Tesoros; cero peticiones externas

---

## QA del cliente web — rutas de aceptación

> Recorridos de extremo a extremo sobre `apps/web` con datos reales (añadidas el 2026-11-01). Con Playwright (doble de la extensión, `fakeExtension.cjs`) o a mano en el navegador.

### QAw1 Ruta guardado: instalar → descubrir → guardar → biblioteca `[FE/QA · Intermedia · N3]`

- [x] Abrir la aplicación web.
- [x] Ir a **Fuentes** e instalar un módulo.
- [x] Moverse a **Descubrir**.
- [x] Seleccionar algún manga o cómic al azar.
- [x] Guardarlo en alguna carpeta o en favoritos.
- [x] Buscarlo en **Biblioteca**.
- [x] Seleccionarlo y **debería mostrar de nuevo la pantalla de detalle** para ese manga o cómic.
- Verif: la obra guardada aparece en Biblioteca y al abrirla se ve su ficha (detalle) completa. — verificado por e2e `apps/web/tests/e2e/discover.cjs` (paso 4: busca en Biblioteca, abre la ficha con capítulos y «Guardada») a 1440/426 px; el bloqueo de «Favorito» ya lo resolvió P-126. Sin cambios nativos, no hay verificación en el teléfono.

### QAw2 Ruta Inicio: vacío → instalar → leer → continuar leyendo `[FE/QA · Intermedia · N3]`

- [ ] Al abrir la aplicación web, **Inicio debería estar vacío** (sin historial de lectura).
- [ ] Ir a **Fuentes** e instalar un módulo en caso de que no exista ninguno.
- [ ] Ir a la sección **Descubrir**.
- [ ] Seleccionar un manga al azar.
- [ ] Abrir un capítulo al azar y avanzar un poco en la lectura, para que quede registro de progreso.
- [ ] Salir del lector y regresar a **Inicio**.
- [ ] Verificar que el manga aparece para **continuar leyendo**.
- Verif: Inicio muestra la obra con el progreso guardado y reanuda en el punto de lectura.

### QAw3 Intercalar entre servidores: dos módulos y cambio de fuente `[FE/QA · Intermedia · N3]`

- [ ] Abrir la aplicación web; aparece la sección de Inicio.
- [ ] Instalar **2 módulos** en caso de que no haya ninguno (los módulos necesarios para la prueba).
- [ ] Navegar a la sección **Descubrir**.
- [ ] Por defecto se debe cargar un módulo si hay alguno instalado.
- [ ] Seleccionar en los filtros para cambiar de módulo.
- [ ] Verificar que cargan correctamente los mangas del **segundo** módulo.
- Verif: el filtro de módulo cambia la fuente y la rejilla muestra series del módulo elegido, sin errores y sin mezclar resultados del anterior.

---

## Verificación final

### F28 Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12) — restante `[FE/QA · Baja · N2]` 🧍

- [x] Parte web hecha (2026-11-02): `f28Screens.cjs`, 34 capturas en `docs/capturasF28/`, comprobaciones de `AGENTS.md` §5 y lista de 20 s; informe en `design/stitch/F28-verificacion.md`; diferencias en `DIFFS.md` — detalle en `todo.archive.md`
- [ ] 🧍 Capturas en POCO F5 Pro y MiBox 4 (AC-12 no se cierra sin dispositivo)

### Checkpoints pendientes de 🧍 revisión

- [ ] Checkpoint H (respaldo): exportar/importar sin pérdidas ✅ y módulos no se instalan solos ✅; falta 🧍 revisión
- [ ] Checkpoint P-B (móvil): falta AC-6 en MiBox 4 (F37) y 🧍 revisión
- [ ] 🚩 Checkpoint P-E — Fin de la Parte 2: pantallas verificadas y diferencias registradas · AC-12 y AC-13 completos · 🧍 Revisión y publicación v1

---

## Deudas

- [ ] **Configurar `expo-updates` (OTA)** (decisión del humano, 2026-11-05): añadir `updates.url`, política de `runtimeVersion`, proyecto/canal de EAS, build de prueba y verificación de una actualización real. **Bloqueada (2026-11-06):** necesita la cuenta de Expo/EAS del humano (login interactivo, proyecto y canal); se retoma en una sesión con el humano. Mientras no exista, Expo Go avisa «expo-updates system is disabled…»; no afecta al desarrollo.

### Puertos futuros de `legacyModulos/` (decidido 2026-10-24: solo TMO en T31; los demás, tareas separadas a priorizar)

> Detalle completo (estado del legado por módulo) en `todo.archive.md`, bloque de T31. Bloqueos: `details`/`pages` de m440 y FoxManga usan Playwright/JS render (el host no tiene navegador); NineManga y Luscious sin `details`/`pages` en el legado; Yupmanga con anti-bot a nivel TLS (`BLOCKED` en la v1, P-8); TmoHentai vacío. Priorizar solo cuando el host soporte navegador o cambie el sitio.

---

## 🧍 Verificaciones humanas pendientes (consolidado)

> Reunidas de los bloques completados de `todo.md` antes de archivarlos; no son tareas nuevas, son los restos 🧍 de tareas ya implementadas.

- **AC-12 por pantalla (F28):** capturas de todas las pantallas en POCO F5 Pro y MiBox 4 (las móviles F11–F21 solo están verificadas en web; F16/F16b/F12/F15/F15b/F13/F14a-c/F11 sin verificación de dispositivo).
- **AC-6 y memoria del lector (F37):** 60 páginas en MiBox 4 sin OOM; medir precarga con `adb shell dumpsys meminfo` para fijar `READER_IMAGE_BUDGET_MB` (P-90/P-45).
- **Respaldo en teléfono (F21a/F21b/F30):** compartir el archivo exportado con la hoja del sistema, importar un archivo real y copiar el informe de diagnóstico en el POCO/S25.
- **Zonas seguras (F34):** comprobar muesca, barra de estado y gesto inferior con `react-native-safe-area-context` en el POCO y el S25.
- **F16/F12:** primer uso completo y confirmación reforzada de un módulo `script` en dispositivo (parcialmente cubierto por F32: YupManga reinstalado con huella SHA-256 y «mantén pulsado»).
- **FB1:** revisión humana del plano de pantalla (`docs/screen-blueprint.md`).
- **T35:** PR de prueba que rompe el contrato y hace fallar el CI.
- **F33 (R1):** hoja «Actualizar módulo» (a la espera de una actualización real), hojas de Respaldo, diálogos de error nativos y modo paginado I → D.
- **F17:** confirmar en el dispositivo qué persiste tras reinicio (favorito, carpeta, release preferida).
- **Bloqueadas por cuenta/entorno del humano:** `expo-updates` (cuenta EAS), extensión en Chrome/Firefox con aviso real del navegador, AC-10 en tu navegador.
