# MEMORY.md: RyuuNest

Memoria del proyecto para cualquier agente. Solo hitos, decisiones vigentes y pendientes. Alcance en `SPEC.md`; reglas de trabajo en `AGENTS.md`; plan y tareas en `tasks/{plan,todo,complexity}.md`.

**Mantenimiento:** al cerrar un hito, añadir o editar su línea en §2 (no una entrada por sesión). Decisión que cambia: marcar `Reemplazada por P-xx`. Pregunta respondida: pasa de §4 a §3. Al fusionar ramas, renumerar IDs si colisionan. IDs canónicos: `P-n` aquí, `D-n` en SPEC §5.4. No registrar comandos, conteos de tests ni errores corrientes.

## 1. Estado (2026-10-27)

- **Parte 1 (núcleo):** T01–T30, T25b, T31 y T32a hechos; T05 🟡 (falta tope de imágenes y RNF-1 en release); T32b–T35 pendientes. Checkpoints A–F cerrados; **G y H** esperan revisión humana.
- **Parte 2 (diseño/front):** F01–F11, F11b, F13, F14a/b/c, F15, F15b, FB1, F16, F16b, F16c y F12 hechos. **Checkpoint P-A** (tras F01–F10) esperando revisión humana. Marcos de F11 y pantallas sin verificar en el POCO.
- **F16 (Fuentes) hecha** (rama `feature/F16-sources`, PR abierto); falta la prueba en el POCO. **F16b** (interruptor de protección, Ajustes mínima), **F16c** (repo oficial por defecto) y **F12** (primer uso) hechas en `feature/F16b-F12-oficial-onboarding`; falta el POCO.
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
- **F17 (Serie):** ficha dinámica desde Descubrir con metadatos, descripción, CTA, favorito, gesto largo para carpeta, búsqueda/orden de capítulos y estados sin leer/en curso/leído; la release preferida se conserva en el estado de la ficha hasta integrar persistencia y lector.
- **F17 verificada (2026-10-28):** tras limpiar `metro-cache`/`haste-map-*`, Metro arrancó con caché vacía; la ficha fuera de `(tabs)` pasa Playwright a 426 y 1440 px sin overflow, errores de consola ni peticiones externas. La portada de ejemplo usa el SVG local del marcador.

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
- 🧍 **Diseño en Stitch (FB2):** componentes de error, Ajustes → Diagnóstico, estados vacíos, y las pantallas sin diseño (primer uso, confirmación de instalación, hoja de filtros). Falta confirmar el orden.
- 🧍 Encargar el arte final del dragón (FA1). Validar los textos `state.error.library.*` (sin diseño).

- 🧍 **F16 en el POCO:** añadir un repo real, instalar un módulo declarativo y uno `script` (confirmación reforzada y bloqueo del dispositivo con la protección activada a mano en `setting`). Incluir F16b/F16c/F12: el repo oficial debe aparecer al entrar en Fuentes, el interruptor de Ajustes con bloqueo real y el primer uso al arrancar sin nada.
- 🧍 **`app.json` está en `0.0.0`**: por eso `useSourcesData` no pasa `appVersion` al validador; un módulo con `minAppVersion` mayor se rechazaría entero. Fijar la versión de la app antes de publicar módulos con `minAppVersion`.

### Del agente (orden sugerido)
1. **T32b:** ADR de congelación de la API 1.0 (revisa P-74/P-75/P-76, resuelve las preguntas técnicas de SPEC §17.2 y fija el segundo sitio real, P-21). *Sugerencia:* hacerlo antes de que crezca el repo de módulos externo para no romper módulos publicados.
2. **F17** (ficha de la serie: Descubrir aún no navega a ella). Después **F20** (completa Ajustes: la pantalla mínima de F16b ya existe y se amplía).
3. **Biblioteca (restos de F14):** pasar `reading: true` al núcleo, hoja de filtros real (tipo/fuente son chips placeholder), menú de orden (hoy cicla al pulsar) y nombre visible de la fuente desde `ModuleRegistry`.
4. **Respaldo en UI:** F21a (exportar/compartir), F21b (importar con errores y confirmación), F21c (sugerencias que descartan repos ya registrados).
5. **Errores y diagnóstico:** T36 (núcleo), F29 (toast/modal/banner), F30 (Diagnóstico), F31 (integración en F15/F16/F21/lector).
6. **Lector y ajustes:** F18 (render del lector y barra de progreso RF-41), F20 (ajustes globales; define las claves de `setting` y el modo de lectura por defecto). Siguen F12, F24 (cliente web/riel), F25 y el resto de Parte 2 (ver `tasks/todo.md`).
7. **T35:** calibrar políticas del host (`HOST_DEFAULTS`: 15 s, 4, 250 ms) con mediciones y cerrar el checkpoint de la Parte 1.
8. **Plataforma:** la app nativa aún no rellena `HttpResponse.url` (P-74). Migrar las filas `kv` de repos/módulos a tablas `repo`/`module` y retirar `kv`. Dar a la app un `ScriptLoader` propio para poder listar y montar módulos `script` en el dispositivo (T18, D-5).
9. Portar a módulos del repo externo los demás sitios de `legacyModulos/` (bloqueos: render JS, anti-bot TLS, código incompleto; detalle en `tasks/todo.md`). Búsqueda global de cabecera: pendiente de F15.
10. `react-native-tvos` sin confirmar contra SDK 57 (pospuesto con P-43). Si los `paths` entre paquetes se complican al crecer, migrar a *project references* de TypeScript.

### Limpieza menor
- Revisar o descartar `stash@{0}` (cambios viejos de `tasks/todo.md`) y borrar a mano el worktree residual de F07 en `~/.local/share/opencode/worktree/`.
- **Actualizar `AGENTS.md`:** pide una entrada de bitácora por sesión (P-15); este archivo ya no la lleva.

## 5. Avisos operativos

- `pnpm add --filter X` poda los `node_modules` de otros paquetes: correr `pnpm install` completo después.
- Tras tocar `ui-tokens`, `pnpm --filter @ryuunest/ui-tokens build` antes de `expo export` (Metro usa `dist`).
- Con `core.autocrlf` `pnpm format` reescribe todo el repo: usar `prettier --end-of-line auto` por archivo.
- `typecheck` de mobile usa `--stack-size=32000` (TS 6 agota el stack). Correr export, typecheck, lint y tests pesados **en secuencia**, no en paralelo.
- Las pruebas visuales de la galería van contra Metro (un export `--dev` estático falla por HMR). Los e2e viven en `apps/mobile/tests/e2e/` y piden Playwright (`PLAYWRIGHT_MODULE`).
- Vitest no parsea `.tsx` de React Native: la lógica de color/forma va en `*Styles.ts` puros.
- No escribir `apps/*/src` dentro de un JSDoc (el `*/` cierra el comentario).
- El scrubber de secretos del entorno reemplaza por `"***"` el valor de un literal escrito como `NOMBRE_KEY = "literal"` al guardar con la herramienta de edición. Si una cadena «desaparece», revisar los bytes del archivo antes de sospechar del código; se evitó renombrando a `*_SETTING` y construyendo la cadena con `join`.
- Graphify: reindexar tras tareas grandes; `graphify-out/cache/` está ignorado. OpenCode carga `.opencode/plugins/` sin `opencode.json`.
