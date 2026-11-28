# todo.md — RyuuNest (solo pendientes) · 2026-11-27

> Lo terminado está en `tasks/todo.archive.md` (última poda: 2026-11-27, con copia íntegra del archivo anterior al final). Contexto → `tasks/plan.md`; decisiones → `docs/MEMORY.md` (vigentes) y `docs/MEMORY.archive.md` (P-1…P-197).
> **Identificadores sin renumerar.** Al iniciar sesión leer `tasks/complexity.md` §1. Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `docs/DESIGN_RULES.md` → `docs/DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
> Etiqueta: `[tipo · complejidad · nivel]`. 🧍 = paso humano (no inventar mediciones).

**Estado:** v1 completa en código (núcleo, móvil, web, extensión, temas, lector progresivo, Acerca de, logo e iconos). **1.0.0** compilada con EAS `preview` e instalada en el POCO. Queda: verificaciones en dispositivo, TV (MiBox 4), extensión en navegador, arte de artistas y las tareas de abajo.

## Cómo está organizado (Regla 15 de `AGENTS.md`)

Por sección de la app: **Guarida**, **Tesoros**, **Aventuras**, **Portales**, **Ajustes**, más **Lector y ficha**, **Web y extensión**, **Recursos** y **General**. Solo tareas con algún `- [ ]`; al terminar, se archivan en `todo.archive.md`.

| Sección | Lote sugerido (una sesión) |
|---|---|
| Recursos | F101 → F75 → F74 → F70 → F71 (FA3 y F102 son 🧍) |
| Portales | F42 (decidir) → T45 → hallazgo ZonaTMO → F100 (cuando Cloudflare bloquee) |
| Ajustes | AB4 → cookies |
| Lector | plural de carpetas → R2 (APK) → F17 (grupo) |
| General | F103 (tras elegir canal) → G5 → G3/T05 |

---

## 📱 Verificar con el APK 1.0.0 `[QA · Baja · N2]` 🧍

> Hecho en código y en Playwright; falta verlo en el teléfono. Una sola sesión con el APK cubre casi todo.

- [ ] Cajón de apps (icono adaptativo y monocromo) y arranque en frío (F73)
- [ ] Tesoros: carpetas por defecto en el primer arranque (F52), «+» y «Nueva carpeta» (F53), pulsación larga (F54), búsqueda y filtros (F55, F57, F58), vacío de búsqueda (F56, y que el humano revise el texto, P-165), chips en una fila (F92), «Gestionar» (F93), borde NSFW (F94)
- [ ] Portadas de ZonaTMO, M440 y YupManga en Guarida y Tesoros (F47)
- [ ] Ficha: corazón → Favoritos/Gemas (F95) y «Guardar» con carpeta (F96); borde NSFW en Aventuras (F97) y en Portales/Recomendados (F98)
- [ ] Banner y punto de actualizaciones de módulo (F99), aviso neutro de éxito (F42), primer uso sin datos: barra oculta e «Ir a leer» deshabilitado (F45)
- [ ] Módulos: repasar FanFox, E-Hentai e Hitomi de punta a punta; Luscious pasa Cloudflare; el primer toque tras instalar un módulo no se pierde; una instalación no se cuelga (hallazgos de P-192)
- [ ] El error «cannot start a transaction within a transaction» no vuelve (P-186)
- [ ] Quitar del S25 el repo de prueba `…/audit-release/index.json` si sigue y reinstalar desde `main`

---

## 🏠 Guarida (Inicio)

### F34 Inicio al 200 % del texto del sistema `[FE · Intermedia · N3]` 🧍

- [ ] 🧍 Comprobar en el S25 con `font_scale 2.0` (el arreglo de código ya está)

---

## 🚪 Portales (Fuentes y módulos)

### T45 Hitomi.la: buscador limitado `[BE/Ops · Intermedia · N3]` 🧍

- [ ] Decidir si se implementa el índice B-tree del sitio (búsqueda por título y varios términos) o se acepta el límite de un término `namespace:valor`
- [ ] Coste de listas: una petición a `galleries/<id>.js` por tarjeta (24 por página); valorar `galleryblock` o tarjetas perezosas
- [ ] 🧍 Comprobar en el teléfono que el adaptador HTTP pasa `Range` (206/416)

### F42 Restos de permisos y «disponibles» `[FE · Baja · N2]` 🧍

- [ ] Decidir: V3 botón primario verde (choca con el naranja de `progress`), N21 sin chevrón (no hay pantalla de idiomas) y si la web conserva título y píldoras

### F100 Anti-bot con navegador nativo: medición `[BE/FE · Alta · N4]` 🧍

> Partes 1 y 2 hechas (PR #152, #157). Cloudflare no bloqueó m440 al probar, así que no se vio la hoja ni el WebView.

- [ ] 🧍 Cuando vuelva a bloquear (`m440.in/manga-list`): Expo Go y luego APK; medir si Cloudflare acepta la cookie con la huella TLS del cliente de RN y cuánto dura `cf_clearance` (procedimiento en el PR #157). Vigilar que `onShouldStartLoadWithRequest` no bloquee `challenges.cloudflare.com`

### F62 Puertos futuros de `legacyModulos/` (deuda) `[BE/Ops · Alta · N4]`

- [ ] Priorizar solo cuando el host soporte navegador o cambie el sitio (bloqueos en `todo.archive.md`, T31)

### Hallazgo · ZonaTMO falla en algunas fichas `[BE · Baja · N2]` (repo `RyuuNest-Models`)

- [ ] «El Mejor Ingeniero del Mundo» (`/library/manhwa/30664/…`) da `PARSE`: falta `h1.element-title`. Revisar el selector con un fixture guardado

### VisorManga fuera del índice `[Ops · Baja · N1]` 🧍

- [ ] Republicarlo (entrada con el `.zip` 0.1.1) cuando vuelva su CDN `imgvtmo.com`

---

## 💡 Sugerencias (no bloqueantes)

> No son tareas hasta que el humano las suba.

- **Barra inferior a 360 dp con texto al 200 %:** las etiquetas se tocan (S25 y POCO).
- **Portadas en blanco (YupManga y m440):** no se reprodujeron. Si reaparecen, leer el registro `cover.load` (PR #150): 403 ⇒ cargar con `host.fetch`; error de decodificación ⇒ formato.
- **YupManga:** si vuelve `UNSUPPORTED` en el reto, correr el canario y ampliar `miniJs.js`/`boxStyle.js` («Depurar el reto» en `tools/README.md` de Models).
- **F63:** instalar un módulo **declarativo** y probar el bloqueo de dispositivo con la protección activada.
- **Diseños sin Stitch:** primer uso, confirmación de instalación y hoja de filtros; validar los textos `state.error.library.*`.
- **EAS:** añadir `.easignore` (archivo de 156 MB en la subida, P-184).

---

## ⚙️ Ajustes (incluye Respaldo y Diagnóstico)

### AB4 «Documentación» en Acerca de `[FE · Baja · N1]`

- [ ] Enlace «Documentación» (→ `README.md` del repo) en `about/appInfo.ts`, con su clave i18n, en móvil y web

### Reemplazar `@react-native-cookies/cookies` `[Ops · Intermedia · N3]` 🧍

> Deprecado; solo compila gracias al parche de pnpm (`jcenter()` → `mavenCentral()`).

- [ ] Medir si el `fetch` de RN en Android ya comparte el CookieManager del WebView y basta sin librería; si no, alternativa con New Architecture (candidata: `@preeternal/react-native-cookie-manager`; pedir permiso)
- [ ] Quitar el parche y la dependencia vieja; repetir build `preview` y F100 en el teléfono

---

## 📖 Lector y ficha

### F17 Hoja «Elegir grupo» en el teléfono `[FE · Baja · N2]` 🧍

- [ ] 🧍 Probarla con un módulo real que tenga ≥ 2 grupos por capítulo (m440 solo trae uno, P-147)

### F23 Lector para TV (D-pad) `[FE · Alta · N4]`

Dep: F22 · `apps/mobile/src/screens/reader/tv/*`

- [ ] Todas las acciones del lector solo con control remoto (AC-9); controles grandes; sin animaciones
- Verif: 🧍 leer un capítulo completo en la MiBox 4 (AC-9, AC-6)

### R2 Estados por página: restos `[FE · Intermedia · N3]` 🧍

- [ ] 🧍 Medir cuadros y memoria con APK y en un capítulo de ~100 páginas
- [ ] «Vaciar caché de imágenes» no vació la caché de disco en Expo Go: comprobar con APK
- [ ] (upstream) `Image.prefetch` de expo-image decodifica cada página a tamaño original solo para dejarla en disco; no hay opción «solo descargar»

### Hallazgo · plural en carpetas de Tesoros `[FE · Baja · N1]`

- [ ] La tarjeta de carpeta dice «1 obras»; falta el singular

---

## 🌐 Web y extensión

### F26/F27 Extensión y puente — restos `[FE/BE · Baja · N2]` 🧍

- [ ] 🧍 Cargar la extensión **en Chrome y en Firefox** y autorizar un dominio con el aviso real del navegador (`apps/extension/README.md`)
- [ ] 🧍 Leer un capítulo con la extensión y un sitio real (AC-10; cierra el Checkpoint P-D)
- [ ] 🧍 Decidir el origen de producción de la PWA (hoy solo `localhost`, P-116), la ficha de las tiendas y validar los textos `extension.*` (P-120)

---

## 🎨 Recursos (arte, iconos e ilustraciones)

> **Regla para el arte de artistas (FA3, F70–F75):** el artista se acredita en Ajustes → Acerca de añadiéndolo a `ARTISTS` (`apps/mobile/src/about/artists.ts`) y cada recurso se registra en `docs/ASSETS.md` (CC BY-NC-ND 4.0, P-196). Solo tokens de color, sin recursos externos (RNF-5).

### FA3 Alta de artista en «Acerca de» `[Datos · Baja · N1]` 🧍

- [ ] 🧍 Pasar nombre artístico, foto, redes y agradecimiento de cada artista
- [ ] Foto en `apps/mobile/assets/artists/<id>.webp` importada con `import` (no `require`: la web reutiliza `ARTISTS`), entrada en `ARTISTS`, texto en `es.json` (`about.artists.<id>.bio`), registro en `docs/ASSETS.md`
- Verif: `tests/about/artists.test.ts` + galería + 🧍 teléfono (cada red abre el navegador)

### F70 Ilustraciones propias por estado vacío `[FE/Arte · Intermedia · N3]`

- [ ] Una ilustración distinta por vacío (hoy todos muestran el logo): Guarida, Tesoros, Aventuras (sin módulos / sin resultados), Portales, Diagnóstico
- [ ] `EmptyState` acepta la ilustración por prop; todas en la galería (dos escalas)
- Verif: Playwright 426/1440 px + 🧍 teléfono

### F71 Ilustraciones de error y de carga `[FE/Arte · Baja · N2]`

- [ ] `ErrorState` y `LoadingState` con ilustración propia; sin animación en el lector
- Verif: Playwright + galería

### F74 Auditoría de iconos `[FE · Baja · N2]`

- [ ] Barra inferior y cabecera: un solo juego (`lucide`), tamaños y colores por estado (activo/inactivo/foco) de `ui-tokens`; sustituir por el arte del artista cuando llegue
- Verif: Playwright + galería

### F75 Iconos de las carpetas por defecto y del botón «+» `[FE/Arte · Baja · N2]`

- [ ] «Favoritos» (estrella) y «Gemas» (gema) en `FolderCard`, y el «+» verde del botón flotante, con tokens
- Verif: galería + Playwright

### F101 Pantalla de bienvenida (splash) con el logo `[FE/Arte · Baja · N2]` 🧍

- [ ] La app no configura `expo-splash-screen` (posible destello blanco en Android 12+). Splash con el logo con pupila sobre `#0B0E14` (`dragonNightColors.bg`), Android e iPhone; Context7 para el plugin de SDK 57 y **pedir permiso** si hay que instalar el paquete
- [ ] Sin animación ni texto; el color sale del tema
- Verif: test de `app.json` + 🧍 APK (arranque en frío sin destello blanco)

### F102 Configuración para iPhone (iOS) `[Ops · Baja · N2]` 🧍

- [ ] `ios.bundleIdentifier` (propuesta: `io.github.davidluciol.ryuunest`), `supportsTablet` y perfil de EAS para iOS
- [ ] 🧍 Decidir la distribución: SPEC P-3 solo contempla APK y PWA; iOS exige Apple Developer o instalación lateral. Si cambia el alcance, actualizar el SPEC antes
- Verif: `eas build -p ios --profile preview` (o `expo prebuild -p ios`) sin errores de configuración

---

## 🗂️ General

### F103 «Mandar reporte»: reporte revisado por el usuario → issues de GitHub `[FE/Ops · Intermedia · N3]` 🧍

Dep: F30, T36 (`core/diagnostics/sanitize.ts`) · Pedido del humano 2026-11-27

> **Bloqueo:** RNF-5 permite que el usuario **revise y envíe a mano** con una app suya; un envío directo a un servidor o relé (C) exige cambiar el SPEC. 🧍 Elegir canal(es).

- [ ] Botón «Mandar reporte» en `ErrorDialog`, `ErrorBanner`, error por página del lector y Ajustes → Diagnóstico
- [ ] Hoja de revisión con **todo** lo que sale, editable solo en «Detalles». Obligatorio: código de error, módulo + versión, versión de la app, plataforma y SO, huella, fecha. Opcional: detalles (con tope) y las últimas N entradas del registro
- [ ] Limpieza con `sanitize.ts` + quitar dominio, IDs de series/capítulos y títulos; avisar de que el texto es público. Pruebas con fixtures de cada dato sensible
- [ ] Nada sale sin pulsar «Enviar»; textos en i18n, galería, áreas ≥48, sin animación en el lector
- [ ] Huella: `sha256(código + módulo + versión mayor.menor + mensaje normalizado + 3 primeros marcos normalizados)`, 12 hex, en título (`[fp:ab12cd34ef56] …`) y cuerpo. Tests: iguales ⇒ misma huella
- [ ] GitHub: plantilla `.github/ISSUE_TEMPLATE/reporte-error.yml`; la app abre `issues/new?…` (límite ~8 KB de URL); buscar antes la huella con la API pública y ofrecer «Ya está reportado»; Action que comenta y cierra duplicados o etiqueta y da de alta en GitHub Projects con «Ocurrencias»
- [ ] 🧍 Canal para quien no tiene GitHub: **A** Telegram (sin token del bot en el APK), **B** `mailto:`, **C** relé Cloudflare Workers (cambia RNF-5), **D** hoja de compartir/portapapeles, **E** formulario web. Recomendación: GitHub + D + (A o B)
- Verif: tests de limpieza y huella, galería + Playwright + 🧍 POCO (reporte de prueba a un repo o canal de pruebas)

### G5 Manejador del enlace `ryuunest://add-repo` `[FE · Intermedia · N3]`

- [ ] Hoy Expo Router lo manda a una ruta inexistente. Abrir Portales con «Añadir repositorio» y la URL puesta (SPEC §7.2), sin instalar; ampliar `deepLink.test.ts`

### G3 / T05 Tope de imágenes y cierre de T05 `[Ops · Baja · N2]` 🧍

- [ ] 🧍 Medir el tope de imágenes (P-45): `ImageCapPanel` no está montado; decidir dónde exponerlo
- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope medido; marcar T05 ✅

### F22 Riel lateral TV: preguntas abiertas `[FE · Alta · N4]` 🧍

- [ ] Decidir (PR #165): ancho del riel TV (hoy 240), márgenes seguros (48×32), zoom del enfocado vs escalar tamaños, ×1,25 en el resto de pantallas, `isTvLike()` → `isTvDevice`
- Verif: 🧍 recorrer los 5 destinos en la MiBox 4

### F37 / F28 Recorrido y capturas en la MiBox 4 `[FE/QA · Baja · N2]` 🧍

- [ ] Recorrido de F32 en la MiBox 4 (Android 9, 2 GB); anotar diferencias frente al S25
- [ ] Memoria del lector con `dumpsys meminfo` en precarga (fija `READER_IMAGE_BUDGET_MB`, P-90) y AC-6 (60 páginas verticales sin cierres)
- [ ] Capturas para AC-12 (no se cierra sin ella)

### G2 Plataforma (condicional) `[BE · Intermedia · N3]`

- [ ] Migrar a *project references* de TypeScript si los `paths` entre paquetes se complican
- [ ] `react-native-tvos` sin confirmar contra SDK 57 (pospuesto con P-43)

### G4 Proceso `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Definir el proceso Scrum en una sesión aparte (AGENTS.md §16)
- [ ] 🧍 Reservar el org npm `@ryuunest`
- [ ] 🧍 Decidir qué hacer con las ramas ya fusionadas (locales y remotas)
- [ ] `AGENTS.md` pide una bitácora por sesión (P-15) que ya no se lleva: decidir dónde va o quitar la regla

### V2 · Dependencias obsoletas de `eas-cli` `[Ops · Baja · N1]` (v2)

> Avisos de npm al usar `npx eas-cli`: son de `eas-cli`, no de RyuuNest (ninguno está en `pnpm-lock.yaml`). Revisar cuando Expo publique una versión que las actualice.

- [ ] `inflight@1.0.6`, `rimraf@2.4.5`, `glob@6/10`, `http-call@5.3.0`, `uuid@7/8`

### 🚩 Checkpoints `[Ops · Baja · N1]` 🧍

- [ ] **G, H y P-A:** revisión humana
- [ ] **I:** API 1.0 congelable (T37–T41 hechas; lo decide el humano)
- [ ] **P-C:** AC-9 (TV)
- [ ] **P-D:** AC-10 en tu navegador (ver F26/F27)
- [ ] **J — Fin de la Parte 1:** suite y CI en verde · cobertura del contrato completa → cierre formal
