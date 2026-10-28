# todo.md — RyuuNest (solo pendientes) · 2026-10-20

> Historial detallado (T01–T24, F01–F10 ✅) → `tasks/todo.archive.md` (el `todo.md` anterior). Contexto → `tasks/plan.md`.
> **Al iniciar sesión leer `tasks/complexity.md` §1 (reglas).** Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
> Comandos: `pnpm -r typecheck` · `pnpm -r test` · `pnpm -r build` · `pnpm lint` · `pnpm --filter @ryuunest/core test`.
> Tracker: `bd` local → GitHub Issues cuando exista el repo (P-12). Etiqueta: `[tipo · complejidad · nivel]`. 🧍 = paso humano (no inventar mediciones).

**Hecho:** Fases 0–5 (T01–T24), Fase 6a (F01–F10); Checkpoints A–F y P-A ✅.

---

## Cierre Fase 0

### T05 cierre `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope de imágenes medido; marcar T05 ✅
- Aparte (no bloquea): MiBox 4 pospuesta (P-43); revalidar RNF-1 en release.

### T05b Identidad de la app (P-71) `[Ops · Baja · N1]` ✅

Dep: P-71 · S · `apps/mobile/app.json`

- [x] `name` = `RyuuNest`, `slug` = `ryuunest`, `android.package` = `io.github.davidluciol.ryuunest`
- Verif: `expo config --type public` (los tres valores)
- **Hecho (2026-10-23):** aplicado en `apps/mobile/app.json`; el APK de calibración anterior queda como otra app al cambiar el package.

---

## Fase 6 — Progreso y lecturas

### T25 + T26 — una sola sesión (mismo patrón) `[BE · Baja · N2]` ✅
>
> Hacer T25 y T26 juntas (~4 archivos, un commit por tarea). Si el test de concurrencia de T25 falla 2 veces → «modelo con poca potencia cambiar.»

#### T25 Progreso atómico y reanudación ✅

Dep: T21 · S · `core/src/progress/ProgressStore.ts` (+test)

- [x] Guardar/leer `(chapter_id, release_id, page_index, page_total)` por serie (SPEC §3.6, RF-20/31)
- [x] Cerrar/reabrir (simulado) devuelve la misma página; `updated_at` cambia en cada escritura
- [x] Escrituras concurrentes de la misma serie no corrompen el registro
- Debounce y «al salir» son de la UI. Verif: `pnpm --filter @ryuunest/core test`
- **Hecho (2026-10-20):** `ProgressStore` (`get`, `save`) con **una sola sentencia `INSERT … ON CONFLICT`** (la fila nunca pasa por un estado intermedio: 30 escrituras simultáneas dejan una fila coherente, probado); título del capítulo y versión de publicación opcionales; páginas inválidas (negativas, no enteras) se rechazan con `ModuleError` sin escribir. 10 tests.

#### T26 `chapter_read` ✅

Dep: T21 · S · `core/src/progress/ChapterReadStore.ts` (+test)

- [x] Marcar/desmarcar por `(module_id, series_id, chapter_id)` (RF-32); al terminar el capítulo se marca solo
- [x] La consulta devuelve el conjunto de leídos de una serie (sin contadores: RF-42 es v2)
- Verif: `pnpm --filter @ryuunest/core test`
- **Hecho (2026-10-20):** `ChapterReadStore` (`markRead`, `unmarkRead`, `isRead`, `readIn` → `Set`). El marcado automático lo dispara `ProgressStore.save`: con un `ChapterReadMarker` **inyectado**, guardar la **última página** (`page_index >= page_total - 1`, base 0 — decisión **P-61**) marca el capítulo; sin marcador, el núcleo sigue headless. 12 tests.
- **Fuera del alcance (no hecho):** borrar el progreso/leídos al quitar una serie (no está en los criterios; el esquema tampoco lo exige) y el porcentaje de RF-41 (lo calcula la pantalla, F13/F18).

### T27 Máquina de estados del lector (headless) `[BE · Intermedia · N3]` ✅

Dep: T25 · M · `core/src/reader/ReaderState.ts` (+test)

- [x] Modos vertical continuo/paginado; cambiar de página y saltar entre capítulos
- [x] Cambiar de modo actualiza la preferencia de la serie (T24)
- [x] Última página → «capítulo terminado» y ofrece el siguiente
- [x] `page_index` en `[0, page_total]`; políticas de memoria documentadas (el render es Parte 2)
- Verif: `pnpm --filter @ryuunest/core test` + recorrer un capítulo de 60 páginas
- **Hecho (2026-10-21):** `ReaderState` headless sobre `ProgressStore` (T25) y `SeriesPrefs` (T24): `openSeries`/`resume`/`openChapter`/`openNextChapter`/`openPreviousChapter`/`next`/`previous`/`goToPage`/`setMode`/`flush` + `snapshot` inmutable. Páginas **base 0** (confirma **P-61**), ajustadas a `[0, page_total]`; llegar a la última página guarda de inmediato y marca leído (RF-32) y ofrece el siguiente (RF-21); el resto de cambios quedan `dirty` para que la UI guarde con retraso corto o al salir (RF-20). Políticas de memoria declaradas como **ventana** (`snapshot.window`): paginado = página actual + `PAGED_PRELOAD_AHEAD` delante; vertical = `VERTICAL_BEHIND`/`VERTICAL_AHEAD` alrededor de la visible (constantes provisionales, pendiente la medición P-45). 29 tests, incluido el recorrido de un capítulo de 60 páginas.

### T25b Borrar progreso y capítulos leídos al quitar una serie (P-62) `[BE · Baja · N2]` ✅

Dep: T22, T25, T26 · S · `packages/core/src/library/*` (+test)

- [x] Quitar una serie de la biblioteca borra su `progress` y sus filas de `chapter_read` en la misma transacción (P-62)
- [x] No deja filas huérfanas ni toca otras series; decide y documenta qué pasa con `series_pref` y la fila `series`
- Verif: `pnpm --filter @ryuunest/core test` con SQLite real
- **Origen:** fuera del alcance de T25/T26 (P-62); el humano pidió tratarlo como tarea separada (2026-10-23).
- **Hecho (2026-10-23):** `removeSeriesFromLibrary({ driver, moduleId, seriesId })` borra `favorite`, `progress` y `chapter_read` en una transacción. **P-73:** se conservan `series` y `series_pref` como caché (título, portada, modo y grupo); no se toca ninguna otra serie y la operación es idempotente. 5 tests sobre SQLite real, incluido el rollback con un driver que falla a mitad.

### 🚩 Checkpoint G `[Ops · Baja · N1]` ✅ (pendiente de revisión humana)

- [x] Guardar y reabrir devuelve la página exacta · [x] `page_total` guardado (RF-41) ·
- [x] 🧍 Revisión

---

## Fase 7 — Respaldo

### T28 Exportar respaldo JSON `[BE · Intermedia · N3]` ✅

Dep: T22, T24, T25, T26 · M · `core/src/backup/{export,schema}.ts` (+test)

- [x] JSON cumple SPEC §8.3 (`format`, `version`, `createdAt`); progreso con `pageTotal`
- [x] Incluye todos los repos y filas de usuario con `updatedAt`; sin secretos ni credenciales
- Verif: `pnpm --filter @ryuunest/core test` + validar contra un esquema de fixture
- **Hecho (2026-10-21):** `exportBackup({ driver, storage, clock })` vuelca todo el estado local en un `Backup` con la forma de SPEC §8.3 (decisión **P-64**: extendido con `series.status`, `progress.chapterTitle`, `repo.addedAt`/`updatedAt` y la metadata del módulo; `settings` como `Record<string,string>` desde la tabla `setting`). Repos y módulos se leen del `Storage` clave-valor; las filas de usuario, de SQL. Lectura pura, sin secretos (sin `files`/`manifest`/`permissions`). 6 tests; 292 en core (580 en el repo), gate completo en verde.

### T29 Importar respaldo — en dos pasos `[BE · Alta · N4 tests · N2 implementación]` ✅

Dep: T28 · M · `core/src/backup/import.ts` (+test)
> **T29a (N4):** escribir solo los tests (en rojo) y los tipos/esquema de resultado; no implementar. **T29b (N2→N3):** implementar hasta verde **sin editar los tests**; si falla 2 veces → «modelo con poca potencia cambiar.» (escala N3, luego N4).

- [x] Respaldo inválido o sobredimensionado se rechaza sin tocar datos
- [x] Fusión respeta el `updated_at` más reciente; reemplazo restaura el estado del respaldo
- [x] Repos/módulos del respaldo se devuelven como **sugerencias**, sin instalar nada (RF-38)
- Verif: `pnpm --filter @ryuunest/core test` + fusionar dos respaldos con progreso en conflicto
- **Hecho (2026-10-23):** T29a y T29b en una sola sesión y rama (`feature/T29ab-backup-import`), por petición del humano. `importBackup({ driver, mode }, texto)` → `ImportResult`: rechazo `TOO_LARGE` (50 MB en bytes UTF-8) / `NOT_JSON` / `INVALID` (con rutas) antes de tocar nada; aplicación en **una transacción** (un fallo a mitad revierte todo). `merge`: por `updated_at` (empate: local), carpetas por nombre, leídos en unión, ajustes con prioridad local; `replace`: restaura el respaldo. Repos y módulos solo como sugerencias (**P-68**, **P-69**). 65 tests (T29a en rojo, verificados con 2 mutaciones); core 357, 717 en el repo.

### T30 E2E de respaldo (AC-7) `[BE · Baja · N2]` ✅

Dep: T29 · S · `core/tests/e2e/backup.e2e.test.ts`

- [x] Biblioteca, carpetas, progreso y repos se reproducen sin pérdidas en instalación limpia
- [x] Nada se instala solo; fusión por `updated_at` verificada con un conflicto
- Verif: `pnpm --filter @ryuunest/core test -- backup.e2e`
- **Hecho (2026-10-23):** E2E con dos dispositivos reales (SQLite en memoria + `Storage`) unidos solo por el JSON: el origen exporta y una instalación limpia importa en `replace`; la exportación del destino iguala la del origen en todas las secciones de usuario (`folders`, `series`, `favorites`, `progress`, `read`, `prefs`, `settings`). Los 2 repos y el módulo vuelven como **sugerencias** y no se registran ni instalan solos (AC-8); confirmar un repo con `RepoRegistry` lo recupera sin instalar su módulo. La fusión se prueba con tres conflictos de progreso: gana el `updated_at` más reciente en ambos sentidos y el empate conserva lo local (P-68). 4 tests; core **361** (721 en el repo). Al no haber código nuevo, se comprobó que los tests cazan fallos con 3 mutaciones: `>=` en lugar de `>` rompe el empate, no restaurar `prefs` rompe el ida y vuelta y vaciar las sugerencias rompe 2 tests.

### T30b Filtro «Leyendo» (P-70) `[BE · Baja · N2]` ✅

Dep: T23 · S · `packages/core/src/library/queries.ts` (+test)

- [x] `browseLibrary` acepta `reading: true` y devuelve solo series con fila en `progress` (P-70)
- [x] `reading: false` devuelve las no empezadas; ausente no filtra; se combina con NSFW, búsqueda, carpeta y cursor
- Verif: `pnpm --filter @ryuunest/core test`
- **Hecho (2026-10-23):** `LibraryFilter.reading?: boolean`; `true` → `p.module_id IS NOT NULL`, `false` → `IS NULL`. 6 tests nuevos (incluye capítulo en la última página, que sigue contando como «Leyendo», y paginación por cursor). F14 ya filtra sus fixtures por `progress !== null` y tiene su test; la conexión real con el núcleo deberá pasar `reading: true` al chip. Core 367, 727 en el repo.

### 🚩 Checkpoint H `[Ops · Baja · N1]`

- [x] Exportar/importar sin pérdidas · [x] Módulos/repos no se instalan solos · [ ] 🧍 Revisión

---

## Fase 8 — Módulos reales y generalidad

### T31 Port de `logicTMO.py` a módulo script `[BE · Alta · N4]`

> **Retirado del repo el 2026-10-26 (P-80):** `modules/tmo/`, sus fixtures y sus pruebas se eliminaron porque el módulo está deprecado y el repo externo (P-78) ya sirve los módulos. Los cambios de API aditivos de T31 (P-74/P-75/P-76) **se conservan** con sus propias pruebas. Lo de abajo es el historial; el «🧍 pendiente» sobre el sitio real ya no aplica a este repo.

Dep: T19 · M · ~~`packages/test-site/fixtures/tmo/*.html`~~ (retirado); módulo fuera del repo principal (P-8)

- [x] `popular`/`latest`/`search`/`details`/`pages` funcionan contra las fixtures, usando solo `host.*`
- [x] Corregidos los 8 defectos del Apéndice A.4 (errores tipados, timeouts, sin estado compartido)
- [x] `pages()` devuelve `Referer`/`User-Agent` en `ImageRef.headers` cuando el sitio lo exige
- Verif: `pnpm --filter @ryuunest/core test -- tmo` · 🧍 ejecución real contra el sitio (fuera de CI)
- **Hecho (2026-10-24):** módulo en `modules/tmo/` (`manifest.json` + `module.js`, formato de la plantilla del SDK; se mueve al repo de módulos cuando exista, P-8) y fixtures sintéticas en `packages/test-site/fixtures/tmo/`. 37 tests en `packages/core/tests/modules/tmo/` + 1 de manifest en `module-sdk`; comprobados con 4 mutaciones. Cambios de API **aditivos** que T32b debe revisar (P-74, P-75, P-76): `HostResponse.url`, errores tipados por forma y `estimatedHasNext` en el arnés. `pnpm --filter @ryuunest/core test -- tmo` ejecuta **toda** la suite de core (el filtro no llega a Vitest); para solo TMO: `pnpm --filter @ryuunest/core exec vitest run tests/modules/tmo`.
- **🧍 Pendiente del humano (ejecución real, fuera de CI)** — lo que las fixtures **no pueden** confirmar porque el sitio no responde desde el entorno del agente: (1) que los selectores del legado siguen vigentes; (2) si `latest_uploads` admite más páginas y cuál es su parámetro (hoy solo página 1); (3) el formato real de la fecha de la release (hoy solo se conserva si es `AAAA-MM-DD`) y los textos de estado (`Publicándose`/`Finalizado`/…); (4) que `Referer` + `User-Agent` bastan para las imágenes; (5) si hay desafío anti-bot (el módulo informa `BLOCKED`, P-8); (6) que la app nativa rellena `HttpResponse.url` con la URL final.

**Ports pendientes de `legacyModulos/`** (decidido 2026-10-24: solo TMO en T31; los demás, tareas separadas a priorizar):

| Módulo legado | Estado en el legado | Bloqueo |
|---|---|---|
| `logicMangaIn.py` (m440.in) | `latest` por JSON y capítulo por HTML estático | `details` usa Playwright (clics para cargar capítulos): el host no tiene navegador |
| `logicFoxManga.py` | listas y ficha por HTML estático | `pages` renderiza JS (`arender`): el host no tiene navegador |
| `logicNineManga.py` | solo lista; `details` incompleto | faltan `details` y `pages` en el legado |
| `logicLuscious.py` | solo lista; `details` incompleto y usa Playwright | faltan `details`/`pages`; NSFW |
| `logicYupmanga.py` | solo lista | anti-bot a nivel TLS (nota del legado): `BLOCKED` en la v1 (P-8) |
| `logicTmoHentai.py` | vacío (`pass`) | nada que portar |

### T32a 2.º sitio falso (JSON + cursor) `[BE · Intermedia · N3]` ✅

Dep: T31 · M · `packages/test-site/fixtures/json-api/**`

- [x] El contrato pasa con las dos arquitecturas de `test-site`; ajustes de API necesarios anotados en la tarea
- Verif: `pnpm -r test`
- **Hecho (2026-10-24):** 8 fixtures JSON estáticos en `packages/test-site/fixtures/json-api/` (`popular-c1/c2`, `latest-c1/c2`, `search-dragon-c1`, `series-dragon-de-ceniza`, `pages-ch-1-r-oficial`, `pages-ch-1-r-alt`) que reproducen las respuestas del sitio JSON dinámico con paginación por cursor. Nuevo test de contrato `packages/core/tests/contract/jsonApi.contract.test.ts` (3 tests) que monta el módulo `EXAMPLE_SCRIPT_JSON` sobre un `StubHttp` con los fixtures estáticos y ejecuta el arnés de contrato completo (`popular`, `latest`, `search`, `details`, `pages`) con `expectImageHeaders`. Verifica que el módulo traduce páginas a cursores (`?cursor=c2`) y que las imágenes llevan las cabeceras exigidas. **Sin ajustes de API nuevos**: los cambios aditivos de T31 (P-74 `HostResponse.url`, P-75 errores tipados, P-76 `estimatedHasNext`) ya cubren la arquitectura JSON + cursor. Suite completa en verde: 787 tests (core 423, +3 nuevos).

### T32b ADR de congelación de API 1.0 `[BE · Alta · N5]`

Dep: T32a · S · `docs/decisions/ADR-000x-congelacion-api-1.0.md`

- [ ] El ADR marca la API 1.0 como estable o enumera los cambios requeridos; lista candidatos de 2.º sitio real (sin instalarlos)
- [ ] Resultado anotado en `MEMORY.md` (preguntas abiertas SPEC §17.2)
- Verif: 🧍 revisar el ADR con el autor

### 🚩 Checkpoint I `[Ops · Baja · N1]`

- [ ] 🧍 `logicTMO` busca, lista capítulos y entrega imágenes en un sitio real · [ ] Contrato pasa con 2 arquitecturas · [ ] API 1.0 congelable · [ ] 🧍 Revisión

---

## Fase 9 — Endurecimiento

### T33 Pruebas de seguridad `[Sec · Alta · N4]`

Dep: T13 · M · `core/tests/security/*.test.ts`

- [ ] Cada amenaza de SPEC §7.2 (zip-slip, bomba, hash, manifest, respaldo malicioso) tiene una prueba que falla si se quita la mitigación
- [ ] Un deep link `ryuunest://add-repo?url=…` solo abre la confirmación, no instala (AC-8)
- [ ] Límites de tamaño/archivos cubiertos
- Verif: `pnpm --filter @ryuunest/core test -- security` + revisar correspondencia amenaza↔prueba

### T34 Pruebas de resiliencia `[BE · Intermedia · N3]`

Dep: T08, T14 · S · `core/tests/resilience/*.test.ts`

- [ ] Módulo que cuelga → `TIMEOUT` sin bloquear el núcleo; excepciones contenidas con `last_error`
- [ ] Reintento manual sin reiniciar; rate-limit por dominio respetado bajo carga
- Verif: `pnpm --filter @ryuunest/core test -- resilience`

### T35 Puertas de CI / contrato / cobertura (AC-11) `[Ops · Baja · N2]`

Dep: T02, T32a · S · `.github/workflows/ci.yml`, `vitest.config.ts`

- [ ] CI falla si la cobertura del contrato baja del umbral; contratos de ambos runtimes corren en CI
- [ ] `pnpm -r test && pnpm -r typecheck && pnpm lint` es la puerta única de fusión
- Verif: ese comando + 🧍 PR de prueba que rompe el contrato y falla el CI

### T36 Núcleo de diagnóstico y errores (P-72) `[BE · Intermedia · N3]`

Dep: T21 · M · `packages/core/src/diagnostics/*`, `packages/core/src/storage/{schema,migrations}.ts` (+test)

- [ ] Migración nueva con tabla `log` (`at`, `level`, `code`, `message`, `context`, `app_version`, `platform`); tope **500 entradas** (borra las más viejas)
- [ ] `record`/`list`/`clear`/`export`; niveles `info`/`warn`/`error`; contexto saneado
- [ ] Redacción estricta: sin credenciales, cookies, cabeceras, HTML, títulos, URLs completas ni rutas locales
- [ ] Export **JSON + texto legible**; sin red ni telemetría
- Verif: `pnpm --filter @ryuunest/core test`
- **Origen:** P-72 (2026-10-23); independiente del Checkpoint J.

### 🚩 Checkpoint J — Fin de la Parte 1 `[Ops · Baja · N1]`

- [ ] Suite y CI en verde · [ ] Cobertura del contrato completa · [ ] 🧍 Revisión → continuar con F11 (Parte 2 ya planificada)

### FA1 Arte final del dragón `[Ops · Baja · N1]` 🧍 (sin dependencias; antes de v1.0 pública)

- [ ] 🧍 Arte original con licencia compatible GPL-3.0; sustituir `apps/mobile/assets/placeholder/*`
- [ ] `ASSETS.md` y `README` de placeholder actualizados; retirar marca TEMPORAL
- Verif: `apps/mobile/tests/placeholder.test.ts` en verde + galería con Playwright (RNF-5)

---

## Fase 6b — Interfaz móvil (cada pantalla: componentes → datos (ejemplo o reales) → estados → Playwright vs `screen.png`)

### F11 Shell: 5 destinos + cabecera única `[FE · Alta · N4]`

Dep: P-A; T35 · M · `apps/mobile/src/{navigation,shell}/*`

- P-65: el humano autoriza adelantar **solo F11**; P-A y T35 siguen pendientes.

- [x] Una sola cabecera y barra inferior, iguales en los cinco marcos (T1)
- [x] Etiquetas funcionales (SPEC §11.7); destino activo con `accent` (V1)
- Verif: [x] Playwright navegando los 5 destinos en 5 anchos · [ ] 🧍 POCO F5 Pro (AC-12 pendiente; el bundle Android no sustituye esta verificación)

### F11b Arreglar el e2e obsoleto del shell (`shell.cjs` y `home.cjs`) `[FE · Baja · N1]` ✅

> Apuntada el 2026-10-26 (hallazgo en F14c y F15). `tests/e2e/shell.cjs` espera los testID `destination-*` del marco de F11, que van desapareciendo al sustituir cada marco por su pantalla real: `destination-home` se fue con F13, `destination-library` con F14c y `destination-discover` se irá con F15. `home.cjs` está roto por lo mismo desde F14c (espera `destination-library`). Quedan vivos solo `destination-sources`/`destination-settings`, y desaparecerán con F16/F20.

Dep: F11; F13, F14c, F15 · S · `apps/mobile/tests/e2e/{shell.cjs,home.cjs}` + raíz de cada pantalla

- [x] Decisión del humano (2026-10-27): **corregir**, no eliminar. Esperas estables: `screen-<id>` en la raíz de cada pantalla real (`HomeScreen`, `LibraryScreen`, `DiscoverScreen`) y `destination-<id>` en los marcos; `markers.cjs` (`destinationMarker`) une los dos y `tests/screens/destinationMarkers.test.ts` vigila el convenio para que la próxima pantalla (F16/F20) no vuelva a romper el script
- [x] `home.cjs`: el tramo de `reduced-motion` pasa por el marcador estable (`destinationMarker("library")`)
- [x] Capturas base de `docs/capturasF11/` regeneradas (426 y 1440; los destinos con pantalla real ya muestran contenido)
- [x] Convenio escrito en `docs/screen-blueprint.md` (para F16/F20 y las pantallas nuevas)
- Verif: [x] los cuatro scripts sobre el export estático (`shell`, `home`, `library`, `discover`) en verde, cero errores de consola y cero dominios externos · [x] `gallery-shell.cjs` sobre Metro · [ ] 🧍 POCO (de siempre)

### F13 Inicio `[FE · Intermedia · N3]` ✅ (pendiente Playwright + POCO)

Dep: F11; T25/T27 · M · `apps/mobile/src/screens/home/*`

- [x] «Continuar» abre en la página exacta; 3 secciones (máx. 4, V6); sin contadores (RF-42); barra = `page_index/page_total`
- [x] Componentes reutilizables: SectionHeader, ContinueCard, RecentCard, FolderCard
- [x] Estados: vacío (sin favoritos ni progreso), datos de ejemplo coherentes (D1)
- [x] Traducciones (`home.*`), galería actualizada, DIFFS.md anotado
- [x] Verif: Playwright vs `inicio_guarida/screen.png` (Corte 10 pendiente) · 🧍 POCO
- **Hecho (2026-10-23):** 9 cortes TDD en rama `feature/F13-home-screen`; 26 tests nuevos; 629 tests en verde; lint y typecheck en verde. Fuera de la v1 (SPEC §11.5): sin «Novedades de Portales» ni tarjeta de estado del nido. Ver `MEMORY.md` §5.

### F14a Biblioteca: cuadrícula, búsqueda y filtros `[FE · Intermedia · N3]` ✅ (pendiente Playwright + POCO)

Dep: F11; T23 · M · `apps/mobile/src/screens/library/*`

- [x] Búsqueda siempre visible; chips Todo · Leyendo (sin «Completado»); filtros por tipo (los 4: P2-8), fuente y NSFW (apagado oculta series NSFW, RF-35)
- [x] Cuadrícula virtualizada (`FlatList` numColumns=3); títulos a 2 líneas sin «…» (T7)
- [x] Componente LibraryCard reutilizable (portada 2:3, insignia neutra V1/V7, barra 3px RF-41)
- [x] Verif: Playwright vs `biblioteca_tesoros/screen.png` · 🧍 3000 series con desplazamiento fluido (AC-4)
- **Hecho (2026-10-23):** F14a+F14b en una rama `feature/F14ab-library-screen` (TDD, 23 tests nuevos). 652 tests en verde. Ver `MEMORY.md` §5.

### F14b Biblioteca: carpetas y orden `[FE · Intermedia · N3]` ✅ (pendiente Playwright + POCO)

Dep: F14a · M · `apps/mobile/src/screens/library/*`

- [x] Chip Carpetas y gestión de carpetas; un solo acceso a carpetas por pantalla (V6)
- [x] Orden por nombre / último leído / fecha (cicla al pulsar el chip)
- [x] Sección de carpetas con chips horizontales
- [x] Verif: Playwright vs `biblioteca_tesoros/screen.png`
- **Hecho (2026-10-23):** junto con F14a en `feature/F14ab-library-screen`. Filtros de tipo/fuente como chips placeholder (la hoja llega con la conexión al núcleo).

### F14c Biblioteca conectada al núcleo `[FE · Intermedia · N3]` ✅ (pendiente POCO)

> Añadida el 2026-10-26 (P-79): F14a/F14b usaban solo `SAMPLE_LIBRARY_DATA`, así que FB1 (P-67) no tenía un ejemplo real de conexión con el núcleo.

Dep: F14a, F14b; T21, T22, T23 · M · `apps/mobile/src/{data,screens/library,app/(tabs)/library.tsx}`

- [x] `loadLibraryData` recorre `browseLibrary` (cursor) y `Folders` y adapta a `LibraryData`; sin sembrar datos
- [x] `createExpoSqlDriver` (`SqlDriver` sobre `expo-sqlite`) + `appDatabase.native.ts` (migra el esquema §8.1); web sin SQLite (`appDatabase.ts` → datos de ejemplo)
- [x] Ruta Biblioteca: carga, error (ErrorState + reintentar) y datos; orden «último leído» real (`lastReadAt`)
- Verif: [x] Vitest con SQLite real (`node:sqlite`) · [x] export web + Playwright (`tests/e2e/library.cjs`) · [x] bundle Android compila · [ ] 🧍 POCO F5 Pro (base real vacía → estado vacío)

### FB1 Plano de pantalla (`screen-blueprint.md`) `[Doc · Baja · N4]`

> Se ejecuta después de F14c: F13 es el ejemplo de fixtures y F14a/F14b/F14c el de datos reales (P-67, P-79).

Dep: F11, F13, F14a, F14b, F14c · S · `docs/screen-blueprint.md` (1 página)

- [x] Documenta, a partir de F11, F13, F14a, F14b y F14c ya hechas: estructura de carpetas de una pantalla, patrón (componentes → datos de ejemplo o reales → estados → Playwright vs `screen.png`), uso de `t()` y tokens, cómo se conecta con el núcleo **con datos reales de la biblioteca** (F14a/F14b; T22/T23) y un ejemplo de test Playwright
- [x] Máx. 1 página (42 líneas, con prueba guardia en pps/mobile/tests/docs/screenBlueprint.test.ts); sin reglas nuevas. F13, ejemplo de fixtures; F14c, ejemplo de datos reales
- Las pantallas F12, F15, F17, F20, F21 y F25 **leen este plano** en vez de explorar el repo. Verif: 🧍 revisión

### F15 Descubrir `[FE · Intermedia · N2]` ✅

Dep: F11, FB1; T20, T10 · M · `apps/mobile/src/screens/discover/*`

- [x] Selector de módulo (hoja de nivel 2) que recuerda el último en la sesión; módulo NSFW oculto con el filtro apagado (RF-35)
- [x] Filas `latest` y `popular` solo si el módulo las ofrece (RF-9); búsqueda con paginación Anterior/Siguiente (RF-10); catálogo = `search` del módulo activo
- [x] Error de módulo con causa, código, reintentar y ver detalle (RF-11); vacío → ir a Fuentes; carga con `LoadingState`; sin orden/filtro por género
- [x] Capa de datos real: los módulos de ejemplo se montan con `createModuleApi` (T20) sobre `test-site` (T10) vía `DeclarativeRuntime` + `TestSiteHttp` (P-81)
- Verif: [x] Vitest (23 tests nuevos: fixtures, capa de datos, selector, puerta de galería) · [x] Playwright (`tests/e2e/discover.cjs`, 426 y 1440, cero externos) · [ ] 🧍 POCO F5 Pro

### F15b Descubrir conectado a módulos instalados `[FE · Baja · N2]` ✅ (queda la navegación con F17)

> Añadida el 2026-10-26 con F15 (P-81): la pantalla ya está hecha; falta leer el registro real y persistir entre arranques. Hecha el 2026-10-27 (P-83).

Dep: F15, F16; T14, T20 · S · `apps/mobile/src/screens/discover/discoverData.ts`

- [x] `discoverData` lee `ModuleRegistry` (T14) en el dispositivo: `DiscoverDataSource` con dos implementaciones — instalados (activos y **declarativos**; los `script` esperan el `ScriptLoader` de app, D-5) y `test-site` en web; la entrada del paquete se decodifica del hexadecimal y se monta con `createModuleApi` (T20) sobre `createFetchHttp` (puerto `Http` sobre el `fetch` de la plataforma)
- [x] El último módulo elegido persiste entre arranques: tabla `setting`, ajuste `discover.lastModule` (web sigue con memoria de sesión: no hay SQLite)
- [ ] Al tocar una serie, navegar a la ficha — **bloqueado por F17** (no existe la pantalla de detalle); se hace al hacer F17
- Verif: [x] Vitest (10 tests nuevos: adaptador `Http`, fuente instalada sobre SQLite real, `setting`) · [x] Playwright sin cambios de comportamiento en web (`discover.cjs` y `library.cjs` en verde) · [ ] 🧍 POCO con un módulo instalado desde F16 (pendiente: F16 aún no da la UI de instalación)

### F16 Fuentes `[FE · Alta · N4]` ✅ (pendiente POCO)

Dep: F11; T14, T15 · M · `apps/mobile/src/screens/sources/*`

- [x] Confirmación muestra permisos y hash; script exige mantener pulsado (`HoldToConfirm`); protección vía `SecureLock` (RF-7, `expo-local-authentication`, falla cerrado si no hay bloqueo)
- [x] Actualizar con ampliación de permisos pide confirmar de nuevo (RF-6): `PackageInstaller.prepare` + `InstallFlow.previewUpdate/applyUpdate` en el núcleo; activar/desactivar/desinstalar/actualizar; último error; sincronizar y quitar repositorio (RF-8)
- [x] Capa de datos `createSourcesService` (núcleo real sobre SQLite) y servicio en memoria para web/galería; ajuste `security.installProtection` en `setting` (apagado por defecto)
- Verif: [x] Vitest · [x] Playwright (`tests/e2e/sources.cjs`, 426 y 1440, capturas en `docs/capturasF16/`, cero errores y cero externos) · [ ] 🧍 POCO con un repo y un módulo reales · [ ] 🧍 instalar un módulo `script` y comprobar la confirmación reforzada y el bloqueo del dispositivo

### F16b Interruptor de «Protección de instalación» `[FE · Baja · N2]` ✅

> Añadida el 2026-10-27 (decisión del humano): F16 lee `security.installProtection` de `setting`, pero no hay interruptor visible hasta F20. Hecha el 2026-10-27 con una pantalla mínima de Ajustes que F20 ampliará.

Dep: F16 · S · `apps/mobile/src/screens/settings/*`

- [x] Fila con interruptor en Ajustes (`SettingsRow` + `Switch` nuevo) que escribe `security.installProtection` (RF-7); sin bloqueo en el dispositivo, la fila avisa (hint en tono aviso) y el interruptor queda deshabilitado en vez de activable sin efecto
- [x] Prueba con SQLite real: activar escribe el ajuste y falla cerrado sin bloqueo; el efecto sobre añadir repo e instalar `script` ya estaba cubierto en `sourcesData.test.ts`
- [x] Además (P-85): fila «Fuentes» que restaura el repo oficial cuando falta
- Verif: [x] Vitest (6 tests nuevos) · [x] Playwright (`tests/e2e/settings.cjs`, 426 y 1440, capturas en `docs/capturasF16b/`) · [ ] 🧍 POCO con bloqueo real del dispositivo

### F16c Repo oficial por defecto `[FE · Baja · N2]` ✅ (nace de F16/F12)

> Añadida el 2026-10-27 (decisión del humano, P-85): al entrar en Fuentes sin repos, la app añade sola el repo `davidluciol/RyuuNest-Models` y muestra sus módulos.

Dep: F16 · S · `apps/mobile/src/data/officialRepo.ts`, `screens/sources/sourcesData.ts`

- [x] `ensureOfficialRepo` registra el repo oficial con la lista vacía; es de primera parte, no pide bloqueo (RF-7 protege los repos que añade el usuario)
- [x] Quitarlo recuerda el descarte (`setting` `sources.officialRepoDismissed`): no vuelve a añadirse solo y el estado vacío explica cómo recuperarlo (Ajustes → Restaurar)
- [x] Si la descarga falla (sin red o índice caído), Fuentes queda en el vacío con un aviso
- Verif: [x] Vitest (SQLite real: auto-registro, descarte, restaurar, fallo) · [x] Playwright (`sources.cjs` y `settings.cjs` sin regresión) · [ ] 🧍 POCO con el repo real

### F12 Primer uso (3 pasos) + estado vacío `[FE · Intermedia · N3]` ✅

Dep: F11, FB1, F16, T15 · M · `apps/mobile/src/screens/onboarding/*`

- [x] Guía hasta añadir un repo (URL del repo oficial ya puesta, P-85) y activar un módulo con la confirmación de Fuentes (hoja `InstallSheet` compartida); nada se instala sin confirmación (AC-8); «Saltar» en cada paso (decisión del humano)
- [x] En TV se omite «Importar respaldo» hasta F21b (anotado en `design/stitch/DIFFS.md`)
- [x] La puerta sustituye a Inicio en el primer uso real (sin repos ni módulos; marca `onboarding.completed`); en web nunca hay primer uso (P-79)
- Verif: [x] Vitest (controlador 8, puerta 3) · [x] Playwright del flujo en la galería (`tests/e2e/onboarding.cjs`, 426 y 1440, AC-8 comprobado; capturas en `docs/capturasF12/`) · [ ] 🧍 dispositivo

### F17 Serie (detalle) `[FE · Intermedia · N2]`

Dep: F11, FB1; T22, T24, T26 · M · `apps/mobile/src/screens/series/*`

- [ ] Fila de capítulo con máx. 2 señales (V8); favorito con un toque; carpeta al mantener pulsado (RF-17)
- [ ] Release preferida recordada por serie (RF-16)
- Verif: Playwright vs `detalle_pantalla/screen.png`

### F18 Lector 1 `[FE · Alta · N4]`

Dep: F17; T25, T27 · M · `apps/mobile/src/screens/reader/*`

- [ ] Modo recordado por serie; centro muestra/oculta controles; guarda `page_index`+`page_total`; reabre en la página exacta
- [ ] Nada decorativo sobre el contenido; sin animaciones en el lector
- Verif: Playwright vs `pantalla_lector/screen.png` · 🧍 60 páginas en MiBox 4 sin OOM (AC-6)

### F19 Lector 2 `[FE · Alta · N4]`

Dep: F18; T05 · M · `apps/mobile/src/{screens/reader,reader}/*`

- [ ] Imágenes con `ImageRef.headers` (RF-24); fallo de imagen → reintento individual, sin descartar el capítulo
- [ ] Zoom con pellizco, pantalla encendida; precarga dentro del presupuesto de memoria de la Fase 0
- Verif: Playwright (zoom/controles) · 🧍 romper una imagen y medir memoria en precarga

### F20 Ajustes `[FE · Baja · N2]`

🟡 Marco navegable de F11; contenido, datos y estados de esta pantalla **pendientes**.

Dep: F11, FB1; T25 · M · `apps/mobile/src/screens/settings/*`

- [ ] NSFW apagado por defecto (RF-34); sin «Modo OLED», «Zonas táctiles», «Precarga» ni selector de tema
- Verif: Playwright vs `ajustes_pantalla/screen.png` · 🧍 cambiar NSFW y ver Biblioteca/Descubrir

### F21 Respaldo (UI) — dividida en tres tareas (2026-10-23)

> El humano pidió tratar como tareas separadas lo que quedó fuera de T29. F21a–F21c sustituyen a la F21 única; FB1 se lee en las tres.

#### F21a Exportar y compartir respaldo `[FE · Intermedia · N3]`

Dep: F20, FB1; T28 · S · `apps/mobile/src/screens/settings/backup/*`

- [ ] Exporta con `exportBackup` y comparte el archivo con la hoja del sistema (RF-37)
- [ ] Estado de error si falla la escritura o el compartir
- Verif: Playwright en web · 🧍 compartir el archivo en un teléfono

#### F21b Importar respaldo `[FE · Intermedia · N3]`

Dep: F21a, F29; T29, T36 · M · `apps/mobile/src/screens/settings/backup/*`

- [ ] Elegir archivo, leerlo y aplicar `merge` o `replace` con `importBackup` (RF-38)
- [ ] Rechazo `TOO_LARGE` / `NOT_JSON` / `INVALID` con mensaje claro y sin tocar datos
- [ ] Confirmación explícita antes de `replace` (destructivo)
- Verif: Playwright exportar/reimportar en instalación limpia · 🧍 archivo real

#### F21c Sugerencias de repos y módulos `[FE · Baja · N2]`

Dep: F21b; T29 · S · `apps/mobile/src/screens/settings/backup/*`

- [ ] Lista las sugerencias de `importBackup`; nada se instala solo (AC-8)
- [ ] Descarta los repos ya registrados (`RepoRegistry.listRepos`)
- [ ] Confirmar un repo lo registra; un módulo sigue su flujo de instalación con confirmación (RF-38)
- Verif: Playwright + tests de la lógica de filtrado

### 🚩 Checkpoint P-B `[Ops · Baja · N1]`

- [ ] AC-1, AC-3, AC-12 (móvil) · [ ] 🧍 AC-6 en MiBox 4 · [ ] Sin literales; estados resueltos · [ ] 🧍 Revisión

---

## Fase 6c — Errores y diagnóstico (transversal, P-72)

### FB2 Diseño en Stitch de errores y Diagnóstico `[Ops · Baja · N2]`

Dep: FB1, F06, F20 · S · `design/stitch/` (PNG/HTML)

- [ ] Toast, modal y banner con estados (info, warning, error, con acción, expandido)
- [ ] Ajustes → Diagnóstico: lista, exportar, copiar, borrar y estado vacío
- [ ] Estados vacíos a pantalla completa (dragón, título y acción)
- Verif: 🧍 revisión y exportación a `design/stitch/`

### F29 Componentes de error: toast, modal y banner `[FE · Intermedia · N3]`

Dep: F06, F10, FB2 · M · `apps/mobile/src/components/*`

- [ ] Toast 4 s, una línea y acción opcional; no bloquea
- [ ] Modal con título, explicación simple, código, detalle expandible y acciones (reintentar, copiar, exportar)
- [ ] Banner inline para error de módulo con causa, código, reintentar y detalle (F15)
- [ ] Todos los estados en la galería; tokens, i18n y sin animación en el lector
- Verif: Playwright + galería

### F30 Ajustes → Diagnóstico `[FE · Baja · N2]`

Dep: F20, F29, T36 · S · `apps/mobile/src/screens/settings/diagnostics/*`

- [ ] Ver últimos registros, exportar (JSON + texto), copiar informe y borrar
- [ ] Estado vacío y confirmación antes de borrar
- Verif: Playwright · 🧍 compartir el archivo

### F31 Integrar errores en las pantallas `[FE · Intermedia · N3]`

Dep: F15, F16, F21, F29, T36 · M · `apps/mobile/src/screens/*`

- [ ] Descubrir y Fuentes usan banner/modal con causa, código, reintentar y detalle
- [ ] Respaldo (F21) muestra rechazos y errores con modal/toast y registra el evento
- [ ] Lector muestra un banner estático (sin animación) y registra el fallo
- [ ] Cada error visible deja una entrada en `log` sin datos sensibles
- Verif: Playwright por pantalla + tests de integración

---

## Fase 7 — TV

### F22 Riel lateral + navegación espacial + foco `[FE · Alta · N4]`

Dep: P-B · M · `apps/mobile/src/tv/*`

- [ ] Foco siempre visible (anillo 2 px `accent`, separación 2 px); escala 1,25×; márgenes seguros; navegación completa con D-pad
- Verif: Playwright (foco con teclado) · 🧍 recorrer los 5 destinos en la MiBox 4

### F23 Lector para TV (D-pad) `[FE · Alta · N4]`

Dep: F22, F18, F19 · M · `apps/mobile/src/screens/reader/tv/*`

- [ ] Todas las acciones del lector solo con control remoto (AC-9); controles grandes; sin animaciones
- Verif: 🧍 leer un capítulo completo en la MiBox 4 (AC-9, AC-6)

### 🚩 Checkpoint P-C `[Ops · Baja · N1]`

- [ ] AC-9 · [ ] 🧍 Revisión

---

## Fase 8 — Web + extensión

### F24 Cliente web (React + Vite) `[FE · Intermedia · N3]`

Dep: P-B (o P-C), F04 · M · `apps/web/{package.json,vite.config.ts,src/**}`

- [ ] Reutiliza tokens/componentes; riel 240 px, rejilla de 8 columnas; fuentes locales, cero peticiones externas (RNF-5)
- Verif: Playwright en ancho escritorio y móvil

### F25 Pantallas web `[FE · Intermedia · N2]`

Dep: F24, FB1, P-B · M · `apps/web/src/screens/*`

- [ ] Pantallas de la v1 con densidad compacta; una etiqueta por concepto; estados carga/vacío/error
- Verif: Playwright recorriendo pantallas vs los PNG

### F26 Extensión de navegador (protocolo HTTP) `[Sec · Alta · N4]`

Dep: F24 · M · `apps/extension/{manifest.json,src/background.ts}`

- [ ] Recibe `{id,url,method,headers,body?}`; responde solo al origen de la app; sin dominio autorizado no hay petición (SPEC §7.2)
- Verif: pruebas del manifiesto/permisos · 🧍 cargar la extensión y autorizar un dominio

### F27 Puente web ↔ extensión `[FE/BE · Alta · N4]`

Dep: F25, F26 · M · `apps/web/src/{ports/http.ts,worker/*}`

- [ ] Módulos en Web Worker sin DOM; `Http` web solo vía extensión; se lee un capítulo en el navegador (AC-10)
- Verif: Playwright (peticiones salen por la extensión) · 🧍 leer un capítulo con la extensión instalada

### 🚩 Checkpoint P-D `[Ops · Baja · N1]`

- [ ] AC-10 · [ ] 🧍 Revisión

---

## Verificación final

### F28 Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12) `[FE · Intermedia · N3]`

Dep: P-D · M · `apps/web/tests/e2e/*`, `design/stitch/DIFFS.md`

- [ ] Cada pantalla v1 vs su `screen.png` sin diferencias de color, tipografía, radio ni espaciado; diferencias aceptadas en `DIFFS.md`
- [ ] Comprobaciones automáticas de `AGENTS.md` §5 en verde
- Verif: Playwright sobre la galería web · 🧍 capturas en POCO F5 Pro y MiBox 4; lista de 20 s (`DESIGN_RULES.md` §6)

### 🚩 Checkpoint P-E — Fin de la Parte 2 `[Ops · Baja · N1]`

- [ ] Pantallas verificadas y diferencias registradas · [ ] AC-12 y AC-13 completos · [ ] 🧍 Revisión y publicación v1
