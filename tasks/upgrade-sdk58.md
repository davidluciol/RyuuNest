# UP1 — Actualización completa a Expo SDK 58 (plan, no ejecutar todavía)

> Estado: **.Task Documentada (2026-10-23), pendiente de autorización de ejecución por el humano.**
> Fuentes: changelog oficial de SDK 58 (`https://expo.dev/changelog/sdk-58`), guía de migración de Router
> (`https://docs.expo.dev/router/migrate/sdk-57-to-58/`), guía general de actualización
> (`https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough`), difs del template nativo
> (`https://docs.expo.dev/bare/upgrade`), Context7 (`/websites/expo_dev`) y el registro npm (más al día que los docs).
> Regla del proyecto: nada se instala sin confirmación (AGENTS.md §7); este documento **no toca** código ni dependencias.

## 1. Decisiones previas ya tomadas (registradas el 2026-10-23)

1. **P-66 queda reemplazada para esta tarea** por decisión del humano: se actualizará a SDK 58 a pesar de su
   antigüedad (salió el 15 de oct. de 2026). La ejecución se hará en una tarea autorizada aparte, no «de paso».
2. **Pinning destino = la última `58.0.x` publicada en npm al momento de ejecutar** (hoy: `expo@58.0.17`,
   `expo-router@58.0.25`), alineando peers con `expo install --fix` y verificándolos contra el registro npm —
   no contra los documentos de Context7, que van algo rezagados (ver pregunta 3 de MEMORY.md).
3. Se mantiene el **comportamiento web de SDK 57** (salida estática) salvo decisión contraria: es lo que usa la
   verificación con Playwright de la galería (F05/F11) y el servidor de `tests/e2e/serve.cjs`.

## 2. Qué se actualiza (destino)

| Paquete (`apps/mobile`) | Hoy (SDK 57) | Destino (SDK 58) |
|---|---|---|
| `expo` | `~57.0.28` | `~58.0.17` (última al ejecutar) |
| `expo-router` | `57.0.28` (fijado por P-66) | `58.0.x` (peers alineados) |
| `expo-constants`, `expo-font`, `expo-linking`, `expo-status-bar`, `@expo/metro-runtime` | `~57.x` | `~58.x` (lo fija `expo install --fix`) |
| `react` / `react-dom` | `19.2.3` | `19.3.0` |
| `react-native` | `0.86.3` | `0.88` |
| `react-native-reanimated` / `react-native-worklets` | `4.5.1` / `0.10.1` | las que fije el SDK 58 (hoy en npm: `4.7.1` / `0.13.0`; confirmar con `expo install`) |
| `@react-native/metro-config` (dev) | `0.86.3` | `0.88.x` |
| `react-native-web` | `~0.21.4` | `0.21.x` (sin salto mayor) |
| `react-native-safe-area-context` / `-screens` / `-svg` | `~5.7.0` / `~4.26.2` / `15.15.4` | las que fije el plugin del SDK 58 |

Fuera de `apps/mobile` no cambia nada: `packages/*` no depende de Expo ni de React Native.

**Requisito de entorno:** Node.js 22.13+ en la línea 22, 24.3+ en la línea 24 o 26+. Este equipo tiene
v24.16.0 ✓. **Expo Go de las tiendas no soporta aún SDK 58** (llega«dentro de unas semanas»): el proyecto no lo
usa como vía principal (compila bundles/APK), pero hay que tenerlo en cuenta para smokes en Expo Go.

## 3. Puntos de ruptura de SDK 58 y solución para RyuuNest

Fuente: changelog SDK 58 y guía de migración de Router (Context7). Ordenados por impacto real en el código
que hoy existe (verificado con búsqueda en `apps/mobile`, no suposición).

### P-1. Router: la salida web pasa a `web.output: "server"` por defecto  ⚠ el que más afecta

- **Qué cambia:** en SDK 58, si `web.output` no está fijado, los proyectos de Router usan `server`, que
  renderiza HTML en cada petición y ya no prerenderiza en `expo export`.
- **Impacto en RyuuNest:** `apps/mobile/app.json` **no fija** `web.output`, así que al subir de SDK el export
  web dejaría de producir el sitio estático que sirve `tests/e2e/serve.cjs` (busca ficheros en `dist` con
  fallback `index.html`) y con el que verifican Playwright `shell.cjs`, `home.cjs` y `gallery-shell.cjs`.
  La galería de desarrollo (F11) corre contra Metro, así que esa parte no cambia, pero el flujo de captura
  estática sí se rompería.
- **Solución (Context7, guía de migración §Review server rendering behavior):** fijar explícitamente en
  `app.json`:
  ```json
  {
    "expo": {
      "web": { "output": "static" },
      "plugins": [["expo-router", { "apiRoutes": true }]]
    }
  }
  ```
  `apiRoutes: true` solo hace falta si se usan rutas de API (no se usan hoy); se puede omitir y añadir cuando
  toque. El proyecto no tiene servidor ni rutas de API, así que `static` es suficiente y mantiene el
  comportamiento de SDK 57 exactamente igual.

### P-2. Router: safe-area insets en web dejan de pasar por `react-native-safe-area-context`

- **Qué cambia:** Router ya no inyecta los insets de área segura en web a través de esa librería; en web se
  usan valores CSS `env(safe-area-inset-*)`.
- **Impacto en RyuuNest:** el shell de F11 usa áreas seguras (`useSafeAreaInsets` / `SafeAreaView`) en
  `_layout.tsx` y los tamas de pantalla. En **nativo** no cambia nada. En **web**, el tipo de dato que hoy
  llega a esos hooks ya no vendrá poblado por Router (queda a 0 o depende del navegador con visual viewport).
- **Solución:** en el shell nativo no se toca nada; para web o se acepta el valor 0 (barras de navegador
  modernas ya gestionan el UI del sistema) o se aplica `env(safe-area-inset-*)` con la capa web de F24 cuando
  exista. Decisión recomendada: **aceptar valores a 0 en web por ahora** y anotarlo en `DIFFS.md`, porque el
  cliente web de v1 es el riel (F24) y aún no existe. Verificar con Playwright que el shell a 320/1440 px
  sigue sin desbordar.

### P-3. RN 0.87 activa la Strict TypeScript API por defecto

- **Qué cambia:** compilando con las condiciones `react-native` de `expo/tsconfig.base`, los imports profundos
  `react-native/Libraries/*` pasan a errores de tipo y algunos tipos cambian de forma (refs con instancias
  `ViewInstance`/`TextInputInstance`).
- **Impacto en RyuuNest:** verificado: **el código propio no importa nada de `react-native/Libraries/*`** ni
  usa tipos de métodos nativos. El riesgo queda en dependencias (tipos de `expo`/router, que ya están
  migrados en SDK 58; y `lucide-react-native`/`react-native-svg`, sin imports profundos conocidos).
- **Solución:** correr el gate de tipos tras subir y, solo si aparece un error de este tipo en una
  dependencia que no podamos actualizar, fijar el opt-out temporal en `apps/mobile/tsconfig.json`:
  ```json
  "compilerOptions": {
    "customConditions": ["react-native", "react-native-legacy-deep-imports"]
  }
  ```
  Ese opt-out **desaparecerá después de RN 0.89**: si se usa, añadir todo al plan de migración durante el
  ciclo del SDK 58 (queda anotado como pendiente en §6).

### P-4. Router: núcleo de navegación reescrito

- **Qué cambia:** el estado y las claves de ruta son deterministas, el envío de navegación se aplaza hasta
  después del commit, y se retiró buena parte de la API bifurcada de React Navigation. Las rutas cargadas
  por `loader` ya usan la caché HTTP (`Cache-Control`). `withLayoutContext` queda deprecado (favor de
  `integrateWithRouter`). Rutas asíncronas **activadas por defecto en web** (los ficheros de ruta se trocean
  y se cargan al navegar).
- **Impacto en RyuuNest:** el shell usa navegación estándar de Router (tabs, sin navigators a medida, sin
  `expo-router/react-navigation`, sin loaders). Afectación esperada: **baja**, pero es la zona con más riesgo
  de regresión sutil (histórico, foco, recarga — lo que prueba `shell.cjs`).
- **Solución:** no migrar nada del código; re-ejecutar la batería completa de Playwright de F11 (5 destinos ×
  5 anchos, historial, teclado, foco) tras el salto y revisar el diff de comportamiento. Con la galería,
  comparar la captura contra `screen.png` base propia (dif de píxeles permitido: es captura base propia).

### P-5. APIs eliminadas en RN 0.86 → 0.88

- **Qué cambió:** se eliminan `InteractionManager` (usar `requestIdleCallback`), el export raíz `Touchable`,
  los tipos `NativeMethods`, la prop `animated` de `Modal` y las props de `StatusBar` nativo
  (`backgroundColor`, `translucent`, `networkActivityIndicatorVisible`). `ImageBackground` queda deprecado a
  favor de `View` + `Image` absoluta.
- **Impacto en RyuuNest:** verificado por búsqueda: **cero usos** de `InteractionManager`, `Libraries/`,
  `ImageBackground`, `Modal animated`. El único `StatusBar` es el component de **`expo-status-bar`**
  (`style="light"` en `src/app/_layout.tsx`), que en SDK 58 es `~58.0.3` y mantiene su API.
- **Solución:** no requiere código; se deja la lista como checklist de verificación al correr el gate.

### P-6. Android release con R8/minify activado por defecto

- **Qué cambia:** el template escribe `android.enableMinifyInReleaseBuilds=true` en `gradle.properties`
  (shrink + obfuscación con `proguard-android-optimize.txt`).
- **Impacto en RyuuNest:** al recompilar el APK de release, el arranque puede **mejorar** (beneficio para
  RNF-1), pero un número pequeño de librería puede requerir reglas keep (el núcleo es JS puro; Hermes no
  se ve afectado; `@noble/hashes` y `htmlparser2` son JS, no nativos; riesgo bajo).
- **Solución:** compilar el release y ejecutar el smoke; si algo falla por ofuscación, desactivar con
  `expo-build-properties` (`enableMinifyInReleaseBuilds: false`) en vez de a mano en `gradle.properties`.
  Revalidar **RNF-1 con el APK compilado** (pendiente ya de T05/P-45; esta actualización completa esa
  revalidación pendiente).

### P-7. `NODE_ENV` lo fija ahora Expo CLI (afecta a `.env` y config dinámica)

- **Qué cambia:** `expo start` fuerza `NODE_ENV=development` y las demás órdenes `production`, reemplazando
  cualquier valor externo; los ficheros `.env.*` se eligen por ese modo.
- **Impacto en RyuuNest:** `apps/mobile` no usa `.env` ni config dinámica que dependa de `NODE_ENV`. El
  `.env` de la raíz (claves de herramientas del agente) es ajena a Expo CLI. Ausencia de impacto.
- **Solución:** nada; anotado por si alguien añade `.env.test` esperando el comportamiento antiguo.

### P-8. Fingerprint por defecto pasa al preset `balanced`

- **Qué cambia:** `@expo/fingerprint` ya no cambia el fingerprint al tocar `version` en `app.json` ni hashes
  por fichero: halla módulos nativos por nombre+versión del paquete.
- **Impacto en RyuuNest:** los fingerprints se usan para recompilaciones de dev-client; efecto esperado:
  **menos recompilados innecesarios**. Sin acción.

### P-9. Deprecaciones nuevas a vigilar (no rompen hoy)

- `expo-router`: `withLayoutContext` → no se usa en el repo.
- `@expo/ui`: varias props cambian de nombre → no se usa `@expo/ui` (no está en `package.json`; en SDK 58 es
  peer **opcional** y deja de ser dependencia indirecta obligatoria del router).
- `expo-file-system`: `File.md5` → `File.digest()` → no se usa `expo-file-system` en `apps/mobile`.
- Nota TV: la versión de `react-native-tvos` para SDK 58 (tabla oficial: `0.87-stable`) sigue **pendiente de
  confirmar** (pregunta 15, P-43: la MiBox está de lado; solo evidencia futura).

### P-10. Beneficios que se ganan (para no olvidarlos al justificar la tarea)

- **`expo-font` con tipografías variables y multifamilia** (SDK 58): es la mejora que F03 anotó como
  « pendiente a SDK 58» (bitácora de F11). Permite cargar todas las variantes de Manrope/Inter bajo un solo
  `fontFamily` con `fontDefinitions` (`weight`/`style`), o usar la fuente variable de un solo archivo con
  `fontVariationSettings` (RN 0.88). **Alcance:** convertirlo quedaría como mejora aparte después de la
  subida, no dentro de UP1 (un corte propio `UP1b`, decidir luego con el humano).
- Builds Android ~50 % más rápidos de `expo-modules-core` (prebuild `.so`).
- Menos recompilados nativos por fingerprint `balanced`.
- `URL`/`URLSearchParams` reescritos en el runtime de Expo (el núcleo declara la global en
  `packages/core/src/globals.d.ts`; no hay acoplamiento, sin acción).

## 4. Guía paso a paso (cortes)

División pensada para la regla de sesión de `tasks/complexity.md` §1 (≈5 ficheros por sesión): los cortes
1–3 son una sesión, el 4 es la verificación pesada (secuencial, como en F11), el 5 son los documentos.
Cada corte termina en un commit atómico con el gate focalizado en verde.

### Corte 0 — Preparación (N1)

1. `git checkout master && git pull origin master`.
2. Rama `feature/UP1-expo-sdk-58`.
3. Registro de partida: guardar la salida de `npx expo-doctor` y `pnpm peers check` actuales como referencia
   (comparar después).
4. Confirmar con el humano el pin: `expo@~58.0.17` o la última `58.0.x` del momento.

### Corte 1 — Subida de dependencias (N3, el corazón)

1. `pnpm --filter @ryuunest/mobile add expo@~58.0.17` (o la última al ejecutar).
2. `npx expo install --fix` **desde `apps/mobile`** para alinear todos los peers al SDK 58 (router, fonts,
   constants, linking, status-bar, metro-runtime, reanimated, worklets, safe-area-context, screens, svg,
   react-native, react, react-dom, react-native-web y la dev-dep `@react-native/metro-config`).
3. **Ojo operativo (P-55 de MEMORY.md):** después de un `add` con filtro, correr `pnpm install` completo para
   restaurar los `node_modules` de los demás workspaces que la poda de pnpm puede tumbar.
4. `pnpm peers check` (sin excepciones si se puede; en SDK 58 la política de peers del router cambió:
   `@expo/ui` y `expo-symbols` son opcionales, así que debería pasar limpio).
5. `npx expo-doctor`.

### Corte 2 — Config de app (N2)

1. `apps/mobile/app.json`: fijar `"web": { "output": "static" }` (P-1) para mantener la verificación
   existente. Decidir con el humano si se añade ya `apiRoutes: true` (recomendado: no, no se usan rutas API).
2. Si el doctor o los logs piden algún ajuste de plugin (`expo-font`, `expo-status-bar`, `expo-router`),
   aplicarlo en este corte.
3. Gate: `pnpm lint`, `pnpm --filter @ryuunest/mobile typecheck`, `pnpm --filter @ryuunest/mobile test`.
   Si el typecheck trae errores de la Strict TS API de terceros, aplicar el opt-out de P-3 y anotarlo.

### Corte 3 — Ajuste del contenido existente si el gate exige (N3→N4)

- Solo APERTURAS que el gate o `expo export` revelen (por hoy no se espera ninguna: cero usos de las APIs
  eliminadas — P-5). Si un fix requerido toca más de 2–3 ficheros, parar y replantear (regla de sesión).

### Corte 4 — Verificación completa (N4, opcional apoyarse en subagente para el arsenal)

1. `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test` (gate completo, secuencial: en este equipo correr
   export/typecheck/test pesados a la vez provocó timeouts, bitácora de F11).
2. `pnpm --filter @ryuunest/mobile export` web → servir con `tests/e2e/serve.cjs` y re-ejecutar la batería
   Playwright de F11 (`shell.cjs`, `home.cjs`, `gallery-shell.cjs`): 5 destinos × 5 anchos, historial,
   teclado, foco, fuentes locales, cero dominios externos, cero errores de consola.
3. La galería de desarrollo contra Metro (no contra export --dev: sin transporte HMR, fallos ajenos a la UI).
4. Bundle Android/Hermes en verde; smoke en POCO F5 Pro si el humano está disponible (🧍, AC-12 sigue
   pendiente de F11; esta tarea **no lo sustituye**, solo añade evidencia del SDK 58).
5. Diferencias aceptadas → `design/stitch/DIFFS.md` (por ejemplo, safe-areas a 0 en web, P-2).

### Corte 5 — Documentos y cierre (N1)

1. `docs/adr/` (ADR-0002 o uno nuevo): fijar el pin actualizado del SDK 58 y retirar el pendiente de
   `react-native-tvos` o actualizarlo según la decisión TV vigente (P-43).
2. `MEMORY.md`: registrar la decisión (P-66 reemplazada para SDK 58 por orden del humano 2026-10-23),
   pinning de destino, resultados de la verificación y cualquier pregunta nueva.
3. `tasks/todo.md`: marcar UP1 `[x]` y anotar `UP1b` (fuentes variables/multifamilia) como tarea aparte
   **pendiente** de autorización.
4. PR con evidencia del gate y de la verificación Playwright (capturas en `docs/capturasUP1/`). El humano
   revisa y fusiona (AGENTS.md §9).

### Rollback

El corte 1 es un cambio solo de `apps/mobile/package.json` + `pnpm-lock.yaml`: revertir en git y
`pnpm install` restaura el estado. Los cortes de configuración (Corte 2) son ficheros de configuración
revertibles igual. Ningún corte migra datos ni produce cambios irreversibles.

## 5. Nivel de complejidad asignado (resumen para `tasks/complexity.md`)

| Tarea | Tipo | Complejidad | Nivel | Escalar | Motivo |
|---|---|---|---|---|---|
| UP1 Actualización total a SDK 58 | Ops/FE | **Alta** | **N4** | N5 | Modifica el andamio sobre el que está hecho TODO lo existente (F03–F14b): dependencias, build web/native, verificación Playwright y gates de CI; puntos de ruptura del router y de la Strict TypeScript API; regla de antigüedad de paquetes (P-66) queda reemplazada por el humano para esta tarea |
| UP1b Fuentes variables/multifamilia (post-UP1) | FE | Intermedia | N3 | N4 | Es la mejora que F03 dejó para SDK 58; toca `expo-font`, tokens y galería |

Nota de sesión: los cortes 1–2 caben en una (≈4 ficheros); el corte 4 (verificación pesada) es mejor
sesión aparte o con subagente de apoyo, siguiendo la regla de ejecución secuencial del equipo (F11).

## 6. Pendientes que UP1 no resuelve (quedan en la lista)

- RNF-1 con APK compilado (P-45/T05) — UP1 suma evidencia al compilar release con R8, pero la medición
  del tope de imágenes sigue siendo del humano (P-45).
- Prueba/captura en POCO F5 Pro de F11 (AC-12) — sigue 🧍 humano.
- `react-native-tvos` para TV (pregunta 15; P-43: de lado, solo evidencia).
- Migración definitiva fuera del opt-out `react-native-legacy-deep-imports` si se llega a usar (antes de
  RN 0.89).

## 7. Referencias usadas por este plan

1. Changelog SDK 58: https://expo.dev/changelog/sdk-58 (publicado 2026-10-15; versiones RN/React y deprecaciones)
2. Guía de actualización de SDK: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough (`pnpm add expo@^58.0.0` + `npx expo install --fix` + `npx expo-doctor` + changelogs)
3. Migración Router SDK 57 → 58: https://docs.expo.dev/router/migrate/sdk-57-to-58 (server output → static + apiRoutes; safe areas en web por CSS; async routes por defecto; testing deps)
4. Diferencias del template nativo 57 → 58: https://docs.expo.dev/bare/upgrade (pins exactos de react/react-native/expo-status-bar)
5. Fuentes variables y multifamilia (SDK 58): https://docs.expo.dev/develop/user-interface/fonts
6. Versión de dependencias (RN 0.88, Node mínimo): https://docs.expo.dev/versions/latest
7. Registro npm (pinning definitivo al ejecutar): `expo@58.0.17`, `expo-router@58.0.25` (2026-10-23)
