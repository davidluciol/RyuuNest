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

---

## Fase 6 — Progreso y lecturas

### T25 + T26 — una sola sesión (mismo patrón) `[BE · Baja · N2]` ✅
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

### T27 Máquina de estados del lector (headless) `[BE · Intermedia · N3]`
Dep: T25 · M · `core/src/reader/ReaderState.ts` (+test)
- [ ] Modos vertical continuo/paginado; cambiar de página y saltar entre capítulos
- [ ] Cambiar de modo actualiza la preferencia de la serie (T24)
- [ ] Última página → «capítulo terminado» y ofrece el siguiente
- [ ] `page_index` en `[0, page_total]`; políticas de memoria documentadas (el render es Parte 2)
- Verif: `pnpm --filter @ryuunest/core test` + recorrer un capítulo de 60 páginas

### 🚩 Checkpoint G `[Ops · Baja · N1]`
- [ ] Guardar y reabrir devuelve la página exacta · [ ] `page_total` guardado (RF-41) · [ ] 🧍 Revisión

---

## Fase 7 — Respaldo

### T28 Exportar respaldo JSON `[BE · Intermedia · N3]`
Dep: T22, T24, T25, T26 · M · `core/src/backup/{export,schema}.ts` (+test)
- [ ] JSON cumple SPEC §8.3 (`format`, `version`, `createdAt`); progreso con `pageTotal`
- [ ] Incluye todos los repos y filas de usuario con `updatedAt`; sin secretos ni credenciales
- Verif: `pnpm --filter @ryuunest/core test` + validar contra un esquema de fixture

### T29 Importar respaldo — en dos pasos `[BE · Alta · N4 tests · N2 implementación]`
Dep: T28 · M · `core/src/backup/import.ts` (+test)
> **T29a (N4):** escribir solo los tests (en rojo) y los tipos/esquema de resultado; no implementar. **T29b (N2→N3):** implementar hasta verde **sin editar los tests**; si falla 2 veces → «modelo con poca potencia cambiar.» (escala N3, luego N4).
- [ ] Respaldo inválido o sobredimensionado se rechaza sin tocar datos
- [ ] Fusión respeta el `updated_at` más reciente; reemplazo restaura el estado del respaldo
- [ ] Repos/módulos del respaldo se devuelven como **sugerencias**, sin instalar nada (RF-38)
- Verif: `pnpm --filter @ryuunest/core test` + fusionar dos respaldos con progreso en conflicto

### T30 E2E de respaldo (AC-7) `[BE · Baja · N2]`
Dep: T29 · S · `core/tests/e2e/backup.e2e.test.ts`
- [ ] Biblioteca, carpetas, progreso y repos se reproducen sin pérdidas en instalación limpia
- [ ] Nada se instala solo; fusión por `updated_at` verificada con un conflicto
- Verif: `pnpm --filter @ryuunest/core test -- backup.e2e`

### 🚩 Checkpoint H `[Ops · Baja · N1]`
- [ ] Exportar/importar sin pérdidas · [ ] Módulos/repos no se instalan solos · [ ] 🧍 Revisión

---

## Fase 8 — Módulos reales y generalidad

### T31 Port de `logicTMO.py` a módulo script `[BE · Alta · N4]`
Dep: T19 · M · `packages/test-site/fixtures/tmo/*.html`; módulo fuera del repo principal (P-8)
- [ ] `popular`/`latest`/`search`/`details`/`pages` funcionan contra las fixtures, usando solo `host.*`
- [ ] Corregidos los 8 defectos del Apéndice A.4 (errores tipados, timeouts, sin estado compartido)
- [ ] `pages()` devuelve `Referer`/`User-Agent` en `ImageRef.headers` cuando el sitio lo exige
- Verif: `pnpm --filter @ryuunest/core test -- tmo` · 🧍 ejecución real contra el sitio (fuera de CI)

### T32a 2.º sitio falso (JSON + cursor) `[BE · Intermedia · N3]`
Dep: T31 · M · `packages/test-site/fixtures/json-api/**`
- [ ] El contrato pasa con las dos arquitecturas de `test-site`; ajustes de API necesarios anotados en la tarea
- Verif: `pnpm -r test`

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

### 🚩 Checkpoint J — Fin de la Parte 1 `[Ops · Baja · N1]`
- [ ] Suite y CI en verde · [ ] Cobertura del contrato completa · [ ] 🧍 Revisión → continuar con F11 (Parte 2 ya planificada)

### FA1 Arte final del dragón `[Ops · Baja · N1]` 🧍 (sin dependencias; antes de v1.0 pública)
- [ ] 🧍 Arte original con licencia compatible GPL-3.0; sustituir `apps/mobile/assets/placeholder/*`
- [ ] `ASSETS.md` y `README` de placeholder actualizados; retirar marca TEMPORAL
- Verif: `apps/mobile/tests/placeholder.test.ts` en verde + galería con Playwright (RNF-5)

---

## Fase 6b — Interfaz móvil (cada pantalla: componentes → datos de ejemplo → estados → Playwright vs `screen.png`)

### F11 Shell: 5 destinos + cabecera única `[FE · Alta · N4]`
Dep: P-A; T35 · M · `apps/mobile/src/{navigation,shell}/*`
- [ ] Una sola cabecera y barra inferior, iguales en todas las pantallas (T1)
- [ ] Etiquetas funcionales (SPEC §11.7); destino activo con `accent` (V1)
- Verif: Playwright navegando los 5 destinos · 🧍 POCO F5 Pro

### F13 Inicio `[FE · Intermedia · N3]`
Dep: F11; T25/T27 · M · `apps/mobile/src/screens/home/*`
- [ ] «Continuar» abre en la página exacta; máx. 4 secciones; sin contadores (RF-42); barra = `page_index/page_total`
- Verif: Playwright vs `inicio_guarida/screen.png` · 🧍 POCO

### FB1 Plano de pantalla (`screen-blueprint.md`) `[Doc · Baja · N4]`
Dep: F11, F13 · S · `docs/screen-blueprint.md` (1 página)
- [ ] Documenta, a partir de F11 y F13 ya hechas: estructura de carpetas de una pantalla, patrón (componentes → datos de ejemplo → estados → Playwright vs `screen.png`), uso de `t()` y tokens, cómo se conecta con el núcleo y un ejemplo de test Playwright
- [ ] Máx. 1 página; sin reglas nuevas (solo lo que ya hacen F11/F13)
- Las pantallas F12, F15, F17, F20, F21 y F25 **leen este plano** en vez de explorar el repo. Verif: 🧍 revisión

### F14a Biblioteca: cuadrícula, búsqueda y filtros `[FE · Intermedia · N3]`
Dep: F11; T23 · M · `apps/mobile/src/screens/library/*`
- [ ] Búsqueda siempre visible; chips Todo · Leyendo (sin «Completado»); filtros por tipo (los 4: P2-8), fuente y NSFW (apagado oculta series NSFW, RF-35)
- [ ] Cuadrícula virtualizada; títulos a 2 líneas sin «…» (T7)
- Verif: Playwright vs `biblioteca_tesoros/screen.png` · 🧍 3000 series con desplazamiento fluido (AC-4)

### F14b Biblioteca: carpetas y orden `[FE · Intermedia · N3]`
Dep: F14a · M · `apps/mobile/src/screens/library/*`
- [ ] Chip Carpetas y gestión de carpetas; un solo acceso a carpetas por pantalla (V6)
- [ ] Orden por nombre / último leído / fecha
- Verif: Playwright vs `biblioteca_tesoros/screen.png`

### F15 Descubrir `[FE · Intermedia · N2]`
Dep: F11, FB1; T20, T10 · M · `apps/mobile/src/screens/discover/*`
- [ ] Recuerda el último módulo; módulo NSFW oculto con el filtro apagado
- [ ] Error de módulo con causa, código, reintentar y ver detalle; sin orden/filtro por género
- Verif: Playwright vs `descubrir_aventuras/screen.png` con `test-site`

### F16 Fuentes `[FE · Alta · N4]`
Dep: F11; T14, T15 · M · `apps/mobile/src/screens/sources/*`
- [ ] Confirmación muestra permisos y hash; script exige mantener pulsado; protección vía `SecureLock` (RF-7)
- [ ] Actualizar con ampliación de permisos pide confirmar de nuevo (RF-6); activar/desactivar/desinstalar/actualizar; último error
- Verif: Playwright vs `fuentes_portales/screen.png` · 🧍 instalar un módulo `script`

### F12 Primer uso (3 pasos) + estado vacío `[FE · Intermedia · N3]`
Dep: F11, FB1, F16, T15 (va después de F16) · M · `apps/mobile/src/screens/onboarding/*`
- [ ] Guía hasta añadir un repo y activar un módulo; nada se instala sin confirmación (AC-8)
- [ ] En TV, el paso 2 prioriza «Importar respaldo»
- Verif: Playwright del flujo con `test-site` (AC-1) · 🧍 dispositivo

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
Dep: F11, FB1; T25 · M · `apps/mobile/src/screens/settings/*`
- [ ] NSFW apagado por defecto (RF-34); sin «Modo OLED», «Zonas táctiles», «Precarga» ni selector de tema
- Verif: Playwright vs `ajustes_pantalla/screen.png` · 🧍 cambiar NSFW y ver Biblioteca/Descubrir

### F21 Respaldo (UI) `[FE · Intermedia · N3]`
Dep: F20, FB1; T28, T29 · M · `apps/mobile/src/screens/settings/backup/*`
- [ ] Exportar/compartir e importar (fusión/reemplazo) reproduce todo (AC-7); sugerencias de repos sin instalar solas
- [ ] Respaldo inválido se rechaza con mensaje claro
- Verif: Playwright exportar/reimportar en instalación limpia · 🧍 compartir el archivo

### 🚩 Checkpoint P-B `[Ops · Baja · N1]`
- [ ] AC-1, AC-3, AC-12 (móvil) · [ ] 🧍 AC-6 en MiBox 4 · [ ] Sin literales; estados resueltos · [ ] 🧍 Revisión

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
