# todo.md — RyuuNest (solo pendientes) · 2026-11-12

> Historial completo de lo hecho → `tasks/todo.archive.md` (podado el 2026-11-12: aquí solo queda lo pendiente). Contexto → `tasks/plan.md`.
> **Identificadores sin renumerar** (decisión del humano, 2026-11-12): los códigos T/F/QAw siguen siendo válidos en `MEMORY.md`, `tasks/Analisis.md`, ADR-0003 y el SPEC.
> **Al iniciar sesión leer `tasks/complexity.md` §1 (reglas).** Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
> Comandos: `pnpm -r typecheck` · `pnpm -r test` · `pnpm -r build` · `pnpm lint` · `pnpm --filter @ryuunest/core test`.
> Tracker: `bd` local → GitHub Issues cuando exista el repo (P-12). Etiqueta: `[tipo · complejidad · nivel]`. 🧍 = paso humano (no inventar mediciones).

**Hecho hasta hoy:** Fases 0–7 del núcleo (T01–T30b, T32a/T32b, T37), endurecimiento T34/T35/T36, Fase 6a completa (F01–F10), móvil F11–F21 y F29/F30/FB2 hechas (F34 casi completa), web F24/F25 y extensión F26/F27 hechas, F28 parte web, recorridos F32/F33 hechos. Detalle en `todo.archive.md`.

**Orden recomendado:** T38 → T39 → T40 → T41 (cierre API 1.0) · T33 en paralelo · F31 (Playwright por pantalla) · F40 → F45 → F41/F42 → F43 → F44 (propuestas de F33, pendientes de aprobar) · F22/F23 (TV) · pulidos F35–F39 y QAw1–3 · verificaciones 🧍 al final de cada tarea.

---

## Cierre Fase 0

### T05 cierre `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope de imágenes medido; marcar T05 ✅
- Aparte (no bloquea): MiBox 4 pospuesta (P-43); revalidar RNF-1 en release.

---

## Cierre de la API 1.0 (ADR-0003, aceptado 2026-10-29)

Orden: ~~T37~~ ✅ → T38 → T39 → T40 → T41. Cada tarea: TDD (rojo → verde), un commit por corte, rama propia. Todas parten de `docs/decisions/ADR-0003-congelacion-api-1.0.md`; los tres módulos publicados de `RyuuNest-Models` son la regresión (ninguno debe necesitar cambios, salvo que T40 lo decida).

### T38 Compatibilidad hacia delante ejecutable (R3) `[BE · Intermedia · N4]`

Dep: T37 · M · `packages/module-sdk/src/{repoIndex,manifest,cli}.ts`, `packages/core/src/{contract/repoIndex,repo/RepoRegistry}.ts`, `apps/mobile/{app.json,src/screens/sources/useSourcesData.ts}`

- [ ] Índice tolerante **por entrada**: `apiVersion`, `runtime` o `kinds` desconocidos marcan la entrada «no compatible» y no invalidan el repo; las rotas se descartan con aviso
- [ ] `minAppVersion?` opcional en `RepoModuleEntry` (aditivo) y la app oculta/etiqueta lo incompatible antes de descargar
- [ ] `app.json` con versión real y la app la pasa al validador (`Constants.expoConfig?.version`); `minAppVersion` se aplica de verdad
- [ ] El CLI no comprueba `minAppVersion` salvo con `--app-version`
- [ ] Pruebas: un índice con un módulo `apiVersion: 2` sigue listando los de v1
- Verif: `pnpm -r test` + 🧍 corregir en `RyuuNest-Models` la frase «un campo de más o de menos lo rechaza» de su `AGENTS.md`

### T39 Formato declarativo cerrado y comprobable (R2, D2) `[BE · Alta · N4]`

Dep: T38 · L (dividir en 2 PRs si pasa de ~5 archivos por corte) · `docs/declarative-format.md`, `packages/core/src/runtimes/{DeclarativeRuntime,transforms}.ts`, `packages/module-sdk/src/*`, `packages/module-sdk/templates/declarative/*`

- [ ] `pages.imageHeaders` (mapa de cabeceras con `{baseUrl}`, `{chapterId}`, `{releaseId}`) rellena `ImageRef.headers`; el lector ya las aplica
- [ ] Serie sin capítulos devuelve `chapters: []` en vez de `PARSE` (L2)
- [ ] `validateDeclarativeConfig` en `module-sdk`, usado por `ryuunest-module validate`
- [ ] `ryuunest-module test` ejecuta el arnés también con módulos declarativos (retirar la omisión de `cli.test.ts`)
- [ ] `docs/declarative-format.md` normativo a partir del Anexo B del ADR; SPEC §6.6 lo enlaza
- [ ] L3–L6 del ADR (extra, fechas, id sin codificar, mapas de `status`/`kind`): decidir aquí cuáles entran; el resto queda como aditivo
- Verif: `pnpm -r test` + contrato declarativo con `imageHeaders`

### T40 Ejecución y empaquetado de módulos `script` (R1, D1 = A) `[BE · Alta · N4 → N5]`

Dep: T38 · L · `packages/core/src/ports/scriptLoader.ts`, `runtimes/{ScriptRuntime,ModuleRuntime}.ts`, `apps/mobile/src/data/moduleMounter.ts`, cargador de plataforma (nuevo)

> **Ya hecho (2026-11-06, `fix/urgente-fuentes-modulos-repo`):** el spike de dispositivo con `zonatmo` confirma que Hermes admite `new Function` (P-83 corregido); la app móvil tiene `createFunctionScriptLoader` y Descubrir lista módulos `script`. Falta lo de abajo.

- [ ] `ScriptLoader.load` recibe el paquete (ruta → texto) y la ruta de entrada; el montador deja de pasar solo `manifest.entry`
- [ ] Contrato a autores documentado: módulo ES, `export default create(host)`, solo imports relativos dentro del paquete, sin `import()` ni paquetes, entorno ECMAScript estándar (SPEC §6.5)
- [ ] 🧍 **Spike de `m440` y `yupmanga`** en el dispositivo (el de `zonatmo` ya pasó); si falla: marcar `script` como experimental (plan C del ADR), anotar la decisión y reabrir D1; escalar a N5
- [ ] Desbloquear en la app los módulos `script` (`createInstalledMounter` deja de lanzar `UNSUPPORTED`)
- Verif: pruebas del cargador con paquetes de varios archivos + 🧍 spike en el dispositivo

### T41 Puerta del 2.º sitio real: `zonatmo` y `m440` en la app (D3) `[Ops · Baja · N2]` 🧍

Dep: T39, T40 · S · sin código (salvo ajustes que salgan)

- [ ] Ambos módulos pasan su arnés con fixtures propias (repo `RyuuNest-Models`) — **ojo (T37):** `runContract` exige «al menos un capítulo con dos releases» y m440/yupmanga nunca la cumplen (una release por capítulo por construcción); relajar esa regla del arnés antes de esta puerta
- [ ] Se instalan por `InstallFlow` en el dispositivo y ejecutan `popular` o `latest`, `search`, `details` y `pages`, y se ve una imagen en el lector
- [ ] Ningún cambio de tipos del modelo de datos; si hace falta uno, se reabre el ADR
- Verif: 🧍 prueba en el dispositivo (S25 Ultra; POCO si vuelve a estar disponible)

### 🚩 Checkpoint I `[Ops · Baja · N1]`

- [ ] 🧍 Módulos reales buscan, listan capítulos y entregan imágenes en sitios reales (= T41) · [x] Contrato pasa con 2 arquitecturas (T32a) · [ ] API 1.0 congelable (faltan T38–T41) · [ ] 🧍 Revisión

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

- [ ] Favorito, carpeta y release preferida deben sobrevivir a un reinicio (hallazgo de F33 y de los «Hallazgos UX/UI consolidados», ver `todo.archive.md`); hoy quedan solo en el estado de la ficha
- [ ] Comprobar en el dispositivo que el reinicio conserva los tres
- Verif: Vitest con SQLite real · 🧍 S25 Ultra
- Nota: la parte web de la ficha entra en F41 (propuesta de F33).

### F31 Integrar errores en las pantallas — verificación restante `[FE · Baja · N2]`

Dep: hecha la integración (errorLog, ErrorState, ErrorBanner, registro en `log`) · S · `apps/mobile/src/screens/*`

- [x] Integración en Descubrir, Fuentes, Respaldo y lector, con registro en `log` (hecha 2026-10-31; detalle en `todo.archive.md`)
- [ ] Playwright por pantalla (en curso): cubrir los errores visibles de las pantallas tocadas a 426 y 1440 px
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
- [ ] **Subir react a 19.3.1+ y react-router a 8** (P-110): ADR-0002 fija react 19.2.3 por Expo SDK 57; al subir react, react-router 8 pasa a ser compatible. Sin tocar Expo: solo `apps/web`.
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

- [ ] Reproducir con prueba en rojo: la `imageRef` de la portada llega a `LibraryCard` con `Referer`/`User-Agent` (P-137), ZonaTMO sí carga y M440/YupManga no; averiguar si falla el módulo (cabeceras o dominio no declarado en `permissions.domains`) o la app (expo-image con cabeceras).
- [ ] Si es del módulo, corregir en `RyuuNest-Models` (otro repo) y subir versión; si es de la app, arreglar con test y verificar en el teléfono.
- [ ] Comprobar portadas en Descubrir (listas y catálogo), ficha y Guarida/Tesoros.
- Verif: 🧍 S25 Ultra (portadas visibles en M440 y YupManga).

### T42 YupManga: el «reto del lector» cambió de formato `[Ops · Intermedia · N3]` 🧍

Dep: T40 · S · repo `RyuuNest-Models`

- [ ] El capítulo falla con `UNSUPPORTED` («el reto del lector cambió de formato»; selector `\[([0-9,]+)\];var [\w$]+=String\.fromCharCode\(([0-9,]+)\);`). Guardar una fixture HTML del reto actual (nunca el sitio real en pruebas), ajustar el módulo y subir versión + índice con SHA-256.
- [ ] Abrir un capítulo de YupManga en el teléfono y ver al menos una imagen.
- [ ] Revisar `m440.in`: dio `TIMEOUT` durante la sesión (sitio intermitente); decidir si el módulo necesita reintentos o un mensaje mejor.
- Verif: 🧍 S25 Ultra; el arnés del módulo en verde.

### F36 Detalle de error sin «…» en la URL `[FE · Baja · N2]`

Dep: F29 · XS

- [ ] En «Ver detalle» de `ErrorState` la URL se corta con «…» (`https://storage2.zonatmo.org/ch…`). Mostrarla completa partiéndola en líneas (T7: un dato importante que cabe no se corta), en móvil y web; añadir test sobre `detailLines`/estilo y revisar `LogEventRow`.
- Verif: S25 Ultra con el error de imagen del lector (red cortada).

### F37 Repetir F32 en la MiBox 4 y el POCO F5 Pro `[FE/QA · Baja · N2]` 🧍

Dep: F32 · S · dispositivos

- [ ] Repetir el recorrido de F32 en la MiBox 4 (piso de rendimiento, Android 9, 2 GB) y en el POCO F5 Pro cuando haya módulo y red; anotar diferencias frente al S25 Ultra.
- [ ] Medir la memoria del lector con `adb shell dumpsys meminfo` durante la precarga (fija `READER_IMAGE_BUDGET_MB`, P-90) y AC-6 (60 páginas verticales sin cierres) en la MiBox 4.
- Verif: 🧍 dispositivos.

### F38 Búsqueda y estados de Descubrir: pulido `[FE · Baja · N2]`

Dep: F32 · XS

- [ ] La búsqueda solo se envía con la tecla «buscar» del teclado y los resultados salen en «Catálogo», al fondo, bajo «Más recientes/Populares»: valorar mostrar el catálogo primero o ocultar las filas cuando hay consulta, y un botón de buscar visible.
- [ ] Al volver a Aventuras sin cambios no hay recarga (`refreshModules`); confirmar que instalar o desinstalar en Portales también se refleja sin Reintentar.
- [ ] El botón «Activar/Desactivar» de la hoja de módulo no cierra la hoja: confirmar si es intencional (dos toques seguidos llegaron a «Desinstalar») y, si no, cerrarla o separar la acción destructiva.
- Verif: S25 Ultra.

### F39 Equivalencias web de los arreglos de F32 `[FE · Baja · N2]`

Dep: F32 · XS

- [ ] La web ya muestra los chips de módulo en el error de Descubrir, pero no tiene prueba ni e2e (`discover.cjs`): añadir el caso «el módulo falla → elegir otro».
- [ ] La web no relee módulos al entrar en Descubrir si cambian en Fuentes (cada ruta monta de nuevo, comprobar que es así) y su error de imagen del lector solo muestra el título: valorar el mismo mensaje por tipo.
- Verif: Playwright a 1440/426 px.

---

## QA del cliente web — rutas de aceptación

> Recorridos de extremo a extremo sobre `apps/web` con datos reales (añadidas el 2026-11-01). Con Playwright (doble de la extensión, `fakeExtension.cjs`) o a mano en el navegador.

### QAw1 Ruta guardado: instalar → descubrir → guardar → biblioteca `[FE/QA · Intermedia · N3]`

> Bloqueada parcialmente (hallazgo de F28): «Favorito» no crea la fila `series`; usar carpeta hasta que se arregle (relacionado con F17).

- [ ] Abrir la aplicación web.
- [ ] Ir a **Fuentes** e instalar un módulo.
- [ ] Moverse a **Descubrir**.
- [ ] Seleccionar algún manga o cómic al azar.
- [ ] Guardarlo en alguna carpeta o en favoritos.
- [ ] Buscarlo en **Biblioteca**.
- [ ] Seleccionarlo y **debería mostrar de nuevo la pantalla de detalle** para ese manga o cómic.
- Verif: la obra guardada aparece en Biblioteca y al abrirla se ve su ficha (detalle) completa.

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
