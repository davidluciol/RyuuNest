# todo.md — RyuuNest (solo pendientes) · 2026-11-12

> Historial completo de lo hecho → `tasks/todo.archive.md` (podado el 2026-11-12: aquí solo queda lo pendiente). Contexto → `tasks/plan.md`.
> **Identificadores sin renumerar** (decisión del humano, 2026-11-12): los códigos T/F/QAw siguen siendo válidos en `MEMORY.md`, `tasks/Analisis.md`, ADR-0003 y el SPEC.
> **Al iniciar sesión leer `tasks/complexity.md` §1 (reglas).** Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
> Comandos: `pnpm -r typecheck` · `pnpm -r test` · `pnpm -r build` · `pnpm lint` · `pnpm --filter @ryuunest/core test`.
> Tracker: `bd` local → GitHub Issues cuando exista el repo (P-12). Etiqueta: `[tipo · complejidad · nivel]`. 🧍 = paso humano (no inventar mediciones).

**Hecho hasta hoy:** Fases 0–7 del núcleo (T01–T30b, T32a/T32b, T37–T41), endurecimiento T34–T36, Fase 6a (F01–F10), móvil F11–F21, F29–F31, F35, F48 y FB2, web F24/F25 y extensión F26/F27 (salvo 🧍), recorridos F32/F33. Detalle en `todo.archive.md`.

## Cómo está organizado este archivo (Regla 15 de `AGENTS.md`)

Las tareas pendientes se agrupan **por sección de la app**: **Guarida**, **Tesoros**, **Aventuras**, **Portales**, **Ajustes**; más las secciones relacionadas **Lector y ficha**, **Web y extensión** y **Recursos** (arte, iconos, ilustraciones) y, al final, **General** (lo que no encaja en una sola sección o las abarca todas: seguridad, plataforma, TV, dispositivos, verificaciones 🧍). Da igual que la tarea sea de interfaz, BE, seguridad u Ops: va bajo la sección a la que sirve. Solo hay tareas **pendientes** (con algún `- [ ]`); lo terminado se archiva en `todo.archive.md`. Los identificadores no se renumeran.

**Lotes (≥ 5 tareas por sesión de una misma sección):** cada sección termina con su «Lote sugerido». La dificultad va en la etiqueta `[tipo · complejidad · nivel]` (Baja/Intermedia/Alta; N1–N5 de `tasks/complexity.md`). Cada problema abierto es **una tarea propia**, así se pueden elegir cinco a la vez sin arrastrar el resto.

| Sección | Lote sugerido (una sesión) |
|---|---|
| Guarida | F46 → F78 → F79 → F80 → F81 → F82 (luego QAw2, F34, F40, F76) |
| Tesoros | F52 → F54 → F53 → F55 → F56 → F57 → F58 (luego F47, F49) · carpetas/filtros: F92 → F93 → F94 |
| Aventuras | listas/filtros: F83 → F84 → F85 → F86 → F87 → F88 · ficha/carpetas: F95 → F96 → F97 |
| Portales | T42 → F61 → F63 → F64 → F45 → F42 → F98 → F99 |
| Ajustes | F65 → F66 → F67 → F68 → F69 · temas: F89 → F90 → F91 |
| Lector y ficha | F17 → F51 → F39 → F43 → F23 |
| Recursos | F70 → F71 → F72 → F73 → F74 → F75 (FA1 es 🧍) |

---

## 🏠 Guarida (Inicio)

### F46 Inicio (Guarida) con datos reales locales `[FE · Intermedia · N3]`

Dep: F48 · M · `apps/mobile/src/app/(tabs)/index.tsx`, `src/screens/home/{homeData,useHomeData}.ts` (nuevos), `HomeScreen.tsx`

> Origen (decisión del humano, 2026-11-14): Inicio usa siempre `SAMPLE_HOME_DATA`; debe mostrar lo guardado en el dispositivo, como ya hace Tesoros (`libraryData.ts`).

- [x] Rojo: `loadHomeData(driver)` arma «Continuar leyendo», recientes y carpetas desde el núcleo (progreso, `browseLibrary`, `Folders`) sobre una base en memoria
- [x] La ruta usa `resolveHomeData` con el mismo patrón que Tesoros: nativo → base real; web de Expo → reserva de ejemplo hasta F49
- [x] Base vacía → estado vacío de Inicio que lleva a Portales (P-141 punto 1); sin secciones vacías a medias
- [x] «Continuar» reanuda en el capítulo y la página guardados; refresca al volver a la pestaña (como `useDiscoverData`)
- [x] Galería y `homeFixtures` siguen con datos de ejemplo (solo para la galería)
- Verif: Vitest + 🧍 S25 Ultra (leer unas páginas → Guarida lo muestra en «Continuar»); retoma QAw2 en el móvil


### QAw2 Ruta Inicio: vacío → instalar → leer → continuar leyendo `[FE/QA · Intermedia · N3]`

- [x] Al abrir la aplicación web, **Inicio debería estar vacío** (sin historial de lectura).
- [x] Ir a **Fuentes** e instalar un módulo en caso de que no exista ninguno.
- [x] Ir a la sección **Descubrir**.
- [x] Seleccionar un manga al azar.
- [x] Abrir un capítulo al azar y avanzar un poco en la lectura, para que quede registro de progreso.
- [x] Salir del lector y regresar a **Inicio**.
- [x] Verificar que el manga aparece para **continuar leyendo**.
> **Hecho en el S25 (2026-11-16):** web de Expo no tiene base real (F49 acotada y aparcada, ver P-160), así que el recorrido se hizo en el móvil con m440 ya instalado: Aventuras → «Who Is the Liar?» → Empezar → 3 páginas → cerrar → Guarida lo muestra primero con «Continuar cap. 1» y reanuda a mitad. **No se ejecutaron** «Inicio vacío» ni «instalar módulo» (el módulo ya estaba y no se borraron datos).
- Verif: Inicio muestra la obra con el progreso guardado y reanuda en el punto de lectura.


### F34 Inicio al 200 % del texto del sistema `[FE · Intermedia · N3]`

> Resto de F34 (F34.1–F34.3 hechos; detalle en `todo.archive.md`).

- [x] **Inicio al 200 %** (código: `Button`/`Badge` con `minHeight` en vez de `height` y título de sección sin `numberOfLines`): recortes en «Continuar la Aventura», el botón «Continuar cap. 41» y las insignias (hallazgo de F34.3, fuera de su alcance)
- [ ] 🧍 Comprobar en el S25 con `font_scale 2.0` (no se pudo: Expo Go no volvió al primer plano en la sesión)
- Verif: `focusAndScale.cjs` + `fontScale.test.ts` en verde · 🧍 S25 Ultra con `font_scale 2.0`

### F40 Estado vacío propio de Inicio y paridad web/nativo (propuesta de F33, sin aprobar) `[FE · Baja · N2]`

Dep: F46 · XS

> Origen: `tasks/Analisis.md` §7. Los datos reales los cubre F46; aquí queda lo que F46 no hace.

- [x] 🧍 Aprobar F40 → **aprobada** (2026-11-16): solo comprobar paridad; el vacío ya existía (F46). Estado vacío añadido a la galería. Pendiente de aprobación original: estado vacío de Inicio con «instalar un módulo» + botón a Portales y paridad web/nativo comprobada con Playwright
> **Hecho:** web a 426 y 1440 px (galería «pantalla de inicio vacía»): sin overflow, botón 48 px, consola limpia. El vacío en el S25 no se verificó (exigiría borrar los datos del móvil).
- Verif: Playwright 426/1440 px + 🧍 S25

### F76 Inicio: «Continuar leyendo» con progreso real en el borde de la tarjeta `[FE · Baja · N2]`

Dep: F46 · XS · `apps/mobile/src/components/ContinueCard.tsx`

- [x] Comprobar que la tarjeta muestra capítulo y página guardados (no los de ejemplo) y que pulsar reanuda en esa página (RF-20); añadir el caso a la galería si falta
> **Hecho (cubierta por F79/F80, 2026-11-16):** la tarjeta muestra capítulo y página guardados y reanuda en esa página (S25); la galería ya tiene `ContinueCard` con página 12/38.
- Verif: Vitest + 🧍 S25

> **Nota:** F47 (portadas con cabeceras) afecta también a Guarida; vive en **Tesoros**.

### F78 Registro «último leído» (base de Continuar y Recientes) `[BE · Intermedia · N3]`

Dep: F46 · M · `packages/core` (progreso + `ports`), `apps/mobile/src/screens/reader/*` (solo el gancho de guardado)

> Origen (petición del humano, 2026-11-16). **Decisión:** registro propio, no solo la biblioteca, para que también cuente lo leído sin guardar.  Debe incluir lo necesario para abrir el capítulo y la página exacta (enlace del capítulo, P-155).
> **Hecho con otra decisión (P-156):** sin tabla nueva; `listLastRead`/`getLastRead` unen `progress` y `series` (una fila por serie, cuenta lo no guardado). El lector ya guarda en `progress` y el respaldo ya la incluye; `recordLastRead` = `ProgressStore.save`.

- [x] Rojo: `recordLastRead(entry)` y `getLastRead()`; entrada = título del capítulo, portada, categoría, título de la serie, estado (en emisión, finalizado, en pausa…), página actual y páginas restantes, **módulo de origen** (lectorTMO, yupmangas, mangasin…) y **enlace de origen** (abre la serie/capítulo en su módulo)
- [x] El historial guarda **una entrada por serie** (la última lectura), ordenado por fecha; las lecturas de una misma serie reemplazan la anterior
- [x] El lector lo actualiza al guardar el progreso (sin animaciones ni trabajo extra en el lector)
- [x] Entra en el respaldo/`backup` y en la migración aditiva de la base (sin romper copias anteriores)
- Verif: Vitest en `packages/core` (orden, reemplazo por serie, vacío)

### F79 Guarida: «Continuar aventura» con datos reales y «Reanudar» exacto `[FE · Intermedia · N3]`

Dep: F78 · M · `apps/mobile/src/screens/home/*`, `apps/mobile/src/components/ContinueCard.tsx`

> Origen (petición del humano, 2026-11-16). Sustituye los datos de ejemplo poco a poco; amplía F46/F76.
> **Resuelto (P-155, 2026-11-16):** web directo al lector; móvil Detalles → lector. En la web de Expo, sin base real hasta F49, se usa la reserva de ejemplo.

- [x] La tarjeta muestra el último leído de `getLastRead()` (capítulo, portada, categoría, título, estado, página y páginas restantes, módulo de origen)
- [x] «Reanudar» (P-155): en **web** va directo al lector en el capítulo y la **página exacta**; en **móvil** apila Detalles → lector (aterriza en la página exacta y «atrás» vuelve a Detalles). El registro de F78 guarda módulo, enlace del capítulo y página
- [x] Sin registro → estado vacío de Guarida (F40), nunca datos de ejemplo en nativo
- Verif: Vitest + 🧍 S25 (leer páginas → Guarida → Reanudar abre la misma página)

### F80 Guarida: «Lecturas recientes» desde el historial de series `[FE · Baja · N2]`

Dep: F78 · S · `apps/mobile/src/screens/home/*`

- [x] Las tarjetas salen del historial (una por serie, más reciente primero) en lugar de los datos de ejemplo
- [x] Al tocar: misma ruta que F79 (P-155: web directo al lector; móvil Detalles → lector)
> **Hecho dentro de F46/F78/F79:** las tarjetas salen de `listLastRead` y tocar usa `resumeRoutes`; verificado en el S25 (tarjeta → lector en la página guardada).
- Verif: Vitest + 🧍 S25

### F81 Guarida: «Tesoros guardados» solo con las 3 carpetas con más series `[FE · Baja · N2]`

Dep: F46 · S · `apps/mobile/src/screens/home/*`, `packages/core` (carpetas)

- [x] Rojo: ordenar carpetas por número de series (empate → más reciente) y tomar 3
- [x] Si hay menos de 3 con series, mostrar solo esas; sin ninguna, ocultar la sección
> **Hecho (2026-11-16):** empate = serie añadida más recientemente (decisión del humano); máximo 3 (antes 4). Verificado en el S25 (sin carpetas con series la sección se oculta).
- Verif: Vitest + Playwright 426/1440 px

### F82 Guarida: «Ver todo» de Lecturas recientes (pantalla reutilizable) `[FE · Intermedia · N3]`

Dep: F78, F80 · M · `apps/mobile/src/app/` (ruta nueva), `apps/mobile/src/screens/*`

> Origen (petición del humano, 2026-11-16). **La lógica de navegación debe cuidarse: preguntar al humano ante cualquier duda.**

- [x] Ruta en pila `/list/[source]` (fuera de pestañas) en blanco y **reutilizable** para otras listas, con título y fuente de datos como props
- [x] Muestra como máximo los 9 ítems del historial; al tocar → misma ruta que F79 (P-155)
- [x] Botón atrás vuelve a Guarida; componente nuevo en la galería con todos sus estados
> **Hecho (2026-11-16, P-159):** `ListScreen` + `listSources` (fuente = título, cargador y reserva web); `RecentCard` en cuadrícula; máx. 9. Playwright/web y S25 verificados.
- Verif: Vitest + Playwright 426/1440 px + 🧍 S25

---

## 💎 Tesoros (Biblioteca)


> Esta sección reúne todo lo de **Tesoros**: primero lo que ya estaba pendiente (F47 y F49, movidas aquí sin cambios) y luego las tareas nuevas **F52–F56**. Solo están **escritas, no implementadas**. Orden propuesto: F52 → F54 → F53 → F55 → F56 (F47/F49 siguen su orden anterior).
> **Resueltas (P-161, 2026-11-16):** (1) «Gemas» es una **vista** (sin fila) y «Favoritos» una carpeta real del sistema; SPEC RF-29/D-12 actualizados. (2) Las etiquetas de una carpeta son **carpeta inteligente** (se guardan y se aplican siempre). Orden de esta sesión: F52 → **F53 → F54** (F54 depende de F53) → F55 → F56.

### F47 Portadas con cabeceras en Guarida y Tesoros `[BE/FE · Intermedia · N4]`

Dep: F46 · M · `packages/core/src/{library/SeriesStore,library/queries,storage/migrations}.ts`, `apps/mobile/src/screens/{home,library}/*`

> Origen (P-148, decisión del humano: opción a): Tesoros y Guarida no pasan `cover` a las tarjetas y `series.cover_url` no guarda las cabeceras, así que M440/YupManga saldrían en blanco aunque se pasara.

- [x] Rojo (núcleo): `saveFromDetails` guarda `cover.headers` y `browseLibrary` (y `listLastRead`, para Guarida) las devuelven junto a `coverUrl`
- [x] Migración 5 **aditiva** (`series.cover_headers`, JSON); las filas viejas siguen válidas sin cabeceras
- [x] Respaldo: la serie viaja en el respaldo y **las cabeceras van con él** (decisión del humano 2026-11-17): formato v3 (`series[].coverHeaders`), v1/v2 siguen leyéndose; SPEC §8.3 avisa de que pueden llevar cookies
- [x] `LibraryCard` en Tesoros y `ContinueCard`/`RecentCard` de Guarida reciben `{ uri, headers }` (`coverSource`); ya usan `expo-image` y salen de `PENDING` en `remoteImageUsage.test.ts`
- [x] Las cabeceras se refrescan al abrir la ficha: `loadSeries` ya llama a `saveFromDetails`, que reescribe `cover_headers` (probado en el núcleo)
- Verif: ✅ `pnpm -r test` · 🧍 S25 Ultra pendiente: portadas de ZonaTMO, M440 y YupManga en Guarida y Tesoros

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
- [x] **F49a** (2026-11-17): `webDatabase.ts` y `byteStore.ts` salen de `apps/web` al paquete `packages/web-db` (`@ryuunest/web-db`, `sql.js` 1.15.2 ya fijada); `apps/web` lo importa, sin cambio de comportamiento
- [x] **F49b** (2026-11-17, alcance **completo**, decisión del humano que anula el aparcado de P-160): la web de Expo abre una base real (`appDatabase.web.ts`: sql.js en IndexedDB `ryuunest-expo-web`, wasm por `expo-asset`) y Tesoros, Guarida, Ajustes, Respaldo y Bienvenida leen de ella
- [x] Rojo/verde: persistencia cubierta en `@ryuunest/web-db` (memoria) y en Playwright (`persistence.cjs`); `createSampleReadingSource(driver)` no siembra progreso con base real
- [x] Reserva de ejemplo retirada de Tesoros/Guarida. **Siguen con ejemplo en web** (sin red no hay módulos que instalar): Portales, Aventuras, lector/ficha (módulos de `test-site`, ahora con el progreso en la base real) y Diagnóstico; `sessionSqlDriver` solo queda para Vitest
- [x] e2e: `tests/e2e/seedDb.cjs` genera con el núcleo y sql.js una base con 3 obras y una carpeta y la siembra en IndexedDB antes de cargar; los scripts de la web de Expo se adaptaron a esos datos
- Verif: Playwright (426 y 1440): guardar/quitar una serie, recargar y verla en Tesoros (`persistence.cjs`), cero peticiones externas y consola limpia

### F52 Carpetas por defecto: «Favoritos» y «Gemas» `[BE/FE · Intermedia · N3]`

Dep: preguntas abiertas (1) · M · `packages/core/src/library/{Folders,Favorites,queries}.ts`, `apps/mobile/src/screens/library/*`

- [x] Rojo (núcleo): al abrir la base por primera vez se crean **Favoritos** y **Gemas** (migración/semilla **idempotente**: no se duplican al reiniciar ni al importar un respaldo); no se pueden borrar ni renombrar
- [x] **Gemas** muestra todas las series sin distinción; **Favoritos** muestra las marcadas como favorito (reutilizar `Favorites`)
- [x] Textos en el catálogo i18n («Favoritos», «Gemas»), tarjetas con `FolderCard`, estados en la galería
- [x] Comprobar el respaldo: las carpetas por defecto no se duplican al restaurar
- Verif: ✅ Vitest con SQLite real + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente (se hace al final de la serie de PRs): primer arranque muestra las dos carpetas

### F53 Botón flotante «+» y modal «Nueva carpeta» `[FE · Intermedia · N3]`

Dep: F52 · M · `apps/mobile/src/screens/library/*`, `apps/mobile/src/components/*` (botón flotante, modal), `packages/i18n`

- [x] Botón flotante **fijo** abajo con icono «+» **verde** (token de `ui-tokens`, sin hexadecimales), ≥48×48, foco visible; no tapa la última fila (margen de la lista)
- [x] Modal con **nombre** (obligatorio, sin duplicados) y **etiquetas** (opcional, multiselección con las etiquetas de las series guardadas); al elegir etiquetas se **añaden dinámicamente** las series de esas categorías (carpeta inteligente, P-161/P-162: etiquetas en migración 4 y respaldo v2)
- [x] Reutilizar `ConfirmSheet`/hoja existente y `TextField`/`Chip`; componente nuevo en la galería con todos sus estados (vacío, error de nombre, con etiquetas)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente (al final de la serie)

### F54 Menú de pulsación larga en las series de Tesoros `[FE · Intermedia · N3]`

Dep: F52, F53 · M · `apps/mobile/src/screens/library/*`, `packages/core/src/library/{Favorites,Folders}.ts`

- [x] Pulsación larga en una serie (en **Gemas y en toda Tesoros**) abre una hoja con: **Eliminar** (con `ConfirmSheet`; conserva el progreso, RF-30), **Mover** (lista de carpetas; la serie pasa a la elegida), **Mover y crear** (abre el modal de F53 y mueve la serie a la carpeta nueva) y **Añadir a favoritos**
- [x] Rojo (núcleo): operaciones atómicas de mover/crear+mover/quitar; que «Eliminar» use `Favorites.remove` (conserva el progreso; P-163 corrige la referencia a `removeSeriesFromLibrary`, que lo borra)
- [x] Alternativa accesible a la pulsación larga (TV/teclado: botón de menú), foco visible
- Verif: ✅ Vitest con SQLite real + ✅ Playwright 426/1440 (`library.cjs`: pulsación larga, «⋮» con foco, mover, crear y mover, eliminar) · 🧍 S25 (pulsación larga) y MiBox 4 (D-pad) pendientes

### F55 Búsqueda en tiempo real y filtros por categoría `[FE · Intermedia · N3]`

Dep: F52 · M · `apps/mobile/src/screens/library/*`, `packages/core/src/library/queries.ts`

- [x] La búsqueda devuelve **al escribir** (con *debounce* corto) las series de nombre **similar** al texto (tolerante a mayúsculas/tildes; decidir si basta «contiene» o hace falta similitud difusa: preguntar)
- [x] Filtros por categoría (seinen, shonen, isekai, aventura…) tomados de las etiquetas de las series guardadas (no inventar lista); con filtros activos **solo** se devuelven series que coincidan (con y sin texto)
- [x] Combina con carpeta, tipo, fuente y NSFW del RF-27
- Verif: ✅ Vitest (consulta + debounce) + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente

### F56 Estado vacío de búsqueda: el dragón sin tesoros `[FE · Baja · N2]`

Dep: F55 · S · `apps/mobile/src/components/{EmptyState,DragonMarker}.tsx`, `packages/i18n`

- [x] Sin resultados: texto **cómico** (analogía del dragón rebuscando entre sus tesoros y sin hallar nada; breve, sin ocultar la causa, SPEC 11.7) y un **SVG generado** centrado (ilustración propia del dragón, solo tokens de color; sin imágenes externas, RNF-5)
- [x] Componente en la galería (con y sin filtros activos); textos en el catálogo i18n
- Verif: ✅ Playwright 426/1440 px sin overflow (`library.cjs`) · 🧍 S25 pendiente (y revisión del texto por el humano, P-165)


### F57 Hoja de filtros real (tipo y fuente) y nombre visible de la fuente `[FE · Intermedia · N3]`

Dep: F55 · M · `apps/mobile/src/screens/library/*`

> Origen: `MEMORY.md` §4 «Biblioteca (restos de F14)». **Comprobar al empezar si sigue vigente.**

- [x] Hoja de filtros real (`FilterSheet`): **tipo, fuente y NSFW** (decisión del humano 2026-11-17; RF-27 ajustado), cada chip aplica al instante, «Limpiar» vacía tipo y fuente, «Listo» cierra
- [x] Nombre visible de la fuente desde `ModuleRegistry` (sin módulo instalado, su id)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente

### F58 Menú de orden real y `reading: true` al núcleo `[FE/BE · Baja · N2]`

Dep: F52 · S · `apps/mobile/src/screens/library/*`, `packages/core/src/library/queries.ts`

> Origen: `MEMORY.md` §4 (restos de F14). **Comprobar al empezar si sigue vigente.**

- [x] Menú de orden (`SortSheet`: nombre, último leído, fecha de adición; RF-28) en lugar de ciclar al pulsar
- [x] `reading: true` **no** se pasa al núcleo (decisión del humano 2026-11-17, P-166): la pantalla filtra en memoria y el chip «Leyendo» ya funciona; el núcleo ya lo soporta
- Verif: ✅ Vitest (`LIBRARY_ORDERS`) + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente

### F92 Filtros de Tesoros en carrusel horizontal `[FE · Baja · N2]`

Dep: F55 · S · `apps/mobile/src/screens/library/*`, `apps/mobile/src/components/ChipScroller.tsx`

> Origen (petición del humano, 2026-11-17): los chips bajo el buscador se ven apretados.

- [x] Los chips de filtro bajo el buscador van en **una sola fila con scroll horizontal** (reutilizar `ChipScroller`; no crear componente), con separación de tokens, sin cortar el último chip y con foco visible/D-pad
- [x] Estados en la galería (pocos chips, desbordando); sin overflow vertical ni de página
- Verif: ✅ Vitest (`libraryChipsRow`) + ✅ Playwright 426/1440 px (`library.cjs`, `chipScroller.cjs`) · 🧍 S25 pendiente (PR #120)

### F93 «Gestionar» carpetas: ver, renombrar, dinámica y borrar `[FE/BE · Intermedia · N3]`

Dep: F52, F53 · M · `apps/mobile/src/screens/library/*`, `packages/core/src/library/Folders.ts`, `packages/i18n`

> Origen (petición del humano, 2026-11-17): el botón «Gestionar» (`library.folder.manage`) no hace nada.

- [x] Rojo (núcleo): `rename`, `setTags` (hacer **dinámica** = carpeta inteligente por etiquetas, o volverla manual) y `delete` de carpeta; **Favoritos y Gemas** no se renombran ni se borran (F52); al borrar una carpeta las series **no se borran** (siguen en Gemas, RF-30); nombre obligatorio y sin duplicados
- [x] Pantalla u hoja «Gestionar carpetas»: lista de carpetas (nombre, nº de series, icono de rayo si es dinámica) con editar (reutilizar el modal de F53 en modo edición) y eliminar con `ConfirmSheet`
- [x] Textos en i18n; componentes nuevos en la galería con todos sus estados; comprobar el respaldo (renombrar/borrar sobrevive a exportar-importar)
- Verif: ✅ Vitest con SQLite real (`setTags`, Favoritos protegido, respaldo exportar→importar) + ✅ Playwright 426/1440 px (`library.cjs`: editar, volver manual, eliminar) · 🧍 S25 pendiente (PR #121)

### F94 NSFW con borde naranja en Tesoros `[FE · Baja · N2]` (opcional)

Dep: F92 · S · `packages/ui-tokens`, `apps/mobile/src/components/CoverCard.tsx`

> Origen (petición del humano, 2026-11-17, opcional). **Leer `DESIGN_RULES.md` antes: decide cómo se usa el color.**

- [x] Las series `nsfw` de Tesoros llevan el **borde naranja** (token nuevo en `ui-tokens` si no existe; sin hexadecimales); **no solo color**: mantener la etiqueta/icono NSFW existente (accesibilidad)
- [x] Estado en la galería; Playwright 426/1440 px
- Verif: ✅ Vitest (`nsfw.test.ts`, `libraryCard.test.ts`) + ✅ Playwright 426/1440 px (`nsfwCard.cjs` en la galería, `library.cjs`) · 🧍 S25 pendiente (PR #122)

**Lote sugerido:** F52 → F54 → F53 → F55 → F56 → F57 → F58; F47 y F49 en sesiones propias (N4). Carpetas y filtros: F92 → F93 → F94.

---

## 🧭 Aventuras (Descubrir)

### F41 Descubrir y ficha en la web: portada y sinopsis (propuesta de F33, sin aprobar) `[FE · Intermedia · N3]`

Dep: F33 · M · `apps/web/*`

- [x] Aprobada (humano, 2026-11-19). Web: portada en las tarjetas de Descubrir (2:3, `discover-card-cover`); la ficha web ya mostraba portada y sinopsis (F25)
- Verif: ✅ Playwright 426/1440 px (`apps/web/tests/e2e/discover.cjs`) + Vitest web

### F44 «Recomendados» como índice remoto `[BE/FE · Alta · N4]`

- [x] Decisión del humano (2026-11-20, P-179): `recommended.json` en `RyuuNest-Models` junto a `index.json`, lista de `{ name, indexUrl, description, nsfw }`; SPEC **RNF-5** con la excepción y **RF-2b** nuevo
- [x] Núcleo: `parseRecommended`/`fetchRecommended` (`packages/core/src/repo/recommended.ts`), tolerancia por entrada como T38, fixture guardado
- [x] Portales (móvil y `apps/web`): sección «Recomendados» con cargando / lista / sin conexión / vacío y «Actualizar recomendados»; se descarga solo al abrir Portales o al pulsarlo; «Añadir» abre «Añadir repositorio» con la URL rellena (confirmación manual); NSFW con insignia. Estados en la galería (vista de Portales)
- [x] PR de `recommended.json` fusionado en `RyuuNest-Models` (#8); repo oficial con `nsfw: false` en Models #9 (pendiente de fusionar)
- [x] Un recomendado ya añadido muestra «Añadido» desactivado (`isRecommendedAdded`, P-179)
- Verif: ✅ Vitest (núcleo `recommended.test.ts`; móvil `sourcesData`/`sourcesFlow`/`sampleSourcesService`) · ✅ Playwright 426/1440 px (`apps/mobile/tests/e2e/sources.cjs`, `apps/web/tests/e2e/sources.cjs` con fixture) · ✅ S25 (2026-11-20): Portales descarga la lista real de GitHub y el oficial sale «Añadido» · ⚠️ «Sin conexión» no se pudo ver en el S25 (sin red Android devolvió la respuesta en caché); cubierto por Vitest

### F83 Contrato de módulo: paginación y orden «más reciente» declarados `[BE · Intermedia · N3]`

Dep: F59 · M · `packages/core/src/contract/types.ts`, `packages/module-sdk` (manifiesto)

> Origen (petición del humano, 2026-11-16). **Decisión:** si un módulo no soporta paginación u orden «más reciente», **se oculta esa sección** para él.

- [x] Rojo: el manifiesto declara `paginated` (list/search paginan) y `sortLatest` (orden más reciente, exige `paginated`); `modulePaging()` en el núcleo y validación en `module-sdk`
- [x] La UI consulta la declaración: sin `paginated` se oculta Popular y el pie de páginas; sin `sortLatest`, Reciente (`discoverData.ts`)
- Verif: ✅ Vitest (núcleo + SDK + móvil con fixtures)

### F84 Explorar catálogo con scroll infinito `[FE · Intermedia · N3]`

Dep: F83 · M · `apps/mobile/src/screens/discover/*`

> Origen (petición del humano, 2026-11-16). Una página del buscador del sitio por lote.

- [x] Resultados del buscador del sitio; al acercarse al final se pide la página siguiente, hasta agotar (sin duplicados ni peticiones repetidas: `catalogPaging.ts`, `catalogOnly` en la carga)
- [x] Estados: cargando más, error con reintento, fin de lista; sin animaciones (el pie de páginas de móvil desaparece; web conserva el suyo hasta F41)
- Verif: ✅ Vitest (paginación) · ✅ S25 (agent-device, M440 con «one»: carga páginas y sale «Has llegado al final») · ✅ Playwright 426/1440 px (`discover.cjs`)

### F85 «Más reciente» y «Popular» con scroll infinito en vez de carrusel `[FE · Intermedia · N3]`

Dep: F83, F84 · M · `apps/mobile/src/screens/discover/*`

- [x] Las filas Reciente/Popular son rejillas de 3 columnas (T7) que reutilizan `catalogPaging` con «Cargar más» (decisión del humano 2026-11-19: tres rejillas apiladas; solo el catálogo hace scroll infinito automático). Las secciones `home()` conservan su carrusel + «Ver más» (F59)
- Verif: ✅ Vitest · ✅ Playwright 426/1440 px (`discover.cjs`) · ✅ S25: lista de sección de ZonaTMO («Ver más») con scroll infinito; las filas Reciente/Popular no se ven en M440/YupManga/ZonaTMO (usan `home()` o no declaran `paginated`)

### F86 Propuesta UX de búsqueda y filtros (revisión de diseño) `[Diseño · Intermedia · N3]` 🧍

Dep: F50 · S

> Origen (petición del humano, 2026-11-16: «revisarlo con un especialista»). Decisión: crítica con las skills de diseño/UX y 2–3 variantes; luego aprobación humana.

- [x] Barra de búsqueda visible por defecto + botón de búsqueda con icono de 48×48 (`touchTarget.min`) + botón de filtros solo con icono junto a la lupa (aparece cuando el módulo declara filtros; **cambiado por P-177:** ya no nace oculto)
- [x] 3 variantes (A, B, C) en la galería (`SearchBarVariants`) con crítica y recomendación; diferencias en `design/stitch/DIFFS.md`
- [x] 🧍 El humano eligió la variante **B** (P-177, 2026-11-20)
- Verif: ✅ capturas de las variantes a 426 px en `docs/capturasF86/` (`variante-a|b|c.png`, Expo web + Playwright) · ✅ decisión en `MEMORY.md` (P-177) · ✅ código revisado en `DiscoverScreen.tsx`

### F87 Filtros desplegables con casillas, declarados por el módulo `[FE · Alta · N4]`

Dep: F86, F50, F59 · M · `apps/mobile/src/screens/discover/*`, `packages/core/src/contract/types.ts`

> Origen (petición del humano, 2026-11-16). Amplía F50 (etiquetas) con más tipos de filtro; **no duplicar F50**.

- [x] Al pulsar «Filtros» aparecen desplegables con casillas: **SFW/NSFW** (NSFW solo si el sitio lo permite), **género** (terror, aventura, harem, ecchi…), **estado** (en emisión, finalizado, en pausa, abandonado y lo que permita el sitio) y **tipo** (manga, manhua, manhwa, webtoon, cómic)
- [x] Todo sale de `ModuleApi.filters()`; lo que el módulo no declare no aparece; «Limpiar» y contador de activos
- [x] Componentes nuevos en la galería con todos sus estados; textos en i18n; solo tokens
- Verif: ✅ Vitest (`tests/components/tagFilterSheet.test.ts`; carga/envío de grupos ya cubiertos en `discoverHome.test.ts`) · ✅ Playwright 426/1440 px sobre la galería (Expo web: desplegables cerrados, casillas y radio, «Limpiar», filas ≥48, sin overflow, consola limpia, cero peticiones externas) · ✅ S25 con ZonaTMO (2026-11-20, agent-device): desplegables, radio, «Género, activos: 1», contador en el botón, recarga y «Limpiar»; corregido en el teléfono que «Limpiar»/«Listo» quedaban fuera de pantalla con listas largas (pie fijo en `SheetModal`) (P-178). Sin cambio de contrato; `apps/web` no tiene filtros (P-171)

### F88 Reubicar el selector de servidor/módulo en Aventuras `[FE · Baja · N2]`

Dep: F86 · S · `apps/mobile/src/screens/discover/*`

> Origen (petición del humano, 2026-11-16: «reorganizar el desplegable para cambiar de servidor o módulo»). Posición final según la variante de F86.

- [x] Selector de módulo movido a la cabecera, solo en Aventuras (`moduleSwitcherStore` + `HeaderModuleSwitcher`, montado en `ShellNavigator` con `destination === "discover"`); `selectModule` reinicia consulta, página, sección y filtros, así que cambiar de módulo recarga la rejilla sin mezclar resultados (QAw3)
- Verif: ✅ Vitest `moduleSwitcherStore.test.ts` · ✅ revisión de código (`useDiscoverData.selectModule`) · ⚠️ sin test unitario del hook `useDiscoverData` (no hay renderer de hooks en el móvil); el no-mezclado queda cubierto por la lógica de reinicio y por la verificación manual previa del PR #139

---


### F95 Ficha: botón «Guardar» (corazón) guarda en la carpeta por defecto `[FE/BE · Intermedia · N3]`

Dep: F52 · M · `apps/mobile/src/screens/series/*` (ficha), `packages/core/src/library/{Favorites,Folders}.ts`

> Origen (petición del humano, 2026-11-17). **Cambiado (P-174, humano 2026-11-19; reemplaza P-170):** el corazón guarda en **Favoritos**; pulsarlo de nuevo la deja en **Gemas** (no la elimina). «Guardar» con carpeta es F96.

- [x] Rojo: pulsar el corazón guarda la serie en Favoritos (venga de Gemas, de otra carpeta o sin guardar) y queda relleno; pulsar de nuevo la pasa a Gemas (conserva el progreso, RF-30); idempotente (`heart.test.ts`)
- [x] La ficha refleja el estado al abrirla y al volver (Tesoros lo relee por foco)
- Verif: ✅ Vitest con SQLite real + ✅ Playwright 426/1440 px (`persistence.cjs`, `series.cjs`) · 🧍 S25 (agent-device) pendiente

### F96 Ficha: botón «Guardar» con hoja para elegir carpeta `[FE · Intermedia · N3]`

Dep: F95, F53 · M · `apps/mobile/src/screens/series/*`, `apps/mobile/src/components/*`

> Origen (petición del humano, 2026-11-17). **Cambiado (P-174, 2026-11-19):** el botón «Carpeta» se llama **«Guardar»**; el corazón pasa a llamarse «Favorito» / «En favoritos».

- [x] «Guardar» abre una hoja con **Gemas, Favoritos y las carpetas del usuario** (la actual marcada) y «Nueva carpeta» (modal de F53); elegir guarda la serie ahí (o la mueve): una sola carpeta (D-12)
- [x] Sin carpetas propias la hoja muestra Gemas y Favoritos, con Gemas como actual (guardado por defecto)
- [x] Hoja `SaveFolderSheet` en la galería (con carpetas, sin carpetas); textos en i18n
- Verif: ✅ Vitest (`saveFolder.test.ts`, SQLite real) + ✅ Playwright 426/1440 px (`series.cjs`: mover, crear y guardar, volver a Favoritos) · 🧍 S25 (agent-device) pendiente

### F97 NSFW con borde naranja en Aventuras: hentai, seinen y josei `[FE · Baja · N2]` (opcional)

Dep: F94 · S · `apps/mobile/src/screens/discover/*`

> Origen (petición del humano, 2026-11-17, opcional; la etiqueta es **josei**, confirmado). **Solo si esas etiquetas existen** en los datos del módulo: no inventar etiquetas.

- [x] Una serie de Aventuras con alguna etiqueta de la lista (hentai, seinen, josei) o `nsfw` lleva el borde naranja de F94 con la insignia «18+» (`hasNsfwBorder`, comparación sin mayúsculas ni acentos, etiqueta completa)
- [x] Etiquetas que llegan hoy: el contrato (`SeriesSummary.badges`) solo cita «Seinen» como ejemplo y el filtro de ejemplo ofrece «Seinen»; **hentai y josei no aparecen en ningún módulo ni fixture** (ni `modules/` ni `test-site`). La regla es por datos: si un módulo las trae, se aplica sin más cambios. Se conserva el filtro NSFW existente (solo cambia el borde)
- Verif: ✅ Vitest (`discoverFixtures.test.ts`) + ✅ Playwright 426/1440 px (`discoverNsfw.cjs`, galería: «Sombras de Arcano» con Seinen) · 🧍 S25 pendiente

**Lote sugerido:** (F41/F44 esperan aprobación). Bloque de listas/filtros: F83 → F84 → F85 → F86 → F87 → F88.

---

## 🚪 Portales (Fuentes y módulos)

### T45 Hitomi.la: buscador limitado y pruebas en la app `[BE/Ops · Intermedia · N3]` 🧍

Dep: T40 · repo `RyuuNest-Models` (módulo `hitomi` 0.1.0) · el host ya expone `HostResponse.bytes()` (SPEC §6.5)

- Probar `Range` (206/416) en el S25: ver «Sugerencias (no bloqueantes)».
- [ ] **Problemas del buscador:** (1) no hay búsqueda por título: el sitio la resuelve con un índice B-tree propio (`galleries.<versión>.index/.data`), no con `.nozomi`; (2) solo acepta **un** término `namespace:valor` (`female:yuri`, `artist:x`, `type:…`) o una etiqueta suelta; (3) combinar términos exigiría bajar listas enteras (hasta ~16 MB). Decidir si se implementa el índice B-tree o se acepta el límite.
- [ ] Coste de listas: una petición a `galleries/<id>.js` por tarjeta (24 por página); valorar `galleryblock` o tarjetas perezosas.

### T42 YupManga: el «reto del lector» cambió de formato `[Ops · Intermedia · N3]` 🧍

Dep: T40 · S · repo `RyuuNest-Models`

- [ ] El capítulo falla con `UNSUPPORTED` («el reto del lector cambió de formato»; selector `\[([0-9,]+)\];var [\w$]+=String\.fromCharCode\(([0-9,]+)\);`). Guardar una fixture HTML del reto actual (nunca el sitio real en pruebas), ajustar el módulo y subir versión + índice con SHA-256.
- [ ] Abrir un capítulo de YupManga en el teléfono y ver al menos una imagen.
- [x] `m440.in` `TIMEOUT`: mensaje claro de «sitio intermitente» sin reintentos (m440 0.2.1, RyuuNest-Models PR #11; el `index.json` va en PR aparte)
- [ ] **Sigue fallando en el S25 (2026-11-20):** YupManga 0.1.1 abre la búsqueda y la ficha, pero el capítulo da `UNSUPPORTED` — «El reto del lector usa JS no soportado: carácter «`»» (el reto actual usa plantillas con acento grave, que `yupmanga/bin/utils/miniJs.js` no entiende). Falta capturar la fixture del reto vigente (1 petición real, con las herramientas de `tools/` de Models), añadir soporte y publicar 0.1.2 + índice
- [x] **YupManga 0.2.0 (RyuuNest-Models PR #13 y #14, 2026-11-20):** el reto con acento grave, la cascada CSS del nodo oculto y la cabecera `Origin` están resueltos y verificados contra el servidor (16/16 respuestas aceptadas); además `home/list/filters` y búsqueda por género (las categorías ya no salen vacías). Canario: `uv run --project tools --locked python tools/canary_yupmanga.py` en Models.
- [x] 🧍 YupManga 0.2.0 en el S25 (2026-11-21, actualizado desde el banner de F99): Aventuras con datos y portadas, ficha y capítulo de 111 páginas con imágenes. M440: portadas, búsqueda y filtro de género funcionan (Cloudflare no bloqueó hoy). **Portadas en blanco no se reprodujeron** en Aventuras/ficha/Guarida; cerrar tras un uso normal más.
- [ ] **Portadas en blanco — diagnóstico añadido (PR #150):** las cabeceras sí llegan al componente (descartado en código); Descubrir ahora registra `cover.load` (URL sin query, nombres de cabecera, error). 🧍 En el S25 abrir Descubrir con YupManga/m440 y leer el registro: 403 ⇒ cargar con `host.fetch`; error de decodificación ⇒ formato; sin registro ⇒ pintado.
- [ ] **Portadas en blanco (YupManga y m440):** el servidor las sirve bien (200, WebP) con las cabeceras del módulo, así que el fallo está en el cargador de imágenes de la app: comprobar que `ImageRef.headers` (Referer, User-Agent, Accept) llegan al componente de imagen, que decodifica WebP servido como `.jpg` (m440) y que la huella TLS del cliente no recibe 403; si Cloudflare la rechaza, cargarlas con `host.fetch`.
- [ ] Si vuelve a salir `UNSUPPORTED` en el reto: correr el canario, guardar la captura en `.scrape-tmp/yupmanga/canary/`, ampliar `miniJs.js`/`boxStyle.js` (ver «Depurar el reto» en `tools/README.md` de Models) y publicar parche + índice.
- Verif: 🧍 S25 Ultra; el arnés del módulo en verde.


### F61 Etiqueta visual de módulos incompatibles `[FE · Baja · N2]`

Dep: T38 (hecha) · XS · `apps/mobile/src/screens/sources/*`

> Origen: T38 dejó `SourcesData.incompatible` sin etiqueta visual.

- [x] Mostrar «No compatible con esta versión» (con la versión mínima) en la fila del módulo; no se puede instalar (sección «No compatibles» con el motivo del índice; sin botón)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (la galería tiene el estado; el e2e de Fuentes usa el servicio sin incompatibles)

### F63 F16 en el dispositivo: repo real, módulo declarativo y `script` `[Ops · Baja · N2]` 🧍

- [x] 🧍 Prueba en el S25 Ultra (2026-11-20, Expo Go + Metro, agent-device) con el repo real `RyuuNest-Models` ya añadido: el repo oficial y sus 3 módulos aparecen; sincronizar muestra «Actualización» en m440 y actualizar 0.2.0 → 0.2.1 funciona (índice y SHA-256 verificados por la app); desinstalar e instalar YupManga con la hoja nueva: aviso NSFW, huella plegable y «Mantén pulsado para instalar» (confirmación reforzada) OK
- Módulo declarativo y bloqueo de dispositivo sin probar: ver «Sugerencias (no bloqueantes)».
- Verif: ✅ S25 Ultra (parcial, ver arriba)

### F64 Revisión de `RyuuNest-Models` `[Ops · Baja · N1]` 🧍

- [x] Frase corregida en `AGENTS.md` de RyuuNest-Models (PR #11); `AGENTS/README/NOTES.md` ya estaban en la raíz del repo, no hubo nada que copiar
- Verif: revisión humana

### F45 Avisos NSFW y primer uso sin jerga (propuesta de F33, sin aprobar) `[FE · Intermedia · N3]`

Dep: F16 · S · `apps/mobile/src/screens/{onboarding,sources}/*`

- [x] Aprobada por el humano (2026-11-20). Hecho: aviso al instalar un módulo NSFW (hoja de instalar) y aviso de primera vez al elegir/abrir un módulo NSFW en Aventuras (`NsfwNoticeSheet`; «Entiendo, continuar» lo marca visto en `setting` `discover.nsfwNoticeSeen.<id>`, «Volver» no); ambos explican «contenido para adultos, sexual o explícito». Primer uso: textos sin jerga (R13), botón primario a ancho completo anclado abajo con «Saltar» como enlace (V5), etiqueta «Repositorio oficial de RyuuNest» con «Usar otro repositorio», barra inferior oculta y «Ir a leer» deshabilitado hasta instalar un módulo (V4), y «Ir a leer» no se repite mientras termina (V6; el fallo original no se reprodujo, no hay medición)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (`onboarding`, `discover`, `discoverNsfw`, `nsfwNotice`) · ✅ S25 (2026-11-20): aviso NSFW al instalar y aviso de primera vez al elegir YupManga en Aventuras; el primer uso (barra oculta, «Ir a leer» deshabilitado) no se vio en el teléfono porque ya había datos

### F42 Portales y Ajustes: permisos y «disponibles» (propuesta de F33, sin aprobar) `[FE · Intermedia · N3]`

Dep: F33 · S · `apps/mobile/src/screens/{sources,settings}/*`

- [x] Aprobada por el humano (2026-11-20). Hecho: título duplicado quitado (N7), permisos «Ejecuta código»/«Para adultos» con icono de aviso solo en filas de módulo de Portales y primer uso (N9; las píldoras NSFW de Recomendados/Respaldo/web no se tocan, F98 sigue abierta), «Enlace del repositorio» sin `index.json` (R5), huella plegable y «Huella de verificación» (V3), Ajustes: idioma en una fila «Idioma» (N21), chips de lectura en columna sin separador (N22), chevrón de filas pulsables siempre a la derecha (R8), «archivo de respaldo» sin JSON (R9)
- [x] V7 «Quitar» visible en la tarjeta del repo, V8 avisos «{name} instalado» / «Módulo desinstalado» (PR #151). Los avisos de éxito salen en rojo (el bloque usa `colors.error`): tarea aparte para un tipo de aviso neutro
- [ ] Pendiente de F42 (no hecho, decidir): V3 botón primario verde (choca con el relleno naranja de `progress`; se deja como está); N21 sin chevrón porque no hay pantalla de idiomas; la web (`apps/web`) conserva su título y sus píldoras
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (`settings`, `sources`, `onboarding`, `shell`, galería)

### F100 Anti-bot con navegador nativo: spike del reto de Cloudflare `[BE/FE · Alta · N4]` 🧍

Dep: T42 · L · SPEC §894, IDEA 2.1 · repo `RyuuNest` (host) + `RyuuNest-Models` (módulos)

> Origen (2026-11-20): `m440` (`/manga-list`, `/filterList`) y ZonaTMO dan `BLOCKED` por el reto de página de Cloudflare, que ni curl_cffi con huella de Chrome supera. Un WebView lo supera y deja `cf_clearance`. **No sirve para el reto del lector de YupManga** (JS propio del sitio, no de Cloudflare): ese sigue con el intérprete cerrado y el canario.

- [x] Parte 1 (PR #152, `packages/core/src/host/challenge.ts`): `solveChallenge` (https + dominio del módulo, confirmación, guarda solo `cf_clearance`+UA por host con caducidad) y `host.fetch` las aplica; probado con navegador y almacén falsos. Los módulos no pueden llamarlo. Procedimiento de medición en el S25 en el PR.
- [x] Parte 2 (PR #157): WebView, hoja de confirmación, almacén `expo-secure-store`, módulo sin campo nuevo y SPEC §6.4/§6.5/§16/§17 actualizados (aprobado por el humano 2026-11-21; la app va por GitHub Releases, nunca Google Play). Medición y prueba en el S25: ver «Sugerencias (no bloqueantes)».
- [ ] Spike (1–2 días): `host.solveChallenge(url)` abre un WebView visible, espera el reto y devuelve control tras guardar `cf_clearance` y el `User-Agent` usado. Nunca en silencio: solo tras `BLOCKED` y con confirmación del usuario.
- [ ] Medir lo que decide la viabilidad: ¿acepta Cloudflare la cookie con la huella TLS del cliente HTTP de React Native o hay que pedir por el propio WebView? ¿cuánto dura? Respuesta con datos, no supuestos.
- [ ] Si es viable: `host.fetch` envía esas cookies y el mismo `User-Agent` por dominio; el módulo declara «este dominio necesita verificación»; la cookie se guarda como secreto del dispositivo con caducidad.
- [ ] Revisar la política de tiendas (uso de WebView para superar protecciones) antes de publicar.
- Verif: 🧍 S25 Ultra con `m440.in/manga-list`; nada en el APK hasta decidir.

### F62 Puertos futuros de `legacyModulos/` (deuda) `[BE/Ops · Alta · N4]`

> Decidido 2026-10-24: solo TMO en T31; los demás, a priorizar. Bloqueos: `details`/`pages` de m440 y FoxManga usan render JS (el host no tiene navegador); NineManga y Luscious sin `details`/`pages` en el legado; Yupmanga con anti-bot TLS; TmoHentai vacío. Detalle en `todo.archive.md` (T31).

- [ ] Priorizar solo cuando el host soporte navegador o cambie el sitio
- Verif: —

**Lote sugerido:** T42 → F61 → F63 → F64 → F45 → F42 → F98 (luego F100).

---

### F98 NSFW con borde naranja en los servidores de Portales `[FE · Baja · N2]` (opcional)

Dep: F94 · S · `apps/mobile/src/screens/sources/*`

> Origen (petición del humano, 2026-11-17, opcional). Reutiliza el token y la regla de F94.

- [x] Los módulos/servidores marcados `nsfw` en Portales llevan el borde naranja (más su etiqueta NSFW existente) — PR #153 (`ModuleRow.nsfw`, también en Recomendados; estado en la galería)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px · 🧍 S25 pendiente (ver el borde)

### F99 Avisar de versiones nuevas de un módulo y recomendar actualizar `[FE · Intermedia · N3]`

Dep: F16 (hoja «Actualizar módulo») · M · `apps/mobile/src/screens/sources/*`, `packages/core` (comparación semver)

> Origen (petición del humano, 2026-11-20): si ZonaTMO instalado es 1.2.3 y el repo publica 1.3.1, avisar al usuario y recomendar actualizar. **Ya existe** la insignia `update` por módulo (`sourcesView.ts`) y la hoja «Actualizar módulo»; falta que el aviso se vea sin entrar a Portales.

- [x] Rojo: comparar la versión instalada con la del índice del repo con semver (`module-sdk`), sin falsos positivos con prerelease ni con versiones iguales (`isUpdateAvailable`, PR #154)
- [x] Aviso visible fuera de Portales: punto neutro en la pestaña Portales y banner «Hay N actualizaciones» con «Ver» (solo en Guarida) que abre la hoja de actualizar del primer módulo con novedad; nada se actualiza solo
- [x] Solo lee lo guardado en SQLite del último sync; sin red ni segundo plano (RNF-5)
- [x] Textos en i18n, solo tokens, estados en la galería
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px · 🧍 S25: instalar un módulo desde un índice local 1.0.0, subirlo a 1.1.0, abrir/actualizar Portales, salir y ver punto + banner; «Ver» abre la hoja y solo actualiza al confirmar

---

## 💡 Sugerencias (no bloqueantes)

> Lo que quedó sin probar o pendiente tras el lote Portales (2026-11-21). No son tareas: no bloquean ni se planifican hasta que el humano las suba a tarea.

- **✅ Error de transacción SQLite (corregido 2026-11-21, falta verlo en el teléfono):** la causa eran dos `withTransaction` a la vez sobre la única conexión (ficha y lector llaman a `loadSeries` → `setTags` al restaurar la ruta). Ahora las transacciones de cada driver van en cola (`core/storage/SqlDriver.ts`, test `withTransaction.test.ts`). 🧍 Si vuelve a salir, abrir un issue con el registro. Texto original: al reabrir la app, el lector de m440 mostró «No se pudo abrir el capítulo» con `Call to function 'NativeDatabase.execAsync' has been rejected. → cannot start a transaction within a transaction` (INTERNAL). No se reprodujo después. Probable transacción anidada o concurrente al restaurar la ruta del lector.
- **F100 sin disparar:** Cloudflare no bloqueó m440 ese día (búsqueda y filtros sin `BLOCKED`), así que no se vio la hoja de confirmación ni el WebView. Probar cuando vuelva a bloquear (`m440.in/manga-list`), en Expo Go (modo «tarro») y luego en build de desarrollo; medir caducidad de `cf_clearance` y si el `fetch` de RN reutiliza la cookie del WebView (el procedimiento está en el PR #157). Vigilar que `onShouldStartLoadWithRequest` en Android no bloquee `challenges.cloudflare.com`.
- **Barra inferior a 360 dp con texto al 200 %:** las etiquetas se tocan (S25 y POCO). Caso muy especial; sin prisa.
- **Cookies sin librería deprecada (ya es tarea, ver F69):** `@react-native-cookies/cookies` está deprecada y sin soporte declarado de la New Architecture. Candidata: `@preeternal/react-native-cookie-manager` (TurboModules, API compatible, solo build de desarrollo). El `fetch` de RN en Android comparte el CookieManager del WebView, así que el «modo tarro» puede bastar sin librería: medir antes de decidir.
- **Portadas en blanco (YupManga y m440):** no se reprodujeron en el S25 (Aventuras, ficha y Guarida las muestran). Si reaparecen, leer el registro `cover.load` (PR #150): 403 ⇒ cargar con `host.fetch`; error de decodificación ⇒ formato.
- **Aviso neutro de F42** (PR #156): solo cubierto por Vitest y Playwright; no se vio en el S25 (tras actualizar YupManga no se observó el aviso).
- **F63:** instalar un módulo **declarativo** (los 3 del repo oficial son `script`) y el bloqueo de dispositivo con la protección activada.
- **T45:** probar en el S25 que el adaptador HTTP real pasa `Range` y devuelve 206/416.
- **Primer uso (F45):** la barra oculta y «Ir a leer» deshabilitado no se vieron en el teléfono porque ya había datos.
- **Borde NSFW (F98) en la lista de Recomendados:** verificado en módulos; falta ver una fila recomendada NSFW en el S25.
- **Limpieza:** borrar a mano `.claude/worktrees/agent-*` (rutas demasiado largas para Windows; git ya los desregistró).

---

## ⚙️ Ajustes (incluye Respaldo y Diagnóstico)

### F65 Respaldo en el teléfono `[FE · Baja · N2]` 🧍

- [x] 🧍 Compartir el archivo exportado con la hoja del sistema, importar un archivo real y comprobar que las carpetas por defecto no se duplican (ver F52) — F21a/F21b · verificado en el S25 (2026-11-21), capturas en `docs/capturasF65/`
- Verif: 🧍 POCO/S25

### F66 Zonas seguras en el dispositivo `[FE · Baja · N2]` 🧍

- [x] 🧍 Muesca, barra de estado y gesto inferior con `react-native-safe-area-context` en el POCO y el S25 (Diagnóstico y Ajustes); interruptor apagado legible (POCO: «Contenido NSFW» y «Protección de instalación»); tarjetas y botones «Exportar/Vaciar» a 360 dp; JetBrains Mono visible en códigos (F34.2, visto en el S25: el POCO no tiene eventos registrados) · evidencia en `docs/capturasF65/poco-*.png`. Observación: a 360 dp con 200 % las etiquetas de la barra inferior se tocan (S25 y POCO)
- [x] 🧍 Repetir F34.3 en el POCO F5 Pro con texto al 200 % · Guarida y Ajustes a 360 dp (densidad 640) sin desbordes; ajustes de pantalla restaurados (560 dpi, fuente 1.0)
- Verif: 🧍 POCO F5 Pro

### F67 Hojas de Respaldo, diálogos de error nativos y modo paginado `[FE · Baja · N2]` 🧍

- [x] 🧍 Revisar en el teléfono las hojas de Respaldo y los diálogos de error nativos, y el modo paginado I → D (F33 R1) · verificado en el S25 (hoja de modo, sugerencias, error INVALID, lector I → D avanza a la derecha); la hoja «Actualizar módulo» espera una actualización real y la de «Reemplazar» no se abrió
- Verif: 🧍 S25

### F68 Informe de diagnóstico en el teléfono `[FE · Baja · N2]` 🧍

- [x] 🧍 Exportar el informe (hoja del sistema) y copiarlo al portapapeles en el POCO/S25 (F30/F31) · verificado en el S25: hoja con `ryuunest-diagnostico-2026-11-21.txt` y aviso «Informe copiado» (el contenido del portapapeles no se pudo leer por adb)
- Verif: 🧍 dispositivo

### F69 Actualizaciones OTA con `expo-updates` `[Ops · Intermedia · N3]` 🧍

> Desbloqueada con la cuenta `poti7652` de EAS (proyecto `ryuunest`, canal `preview`). Expo Go sigue avisando «expo-updates system is disabled…»; no afecta al desarrollo.

- [x] Añadir `updates.url`, política de `runtimeVersion`, proyecto/canal de EAS, build de prueba y verificación de una actualización real · `eas.json` (perfil `preview`, APK), `runtimeVersion` `appVersion`, script `eas-build-post-install` (compila los paquetes del workspace) y parche de pnpm a `@react-native-cookies/cookies` (`jcenter()` → `mavenCentral()`); APK instalado en el POCO y actualización `01a20037…` descargada y ejecutada (logcat `DownloadComplete` y luego `CheckCompleteUnavailable`)
- Verif: 🧍 con la cuenta de EAS

#### Tarea general (sin ID): reemplazar `@react-native-cookies/cookies` `[Ops · Intermedia · N3]`

> Origen (petición del humano, 2026-11-21). El paquete está deprecado y solo compila gracias al parche de pnpm de `patches/` (`jcenter()` → `mavenCentral()`). Hay que quitar esa implementación y sustituirla por algo mantenido.

- [ ] Medir si el `fetch` de RN en Android ya comparte el CookieManager del WebView («modo tarro») y basta sin librería; si no, adoptar una alternativa con soporte de la New Architecture (candidata: `@preeternal/react-native-cookie-manager`; pedir permiso antes de añadir la dependencia)
- [ ] Quitar el parche de pnpm y la dependencia vieja, y repetir build `preview` y F100 en el S25
- Verif: 🧍 build de EAS + S25

### F89 Esquema de tema (JSON de tokens) y validación `[BE · Intermedia · N3]`

Dep: ninguna · M · `packages/ui-tokens`, `packages/module-sdk` (validación)

> Origen (petición del humano, 2026-11-16). **Decisión:** un tema es un JSON de tokens, sin código ejecutable.

- [x] Rojo: esquema con los colores semánticos de `ui-tokens`, versión y nombre; rechaza claves desconocidas, colores inválidos y contraste insuficiente (WCAG AA)
- [x] Temas integrados actuales expresados con ese esquema
- Verif: Vitest en `ui-tokens`/SDK

### F90 Ajustes: sección «Temas» con cambio dinámico `[FE · Intermedia · N3]`

Dep: F89 · M · `apps/mobile/src/screens/settings/*`, `packages/ui-tokens`

- [x] Selector de tema con vista previa; el cambio se aplica al instante y persiste entre sesiones
- [x] Componentes nuevos en la galería; textos en i18n; respeta `prefers-reduced-motion`
- Verif: Vitest + Playwright 426/1440 px + 🧍 S25 (hecho en el S25 2026-11-21: importar, aplicar y borrar; ver PR)

### F91 Ajustes: importar temas de la comunidad `[FE · Intermedia · N3]`

Dep: F90 · M · `apps/mobile/src/screens/settings/*`

- [x] Importar un JSON de tema **con confirmación manual** (nunca automática); error claro si no valida; poder borrar un tema importado
- Verif: Vitest + 🧍 S25 (hecho en el S25 2026-11-21: importar, aplicar y borrar; ver PR)

**Lote sugerido:** F65 → F66 → F67 → F68 (F69 espera cuenta); temas: F89 → F90 → F91. Diagnóstico y escritorio (F43) está en «Lector y ficha».

---

## 📖 Lector y ficha (relacionadas con Aventuras y Tesoros)

### F17 Cierre de la ficha de serie `[FE · Baja · N2]`

Dep: F32 (hallazgo) · S · `apps/mobile/src/screens/series/*`

- [x] **Carpeta:** cubierta por F96 (botón «Guardar» con hoja de carpetas); comprobado con `tests/e2e/series.cjs` a 426/1440 (2026-11-21)
- [x] Selector de grupo: el chip de un capítulo con ≥ 2 releases abre «Elegir grupo» (`ReleaseSheet`); la elección vale para toda la serie (P-187). Vitest + e2e `series.cjs` 426/1440
- [ ] 🧍 Comprobar en el dispositivo que el reinicio conserva favorito y grupo elegido
- Verif: Vitest con SQLite real · 🧍 S25 Ultra
- Nota: la parte web de la ficha entra en F41 (propuesta de F33).


### F51 Lector en cascada (webtoon): deslizar, pellizcar para zoom y barras que se ocultan a los 3 s `[FE · Alta · N4]`

Dep: F18/F19 (hechas) · M · `apps/mobile/src/screens/reader/{ReaderScreen,ReaderVertical,ReaderBars,ZoomableView}.tsx`

> Origen (petición del humano, 2026-11-16). Hoy el modo vertical ya es una lista, pero un toque en la pantalla avanza a la página siguiente (`scrollToPage`).

- [x] En modo cascada/webtoon las imágenes se apilan de arriba abajo y se navega **solo deslizando**; un toque en la pantalla deja de avanzar de página (el toque solo muestra u oculta las barras)
- [x] Zoom con pellizco (acercar/alejar) en cascada, sin romper el desplazamiento vertical; revisar el presupuesto de memoria (P-90)
- [x] Las barras (cabecera y pie) se ocultan solas **3 s** después de mostrarse, sin transición. Resuelto (P-185): mantener presionado las muestra; afecta también al paginado; pasar de página reinicia la cuenta y una hoja abierta la pausa
- [x] Paginado: deslizar pasa de página (invertido en D→I), además de las orillas
- [x] Al ver la tarjeta de fin, a los 3 s se abre el siguiente capítulo (aviso en la tarjeta; alejarse lo cancela)
- [x] El progreso guardado y «Continuar» siguen funcionando con el nuevo desplazamiento (RF-20; e2e `reader.cjs` pasos 6–7)
- [x] Precarga a disco por lotes de 5 (lote actual + siguiente) con aviso «Cargando imágenes X / N» (petición del humano, 2026-11-21)
- [x] Probado en el POCO con m440 (Blue Lock): deslizar rápido, mantener presionado, ocultado a 3 s, paso automático al cap. 2 y deslizar en paginado
- [x] 🧍 Pellizcar para zoom en el teléfono (no se probó en esta sesión; el código del zoom no cambió)
- Verif: Vitest de la lógica (temporizador, toque ≠ avanzar) + 🧍 S25: leer un capítulo largo deslizando, pellizcar y ver que las barras se ocultan

---


### F23 Lector para TV (D-pad) `[FE · Alta · N4]`

Dep: F22, F18, F19 · M · `apps/mobile/src/screens/reader/tv/*`

- [ ] Todas las acciones del lector solo con control remoto (AC-9); controles grandes; sin animaciones
- Verif: 🧍 leer un capítulo completo en la MiBox 4 (AC-9, AC-6)


### F39 Equivalencias web de los arreglos de F32 `[FE · Baja · N2]`

- [x] Cubierta por F77 (P-171): el lector web muestra el mensaje por tipo. Comprobado 2026-11-21 con `apps/web/tests/e2e/reader.cjs` a 1440/426 px; de paso se arregló el salto de página del modo vertical que hacía fallar ese e2e a 426 px (P-187)
- Verif: ✅ Playwright a 1440/426 px

### F36 Detalle de error en el S25 `[FE · Baja · N2]` 🧍

- [ ] 🧍 Ver el «Ver detalle» de `ErrorState` con la URL completa (sin «…») en el S25 con un error de imagen real (red cortada)
- Verif: S25 Ultra

### F43 Lector, Diagnóstico y escritorio (propuesta de F33, sin aprobar) `[FE · Intermedia · N3]`

- [x] Aprobada (humano, 2026-11-21). Auditoría: R12 y W19 ya resueltos; N17/R10/R11/R6 parciales; R7, W14, W15 abiertos; W17 en la web de Expo
- [x] N17 un solo indicador (sin «%») · R11 sin botones ‹ › · R10 «Derecha a izquierda (manga)» / «Izquierda a derecha (cómic)»
- [x] R6 eventos repetidos agrupados («×N») · R7 chips «Texto» / «Datos»
- [x] W14 banner del lector web con margen, código y «Ver detalle» · W15 selector de capítulo en la barra del lector web
- [x] W17 Guarida y Tesoros con tope `gridMaxWidth` 1100 px y rejilla por tramo (P-188)
- [ ] 🧍 Ver en el teléfono la barra inferior sin ‹ › ni «%» y los nombres de modo nuevos
- Verif: ✅ Vitest + Playwright (`reader`, `settings`, `diagnostics`, `library`, `home`, `shell` en móvil; `reader`, `settings`, `f28Screens` en `apps/web`)

### 🧍 Lector en el POCO (F18/F19) `[FE · Baja · N2]`

- [ ] 🧍 Abrir un capítulo real, cambiar de modo, pellizcar, comprobar que la pantalla no se apaga, romper una imagen (modo avión) y reintentarla, y medir la memoria con `adb shell dumpsys meminfo` durante la precarga

### Hallazgo (2026-11-21) · plural en carpetas de Tesoros `[FE · Baja · N1]`

- [ ] La tarjeta de carpeta dice «1 obras» (visto en la web de Expo a 1440 px con la base sembrada); falta singular

**Lote sugerido:** F17 → F51 → F39 → F36 → F43 → F23.

---

## 🌐 Web y extensión

### F26/F27 Extensión y puente — restos `[FE/BE · Baja · N2]`

- [ ] 🧍 Cargar la extensión **en Chrome y en Firefox** y autorizar un dominio con el aviso real del navegador (ver `apps/extension/README.md`)
- [ ] 🧍 Leer un capítulo con la extensión instalada y un sitio real (AC-10; cierra Checkpoint P-D)
- [ ] 🧍 Decidir el origen de producción de la PWA (hoy solo `localhost`, P-116), la ficha de las tiendas y validar los textos `extension.*` (P-120)

### 🚩 Checkpoint P-D `[Ops · Baja · N1]`

- [ ] 🧍 AC-10 en tu navegador · [ ] 🧍 Revisión

> La base local de la web de Expo (F49) está en **Tesoros**. El arte de los iconos de la extensión, en **Recursos** (F72).

---

## 🎨 Recursos (arte, iconos e ilustraciones)

> Hallazgos de explorar la app (2026-11-16): **todos** los estados vacío, de error y de carga usan el mismo `DragonMarker` (silueta marcador en `assets/placeholder/`, TEMPORAL); la barra inferior usa iconos de `lucide`; no hay ilustración propia por pantalla ni arte para las carpetas por defecto; los iconos de la app (`icon.png`, `android-icon-*`, `splash-icon.png`) y los de la extensión no tienen arte final. Solo tokens de color de `ui-tokens`, arte original GPL-3.0, sin recursos externos (RNF-5); cada recurso se registra en `ASSETS.md`.

### FA1 Arte final del dragón `[Ops · Baja · N1]` 🧍 (sin dependencias; antes de v1.0 pública)

- [ ] 🧍 Arte original con licencia compatible GPL-3.0; sustituir `apps/mobile/assets/placeholder/*`
- [ ] `ASSETS.md` y `README` de placeholder actualizados; retirar marca TEMPORAL
- Verif: `apps/mobile/tests/placeholder.test.ts` en verde + galería con Playwright (RNF-5)

---


### F70 Ilustraciones propias por estado vacío `[FE/Arte · Intermedia · N3]`

Dep: F56 · M · `apps/mobile/src/components/{EmptyState,DragonMarker}.tsx`

- [ ] Una ilustración SVG distinta por vacío: Guarida (sin lecturas), Tesoros (sin series), Aventuras (sin módulos / sin resultados), Portales (sin repos), Diagnóstico (sin eventos); F56 aporta la de «sin resultados»
- [ ] `EmptyState` acepta la ilustración por prop; todas en la galería (dos escalas)
- Verif: Playwright 426/1440 px + 🧍 S25

### F71 Ilustraciones de error y de carga `[FE/Arte · Baja · N2]`

- [ ] `ErrorState` y `LoadingState` con ilustración propia (hoy comparten el dragón marcador); sin animación en el lector
- Verif: Playwright + galería

### F72 Iconos de la extensión `[Arte · Baja · N1]` 🧍

- [ ] El manifiesto va sin `icons`: crear 16/32/48/128 px a partir del arte final del dragón (tras FA1)
- Verif: construir la extensión y cargarla

### F73 Icono de la app, adaptativo y pantalla de inicio `[Arte · Baja · N1]` 🧍

- [ ] Sustituir `icon.png`, `android-icon-{background,foreground,monochrome}.png`, `favicon.png` y `splash-icon.png` por arte final; comprobar el icono monocromo
- Verif: 🧍 S25 (cajón de apps y arranque)

### F74 Iconos y colores de iconos `[FE · Baja · N2]`

Dep: — · S · `apps/mobile/src/icons`, `BottomNav.tsx`

- [ ] Auditar iconos de la barra inferior y la cabecera: un solo juego (`lucide`), tamaños y colores por estado (activo/inactivo/foco) tomados de `ui-tokens`; iconos con nombres temáticos coherentes (Guarida, Tesoros, Aventuras, Portales, Ajustes)
- Verif: Playwright + galería

### F75 Iconos de las carpetas por defecto y del botón «+» `[FE/Arte · Baja · N2]`

Dep: F52, F53 · XS

- [ ] Iconos para «Favoritos» (estrella) y «Gemas» (gema) en `FolderCard`, y el «+» verde del botón flotante, con tokens
- Verif: galería + Playwright

**Lote sugerido:** F70 → F71 → F74 → F75 → F73 (F72 y FA1 esperan el arte final del dragón).

---

## 🗂️ General (abarca varias secciones o ninguna)

### T44 ✅ 58 archivos de test fallaban en `vitest run` desde la raíz `[Ops · Intermedia · N3]`

- [x] Resuelto (2026-11-21): no eran tests rotos. Faltaba la config de la raíz (`vitest.config.ts` con `projects`: cada paquete con su config y sus alias) y 19 tests leían rutas relativas a `process.cwd()` (ahora parten de `import.meta.dirname`). Raíz 231/231 y `pnpm -r test` en verde.
- [x] ~~Revisar y resolver.~~ Medido el 2026-11-20 con `npx vitest run` desde la raíz: **58 archivos / 44 tests fallan**, y fallan igual sin los cambios de `HostResponse.bytes()` (comprobado con `git stash`). Reparto por paquete: `apps/mobile` 44, `apps/web` 7, `packages/core` 4, `tools/eslint-plugin-ryuunest` 2, `packages/ui-tokens` 1.
- Pista: varios dan `ENOENT: scandir '<raíz>\src'` (asumen cwd = paquete). Probar `pnpm -r test` y comparar con la raíz; decidir si es la configuración de vitest o tests rotos de verdad. Hasta resolverlo, la suite global no sirve como puerta de calidad.

### T05 cierre `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope de imágenes medido; marcar T05 ✅
- Aparte (no bloquea): MiBox 4 pospuesta (P-43); revalidar RNF-1 en release.

### T33 Pruebas de seguridad `[Sec · Alta · N4]`

Dep: T13 · M · `core/tests/security/*.test.ts` · sin dependencia del cierre de la API (en paralelo)

- [ ] Cada amenaza de SPEC §7.2 (zip-slip, bomba, hash, manifest, respaldo malicioso) tiene una prueba que falla si se quita la mitigación
- [ ] Un deep link `ryuunest://add-repo?url=…` solo abre la confirmación, no instala (AC-8)
- [ ] Límites de tamaño/archivos cubiertos
- Verif: `pnpm --filter @ryuunest/core test -- security` + revisar correspondencia amenaza↔prueba


### G1 Calibrar políticas del host (T35) `[BE · Intermedia · N3]`

- [ ] Calibrar `HOST_DEFAULTS` (15 s, 4, 250 ms) con mediciones; 🧍 PR de prueba que rompe el contrato y hace fallar el CI

### G2 Plataforma: deudas del núcleo `[BE · Intermedia · N3]`

- [ ] La app nativa aún no rellena `HttpResponse.url` (P-74)
- [ ] Migrar las filas `kv` de repos/módulos a tablas `repo`/`module` y retirar `kv`
- [ ] Si los `paths` entre paquetes se complican, migrar a *project references* de TypeScript
- [ ] `react-native-tvos` sin confirmar contra SDK 57 (pospuesto con P-43)

### F22 Riel lateral + navegación espacial + foco `[FE · Alta · N4]`

Dep: P-B · M · `apps/mobile/src/tv/*`

- [ ] Foco siempre visible (anillo 2 px `accent`, separación 2 px); escala 1,25×; márgenes seguros; navegación completa con D-pad (incluye el ítem pendiente de F33: revisar navegación con teclado/D-pad y legibilidad en densidad TV)
- Verif: Playwright (foco con teclado) · 🧍 recorrer los 5 destinos en la MiBox 4


### F37 Repetir F32 en la MiBox 4 y el POCO F5 Pro `[FE/QA · Baja · N2]` 🧍

Dep: F32 · S · dispositivos

- [ ] Repetir el recorrido de F32 en la MiBox 4 (piso de rendimiento, Android 9, 2 GB) y en el POCO F5 Pro cuando haya módulo y red; anotar diferencias frente al S25 Ultra.
- [ ] Medir la memoria del lector con `adb shell dumpsys meminfo` durante la precarga (fija `READER_IMAGE_BUDGET_MB`, P-90) y AC-6 (60 páginas verticales sin cierres) en la MiBox 4.
- Verif: 🧍 dispositivos.


### F28 Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12) — restante `[FE/QA · Baja · N2]` 🧍

- [ ] 🧍 Capturas en POCO F5 Pro y MiBox 4 (AC-12 no se cierra sin dispositivo)


### G3 Medidas con APK compilado `[Ops · Baja · N2]` 🧍

- [ ] 🧍 Medir el tope de imágenes (P-45) y revalidar RNF-1 (<3 s) con APK compilado (antes: POCO 4580 ms, S25 1940 ms, MiBox 5600 ms); cierra T05

### G4 Proceso y limpieza `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Definir el proceso Scrum en una sesión aparte (AGENTS.md §16) · [ ] 🧍 Reservar el org npm `@ryuunest` · [ ] 🧍 Decidir qué hacer con las ramas remotas ya fusionadas
- [ ] Revisar o descartar `stash@{0}` y borrar el worktree residual de F07 en `~/.local/share/opencode/worktree/`
- [ ] `AGENTS.md` pide una entrada de bitácora por sesión (P-15) que este archivo ya no lleva: decidir dónde va

### 🚩 Checkpoints `[Ops · Baja · N1]`

- [ ] **I:** API 1.0 congelable (T37–T41 hechas; lo decide el humano) · 🧍 Revisión
- [ ] **P-C:** AC-9 · 🧍 Revisión
- [ ] **J — Fin de la Parte 1:** suite y CI en verde · cobertura del contrato completa · 🧍 Revisión → cierre formal

---
