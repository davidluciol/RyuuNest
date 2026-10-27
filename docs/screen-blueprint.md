# Plano de pantalla (FB1)

> Lo que ya hacen F11, F13 y F14 (a/b/c). Sin reglas nuevas: las reglas siguen en `AGENTS.md` y `DESIGN_RULES.md`. F12, F15, F17, F20, F21 y F25 leen esto en vez de explorar el repo.

## Estructura de una pantalla

- `apps/mobile/src/screens/<nombre>/<Nombre>Screen.tsx`: la pantalla; recibe `data` y callbacks por props, sin tocar el núcleo ni la red.
- `apps/mobile/src/screens/<nombre>/<nombre>Fixtures.ts`: tipos de `data`, estado vacío (`EMPTY_*`) y datos de ejemplo (`SAMPLE_*`, series inventadas, D1 a D5).
- Pantalla con datos reales: además `<nombre>Data.ts` (núcleo → `data`) y `use<Nombre>Data.ts` (carga/error).
- `apps/mobile/src/app/(tabs)/<nombre>.tsx`: la ruta de Expo Router; solo conecta datos y pantalla. El marco (cabecera y barra) lo da `apps/mobile/src/navigation/ShellNavigator.tsx`.
- Marcador estable (F11b): la raíz de cada pantalla destino declara `testID="screen-<id>"`; el marco de F11 usa `destination-<id>`. `apps/mobile/tests/e2e/markers.cjs` los espera a los dos y `apps/mobile/tests/screens/destinationMarkers.test.ts` vigila el convenio: sustituir un marco por su pantalla no debe romper `shell.cjs`.
- Piezas repetibles van a `apps/mobile/src/components/` (`Nombre.tsx` + `nombreStyles.ts` puro) y se registran en `apps/mobile/src/gallery/registry.ts`.

## Patrón

1. Componentes reutilizables nuevos o ampliados (Regla 3) con todos sus estados en la galería.
2. Datos: primero de ejemplo, después reales. Estados: vacío, carga, error y con datos.
3. Verificar con Playwright contra el `screen.png` de `design/stitch/<pantalla>/`; diferencias aceptadas en `design/stitch/DIFFS.md`.
4. Ejemplo con fixtures: `apps/mobile/src/screens/home/HomeScreen.tsx` con `apps/mobile/src/screens/home/homeFixtures.ts` (F13).

## Textos y tokens

- Todo texto sale de `t("clave")` (`apps/mobile/src/i18n/index.ts`, catálogo `apps/mobile/src/i18n/es.json`); una clave nueva debe usarse, y ninguna cadena del catálogo va literal.
- Colores, espacios, radios y tipografía solo de `@ryuunest/ui-tokens`; el ancho decide con `layoutForWidth(width)`. El lint de diseño (F09) rechaza literales.
- Áreas táctiles mínimas con `touchTarget` (48); títulos a 2 líneas sin «…» (T7).

## Datos reales

Ejemplo: Biblioteca (F14c). La pantalla no importa el núcleo; lo hace la capa de datos:

1. `apps/mobile/src/data/appDatabase.native.ts` abre `ryuunest.db` (expo-sqlite), migra el esquema del SPEC §8.1 y se comparte; `apps/mobile/src/data/appDatabase.ts` devuelve `null` (web y Vitest).
2. `apps/mobile/src/data/expoSqlDriver.ts` adapta expo-sqlite al puerto `SqlDriver` del núcleo.
3. `apps/mobile/src/screens/library/libraryData.ts` llama a `browseLibrary` y `Folders` y devuelve `LibraryData`; `resolveLibraryData` usa los datos de ejemplo cuando no hay base (web).
4. `apps/mobile/src/screens/library/useLibraryData.ts` expone carga, error y `reload`; la ruta `apps/mobile/src/app/(tabs)/library.tsx` pinta `ErrorState` o la pantalla.
5. Una base real vacía muestra el estado vacío: nunca se siembran datos de ejemplo.

Prueba: `apps/mobile/tests/screens/libraryData.test.ts` siembra SQLite real (`node:sqlite`, `packages/core/tests/support/nodeSqliteDriver.ts`) y comprueba lo que ve la pantalla.

## Verificación con Playwright

- Script `.cjs` en `apps/mobile/tests/e2e/`; ejemplo: `apps/mobile/tests/e2e/library.cjs`. Se sirve el export web con `apps/mobile/tests/e2e/serve.cjs` (`expo export --platform web`).
- Comprueba, a 426 y 1440 px: la pantalla pinta, sin desbordamiento horizontal, sin errores de consola y sin peticiones a dominios externos (RNF-5). Las capturas se comparan a ojo con `screen.png`, no por píxeles.
- Playwright no ve la app nativa: la prueba en el POCO F5 Pro queda como paso humano (AC-12).
