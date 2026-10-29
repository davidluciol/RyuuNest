# MEMORY.md: RyuuNest

Memoria del proyecto para cualquier agente. Solo hitos, decisiones vigentes y pendientes. Alcance en `SPEC.md`; reglas de trabajo en `AGENTS.md`; plan y tareas en `tasks/{plan,todo,complexity}.md`.

**Mantenimiento:** al cerrar un hito, añadir o editar su línea en §2 (no una entrada por sesión). Decisión que cambia: marcar `Reemplazada por P-xx`. Pregunta respondida: pasa de §4 a §3. Al fusionar ramas, renumerar IDs si colisionan. IDs canónicos: `P-n` aquí, `D-n` en SPEC §5.4. No registrar comandos, conteos de tests ni errores corrientes.

## 1. Estado (2026-10-28)

- **Parte 1 (núcleo):** T01–T30, T25b, T31, T32a y **T36** hechos; T05 🟡 (falta tope de imágenes y RNF-1 en release); T32b–T35 pendientes. Checkpoints A–F cerrados; **G y H** esperan revisión humana.
- **Parte 2 (diseño/front):** F01–F11, F11b, F13, F14a/b/c, F15, F15b, FB1, F16, F16b, F16c, F12, F20, **F29** y **F21a/F21b/F21c** hechos. **Checkpoint P-A** (tras F01–F10) esperando revisión humana. Marcos de F11 y pantallas sin verificar en el POCO.
- **F18 y F19 (Lector) hechas** en una sola rama (`feature/F18-F19-reader`, por decisión del humano, un PR); la ficha F17 ya lee datos reales. Falta la prueba en el POCO y AC-6 en MiBox (ver §4).
- **F16 (Fuentes) hecha** (rama `feature/F16-sources`, PR abierto); falta la prueba en el POCO. **F16b** (interruptor de protección, Ajustes mínima), **F16c** (repo oficial por defecto) y **F12** (primer uso) hechas en `feature/F16b-F12-oficial-onboarding`; falta el POCO.
- **FB2 y F30 hechas** (rama `feature/FB2-F30-diagnostics`, 2026-10-29): diseños de Diagnóstico/vacíos y la pantalla Ajustes → Diagnóstico; queda **F34** (correcciones UX/UI transversales, Alta, N4) y F31 (integrar errores en pantallas).
- Suite en verde (~800 tests), CI activo, Graphify indexado.

## 2. Hitos

- **Base:** monorepo pnpm `packages/{core,module-sdk,test-site,ui-tokens}` + `apps/mobile` (Expo SDK 57) + `tools/eslint-plugin-ryuunest`; TS estricto, ESLint, Prettier, Vitest, CI (T01–T04).
- **Contrato y host:** tipos, puertos, `ModuleHost` (permisos por dominio, 15 s, 4 simultáneas, 250 ms), validadores de manifest/índice (T06–T09).
- **Pruebas y SDK:** `test-site` con dos sitios falsos (HTML+CSS y JSON+cursor), arnés `runContract`, CLI del SDK con plantillas (T10–T11, T32a).
- **Instalación:** `RepoRegistry`, `PackageInstaller` (HTTPS, SHA-256, zip-slip, topes), `ModuleRegistry`, `InstallFlow` con confirmación manual (T12–T15; AC-8).
- **Runtimes:** declarativo + transforms, script (`ScriptLoader`), `createModuleApi` con errores contenidos y mapeo central (T16–T20).
- **Datos:** SQLite vía `SqlDriver`, esquema §8.1 con migraciones, favoritos/carpetas, consultas keyset (<300 ms con 3000 series), prefs por serie, quitar serie de biblioteca (T21–T24, T25b).
- **Lector (headless):** progreso atómico, capítulo leído, máquina de estados con ventana de memoria (T25–T27).
- **Respaldo JSON:** exportar, importar (validar/fusionar/reemplazar/sugerencias) y E2E sin pérdidas (T28–T30).
- **Módulos externos:** repo `davidluciol/RyuuNest-Models` con 3 módulos (zonatmo, yupmanga, m440); descarga verificada en vivo; validador acepta `details`/`pages`; módulo TMO local retirado (T31, P-78–P-82).
- **Diseño 6a:** `ui-tokens` + tema Dragon Night, puertas AC-13 en CI, fuentes/iconos locales, escala y layout por densidad, galería web, componentes base 1 y 2, dragón marcador, lint de diseño, i18n (F01–F10).
- **Pantallas 6b:** shell con Expo Router (F11), Inicio (F13), Biblioteca conectada a SQLite (F14a–c), Descubrir sobre runtime real (F15) y conectado al registro de módulos instalados con recuerdo del último módulo (F15b), plano de pantalla `docs/screen-blueprint.md` (FB1), e2e del shell estabilizado con marcadores `screen-<id>` y un guard que evita que se pudra (F11b).
- **Fuentes (F16):** pantalla con repos, módulos por tipo, instalar con confirmación (permisos y huella; `script` exige mantener pulsado), gestionar, actualizar con reconfirmación (RF-6), desinstalar y quitar repo (RF-8). Núcleo ampliado con `PackageInstaller.prepare` e `InstallFlow.previewUpdate/applyUpdate`; `SecureLock` real con `expo-local-authentication`; web con servicio en memoria.
- **Ajustes mínima + repo oficial (F16b/F16c):** pantalla `screen-settings` con la sección Seguridad (interruptor de `security.installProtection`, aviso sin bloqueo) y la fila de restaurar el repo oficial (P-85); componente `Switch`. Al entrar en Fuentes sin repos, la app registra sola el repo externo (`ensureOfficialRepo`, primera parte sin bloqueo); quitarlo recuerda el descarte y el vacío explica cómo recuperarlo.
- **Primer uso (F12):** flujo de 3 pasos (bienvenida, repo con URL del oficial puesta, instalar con la hoja compartida de Fuentes) con «Saltar»; sustituye a Inicio en el primer uso real (`onboarding.completed`); en la galería, montaje interactivo (`OnboardingSample`) y e2e con AC-8 comprobado.
- **Ajustes (F20, 2026-10-28):** `SettingsService` persiste `settings.nsfwVisible` y `settings.defaultReaderMode`, mantiene español como único idioma de v1, notifica cambios a Biblioteca/Descubrir, entrega el modo global al lector como fallback y vacía cachés de memoria/disco mediante `expo-image`. La UI omite OLED, zonas táctiles, precarga configurable y temas; no inventa cifras de almacenamiento.
- **F17 (Serie):** ficha dinámica desde Descubrir con metadatos, descripción, CTA, favorito, gesto largo para carpeta, búsqueda/orden de capítulos y estados sin leer/en curso/leído; la release preferida se conserva en el estado de la ficha hasta integrar persistencia y lector.
- **Lector (F18/F19, 2026-10-28):** ruta `reader/[moduleId]/[seriesId]/[chapterId]?release=` a pantalla completa; vertical continuo (solo se montan las imágenes de `snapshot.window`) y paginado D→I / I→D con zonas táctiles (laterales invertidas en D→I); barras `elevated` al 95 % sin animaciones; hojas de modo y de capítulo; tarjeta de siguiente capítulo; progreso con retraso (800 ms) y al salir, reabre en la página exacta; imágenes con `ImageRef.headers`, reintento por imagen con detalle técnico, zoom con pellizco, pantalla encendida y precarga a disco. La ficha (F17) lee `details()`, progreso y leídos de la misma `ReadingSource` y abre el lector. Verificado con Playwright (`tests/e2e/reader.cjs`, 426 y 1440 px).
- **F17 verificada (2026-10-28):** tras limpiar `metro-cache`/`haste-map-*`, Metro arrancó con caché vacía; la ficha fuera de `(tabs)` pasa Playwright a 426 y 1440 px sin overflow, errores de consola ni peticiones externas. La portada de ejemplo usa el SVG local del marcador.
- **T36 (2026-10-28):** núcleo de diagnóstico (P-72) en rama `feature/T36-diagnostics-log` (PR #49): migración 2 con tabla `log`, `createLogStore` (`record`/`list`/`clear`/`export` JSON+texto, tope 500) y saneado estricto (URLs, cabeceras con credenciales, HTML, rutas locales; truncado). 16 tests; core 419 en verde.
- **F29 (2026-10-28):** componentes de error (P-72) en rama `feature/F29-error-components` (PR #50): `Toast` (4 s, una línea, acción opcional), `ErrorBanner` (inline, código visible, detalle desplegable) y `ErrorDialog` (nivel 2, detalle expandible, cerrar/reintentar); lógica pura en `errorNoticeStyles.ts` (11 tests). `Button` ganó `testID`; `ModuleRow` ganó `hint`. Sin diseño en Stitch (P-30).
- **F21 (2026-10-28):** respaldo en Ajustes (RF-37/RF-38) en rama `feature/F21-backup-ui` (un commit, P-102): F21a exportar/compartir, F21b importar (merge/replace con confirmación explícita; «Importar respaldo» habilitado en el paso 2 del primer uso en TV y en la galería/web) y F21c hoja de sugerencias tras importar (repos filtrados, nada se instala solo, AC-8). Dependencias nuevas autorizadas: `expo-sharing`, `expo-file-system`, `expo-document-picker` (SDK 57, P-93). 23 tests nuevos; e2e `backup.cjs` en verde a 426 y 1440 px (capturas en `docs/capturasF21/`); e2e de settings y onboarding ampliados y en verde. Sin diseño en Stitch (P-30); prompt para generarlos en `design/stitch/PROMPT-FB2-respaldo-errores.md`.
- **FB2 + F30 (2026-10-29):** el humano ya había añadido en Stitch el banner/toast y el diálogo bloqueante (`8c1457c`); esta sesión compuso los que faltaban (Diagnóstico lista/confirmación/vacío, fila de Ajustes y estados vacíos) con `stitch-design-taste` + `ui-ux-pro-max` y los renderizó a PNG. F30: ruta `/diagnostics`, `formatLogEntries` en el núcleo, servicio/flujo/controlador/vista puros, `LogEventRow` en la galería, `expo-clipboard`. e2e `diagnostics.cjs` en verde (426 y 1440 px, capturas en `docs/capturasF30/`). Chip y EmptyState se corrigieron (caían a serif); el resto va a F34.

## 3. Decisiones vigentes

**Producto**
- P-1 Nombre **RyuuNest**, público y abierto a la comunidad. P-4 GPL-3.0.
- P-2 Todo el scraping en el dispositivo; sin servidor ni cuentas. P-3 APK directo y PWA, sin tiendas.
- P-5 React Native (Expo) con variante TV; web como cliente aparte con extensión de navegador.
- P-6 Módulos `.zip` (`manifest.json` + código + hash), dos niveles (declarativo/script); la app se distribuye sin módulos.
- P-7 La v1 no trae sincronización ni descargas; respaldo en JSON. P-8 Anti-bot: se informa `BLOCKED`, resto a v2.
- P-16 Contador de no leídos y «Completado» van a v2; tipo `manhwa` añadido. P-27 Filtros con los 4 tipos.
- P-21 Segundo sitio real aplazado: el contrato se valida con el sitio falso JSON+cursor; el real se elige antes de la 1.0.
- P-23 Límites de módulo (SPEC §7.1): paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos.
- P-70 «Leyendo» = serie con fila en `progress`. P-73 Quitar serie borra favorito, progreso y leídos; conserva `series`/`series_pref` como caché.
- P-72 Errores: toast (transitorio), modal (bloqueante), banner inline (módulo), EmptyState (sin datos); tabla `log` en SQLite (tope 500, redacción estricta), export JSON+texto en Ajustes → Diagnóstico; sin telemetría.
- P-29 La v1 trae solo Dragon Night. P-31 `accent-alt` no se usa. P-30 Pantallas sin diseño: se componen con `DESIGN.md` y se marcan «sin diseño».
- P-11/P-60 UI en español con catálogo plano `es.json`; clave o parámetro faltante lanza; los valores de API no son copy.

**Identidad y entorno**
- P-71 Repo en `davidluciol/RyuuNest` (sin org), scope npm `@ryuunest`, sin dominio en la v1, `applicationId` `io.github.davidluciol.ryuunest` (ya en `app.json`).
- P-78 Módulos en repo externo `RyuuNest-Models`: carpeta por sitio con `manifest.json` + `module.js`; apoyo solo en `bin/`.
- P-9 Desarrollo con Opencode, ~4 h en días laborales, sin fecha límite. P-44 Pruebas en POCO F5 Pro y Galaxy S25 Ultra; **MiBox 4 (Android 9, 2 GB) sigue siendo el piso** pero sin pruebas por ahora (P-43). P-45 El tope de imágenes se mide en teléfono y queda provisional.

**Arquitectura del núcleo**
- P-37 `module-sdk` → `core` (solo tipos). P-46 Validadores inyectados en `core`. P-47 `@noble/hashes` en `core`. P-48 `Http.bytes()`.
- P-49 `InstallFlow` es el único punto de instalación, exige confirmación y no pisa módulos instalados.
- P-50 Transform `path` devuelve el último segmento. P-53 `createModuleApi` devuelve `{api, lastError()}`; mapeo de errores en `errorMapping.ts`.
- P-55 `Storage` sigue clave-valor; el dominio relacional usa `SqlDriver`; tabla `kv` temporal; migraciones con `PRAGMA user_version`; pruebas con `node:sqlite`.
- P-56 Cursor keyset, NSFW oculto en la consulta del núcleo, `reader_mode` con 3 valores. P-61/P-63 Páginas base 0; el estado del lector declara la ventana de memoria (constantes provisionales).
- P-64/P-68/P-69 Respaldo: SPEC §8.3 extendido, importación con tope 50 MB y fusión por `updated_at` (empate gana lo local, settings gana lo local), `importBackup` devuelve resultado en vez de lanzar, repos/módulos solo como sugerencias.
- P-74/P-75/P-76 Cambios aditivos de API de T31 (`HostResponse.url`, errores tipados por forma en scripts, `estimatedHasNext` en el arnés). **Se revisan en T32b.**
- P-82 `capabilities` admite `details` y `pages` (informativas).

**UI**
- P-54 Separación de rejilla en tablet: 16 px. P-57 Dragón marcador 48/96. P-58 Marcador = silueta SVG original (el arte final será de un artista, FA1). P-59 Lint de diseño propio (solo `apps/*/src`, no tests).
- P-65/P-66 Expo Router permitido; sin excepciones a la antigüedad mínima de paquetes (Router 57.0.28).
- P-79 Biblioteca: `expo-sqlite ~57.0.4`, web con datos de ejemplo, nativo con SQLite y base vacía real. P-81 Descubrir se ejercita con el runtime real sobre `test-site`.
- P-83 Descubrir habla con `DiscoverDataSource`: en el dispositivo lista módulos **instalados** (`ModuleRegistry` + `createModuleApi` + `Http` sobre `fetch`); en web usa los ejemplos de `test-site`. El último módulo persiste en `setting` (`discover.lastModule`) solo en nativo. Los módulos `script` **no se listan** hasta que la app tenga su `ScriptLoader` (sin `eval`/`new Function`: Hermes no los admite y rompería el modelo de seguridad del `Host`).
- P-84 Fuentes (F16): `@ryuunest/module-sdk` pasa a dependencia de workspace de `apps/mobile` (validadores inyectados al núcleo, respeta P-37/P-46); `expo-local-authentication ~57.0.3` para `SecureLock` (docs SDK 57, `docs.expo.dev/versions/v57.0.0/sdk/local-authentication`). RF-7: ajuste `security.installProtection` en `setting`, apagado por defecto; activo, añadir repo e instalar/actualizar a `script` piden el bloqueo y, **sin bloqueo en el dispositivo, falla cerrado**. Sincronizar un repo ya registrado no pide bloqueo. Cambio aditivo del núcleo: `prepare()` (verifica sin guardar) y `previewUpdate/applyUpdate`. Sin diseño en Stitch para las hojas (P-30); se omiten «Importar respaldo» (F21b), «Seguridad del Nido» y «Escanear QR».
- P-85 Repo oficial por defecto (F16c, decisión del humano 2026-10-27): al entrar en Fuentes con cero repos, la app registra sola el repo `davidluciol/RyuuNest-Models` y muestra sus módulos; es de **primera parte**, así que registrarlo o restaurarlo **no pide bloqueo** (RF-7 protege los repos que añade el usuario). Quitarlo recuerda el descarte (`setting` `sources.officialRepoDismissed`): no vuelve a añadirse solo; el estado vacío de Fuentes lo explica y **Ajustes lleva la fila «Restaurar»**. Si la descarga falla, Fuentes queda en el vacío con aviso. Pendiente: reflejarlo en SPEC §3.1/RF-2 y §7.2.
- P-86 Primer uso (F12, decisión del humano 2026-10-27): «Saltar» en cada paso (el wireframe no lo trae); en TV se omite «Importar respaldo» hasta F21b. Sin botón de pegar del portapapeles: necesitaría `expo-clipboard` (pendiente decidir). Nada se instala sin la confirmación de Fuentes (AC-8).
- P-87 Lector, dependencias (decisión del humano 2026-10-28): se autorizan `expo-image ~57.0.5` (cabeceras, caché a disco, `Image.prefetch`) y `expo-keep-awake ~57.0.2` (`useKeepAwake`); fuentes: `docs.expo.dev/versions/v57.0.0/sdk/keep-awake` y la documentación de expo-image vía Context7 (`/websites/expo_dev_versions`). **No** se autorizó `react-native-gesture-handler`: el zoom usa `PanResponder`. En react-native-web solo un **ancestro** del respondedor puede robarle el gesto, así que `ZoomableView` va por fuera del `Pressable` del lienzo.
- P-88 Lector, alcance (decisión del humano 2026-10-28): lector **y** ficha conectada. `ReadingSource` (`screens/reader/readingSource.ts`) une un `ModuleMounter` (instalados en el dispositivo; ejemplos de `test-site` en web; extraído de `discoverData.ts`) con un `SqlDriver` (SQLite en el dispositivo; `sessionSqlDriver` en memoria en web, que rechaza sentencias desconocidas). Favorito, carpeta y edición preferida de la ficha **siguen sin persistir** (F20/otra tarea). Web: páginas de ejemplo SVG locales en `assets/placeholder/page-*.svg` (registradas en `ASSETS.md`); progreso de ejemplo ch-2, página 3 de 4.
- P-89 Núcleo (aditivo): `ReaderState` acepta `defaultMode` (modo cuando ni la preferencia ni el tipo deciden; no se guarda como preferencia). La app pasa `FALLBACK_READER_MODE = "vertical"` hasta que F20 defina el ajuste global. El orden de lectura de capítulos se calcula por número (`readingOrder`), porque el contrato dice «más nuevo primero» pero el sitio falso entrega ascendente.
- P-90 Constantes provisionales del lector (a medir en el teléfono, P-45): guardado `PROGRESS_SAVE_DELAY_MS = 800`, columna `READER_MAX_WIDTH = 720`, zoom `MAX_ZOOM = 4`, precarga del siguiente capítulo `NEXT_CHAPTER_PRELOAD = PAGED_PRELOAD_AHEAD (2)` y `READER_IMAGE_BUDGET_MB = null` (sin cifra medida no se inventa un tope: la precarga va a disco).
- P-91 Ajustes F20 (decisión del humano 2026-10-28): aplicar el `SPEC` vigente y no los controles obsoletos de la captura; NSFW parte apagado, el idioma disponible es español, el modo global solo actúa cuando no hay preferencia por serie ni decisión por tipo, y vaciar caché usa `expo-image` sin mostrar tamaños inventados. Las claves nuevas son `settings.nsfwVisible`, `settings.language` y `settings.defaultReaderMode`.
- P-92 Cierre previo al merge del PR de F20 (decisión del humano 2026-10-28): añadir al TODO un recorrido real mínimo de instalación → Descubrir → ficha → primera imagen del lector (F32) y una revisión transversal observable de UX/UI (F33), integrando los hallazgos con las tareas pendientes existentes.
- P-93 Dependencias de F21 (decisión del humano 2026-10-28): autorizadas `expo-sharing ~57.0.24`, `expo-file-system ~57.0.7` y `expo-document-picker ~57.0.3` con `npx expo install` (SDK 57). En nativo, `backupFiles.native.ts` usa la API legacy de `expo-file-system/legacy` (estable en SDK 57; la nueva `File`/`Paths` queda para una futura migración).
- P-94 Respaldo en web (decisión del humano 2026-10-28): sin hoja del sistema — exportar descarga el JSON (`Blob` + ancla `download`) e importar usa `input type="file"`. La descarga es síncrona dentro del gesto del clic (un `await` intermedio la bloquea en algunos navegadores).
- P-95 F21b tras F29/T36 (decisión del humano 2026-10-28): F21b se bloqueó hasta existir los componentes de error (F29) y el núcleo de diagnóstico (T36); la sesión hizo T36 → F29 → F21 completa. F29 quedó sin diseño Stitch (P-30) porque FB2 es del humano; el prompt para generar los diseños está en `design/stitch/PROMPT-FB2-respaldo-errores.md`.
- P-96 UI del respaldo (decisión del humano 2026-10-28): sección «Respaldo» dentro de Ajustes (SPEC §11.5: «filas de ajustes y diálogo de confirmación»), sin diseño en Stitch por ahora; al cerrar la tarea se genera el prompt para Stitch (hecho, ver P-95).
- P-97 Importar: diálogo con dos opciones (decisión del humano 2026-10-28): hoja «Importar respaldo» con «Fusionar» (primario) y «Reemplazar» (destructivo); el reemplazo pasa por una segunda hoja de confirmación explícita antes de aplicar.
- P-98 Sugerencias (decisión del humano 2026-10-28): hoja justo después de importar con los repos y módulos del respaldo; se descartan los repos ya registrados; confirmar un repo lo registra (con su índice, RF-2); un módulo apunta a Fuentes (nunca se instala solo, AC-8). Si se cierra la hoja, las sugerencias se pierden (sin persistencia adicional).
- P-99 «Importar respaldo» en el primer uso (decisión del humano 2026-10-28): habilitado dentro de F21b en el paso 2 del onboarding en TV (SPEC §11.8 lo prioriza) y en la galería/web para poder probarlo; en el móvil nativo no aparece porque el respaldo ya está en Ajustes. La detección de TV es por `userAgent` (sin importar `react-native` en la ruta, para las pruebas).
- P-100 Ramas de la sesión (decisión del humano 2026-10-28): T36 en `feature/T36-diagnostics-log` (PR #49) y F29 en `feature/F29-error-components` (PR #50), cada una con su PR; F21 en `feature/F21-backup-ui`.
- P-101 Alcance de la sesión (decisión del humano 2026-10-28): F21 completa (F21a → F21b → F21c) en una sola sesión, una tras otra, con el ciclo TDD en cada una.
- P-102 F21 en un solo commit (decisión del agente 2026-10-28, anotada para el humano): la división en tres commits (F21a/F21b/F21c) quedó **reemplazada** por un commit único en `feature/F21-backup-ui`, porque las tres sub-tareas comparten capa de datos (`backupData.ts`), flujo (`backupFlow.ts`), controlador (`backupController.ts`) y hojas (`BackupSheets.tsx`); un corte intermedio no compilaría solo ni sería un rollback limpio. La división lógica queda en `tasks/todo.md` y en el mensaje de commit.
- P-103 Alcance de FB2/F30 (decisión del humano 2026-10-29): FB2 + F30 en una sesión; no se realinea F29 con los nuevos diseños de Stitch (queda en F34). Los diseños nuevos se generan como HTML local (`design/stitch/_shared/dragon-night.css`) + PNG con Playwright, sin Stitch en línea.
- P-104 `expo-clipboard ~57.0.2` autorizada por el humano (2026-10-29) para «Copiar informe» (docs `docs.expo.dev/versions/latest/sdk/clipboard/` vía Context7 `/websites/expo_dev`; `setStringAsync`). Puerto `data/clipboard{,.native}.ts`; en web, `navigator.clipboard`. Desbloquea también el «pegar» pendiente de P-86.
- P-105 Diagnóstico (F30, agente): ruta `/diagnostics` fuera de pestañas, con «volver» por `router.dismissTo("/settings")` (un enlace directo no deja historial); confirmación de borrado en `SheetModal`; fallos con texto fijo (el mensaje técnico no se enseña); informe en texto o JSON con el mismo formato que el núcleo (`formatLogEntries`). Un módulo `.native.ts` **no** debe importar de su hermano `.ts` (Metro lo resuelve a sí mismo): los tipos/utilidades compartidos van en un módulo aparte (`diagnosticsReport.ts`).
- P-106 Una sola tarea de correcciones UX/UI (F34, decisión del humano 2026-10-29): Alta, N4 `claude-sonnet-5-5`, skills `ui-ux-pro-max` + `stitch-design-taste`; agrupa los hallazgos previos y los nuevos (fuentes en serif, toast, interruptor, filas, escritorio, confirmación unificada, zonas seguras, token mono, puerta de i18n).
- Convenio de pruebas: cada pantalla raíz declara `testID="screen-<id>"`; los e2e esperan ese marcador (`tests/e2e/markers.cjs`) y un guard falla si una ruta de destino no es marco ni lo declara.

**Proceso**
- P-12 Diseño base: plantilla Stitch «RyuuNest Dragon Nest Themed UI». P-14 Autoridad: SPEC, `DESIGN_RULES.md`, `DESIGN.md`, PNG, HTML, `IDEA.md`.
- P-15 Reglas del agente en `AGENTS.md` (preguntar ante la duda, componentes reutilizables, verificar con Playwright, actualizar este archivo). P-41 **TDD estricto obligatorio** (rojo → verde, commit por corte).
- P-17 pnpm + Vitest. P-18 `test-site` como paquete reutilizable. P-24 Tracker `bd` local, migrar a GitHub Issues. P-28 Verificación visual: galería web + Playwright, y capturas en dispositivo para AC-12.
- P-34 Tooling: `typescript@6` fijado (`typescript-eslint` no soporta 7), `eslint@10`, `prettier@3`, `vitest@5`. P-36 Host: `htmlparser2@12`, `css-select@7`, `domhandler@6`. P-42 `@types/node` como devDependency en `module-sdk`.

## 4. Pendientes y sugerencias

### Del humano
- 🧍 **Prueba y captura en el POCO F5 Pro** (cierra F11/AC-12; también F13, F14c con base vacía y F15/F15b; la prueba de Descubrir con un módulo instalado necesita F16). *Sugerencia:* una sola sesión con el APK compilado para todas las pantallas.
- 🧍 **Medir el tope de imágenes** (P-45) con el panel de `apps/mobile` y **revalidar RNF-1 (<3 s)** con APK compilado; las mediciones previas son de la app en desarrollo (POCO 4580 ms, S25 1940 ms, MiBox 5600 ms). Con eso se cierra T05 y se ajustan las constantes de P-63.
- 🧍 Reservar el org npm `@ryuunest`.
- 🧍 Revisar y fusionar PRs abiertos (F15, F15b, F11b, P-82 y la cadena FB1/F14c/retiro de TMO) y pasar los Checkpoints **G, H y P-A**.
- 🧍 Verificar que `modules/{AGENTS,README,NOTES}.md` estén copiados al repo `RyuuNest-Models` (están ignorados por git aquí) y ejecutar los módulos reales en el dispositivo (selectores y rutas nunca se contrastaron con los sitios reales desde el entorno del agente).
- 🧍 **Diseño en Stitch (FB2):** revisar los diseños nuevos de `design/stitch/*_dragon_night/` y, si quieres versiones hechas en Stitch, regenerarlas. Siguen sin diseño: primer uso, confirmación de instalación y hoja de filtros.
- 🧍 **F30 en el POCO:** exportar el informe (hoja del sistema) y copiarlo al portapapeles; el registro real estará vacío hasta F31.
- 🧍 **F34:** elegir la fuente monoespaciada local (OFL) para códigos y detalle técnico, y confirmar en el POCO el posible fallo nativo de `backupFiles.native.ts`.
- 🧍 Encargar el arte final del dragón (FA1). Validar los textos `state.error.library.*` (sin diseño).

- 🧍 **F16 en el POCO:** añadir un repo real, instalar un módulo declarativo y uno `script` (confirmación reforzada y bloqueo del dispositivo con la protección activada a mano en `setting`). Incluir F16b/F16c/F12: el repo oficial debe aparecer al entrar en Fuentes, el interruptor de Ajustes con bloqueo real y el primer uso al arrancar sin nada.
- 🧍 **Lector en el POCO (F18/F19):** abrir un capítulo real, cambiar de modo, pellizcar para ampliar, comprobar que la pantalla no se apaga, romper una imagen (modo avión) y reintentarla, y medir la memoria con `adb shell dumpsys meminfo` durante la precarga; con eso se fija `READER_IMAGE_BUDGET_MB`. **AC-6** (60 páginas verticales en la MiBox 4 sin cierres) sigue pendiente de ese equipo.
- 🧍 **Pregunta abierta (cabeceras de imagen, RF-24):** el runtime **declarativo** no tiene forma de declarar `Referer`/`User-Agent` de las imágenes; solo los módulos `script` devuelven `ImageRef.headers`, y la app aún no carga scripts en el dispositivo. El lector ya las aplica cuando llegan. Opciones: (a) ampliar el formato declarativo con `pages.imageHeaders` (recomendada; revisarlo en T32b antes de congelar la API 1.0), (b) mandar siempre `Referer: baseUrl` desde el host, (c) esperar al `ScriptLoader` de la app.
- 🧍 **`app.json` está en `0.0.0`**: por eso `useSourcesData` no pasa `appVersion` al validador; un módulo con `minAppVersion` mayor se rechazaría entero. Fijar la versión de la app antes de publicar módulos con `minAppVersion`.
- 🧰 El script e2e de F20 quedó preparado, pero no se ejecutó con Playwright porque el entorno no incluye el paquete y no se añadió una dependencia. La auditoría interactiva del export web sí comprobó la pantalla, el cambio NSFW, Biblioteca/Descubrir, overflow, consola y red.
- 🧍 Antes de fusionar el PR de F20, ejecutar F32 con un módulo declarativo real y completar F33 con la revisión general UX/UI; no dar por suficiente la verificación sobre fixtures o el export web.

### Del agente (orden sugerido)
1. **T32b:** ADR de congelación de la API 1.0 (revisa P-74/P-75/P-76, resuelve las preguntas técnicas de SPEC §17.2 y fija el segundo sitio real, P-21). *Sugerencia:* hacerlo antes de que crezca el repo de módulos externo para no romper módulos publicados.
2. **Biblioteca (restos de F14):** pasar `reading: true` al núcleo, hoja de filtros real (tipo/fuente son chips placeholder), menú de orden (hoy cicla al pulsar) y nombre visible de la fuente desde `ModuleRegistry`.
3. **F34 (correcciones UX/UI transversales, Alta, N4):** empezar por «fuentes en serif» y el posible fallo nativo de F21 (bloqueantes); ver `tasks/todo.md`.
4. **Errores y diagnóstico:** F31 (integración de toast/modal/banner en F15/F16/F21/lector con registro en `log`; F21 ya usa el diálogo de rechazo). F30 ya lee el registro real, hoy vacío.
5. **Lector y ajustes:** F18/F19 hechas; falta F22 (lector en TV, D-pad). Siguen F24 (cliente web/riel), F25 y el resto de Parte 2 (ver `tasks/todo.md`).
6. **T35:** calibrar políticas del host (`HOST_DEFAULTS`: 15 s, 4, 250 ms) con mediciones y cerrar el checkpoint de la Parte 1.
7. **Plataforma:** la app nativa aún no rellena `HttpResponse.url` (P-74). Migrar las filas `kv` de repos/módulos a tablas `repo`/`module` y retirar `kv`. Dar a la app un `ScriptLoader` propio para poder listar y montar módulos `script` en el dispositivo (T18, D-5).
8. Portar a módulos del repo externo los demás sitios de `legacyModulos/` (bloqueos: render JS, anti-bot TLS, código incompleto; detalle en `tasks/todo.md`). Búsqueda global de cabecera: pendiente de F15.
9. `react-native-tvos` sin confirmar contra SDK 57 (pospuesto con P-43). Si los `paths` entre paquetes se complican al crecer, migrar a *project references* de TypeScript.

### Limpieza menor
- Revisar o descartar `stash@{0}` (cambios viejos de `tasks/todo.md`) y borrar a mano el worktree residual de F07 en `~/.local/share/opencode/worktree/`.
- **Actualizar `AGENTS.md`:** pide una entrada de bitácora por sesión (P-15); este archivo ya no la lleva.

## 5. Avisos operativos

- `pnpm add --filter X` poda los `node_modules` de otros paquetes: correr `pnpm install` completo después.
- Metro resuelve `@ryuunest/core` por su `dist`: tras tocar `packages/core/src`, `pnpm --filter @ryuunest/core build` y reiniciar Metro (`--clear` si no recoge el cambio), o la web falla con símbolos `undefined`. Playwright está instalado globalmente: `PLAYWRIGHT_MODULE=%APPDATA%\npm\node_modules\playwright`.
- La puerta de i18n compara subcadenas: un valor de catálogo como «Error», «Info» o «JSON» choca con `ErrorState`, `Info` o `JSON.stringify` (F34 la afina).
- Tras tocar `ui-tokens`, `pnpm --filter @ryuunest/ui-tokens build` antes de `expo export` (Metro usa `dist`).
- Con `core.autocrlf` `pnpm format` reescribe todo el repo: usar `prettier --end-of-line auto` por archivo.
- `typecheck` de mobile usa `--stack-size=32000` (TS 6 agota el stack). Correr export, typecheck, lint y tests pesados **en secuencia**, no en paralelo.
- Las pruebas visuales de la galería van contra Metro (un export `--dev` estático falla por HMR). Los e2e viven en `apps/mobile/tests/e2e/` y piden Playwright (`PLAYWRIGHT_MODULE`).
- Vitest no parsea `.tsx` de React Native: la lógica de color/forma va en `*Styles.ts` puros.
- No escribir `apps/*/src` dentro de un JSDoc (el `*/` cierra el comentario).
- El scrubber de secretos del entorno reemplaza por `"***"` el valor de un literal escrito como `NOMBRE_KEY = "literal"` al guardar con la herramienta de edición. Si una cadena «desaparece», revisar los bytes del archivo antes de sospechar del código; se evitó renombrando a `*_SETTING` y construyendo la cadena con `join`.
- Metro en modo CI (`CI=1 npx expo start --web --port 8082`, el único que arranca en segundo plano) **no vigila ficheros**: tras editar `src/` hay que reiniciarlo (el primer acceso compila el bundle, 15–45 s con caché; ~2 min con `--clear`) y no solapar el arranque con el comando que mata el proceso anterior. `onboarding.cjs` usa `GALLERY_URL` (por defecto 8081).
- Los e2e que ya existen vuelven a escribir sus capturas en `docs/capturasF*`: si salen modificadas tras ejecutarlos, revisarlas antes de incluirlas.
- Graphify: reindexar tras tareas grandes; `graphify-out/cache/` está ignorado. OpenCode carga `.opencode/plugins/` sin `opencode.json`.
