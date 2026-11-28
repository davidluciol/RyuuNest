# docs/MEMORY.md: RyuuNest

Memoria del proyecto para cualquier agente: estado, hitos importantes, decisiones que siguen mandando y pendientes. Alcance en `SPEC.md`; reglas en `AGENTS.md`; tareas en `tasks/todo.md`.

**Histórico:** el detalle de hitos y **todas** las decisiones P-1…P-197 está en `docs/MEMORY.archive.md` (poda del 2026-11-27). Si el código o una tarea citan un `P-n` que no aparece aquí, búscalo allí.

**Mantenimiento:** al cerrar un hito, una línea en §2. Decisión nueva: §3 con el siguiente número (P-198 en adelante); si cambia una, `Reemplazada por P-xx`. Pregunta respondida: sale de §4. No registrar comandos, conteos de tests ni errores corrientes.

## 1. Estado (2026-11-27)

- **v1 completa en código:** núcleo (Parte 1), app móvil Expo SDK 57 (con TV en código), cliente web `apps/web` con extensión de navegador, temas, lector progresivo, Acerca de, logo e iconos.
- **Release 1.0.0:** APK compilado con EAS `preview` e instalado en el POCO F5 Pro (arranca en ~0,5 s). Distribución por GitHub Releases, nunca tiendas.
- **Módulos** (repo `RyuuNest-Models`, 8 publicados): ZonaTMO, M440, YupManga, FanFox, E-Hentai, Hitomi, Luscious, Mangation. VisorManga retirado (CDN caído).
- **Falta:** verificar con el APK, TV en la MiBox 4, extensión en un navegador real, arte de artistas, splash, «Mandar reporte» (`tasks/todo.md`).

## 2. Hitos importantes

- **Núcleo (oct 2026):** contrato y `ModuleHost` (permisos por dominio, 15 s / 4 / 250 ms), instalación verificada (HTTPS, SHA-256, zip-slip, topes), runtimes declarativo y `script`, SQLite con migraciones (hoy v6), lector headless, respaldo JSON, diagnóstico saneado, resiliencia y CI. ADR-0003 aceptado; T37–T43 cierran la API (Checkpoint I sin revisar).
- **Diseño y pantallas (oct–nov):** `ui-tokens` Dragon Night, galería, i18n compartido; Guarida, Tesoros, Aventuras, Portales, Ajustes, ficha, lector, primer uso, respaldo, diagnóstico; correcciones UX F34 y análisis F33.
- **Web y extensión (2026-11-01):** `apps/web` con datos reales (sql.js + IndexedDB) y toda la red por la extensión MV3 (Chrome/Edge y Firefox); AC-10 verificado con Playwright, falta en navegador real.
- **Datos reales en todas partes (2026-11-14/17):** Guarida y Tesoros desde la base; web de Expo con base real (`@ryuunest/web-db`); carpetas por defecto, carpetas inteligentes, búsqueda, filtros, orden y cabeceras de portada.
- **Aventuras y Portales (2026-11-19/21):** paginación declarada, scroll infinito, filtros del módulo, selector de módulo en cabecera, «Recomendados» remoto, avisos NSFW, aviso de actualizaciones, anti-bot con WebView (partes 1–2).
- **Temas (2026-11-21):** JSON validado (AA), 3 integrados e importación con confirmación.
- **Red en Android (2026-11-22):** el TIMEOUT tras minutos sin tráfico era una conexión OkHttp muerta; OkHttp con ping (plugin) y `network.minDelayMs` por módulo. Con APK, «Retomar» en ~1 s; RNF-1 ≈ 1,8 s.
- **Lector progresivo (2026-11-23):** cola de páginas con prioridad, reintentos y cancelación; estado visible por página; sin descargas dobles (−40 % de tráfico al abrir).
- **Auditoría de módulos para el release (2026-11-26/27):** arreglo del `await` de Hermes en flechas con parámetros desestructurados; montador que remonta al actualizar; luscious 0.1.4, mangation 0.1.3; títulos de capítulo sin repetir numeración.
- **Lector vertical que no se deslizaba (2026-11-27):** un `Pressable` envolvía al `ScrollView` y le robaba el arrastre en Android (P-193).
- **Release (2026-11-27):** Acerca de con artistas (móvil y web), raíz ordenada (`docs/`), licencias GPL-3.0 + CC BY-NC-ND 4.0, logo final, iconos de app/web/extensión y APK 1.0.0.

## 3. Decisiones vigentes (resumen; detalle en el archivo)

**Producto y licencias**
- P-2/P-3 Todo en el dispositivo; sin servidor, cuentas ni tiendas: APK por GitHub Releases y PWA. P-7 Sin sincronización ni descargas en v1.
- P-6 Módulos `.zip` (declarativo o `script`) en el repo externo `RyuuNest-Models` (P-78); nada se instala solo (P-49).
- P-196 Código **GPL-3.0-only**; arte de artistas **CC BY-NC-ND 4.0** (`LICENSE-ART.md`, `docs/ASSETS.md`); donaciones por Ko-fi.
- P-197 Logo del humano (arte de Artista): con pupila para app e iconos, sin pupila ≤32 px; verde `#35C98A` sobre `#0B0E14`.
- P-71 Repo `davidluciol/RyuuNest`, `applicationId` `io.github.davidluciol.ryuunest`.

**Arquitectura**
- P-37/P-46 `module-sdk` → `core` (solo tipos), validadores inyectados; `core` sin dependencias de apps.
- P-118 Toda la red de la web pasa por la extensión. P-115 Lógica pura de pantallas compartida vía `@ryuunest/mobile-src`.
- P-137 Hermes admite `new Function`; los `script` se cargan en la app. P-192 Hermes falla con `await` en flechas `async` de parámetros desestructurados.
- P-184 EAS: cuenta `poti7652`, proyecto `ryuunest`, canal `preview`; script `eas-build-post-install` y parche de `@react-native-cookies/cookies`.
- P-189 Migración 6: `kv` → tablas `repo`/`module`. P-186 Transacciones en cola por `SqlDriver`.

**UI y lector**
- P-138 Secciones Guarida, Tesoros, Aventuras, Portales, Ajustes (claves y rutas sin cambio).
- P-140 T7: un texto que cabe se muestra entero; tarjetas a 3 líneas.
- P-161/P-174 «Gemas» es una vista de todas las series; «Favoritos» carpeta del sistema; el corazón alterna Favoritos ↔ Gemas.
- P-173 `nsfw` es token (borde naranja siempre con insignia «18+»). P-183 Temas solo JSON de colores; nada de `StyleSheet.create` con colores fijos (`themedStyles`).
- P-185 Webtoon: solo deslizar y pellizcar; el toque muestra/oculta barras (ocultas a los 3 s).
- P-190 Excepción a «ninguna animación en el lector»: el `ActivityIndicator` nativo del placeholder de página.
- P-193 Nunca envolver un `ScrollView` en un `Pressable`.

**Proceso y verificación**
- P-127 App nativa con agent-device; web y galería con Playwright.
- P-192 Trabajo grande: rama de integración + ramas hijas por subagente; los PR finales los fusiona el humano.
- P-44 Pruebas en POCO F5 Pro y S25 Ultra; la MiBox 4 (2 GB) es el piso de rendimiento.

**Nuevas (2026-11-27)**
- P-198 «Mandar reporte» (F103): dos botones, **GitHub** («La atención será prioritaria») y **correo** a `potigameplays@gmail.com` («Será más lenta, pero lo atenderemos»); el usuario revisa y envía a mano (cabe en RNF-5). Telegram, más adelante.
- P-199 **Habrá iOS** solo si se instala fuera de la App Store, como un APK (instalación lateral) o como extensión para iOS; sin App Store. Antes de compilar: investigar las vías y actualizar SPEC P-3.
- P-200 F42 cerrado con crítica UX/UI (design-critique, humano 2026-11-27): el botón de mantener pulsado es el **primario** (`accent`, tinta `bg`; el relleno ámbar es avance); «Idioma» sin chevrón (no hay pantalla a la que ir); en la web el h1 se queda, los permisos van en línea propia con icono, «Instalar» es secundario y el aviso de éxito es neutro.

## 4. Pendientes y preguntas abiertas

- 🧍 **Verificar con el APK 1.0.0** todo lo hecho sin prueba en el teléfono (lista en `tasks/todo.md`).
- ⏰ **Recordar al humano al empezar la sesión:** decidir T45 (¿índice B-tree de Hitomi o aceptar un solo término?).
- **PR abiertos sin fusionar:** #178 (poda de docs), #179 (F42), #180 (F103 parte 1).
- 🐞 **FanFox +18:** la ficha sale con 0 capítulos (dice 113) por el aviso de contenido adulto; Models issue #30.
- 🐞 **ZonaTMO:** el lector se traba al bajar rápido tras cargar el capítulo (posible rendimiento; falta saber qué manga).
- **F102 iOS:** investigar la instalación lateral y la extensión de iOS (P-199).
- 🧍 **FA3:** quizá entre el primer artista el 2026-11-28.
- 🧍 **Extensión:** probarla en Chrome y Firefox reales, AC-10, origen de producción de la PWA (P-116) y textos `extension.*` (P-120).
- 🧍 **MiBox 4:** F23, F22 (preguntas del PR #165), F37, AC-6, AC-12.
- 🧍 **Checkpoints** G, H, P-A, I, P-C, P-D y J sin revisar.
- 🧍 Tope de imágenes (P-45) y cierre de T05; proceso Scrum; org npm `@ryuunest`; ramas fusionadas; bitácora de P-15.
- VisorManga: republicarlo cuando vuelva `imgvtmo.com`.

## 5. Avisos operativos

- `pnpm add --filter X` poda los `node_modules` de otros paquetes: correr `pnpm install` completo después.
- Metro y la web usan el `dist` de `@ryuunest/core` y `ui-tokens`: tras tocarlos, `pnpm --filter <paquete> build` y reiniciar Metro (`--clear` si no recoge el cambio o tras cambiar de rama).
- Metro con `CI=1` no vigila ficheros: reiniciarlo tras editar `src/`.
- Nativo: `adb reverse tcp:8081 tcp:8081` y abrir `exp://127.0.0.1:8081` en Expo Go. Expo Go no trae el OkHttp con ping: los cuelgues de red tras minutos sin tráfico solo se juzgan con APK.
- Un `x.native.ts` **nunca** importa `./x` (Metro lo resuelve a sí mismo); comprobar el bundle con `npx expo export -p android --no-minify --no-bytecode -s external`.
- `typecheck` de mobile usa `--stack-size=32000`. Export, typecheck, lint y tests pesados **en secuencia**.
- **Prettier siempre por archivo** con `--end-of-line auto` (con `core.autocrlf`, formatear carpetas reescribe todo).
- Playwright: `PLAYWRIGHT_MODULE=%APPDATA%\npm\node_modules\@playwright\cli\node_modules\playwright`. La extensión real va con el Chromium de Playwright (Chrome de marca ignora `--load-extension`); `vite preview` escucha en `localhost`, no en `127.0.0.1`.
- Los e2e reescriben capturas en `docs/capturas*`: revisarlas antes de incluirlas.
- Vitest no parsea `.tsx` de React Native: la lógica de color/forma va en `*Styles.ts` puros. No escribir `apps/*/src` dentro de un JSDoc.
- La puerta de i18n compara subcadenas («Error», «JSON» chocan con identificadores).
- El scrubber de secretos reemplaza por `"***"` literales como `NOMBRE_KEY = "…"`: usar `*_SETTING`.
- No nombrar dos archivos que solo difieran en mayúsculas (TS1149 en Windows).
- El aviso `configLoader: 'native'` de Vite al construir web/extensión no es una regresión.
- Graphify: `graphify update .` tras tareas grandes.
