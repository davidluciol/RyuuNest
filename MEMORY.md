# MEMORY.md: memoria del proyecto RyuuNest

> Para que cualquier agente conozca el proyecto aunque se cambie de herramienta. Guarda **solo lo importante**: decisiones, elecciones, recomendaciones e hitos.
> La funcionalidad y el alcance están en `SPEC.md`; las reglas de trabajo, en `AGENTS.md`. Aquí va lo que se decidió y lo que se hizo.

## Cómo se mantiene

- Cada sesión agrega **una entrada** a la bitácora (sección 5), la más reciente arriba.
- Una decisión que cambia no se borra: se marca `Reemplazada por D-xx` y se añade la nueva.
- No se registran comandos, errores corrientes ni cambios menores. Sí se registra todo lo que otro agente necesitaría saber para no repetir una discusión.
- Las preguntas se mueven de «abiertas» a «decisiones» cuando el humano responde.

## 1. Estado actual

- **Fase:** Fase 0 en curso (fundación) y Fase 1 en curso. Del plan de la Parte 1: **T01–T04 hechos**; **T05 en curso** (la app arranca en los 3 dispositivos; faltan los smokes de librerías); **T06–T11 hechos**. Próximo: **Checkpoint B** (revisión humana) y después T12.
- **Hecho:** documentación (`IDEA.md`, `SPEC.md`, `DESIGN.md`, `DESIGN_RULES.md`, 7 pantallas en `design/`, `AGENTS.md`, `MEMORY.md` en la raíz) y **monorepo** con `packages/core`, `module-sdk`, `test-site` y `ui-tokens`, más tooling (pnpm, TypeScript estricto, ESLint, Prettier, Vitest, CI) y prueba de humo en verde. Documentación base (T03: ADR-0001, `CONTRIBUTING.md`, `ASSETS.md`, DoD) y `design/` organizado (T04). Contrato, puertos, host, validadores, sitio falso y CLI del SDK (T06–T11).
- **Siguiente paso:** **Checkpoint B** (revisión humana de T06–T11) y, después, T12 (repos + `index.json`); cerrar T05 con los smokes de librerías.

## 2. Decisiones

Las decisiones de arquitectura D-1 a D-13 están en `SPEC.md` §5.4. Las de proceso y producto:

| ID | Fecha | Decisión | Motivo o alternativa descartada |
|---|---|---|---|
| P-1 | Oct 2026 | Nombre del proyecto: **RyuuNest**; público y con contribuciones de la comunidad | Falta verificar disponibilidad (SPEC §15) |
| P-2 | Oct 2026 | Todo el scraping corre en el dispositivo; sin servidor propio ni cuentas | Privacidad y sin costos de servidor |
| P-3 | Oct 2026 | Distribución por APK directo y PWA; sin tiendas | Evita revisiones de tiendas |
| P-4 | Oct 2026 | Licencia **GPL-3.0** (todos los derivados también abiertos) | Antes se había pensado MIT |
| P-5 | Oct 2026 | App en React Native (Expo) con variante TV; web como cliente separado con extensión de navegador | Capacitor + React quedó descartado; el humano había comparado Flutter y React Native |
| P-6 | Oct 2026 | Módulos como paquetes `.zip` con `manifest.json`, código y hash; en dos niveles (declarativo y script); la app se distribuye sin módulos | |
| P-7 | Oct 2026 | La v1 no incluye sincronización ni descargas; respaldo en JSON | Sincronización y descargas pasan a la v2 |
| P-8 | Oct 2026 | Sitios con anti-bot: se informa `BLOCKED` y se deja para la v2 | |
| P-9 | Oct 2026 | Se desarrolla con Opencode (planes Go y Zen), con unas 4 horas en días laborales y sin fecha límite; sin experiencia previa en React Native | De ahí la Fase 0 de calibración |
| P-10 | Oct 2026 | Dispositivos de prueba: POCO F6 Pro, Galaxy S25 Ultra y Xiaomi MiBox 4 (Android 9, 2 GB) | La MiBox fija el piso de rendimiento |
| P-11 | Oct 2026 | Interfaz en español al inicio, con cadenas externalizadas | |
| P-12 | Oct 2026 | El diseño es la plantilla de Stitch «RyuuNest Dragon Nest Themed UI»; las reglas contra el diseño genérico están en `DESIGN_RULES.md` | El arte final lo harán artistas; hoy hay marcadores generados con IA |
| P-13 | 2026-10-13 | Se eliminan `prd_ryuunest_v1.0.md` y `DESING.md_EspecificacionVisual.md` | Contradecían el SPEC y las reglas (obras reales, campana de avisos, sincronización, 4 temas) |
| P-14 | 2026-10-13 | Orden de autoridad: SPEC, `DESIGN_RULES.md`, `DESIGN.md`, PNG, HTML, `IDEA.md` | Evita que el agente siga el HTML sin depurar |
| P-15 | 2026-10-13 | Reglas del agente en `AGENTS.md`: preguntar ante la duda, componentes reutilizables, animaciones ligeras, verificar con Playwright y actualizar este archivo cada sesión | Pedido del humano |
| P-16 | 2026-10-13 | Contador de no leídos y filtro «Completado» pasan a la v2; se añade el tipo `manhwa` al contrato | Coherencia con `DESIGN_RULES.md` y con los filtros del diseño |
| P-17 | 2026-10-13 | Monorepo con **pnpm workspaces** y pruebas con **Vitest** | Confirmado por el humano al revisar el plan de la Parte 1 |
| P-18 | 2026-10-13 | El sitio falso de pruebas es un **paquete reutilizable** (`packages/test-site`) | Reutilizable por el SDK y por la galería; alternativa descartada: HTML dentro de `core/tests` |
| P-19 | 2026-10-13 | La app de calibración de dispositivos se mantiene en la Parte 1 (Fase 0) | Es la única tarea de la Parte 1 que toca Expo, por decisión del humano |
| P-20 | 2026-10-13 | ~~Límite de contenido descomprimido de un módulo: ≤ 150 MB~~ | **Reemplazada por P-23** |
| P-21 | 2026-10-13 | El **segundo sitio real** se aplaza: la generalidad del contrato se valida con un segundo **sitio falso** de arquitectura distinta (JSON + cursor); el sitio real se elige antes de publicar la 1.0 | **Aceptada por el humano**; ver `tasks/plan.md` §8 |
| P-22 | 2026-10-13 | ~~Seguimiento de tareas en tracker externo (GitHub Issues o `bd`)~~ | **Actualizada por P-24** |
| P-23 | 2026-10-13 | Límites de módulo: los del **SPEC §7.1** (paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos) | Se descarta subir a 150 MB por la defensa anti-bomba |
| P-24 | 2026-10-13 | Tracker: **`bd` local ahora**; migrar a **GitHub Issues** cuando exista el repositorio | El repo aún no existe ni el nombre está confirmado |
| P-25 | 2026-10-13 | `MEMORY.md` se mueve a la **raíz** en la Fase 0 | Coincide con SPEC §5.1 |
| P-26 | 2026-10-13 | La **Parte 2 (diseño/front-end)** se planifica en esta misma sesión, en `tasks/plan.md` §P2 y `tasks/todo.md` | Respuesta del humano |
| P-27 | 2026-10-13 | Los filtros de Biblioteca muestran los **cuatro tipos** (manga, manhua, manhwa, cómic) | Coherente con D-13; una opción más que el diseño |
| P-28 | 2026-10-13 | Verificación visual: **galería compilada para web con Playwright + capturas de dispositivo** para AC-12 | Playwright no controla la app nativa |
| P-29 | 2026-10-13 | La v1 trae **solo Dragon Night**, con tokens para más temas | Solo ese tema tiene las 7 pantallas |
| P-30 | 2026-10-13 | Las **pantallas sin diseño** se deciden más adelante | Se componen con `DESIGN.md` y se marcan «sin diseño» mientras tanto |
| P-31 | 2026-10-13 | `accent-alt` (violeta) **no se usa en la v1** | Confirmado por el humano |
| P-32 | 2026-10-13 | Las preguntas técnicas del SPEC §17.2 (Android mínimo con Expo, formato declarativo completo, librerías de TV/listas) se resuelven **durante la Fase T32** | Acordado por el humano |
| P-33 | 2026-10-13 | Repositorio **GitHub conectado** (`github.com/davidluciol/RyuuNest`) y primer commit subido | Resuelve en parte el nombre (falta organización/npm/dominio/`applicationId`) |
| P-34 | 2026-10-13 | Tooling de la Fase 0: `typescript@6` (fijado), `eslint@10`, `prettier@3`, `typescript-eslint@8`, `vitest@5` | `typescript-eslint` todavía no soporta TS 7.0 nativo, así que TypeScript se fija a la 6 |
| P-35 | 2026-10-13 | Los IDs de decisión **canónicos** son los de `MEMORY.md` §2 (`P-n`) y los del SPEC (`D-n`); los `P-n` locales de `tasks/plan.md` §3 quedan como históricos y **no se citan** | `plan.md` §3 y `MEMORY.md` §2 usaban `P-1…P-n` para decisiones distintas; se resuelve en `ADR-0001` |
| P-36 | 2026-10-13 | Librerías del host (P-5) fijadas: `htmlparser2@12`, `css-select@7`, `domhandler@6` en `packages/core` | `host.html()` (selectores CSS) sin APIs de plataforma; son JS puro y corren en RN |
| P-37 | 2026-10-13 | Dirección de dependencias: **`module-sdk` → `@ryuunest/core`** (solo tipos); `core` **no** depende del SDK | El contrato (SPEC §6) vive en `core`; el SDK lo reutiliza para validar |
| P-38 | 2026-10-14 | El **arnés de contrato** (`runContract`) vive en **`@ryuunest/test-site`**, no en `packages/core/tests/` (ver `tasks/plan.md` T10, «archivos probables») | Lo necesitan el núcleo (T17/T19) y el CLI del SDK (T11); así se reutiliza sin invertir la dependencia `test-site → core` (solo tipos) |
| P-39 | 2026-10-14 | El CLI del SDK usa `packages/module-sdk/src/node.d.ts` (declaraciones mínimas de Node) **en vez de añadir `@types/node`**, y reutiliza `fflate` (P-3) y `@noble/hashes` (P-4) para `pack` | `AGENTS.md` §7: no añadir dependencias sin preguntar; `core` ya usa el mismo patrón en `globals.d.ts` |
| P-40 | 2026-10-14 | Para `test`, el CLI carga el módulo script desde una copia `.mjs` temporal (en la carpeta del módulo, borrada al terminar) importada con `@vite-ignore` | Un `.js` sin `package.json` al lado sería CommonJS para Node; el runtime del núcleo (T18) cerrará la estrategia definitiva |
| P-41 | 2026-10-14 | **TDD estricto obligatorio en todo el proyecto**: cada tarea se escribe primero en rojo (test que falla), después se implementa por cortes (RED → GREEN), y solo entonces se commitea | Lo pidió el humano tras detectar que T11 se implementó antes de sus tests; T11 se rehízo completo con el ciclo |

## 3. Recomendaciones hechas

| Fecha | Recomendación | Estado |
|---|---|---|
| 2026-10-13 | Mover las 7 carpetas de pantalla a `design/stitch/`; `DESIGN.md` y `DESIGN_RULES.md` a la raíz; los `DESIGN.md` de otros temas a `design/themes/` | **Hecha** en T04 (2026-10-13) |
| 2026-10-13 | Generar en Stitch las pantallas que faltan (primer uso, confirmación de instalación, hoja de filtros, estados vacíos y de error) antes de la Fase 6b | Pendiente de decisión |
| 2026-10-13 | La v1 con solo Dragon Night, con tokens preparados para más temas | En el plan (P2-2); confirmado por P-29 |

## 4. Preguntas abiertas

1. **Pantallas sin diseño:** se decide más adelante cuáles se generan en Stitch antes de la Fase 6b (primer uso, confirmación de instalación, hoja de filtros, estados vacíos y de error). Mientras, se componen con `DESIGN.md` y se marcan «sin diseño».
2. **Nombre (resto):** el repo ya existe (`github.com/davidluciol/RyuuNest`); falta verificar organización, scope de npm, dominio y `applicationId` de Android.
3. **Context7 (clave):** resuelto: ctx7 vuelve a funcionar (login guardado; el `.env` con la clave nueva no se usa). Las documentaciones de ctx7 van algo rezagadas respecto a las últimas versiones; sirve para guiar, y las versiones se comprueban contra el registro npm.
4. **T05 (calibración):** el humano registró arranque/memoria y lo confirmó: POCO F6 Pro 4580 ms / 226 MB, Galaxy S25 Ultra 1940 ms / 140 MB, MiBox 4 5600 ms / 323 MB (fija el presupuesto del lector, SPEC §9). `minSdk` = Android 9 / API 28 confirmado (ADR-0002). Faltan los smokes de librerías en dispositivo y el tope de imágenes en memoria.
5. **Tipos de host:** confirmados por el humano (T06); se formalizan en T08 (`ModuleHost`).
6. **Verificación con tipos en `core`:** `pnpm --filter @ryuunest/core typecheck` ahora usa `tsconfig.test.json` (cubre `src` y `tests`); el `build` sigue emitiendo solo `src`. Aplicar el mismo patrón al resto de paquetes cuando toque.
7. **Puerto `Storage` (provisional):** T07 lo dejó como un contrato mínimo de clave–valor; el API completo sobre el esquema del SPEC §8.1 se cierra en T21. Si T21 necesita otro enfoque (relacional), se amplía el puerto (cambio aditivo).
8. **Políticas del host (números):** el SPEC §6.5 no fija los valores; T08 usó por defecto 15 s de tiempo límite, 4 peticiones simultáneas y 250 ms de pausa. Son ajustables por módulo (`HOST_DEFAULTS`); revisar con las mediciones (T35).
9. **Globales del núcleo:** `setTimeout`/`clearTimeout`/`URL` se declaran en `packages/core/src/globals.d.ts` para no añadir las libs `DOM` ni `@types/node` (el núcleo sigue sin APIs de plataforma). No se emite a `dist/`. El CLI del SDK hace lo mismo con las API de Node que usa (`packages/module-sdk/src/node.d.ts`, P-39): decidir si merece la pena fijar `@types/node` como devDependency.
10. **Tipos entre paquetes:** `module-sdk` depende de `@ryuunest/core` y de `@ryuunest/test-site`. Su `typecheck` usa `tsconfig.test.json` con `paths` a `../core/src/index.ts`, `../test-site/src/index.ts` y `../core/src/globals.d.ts`, y sus tests usan alias de Vite (`vitest.config.ts`) por el mismo motivo: ni `typecheck` ni `test` necesitan que los otros paquetes estén compilados; el `build` resuelve por `dist` (pnpm compila en orden). Si esto se complica al crecer, migrar a *project references* de TypeScript.
11. **T12 y la validación en el núcleo:** como la dependencia va `module-sdk → core` (P-37), el núcleo no puede importar los validadores del SDK. Cuando T12 necesite validar `index.json` en `core`, decidir: mover los validadores a `core` (y que el SDK los reexporte) u otra vía.

## 5. Bitácora de sesiones (la más reciente arriba)

### 2026-10-14 · Fase 1 (T11, rehecha con TDD)
- **Hecho:** T11 **rehecha de cero con test-first** (a petición del humano): primero se escribió la suite de 26 tests en `packages/module-sdk/tests/cli.test.ts` (RED de carga) y un esqueleto de `main` que devolvía 1 para forzar el **rojo conductual** (26 fallos); después se implementó por cortes verdes: argumentos+despacho (26→21), `create` con plantillas (21→13), `validate` (13→9), `test` (9→5) y `pack` (5→1). El último rojo era una aserción mía demasiado específica (`"Manifest"`), y se corrigió el test (no la implementación) para que expresara el requisito real: que `create` informe del módulo y del destino. Resultado: CLI de `module-sdk` (`src/cli.ts`, `node dist/cli.js`, `bin: ryuunest-module`) con `create` (plantillas `declarative` y `script`), `validate` (usa T09 y `CORE_VERSION`, con código 1 y cada problema con su ruta), `test` (monta un `ModuleHost` sobre el sitio falso de T10 y corre `runContract`; los declarativos se omiten hasta T16) y `pack` (`.zip` con `fflate`, `sha256` con `@noble/hashes`, informe JSON con `file`/`sha256`/`size`/`files`). Verificado también a mano desde `dist`. Línea base en verde: 84 tests (20 core + 20 test-site + 44 module-sdk).
- **Decisiones:** P-39 (declaraciones mínimas de Node en `src/node.d.ts`, sin `@types/node`; `fflate` y `@noble/hashes` reutilizadas de P-3/P-4). P-40 (el CLI carga el módulo script desde una copia `.mjs` temporal importada con `@vite-ignore`). **P-41: TDD estricto obligatorio en todo el proyecto**.
- **Preguntas nuevas / respondidas:** ninguna nueva. Ampliadas la 9 (el CLI también evita `@types/node`) y la 10 (el SDK mapea `@ryuunest/core` y `@ryuunest/test-site` a sus fuentes en `typecheck`, y usa alias de Vite en `test`).
- **Siguiente paso:** **Checkpoint B** (revisión humana) y, después, T12 (repos + `index.json`).

### 2026-10-14 · Fase 1 (T10)
- **Hecho:** T10: `packages/test-site`, con un **único conjunto de fixtures** (`FIXTURE_SERIES`: 5 series inventadas que cubren los cuatro tipos y una NSFW, con capítulos y releases), **dos sitios falsos de arquitecturas opuestas** — HTML con selectores CSS y paginación `?page=` (`createHtmlSite`, `HTML_SELECTORS`) y JSON con cursor `?cursor=` (`createJsonApiSite`) — servidos por `TestSiteHttp` (implementa el puerto `Http`, sin dependencia de plataforma) y el **arnés de contrato** `runContract(api, options)`, que valida los cinco métodos, la paginación, los capítulos con dos releases y, si se pide, las cabeceras de imagen; falla con `ContractError` y mensaje concreto. 20 tests en `test-site` (58 en total: 20 + 18 + 20). Se commitó aparte la revisión del Checkpoint A que dejó el humano en `tasks/todo.md`. Línea base (`lint`, `typecheck`, `test`, `build`, `format:check`) en verde.
- **Decisiones:** P-38 (el arnés vive en `@ryuunest/test-site`, no en `packages/core/tests/`, para que el CLI del SDK también pueda usarlo sin invertir la dependencia `test-site → core`).
- **Preguntas nuevas / respondidas:** ninguna nueva. Siguen abiertas la 10 (mecanismo de tipos entre paquetes) y la 11 (validación de `index.json` en `core` para T12).
- **Siguiente paso:** T11 (CLI del SDK + plantilla); cerrar T05 con los smokes.

### 2026-10-13 · Fase 0 (T03–T05) y Fase 1 (T06–T09)
- **Hecho:** T03: `docs/decisions/ADR-0001-stack-y-convenciones.md`, `CONTRIBUTING.md`, `ASSETS.md` y `docs/definition-of-done.md`. T04: `design/stitch/<pantalla>/` (7 pantallas), `design/themes/<tema>/` (4 temas), `DESIGN.md` y `DESIGN_RULES.md` movidos a la raíz; referencias de rutas actualizadas. T05 (en curso): app de calibración `apps/mobile` (`@ryuunest/mobile`, Expo SDK 57 + RN 0.86.3 + React 19.2.3) con smoke de `@noble/hashes`, `fflate` y `htmlparser2`; el bundle de Android compila (611 módulos). `docs/decisions/ADR-0002-versiones-y-presupuesto.md` en borrador, pendiente de mediciones. T06: tipos del contrato (`packages/core/src/contract/{types,errors}.ts`: `MediaKind` con `manhwa`, `Page`, `ImageRef`, `SeriesSummary`, `Release`, `Chapter`, `SeriesDetails`, `ChapterPages`, `ModuleManifest`, `ModuleApi`, `Host` y `ModuleError`/`ModuleErrorCode`) con tests propios (`tests/contract/*`) y `tsconfig.test.json` para verificar tipos. T07: puertos (`Storage`, `Http`, `Archive`, `Clock`, `SecureLock`) con adaptadores falsos (`MemoryStorage`, `StubHttp`, `FakeArchive`, `FixedClock`, `NoopSecureLock`) y 11 tests en `core`. T08: `ModuleHost` (permisos por dominio, tiempo límite, concurrencia y pausa mínima) y `host.html()` con selectores CSS (`htmlparser2` + `css-select` + `domhandler`); 20 tests en `core`. T09: validadores de manifest (SPEC §6.1) e índice de repo (SPEC §6.7) en `module-sdk` (con ruta y motivo, y `minAppVersion` contra la app); 18 tests en `module-sdk` (38 en total). T05: `minSdk` confirmado en Android 9 / API 28. Línea base (`lint`, `typecheck`, `test`, `build`, `format:check`) en verde.
- **Decisiones:** P-35 (IDs de decisión canónicos), P-36 (librerías del host), P-37 (dirección `module-sdk` → `core`, solo tipos). `minSdk` 28 confirmado (ADR-0002). Versiones candidatas del SDK 57 en ADR-0002 (sin fijar hasta medir).
- **Preguntas nuevas / respondidas:** ctx7 vuelve a funcionar (no indexa `css-select`; documentación algo rezagada). Tipos de host confirmados por el humano. `minSdk` = Android 9 / API 28 confirmado. Puerto `Storage` provisional (se cierra en T21). Políticas del host, `globals.d.ts`, el mecanismo de tipos entre paquetes y la validación de T12 quedan como preguntas. T05 pendiente de los smokes de librerías.
- **Siguiente paso:** T10 (paquete `test-site` + arnés de contrato); cerrar T05 con los smokes.

### 2026-10-13 · Inicio de implementación: T01–T02 (monorepo + tooling)
- **Hecho:** monorepo pnpm con `packages/{core,module-sdk,test-site,ui-tokens}`, TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint/Prettier, Vitest y CI de GitHub Actions. `pnpm lint | typecheck | test | build` en verde; prueba de humo en `core`.
- **Decisiones:** P-34 (versiones del tooling; TypeScript fijado a la 6 porque `typescript-eslint` no soporta la 7.0).
- **Preguntas nuevas / respondidas:** ninguna nueva; pendiente crear las tareas en `bd`.
- **Siguiente paso:** T03 y T04; después F01 (`ui-tokens`).

### 2026-10-13 · Plan de las Partes 1 y 2 con `planning-and-task-breakdown`
- **Hecho:** se leyó el nuevo `SPEC.md` (diseño integrado, `manhwa`, `page_total`, Fases 6a/6b) y se escribieron los planes en `tasks/plan.md` y `tasks/todo.md`: **Parte 1** (Back-end, 35 tareas, checkpoints A–J) y **Parte 2** (diseño/front-end, 28 tareas, checkpoints P-A a P-E).
- **Decisiones:** P-17 a P-30 (pnpm+Vitest, `test-site` reutilizable, calibración en Parte 1, límites del SPEC §7.1, `bd`→GitHub, `MEMORY.md` a la raíz, segundo sitio falso, Parte 2 en esta sesión, filtros con 4 tipos, verificación con galería web + capturas, v1 solo Dragon Night, pantallas sin diseño diferidas).
- **Preguntas nuevas / respondidas:** respondidas las del plan y las de diseño; siguen abiertas `accent-alt`, las técnicas de SPEC §17.2 y la disponibilidad del nombre.
- **Siguiente paso:** empezar T01 (Fase 0); la verificación visual nativa ya está decidida (P-28).

### 2026-10-13 · Integración del diseño en el SPEC y reglas para agentes
- **Hecho:** se integró el diseño (`DESIGN.md`, 7 pantallas de Stitch, `DESIGN_RULES.md`) en `SPEC.md` (§11, nuevos RF-41 a RF-44, AC-12 y AC-13, Fase 6a, apéndice B). Se creó `AGENTS.md` y este archivo.
- **Decisiones:** P-13 a P-16.
- **Siguiente paso:** responder las preguntas 1 a 3 y empezar la Fase 0.

### Oct 2026 · Definición del proyecto
- **Hecho:** se afinó la idea con rondas de preguntas, se generó `IDEA.md`, se eligió el stack y se escribió el primer `SPEC.md`. Se diseñó el tema Dragon Night en Stitch y se revisó con crítica de diseño.
- **Decisiones:** P-1 a P-12.

## 6. Plantilla de entrada

```text
### AAAA-MM-DD · Título corto de la sesión
- **Hecho:** qué se terminó (hitos, no comandos).
- **Decisiones:** IDs nuevos o cambiados, y quién decidió.
- **Preguntas nuevas / respondidas:** …
- **Siguiente paso:** …
```
