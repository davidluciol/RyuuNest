# ADR-0003: Congelación de la API 1.0 de módulos

- **Estado:** **aceptado** por el autor el 2026-10-29, con D1 = A, D2 = (a) y D3 = `m440` (más `zonatmo`); ver «Decisiones del autor (resueltas)». R1 a R4 son las tareas T37 a T40 y la puerta del 2.º sitio es T41 (`tasks/todo.md`). La API 1.0 sigue **sin congelarse** hasta que se cierren.
- **Fecha:** 2026-10-29
- **Tarea:** T32b (Fase 8)
- **Autoridad:** `docs/SPEC.md` §6, §13, §15, §17; `MEMORY.md` P-21, P-74 a P-76, P-78, P-82, P-83; `tasks/plan.md` §8
- **Nota de proceso:** `tasks/complexity.md` clasifica T32b como N5 (juicio de diseño). Se redactó con un modelo N4 por petición expresa del humano. Las partes marcadas con ⚠ son las que más piden una segunda lectura.

## Veredicto

**La API 1.0 no se congela todavía.** Lo que sí está listo para congelarse es el **modelo de datos y las firmas** (Anexo A): tres módulos reales de tres sitios distintos y dos sitios falsos de arquitecturas distintas (HTML + CSS y JSON + cursor) los usan sin que ninguno haya exigido cambiar un tipo (el único ajuste fue `capabilities`, P-82).

Lo que falta no es el modelo, sino **lo que lo rodea**:

1. **R1.** Cómo se ejecuta un módulo `script` en el dispositivo: los tres módulos publicados son módulos ES de varios archivos y la app solo sabe pasar al cargador el archivo de entrada.
2. **R2.** El formato declarativo solo existe como código: el SPEC prometió un documento propio y no lo hay.
3. **R3.** La política de compatibilidad que promete el SPEC (§15) no se puede cumplir con el código actual.
4. **R4.** El contrato está escrito a medias y nadie lo comprueba en ejecución.

Son cuatro cambios (R1 a R4) y tres decisiones del autor (D1 a D3). Con R1 a R4 hechas y D3 cumplida, la API pasa a congelable. Si se congelara hoy y el spike de R1 obligara a cambiar el formato de empaquetado, habría que subir `apiVersion` a 2 con tres módulos ya publicados: esa es la razón principal para esperar.

## Contexto

T32b pide marcar la API 1.0 como estable o enumerar los cambios requeridos, y listar candidatos de 2.º sitio real (sin instalarlos). Desde que se escribió esa tarea cambiaron dos cosas:

- **Ya hay módulos publicados.** `RyuuNest-Models` (P-78) sirve tres módulos con `apiVersion: 1` (`zonatmo` 0.2.0, `m440` 0.1.0, `yupmanga` 0.1.0). Congelar ahora es **retroactivo**: cualquier propuesta tiene que seguir funcionando con ellos. `MEMORY.md` ya sugería hacer este ADR antes de que ese repo creciera.
- **T32a cerró la prueba de generalidad** del plan (§8): el contrato pasa con un sitio HTML + CSS (declarativo y script) y otro JSON con cursor (script). El plan dejó el sitio real para antes de congelar *públicamente* (SPEC §13, P-21).

### Cómo se obtuvo la evidencia

- Código leído en este repo: `packages/core/src/{contract,host,runtimes,ports,install,repo}`, `packages/module-sdk`, `packages/test-site` y `apps/mobile/src/data/moduleMounter.ts`.
- Recuento sobre el código y las notas de `RyuuNest-Models` (HEAD, `index.json` del 2026-10-26) con un script de lectura (expresiones regulares sobre el código sin comentarios). Globales buscados: `setTimeout`, `URL`, `URLSearchParams`, `TextDecoder`, `TextEncoder`, `atob`, `btoa`, `Buffer`, `Intl`, `console`, `navigator`, `globalThis`, `eval` e `import()`. Es un recuento, no una auditoría de seguridad.
- `legacyModulos/*.py` para los candidatos.
- **No** se ejecutó nada en un dispositivo ni contra sitios reales.

### Uso real de la API (tres módulos publicados)

| | `zonatmo` 0.2.0 | `m440` 0.1.0 | `yupmanga` 0.1.0 |
| --- | --- | --- | --- |
| Runtime | `script` | `script` | `script` |
| Archivos `.js` / líneas | 11 / 587 | 11 / 1088 | 12 / 885 |
| `import` relativos / de paquetes | 29 / 0 | 30 / 0 | 33 / 0 |
| Miembros de `host` usados | `fetch`, `html` | `fetch`, `html` | `fetch`, `html` |
| Métodos de elemento usados | `select`, `text`, `attr` | `select`, `text`, `attr` | `select`, `text`, `attr` |
| Opciones de `host.fetch` | `headers` | `headers` | `method`, `body`, `headers` (con `Cookie`) |
| Lee `response.url` (con respaldo a la pedida) | sí | sí | sí |
| Globales que no son de ECMAScript | ninguno detectado | ninguno detectado | `setTimeout` (comprueba que exista) |
| Cabeceras en las imágenes | `Referer` y `User-Agent` | `Referer` (403 sin él) | sin dato |
| Paginación | `page` y `a[rel=next]` | listas sin paginar; búsqueda JSON sin paginar | `page` en la búsqueda |
| Particularidad | devuelve `related` (campo fuera del contrato) | lista de capítulos cifrada con AES-256-CBC, reimplementada en el módulo | reto JS, interstitial de anuncio y cookies propias |

Lo que enseña:

- **La superficie que usan es pequeña**: `host.fetch` y `host.html`. Nadie usa `host.log`, `host.settings` ni `HtmlDocument.find`.
- Los tres **leen `HostResponse.url`** (P-74) y los tres lanzan el error tipado por forma (P-75).
- Los tres son **módulos ES de varios archivos**. Nada de eso puede cargarse hoy en la app (R1).
- `yupmanga` lleva su propio tarro de cookies y sigue redirecciones a mano («El host no garantiza un tarro de cookies entre llamadas», dice su código). Es presión real sobre `Host`, pero **aditiva** (ver «Reservas»).
- Todos han sido verificados **fuera de la app** (Node, fixtures y pruebas en vivo). Ninguno se ha ejecutado dentro del runtime de la app.

## Decisión 1: qué se puede congelar ya

Se propone congelar, tal cual están (Anexo A):

- `ModuleManifest` y `RepoIndex` (con `apiVersion: 1` literal).
- `ModuleApi`: `popular?`, `latest?`, `search`, `details`, `pages`.
- El modelo de datos: `Page`, `SeriesSummary`, `SeriesDetails`, `Chapter`, `Release`, `ChapterPages`, `ImageRef`, `MediaKind`, `SeriesStatus`.
- `ModuleError`, sus 8 códigos y `details { url, status, selector }`.
- `Host.fetch` y `Host.html` con la forma que usan los módulos reales.
- El paquete `.zip` y sus topes (SPEC §7.1).

Condiciones: que se cumplan R3 y R4 (tolerancia y semántica escrita), que es lo que convierte esas formas en una promesa.

## Decisión 2: cambios requeridos antes de declarar la 1.0

### R1. Ejecución y empaquetado de módulos `script` (decide el autor: D1)

**Hechos.**

- Los tres módulos publicados son módulos ES de 11 a 12 archivos con 29 a 33 `import` relativos y ninguno de paquetes. `module.js` solo importa de `bin/` y arma `create(host)`.
- El instalador guarda **todos** los archivos del paquete (`InstalledPackage.files`), pero `createInstalledMounter` entrega a `createModuleApi` solo el texto de `manifest.entry` y `ScriptLoader.load(source: string)` solo conoce un texto. Por eso un módulo con `import` no puede cargarse.
- La app tampoco monta módulos `script` hoy (`UNSUPPORTED`; P-83). El cargador de pruebas (`FakeScriptLoader`) devuelve fábricas registradas a mano: **no evalúa código**. El único código descargado que se ha ejecutado de verdad corrió en Node (CLI `test` y arneses del repo de módulos).
- ⚠ P-83 afirma que Hermes no admite `eval`/`new Function`. Este ADR no lo ha verificado; el spike de abajo lo confirma o lo corrige. Si es cierto, hace falta otro mecanismo de carga y eso puede cambiar la forma del paquete.

**Cambio requerido.**

1. Fijar lo que promete el contrato a los autores: *un módulo ES cuyo `entry` exporta por defecto `create(host)`; puede importar solo rutas relativas dentro de su paquete; sin `import()` dinámico ni paquetes; entorno = ECMAScript estándar* (sin `setTimeout`, `URL`, `TextDecoder`, `fetch` ni cualquier otro global de plataforma).
2. `ScriptLoader.load` pasa a recibir el paquete (ruta → texto) y la ruta de entrada. Es un puerto interno: no afecta a los módulos.
3. **Spike en el POCO**: cargar y ejecutar el `script` real de `zonatmo` dentro de la app y llamar a `popular`. Hasta que exista, «script» se publica como **experimental** (SPEC §5.4, D-5).

Archivos probables: `packages/core/src/ports/scriptLoader.ts`, `runtimes/ScriptRuntime.ts`, `runtimes/ModuleRuntime.ts`, `apps/mobile/src/data/moduleMounter.ts` y el cargador de plataforma (nuevo).

### R2. Formato declarativo cerrado y comprobable

**Hechos.**

- SPEC §6.6 dice que el formato «se cierra en un SPEC propio durante la Fase 3». No existe tal documento: el formato vive en `DeclarativeRuntime.ts`, `transforms.ts` y la plantilla del SDK (Anexo B).
- No hay validador de `index.json`: un error se descubre al llamar al método.
- `ryuunest-module test` **omite** los módulos declarativos («hasta que exista el runtime (T16)», fijado por una prueba de `cli.test.ts`). T16 ya existe, y la plantilla por defecto del CLI es la declarativa.
- Huecos de formato que ya se ven con sitios reales (Anexo B.9): cabeceras de imagen, series sin capítulos, `extra`, fechas, ids con `/`, `status` y `kind` solo con el valor literal.

**Cambio requerido.**

1. Convertir el Anexo B en el documento normativo del formato (`docs/declarative-format.md` o SPEC §6.6) **después** de decidir los huecos.
2. `validateDeclarativeConfig` en `module-sdk`, usado por `validate`, y `test` ejecutando el arnés también para declarativos (la prueba `declarative.contract.test.ts` ya hace en el núcleo lo que falta en el CLI).
3. **Antes de congelar**: L1 (cabeceras de imagen, D2) y L2 (serie sin capítulos deja de ser `PARSE`). **Pueden ser aditivos después**, con R3 hecho: L3 a L6.

### R3. Compatibilidad hacia delante ejecutable

**Hechos.**

- `validateRepoIndex` devuelve error si **una sola** entrada tiene `apiVersion`, `runtime` o `kinds` que no conoce, y `RepoRegistry` lanza `PARSE`. Un único módulo con `apiVersion: 2` inutilizaría el repo entero para toda app v1, también para los módulos v1 de ese repo.
- SPEC §15 promete que «la app informa qué módulos no son compatibles»: ningún código lo hace.
- `minAppVersion` no se aplica en la app: `useSourcesData` deja `appVersion` sin pasar *a propósito* porque `app.json` está en `0.0.0`. `CORE_VERSION` y `MODULE_SDK_VERSION` también valen `0.0.0`, así que el CLI valida por defecto contra `0.0.0` y un módulo con `minAppVersion` mayor no valida sin `--app-version`.
- `RepoModuleEntry` no lleva `minAppVersion`: solo se conoce después de descargar el `.zip`.
- El validador **tolera campos desconocidos** (no hay ninguna comprobación ni prueba que los rechace). La guía de `RyuuNest-Models` afirma lo contrario («un campo de más o de menos lo rechaza»). Se propone mantener la tolerancia y corregir esa frase en el otro repo.

**Cambio requerido.**

1. Índice tolerante **por entrada**: las incompatibles (`apiVersion`, `runtime` o `kinds` desconocidos) se listan aparte como «no compatible» y no invalidan el repo; las estructuralmente rotas se descartan con aviso.
2. La app pasa su versión real al validador (ya existe `Constants.expoConfig?.version`, usado en Diagnóstico) y `app.json` deja de estar en `0.0.0`.
3. `minAppVersion?` opcional en `RepoModuleEntry` (aditivo) para ocultar lo incompatible antes de descargar.
4. El CLI no comprueba `minAppVersion` salvo con `--app-version`.

### R4. Contrato escrito y comprobado en ejecución

**Hechos.**

- `HostRequestInit`, `HostResponse`, `HtmlElement` y `HtmlDocument` siguen marcados «⚠️ Provisional: se cierra en T08». T08 está cerrada y el uso real los avala sin cambios.
- La semántica que importa solo está en el código: `page` empieza en 1 (la app y el arnés lo suponen; el SPEC no lo dice), `host.fetch` sigue redirecciones, `Host.settings` no persiste, `hasNext` puede ser una estimación (P-76).
- El runtime `script` devuelve lo que entrega el módulo sin validarlo (`as R`): una forma incorrecta rompe pantallas en vez de dar `PARSE`. El arnés solo valida en pruebas.

**Cambio requerido.**

1. Quitar las marcas «provisional» y escribir la semántica en SPEC §6.2 a §6.5 (valores propuestos en «Valores a confirmar»).
2. Validar en `guardApi` la forma **mínima** que exige el contrato (campos obligatorios y tipos básicos), tolerando campos extra. Mejor ahora, con tres módulos, que después: endurecer cuando haya muchos rompe módulos publicados.
3. Fixtures de los tres módulos publicados como regresión de esa validación.

## Decisión 3: política de compatibilidad

Se propone esta regla para la línea 1.x:

| Cambio | ¿Rompiente? | Nota |
| --- | --- | --- |
| Campo opcional nuevo en manifest, entrada de índice, respuesta de módulo o `index.json` | No | La app ignora lo desconocido. Si el módulo lo necesita, declara `minAppVersion` (R3). |
| Método opcional nuevo en `ModuleApi`, miembro opcional nuevo en `Host` | No | El módulo lo detecta (`host.x?.()`). |
| Código de error nuevo | No | Una app vieja lo trata como `INTERNAL`. |
| Valor nuevo en `kinds`, `runtime` o `apiVersion` en un índice | **Hoy sí** | R3 lo vuelve no rompiente (entrada «no compatible»). |
| Quitar, renombrar o cambiar de tipo un campo; volver obligatorio uno opcional | Sí | Sube `apiVersion` a 2. |
| Cambiar semántica (base de `page`, seguimiento de redirecciones, reglas de carga del paquete) | Sí | Sube `apiVersion` a 2. |

Cuando exista `apiVersion: 2`, cuánto tiempo se mantiene el soporte de la 1 se decide en un ADR nuevo; este ADR no lo fija.

### Reservas aditivas (no forman parte de la 1.0)

Solo se listan las que ya tienen evidencia (o mención en el SPEC):

| Reserva | Evidencia |
| --- | --- |
| `pages.imageHeaders` en declarativo (D2) | Cinco de los siete módulos legados mandan `Referer`; `m440` responde 403 a las imágenes sin él y `zonatmo` las pide con `Referer` y `User-Agent`. |
| `redirect: "manual"` y acceso a cookies en `host.fetch` | `yupmanga`: cookies y redirecciones a mano. Fuera de garantía por P-8 (anti-bot, v2). |
| `host.sleep(ms)` | `yupmanga` usa `setTimeout`, que R1 no garantiza. |
| `host.crypto` (AES, MD5) | `m440` reimplementó unos 11 KB. Solo si lo piden más sitios; la guía de autores ya prevé que una librería necesaria entre por el lado del host y no dentro del `.zip`. |
| `SeriesDetails.related?` | `zonatmo` ya lo devuelve fuera del contrato. |
| `Page.next?` y parámetro de cursor | Ninguna evidencia real. El «cursor» del sitio falso JSON es `c${page}` (predecible), así que T32a no ejercita cursores opacos. Con un cursor opaco, un módulo puede guardar un mapa página → cursor mientras la app pida las páginas en orden. |
| Parámetro opcional de filtros en `search` | SPEC §17.2, pregunta 5 (fuera de la v1). |

## Decisión 4: revisión de P-74, P-75 y P-76

| P | Qué es | Veredicto |
| --- | --- | --- |
| P-74 | `HostResponse.url`; `HttpResponse.url?` opcional, el host rellena la pedida si falta | **Se congela.** Los tres módulos la leen con respaldo (`response.url \|\| url`) y `createFetchHttp` la informa cuando la plataforma la trae. 🧍 Confirmar en el POCO que llega la URL final tras una redirección (la nota de `MEMORY.md` «la app aún no la rellena» está desfasada respecto del adaptador). |
| P-75 | Error tipado por forma en scripts (`name === "ModuleError"`, `code`, `details`) | **Se congela.** Los tres módulos lanzan exactamente esa forma. `details` solo conserva `url`, `status` y `selector`; ampliarlo es aditivo. Un `code` desconocido llega como `INTERNAL`. |
| P-76 | `estimatedHasNext` en el arnés | **No es contrato de módulos**: es una opción de herramienta de `@ryuunest/test-site`, versionada con el SDK. Pero señala una regla del contrato: `hasNext` es una **estimación válida**; la app no debe asumir que `hasNext: true` garantiza una página siguiente no vacía. |

## Decisión 5: 2.º sitio real, candidatos (sin instalarlos)

El plan (§8) exige uno **antes de congelar públicamente**. La «licencia/condiciones compatibles» del plan (§8.3) es un juicio del autor: este ADR no evalúa términos de uso de ningún sitio.

| Candidato | Estado | Qué ejercita del contrato | Riesgo | Veredicto |
| --- | --- | --- | --- | --- |
| **`m440`** | Publicado (0.1.0, `script`). Verificado con fixtures y en vivo desde Node; **no probado dentro de la app** | Listas sin paginar, búsqueda JSON sin paginar, ficha con lista de capítulos cifrada, todas las páginas en un solo HTML, imágenes con `Referer` | Cloudflare delante como CDN (sin reto en las rutas usadas). Si el sitio rota la clave del listado, `details` da `UNSUPPORTED` | **Recomendado** |
| `yupmanga` | Publicado (0.1.0, `script`). Verificado en vivo con un proxy local con huella de navegador | `POST`, cookies, redirecciones a mano, `setTimeout` | El WAF bloquea clientes sin huella de navegador; reto JS y espera de anuncio; sus notas registran que su `robots.txt` desautoriza rutas que el módulo usa | **No recomendado** como puerta del contrato: sus fallos hablarían de anti-bot (P-8), no del contrato. Sí sirve como fuente de requisitos aditivos |
| `zonatmo` | Publicado (0.2.0) | HTML con `page` y `a[rel=next]` | Es el 1.er sitio real, no el 2.º | Control |
| `logicFoxManga.py` | Sin portar | Listas y ficha en HTML estático | `pages` usa render JS (`arender`) y el host no tiene navegador | Aún no |
| `logicNineManga.py` | Sin portar | Solo lista (`details` incompleto en el legado) | Falta análisis | Aún no |
| `logicLuscious.py` | Sin portar | Solo lista; usa Playwright; NSFW | Falta `details`/`pages` y navegador | Aún no |
| `logicTmoHentai.py` | Vacío | n/a | n/a | No |

Las filas de los legados sin portar resumen la tabla «Ports pendientes» de `tasks/todo.md` (T31) y una lectura rápida del código (el render JS de FoxManga y el uso de Playwright en Luscious están confirmados); no son un análisis de viabilidad. Esa tabla quedó desfasada: `m440` y `yupmanga` ya están portados al repo de módulos.

**Criterio de aceptación propuesto para la puerta del 2.º sitio** (D3): (1) el módulo pasa su arnés con fixtures propias; (2) se instala por `InstallFlow` en la app y ejecuta `popular` o `latest`, `search`, `details` y `pages`, y se ve una imagen, en el POCO; (3) ningún cambio de tipos del modelo de datos. Coincide con la casilla 🧍 del Checkpoint I.

## Decisión 6: preguntas abiertas del SPEC §17.2

| # | Pregunta | Estado | Fuente |
| --- | --- | --- | --- |
| 1 | Android mínimo | **Resuelta**: API 28 | ADR-0002 |
| 2 | Formato declarativo completo | **Se cierra con R2** (Anexo B es el punto de partida) | este ADR |
| 3 | Navegación con foco para TV y listas virtualizadas | Sin relación con la API de módulos; sigue abierta hasta F22 (la app usa `FlatList` en Biblioteca). Sin decisión aquí | P-43 |
| 4 | Un favorito en varias carpetas | Dato local, no afecta al contrato de módulos; sigue D-12 (una carpeta), reevaluar en v2 | D-12 |
| 5 | Filtros de búsqueda por módulo | Fuera de la v1. La firma `search(query, page)` se congela; los filtros serían un parámetro opcional aditivo | este ADR |
| 6 | Nombre | **Resuelta** | P-71 |
| 7 | Temas | **Resuelta**: solo Dragon Night | P-29 |
| 8 | Tipos de obra en filtros | **Resuelta**: los cuatro | P-27 |
| 9 | Violeta `accent-alt` | **Resuelta**: no se usa | P-31 |
| 10 | Pantallas sin diseño | Tarea de diseño (FB2, F34); no afecta a la API | `MEMORY.md` §4 |
| 11 | Verificación de la app nativa | Abierta; decisión del humano | `AGENTS.md` §5 |

## Decisiones del autor (resueltas el 2026-10-29)

| | Decisión |
| --- | --- |
| **D1** | **A**: conservar «módulo ES con imports relativos»; el cargador de la app resuelve el paquete. Spike en el POCO como puerta (T40). Si falla, plan C (`script` experimental) y se reabre. |
| **D2** | **(a)**: `pages.imageHeaders` en el formato declarativo (T39). |
| **D3** | **`m440`** como 2.º sitio real, junto con `zonatmo` (el 1.º). Habrá más sitios en el futuro; por ahora la puerta usa esos dos (T41). |
| Valores | Aceptados con el ADR: `page` base 1, `Host.settings` sin persistencia garantizada, `hasNext` estimable, redirecciones seguidas, cookies fuera de garantía, campos desconocidos ignorados e ids opacos. |

Las opciones que se presentaron quedan abajo como registro.

### D1. Cómo se ejecutan los módulos `script` (R1)

| Opción | Efecto |
| --- | --- |
| **A (recomendada)**: conservar «módulo ES con imports relativos» y que el cargador de la app resuelva el paquete | Ningún módulo publicado cambia. El esfuerzo está en el cargador de plataforma. Si el spike muestra que Hermes no puede cargar código descargado, hace falta otro motor y se decide entonces con datos. |
| B: `ryuunest-module pack` genera un único archivo autocontenido | El cargador recibe un solo texto. Los tres módulos se republican (versión menor) y se pierde la vía manual sin herramientas que describe el repo de módulos. |
| C: publicar la 1.0 con `script` experimental y congelar el resto | Permite congelar ya el modelo de datos y el declarativo, pero los tres módulos reales (todos `script`) quedan sin garantía. Es el plan B si el spike falla. |

### D2. Cabeceras de imagen en el formato declarativo (RF-24, pregunta abierta de `MEMORY.md`)

| Opción | Efecto |
| --- | --- |
| **(a) recomendada**: `pages.imageHeaders`, un mapa de cabeceras con las mismas variables de URL (`{baseUrl}`, `{chapterId}`, `{releaseId}`) | Explícito y aditivo. Cubre `Referer` y `User-Agent`. Un módulo que lo use declara `minAppVersion` (R3). |
| (b) el cargador de imágenes añade `Referer: <baseUrl>` si el módulo no puso uno | No toca el formato, pero esconde un comportamiento fuera del contrato y no cubre `User-Agent`. |
| (c) sin cabeceras en declarativo | Un módulo declarativo no podría leer `m440` ni `zonatmo`; para los demás sitios no se sabe hasta probarlos. |

### D3. 2.º sitio real

Recomendación: **`m440`** con el criterio de aceptación de la Decisión 5. Alternativas: `yupmanga` (no recomendado) o aplazar y congelar solo con la prueba de generalidad (plan §8.3), que deja la API sin una segunda confirmación real.

### Valores a confirmar (propuestos)

- `page` empieza en **1** (lo que hacen la app y el arnés).
- `Host.settings`: firma congelada, **sin garantía de persistencia** (reforzarla después no rompe nada; quitarla sí).
- `hasNext` es una estimación válida.
- `host.fetch` sigue redirecciones; **no** se garantiza el manejo de `Cookie`/`set-cookie` (depende de la plataforma, P-8).
- Los campos desconocidos se **ignoran** (manifest, índice, respuestas de módulos, `index.json`).
- Los ids (`SeriesSummary.id`, `Chapter.id`, `Release.id`) son cadenas **opacas**: pueden llevar `/`, `?` y `=` (`yupmanga` guarda la query en el id) y la app se los devuelve al módulo sin modificarlos.

## Límites conocidos que no bloquean (van a otras tareas)

- **Permisos y redirecciones (T33).** `host.fetch` comprueba el dominio de la URL pedida; la plataforma sigue las redirecciones sola y `response.url` informa a posteriori. Los dominios que ve el usuario al confirmar prometen algo más fuerte de lo que se hace cumplir. El SPEC §7.2 ya reconoce que un script hostil puede saltarse los permisos (D-5); T33 decide si el host sigue las redirecciones salto a salto.
- **Tiempo límite sin cancelación (T34).** `ModuleHost` corta con `TIMEOUT` pero no cancela la petición subyacente (`Http.request` no tiene señal).
- **Políticas del host (T35).** `HOST_DEFAULTS` (15 s, 4 simultáneas, 250 ms) no son parte del contrato: ningún módulo debe depender de esos valores.

## Consecuencias

- **Ningún módulo publicado necesita cambios** con lo propuesto. La única opción que obliga a republicar es D1-B.
- Al aceptarse (hecho): `MEMORY.md` pasa P-108 de «propuesto» a vigente; se actualizan SPEC §6.2 a §6.6 y §17.2; y R1 a R4 se convierten en tareas (T37 a T40; T41 es la puerta del 2.º sitio). Orden: T37 → T38 → T39 → T40 → T41.
- El Checkpoint I sigue abierto hasta R1 a R4, D3 y la prueba en el POCO.
- Si se acepta tal cual, conviene hacer R3 y R4 **antes** de que el repo de módulos crezca más allá de los tres módulos actuales.
- Fuera de este repo: la guía `AGENTS.md` de `RyuuNest-Models` dice que «un campo de más o de menos lo rechaza» y no coincide con el validador.
- Este ADR no toca código. Los cambios del SPEC derivados de su aceptación (§6.2 a §6.6 y §17.2) se aplicaron en la misma rama.

## Anexo A: inventario de la superficie

| Pieza | Dónde vive | Veredicto | Nota |
| --- | --- | --- | --- |
| `ModuleManifest`, `apiVersion: 1` | `core/contract/types.ts` | Congelable | `capabilities` admite las cinco (P-82). Campos desconocidos tolerados. |
| `RepoIndex`, `RepoModuleEntry` | `core/contract/repoIndex.ts` | Congelable con R3 | Tolerancia por entrada y `minAppVersion?` aditivo. |
| `ModuleApi` | `core/contract/types.ts` | Congelable | `popular` y `latest` opcionales; `search`, `details` y `pages` obligatorios. `page` base 1 (R4). |
| Modelo de datos: `Page`, `SeriesSummary`, `SeriesDetails`, `Chapter`, `Release`, `ChapterPages`, `ImageRef`, `MediaKind`, `SeriesStatus` | `core/contract/types.ts` | Congelable | Sin cambios de tipo por presión real. `Release.publishedAt` se dice ISO 8601, pero el declarativo lo pasa tal cual (L4). |
| `ModuleError`, 8 códigos, `ModuleErrorDetails` | `core/contract/errors.ts` | Congelable | Forma por forma en scripts (P-75). |
| `Host.fetch`, `HostRequestInit { method, headers, body }`, `HostResponse { status, headers, url, text() }` | `core/contract/types.ts` | Congelable tras R4 | Solo cuerpo de texto; sin `json()` ni `bytes()` (nadie los pide). |
| `Host.html`, `HtmlDocument`, `HtmlElement { attr, text, select }` | `core/contract/types.ts` | Congelable tras R4 | `find` existe y nadie lo usa. |
| `Host.log`, `Host.settings` | `core/contract/types.ts` | Firma congelable, **sin garantía de persistencia** | Cero usos reales. |
| Carga de `script`: `create(host)` + ES + imports relativos | SPEC §6.5, `ports/scriptLoader.ts` | **No congelable** hasta R1 | Sin implementación en el dispositivo. |
| Formato declarativo `index.json` | `runtimes/DeclarativeRuntime.ts`, `transforms.ts` | **No congelable** hasta R2 | Anexo B. |
| Paquete `.zip`: `manifest.json` en la raíz, ≤ 2 MB, ≤ 5 MB descomprimido, ≤ 50 archivos | SPEC §7.1, `install/PackageInstaller.ts` | Congelable | Los tres paquetes reales pesan de 9 a 14 KB. |
| CLI, plantillas, `runContract`, `estimatedHasNext` | `module-sdk`, `test-site` | Fuera del contrato; se versionan con el SDK | El CLI no prueba declarativos (R2). |
| Políticas del host | `HOST_DEFAULTS` | Fuera del contrato (T35) | |

## Anexo B: formato declarativo tal como está construido

> Descripción del **código a fecha de hoy**, no una especificación. R2 la convierte en normativa tras decidir los huecos de B.9.

**B.1 Estructura.** `index.json` es un objeto con las claves opcionales `popular`, `latest`, `search`, `details` y `pages`. Si falta `popular` o `latest`, ese método no existe en la `ModuleApi`; si falta `search`, `details` o `pages`, llamarlos da `UNSUPPORTED`. Las claves desconocidas se ignoran. `index.json` se interpreta con `JSON.parse` sin validación de esquema.

**B.2 Listados** (`popular`, `latest`, `search`): `{ url, list, fields, hasNext? }`. `list` es el selector de cada tarjeta. Campos leídos: `id` y `title` (obligatorios), `cover`, `kind`, `nsfw`, `badges` (lista) y `hint`. Sin `hasNext`, el resultado es siempre `hasNext: false`; con `{ selector, exists? }`, es `true` si el selector coincide (o si no coincide, con `exists: false`).

**B.3 Ficha** (`details`): `{ url, fields, chapters }`.

- `fields`: `title` (obligatorio), `cover`, `description`, `status`, `kind`, `nsfw`, `genres` (lista) y `altTitles` (lista).
- `chapters`: `{ list, fields: { id, title, number }, releases: { list, fields: { id, group, publishedAt } } }`. `id` y `title` de capítulo y el `id` de release son obligatorios.
- Debe haber al menos un capítulo y cada capítulo al menos una release; si no, `PARSE`.

**B.4 Páginas** (`pages`): `{ url, images, title? }`. `images` se lee siempre como lista; ninguna imagen es `PARSE`.

**B.5 Campo (`FieldSpec`).** `{ selector?, attr?, regex?, all?, transform? }`. Sin `selector`, el ámbito es el propio elemento. Sin `attr`, se usa el texto. `regex` se aplica al valor leído (primer grupo o coincidencia entera) y después las transformaciones en orden. Sin `all`, se toma el primer valor.

**B.6 Transformaciones.** `trim`; `path` (último segmento de la ruta, P-50); `absoluteUrl` (contra `baseUrl`); `regex` (arg: patrón); `number` (primer número); `join` (solo con `all: true`; arg: separador); `replace` (args: patrón de expresión regular global y reemplazo). Un nombre desconocido da `UNSUPPORTED`.

**B.7 Variables de URL.** `{baseUrl}`; en listados `{page}`; en `search` `{query}`; en `details` `{id}`; en `pages` `{chapterId}` y `{releaseId}`. Los valores (`query` e ids) pasan por `encodeURIComponent`. Una variable desconocida da `UNSUPPORTED`.

**B.8 Red y errores.** Siempre `host.fetch(url)` (GET, sin cabeceras) y el cuerpo se interpreta como HTML con los selectores de `css-select`. Solo el estado `200` es éxito: `404` es `NOT_FOUND`, `429` `RATE_LIMITED`, `401` y `403` `BLOCKED`, el resto `NETWORK`. `cover` e imágenes salen como `{ url }`, sin cabeceras. `kind` solo se acepta si es uno de los cuatro valores; `nsfw` acepta `true`, `1`, `yes`, `si`, `sí` y sus negativos; `status` solo si es uno de los cinco valores del contrato (si no, `unknown`).

**B.9 Huecos.**

| # | Hueco | Propuesta | Cuándo |
| --- | --- | --- | --- |
| L1 | Imágenes y portadas sin cabeceras | `pages.imageHeaders` (D2) | Antes de congelar |
| L2 | Serie sin capítulos da `PARSE` | Lista vacía; el contrato no exige capítulos | Antes de congelar |
| L3 | `extra` siempre vacío | `details.extra: { clave: FieldSpec }` | Aditivo |
| L4 | `publishedAt` pasa tal cual aunque el contrato dice ISO 8601 | Transformación `date`, o que la app tolere texto libre | Aditivo |
| L5 | `{id}` siempre codificado: un id con `/` no sirve en la URL | Variante sin codificar | Aditivo |
| L6 | `status` y `kind` solo con el valor literal del contrato | Transformación `map` | Aditivo |
| L7 | Solo GET sin cabeceras; sin JSON | **Es el alcance**: lo demás es `script` | Documentar |
