# Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)

> Detalle de `tasks/plan.md`. Orden de autoridad: `docs/SPEC.md` → `DESIGN_RULES.md`
> → `DESIGN.md` → PNG/HTML de `design/` → `docs/IDEA.md`.
> Convención de comandos (se fijan en T01/T02): `pnpm -r typecheck` · `pnpm -r test` ·
> `pnpm -r build` · `pnpm lint` · focalizada: `pnpm --filter @ryuunest/core test`.
> Estados: `[ ]` pendiente · `[x]` hecho · `[-]` descartado/bloqueado.
> Tracker: pendiente elegir GitHub Issues o `bd` (ver pregunta abierta 2 de `plan.md`).
> **Nivel de complejidad, modelo recomendado y esfuerzo** de cada tarea pendiente:
> `tasks/complexity.md`.

## Fase 0 — Fundación

## Task T01: Monorepo (pnpm) + TypeScript estricto

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Crear el esqueleto del monorepo `ryuunest/` con **workspaces de pnpm** (P-1),
paquetes `@ryuunest/core`, `@ryuunest/module-sdk`, `@ryuunest/test-site` y
`@ryuunest/ui-tokens` (este último vacío, solo placeholder hasta la Fase 6a), un
`tsconfig.base.json` compartido y el comando raíz `build`.

**Criterios de aceptación:**

- [X] `pnpm install` enlaza los paquetes del workspace sin publicar.
- [X] `tsconfig` base con `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- [X] El core no importa nada de `apps/*` ni de RN/DOM.
- [X] `pnpm -r build` compila los paquetes.

**Verificación:**

- [X] `pnpm install && pnpm -r build`
- [X] Manual: los `package.json` tienen `"name": "@ryuunest/*"` y `"private": true`.

**Dependencias:** Ninguna.
**Archivos probables:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`,
`packages/{core,module-sdk,test-site,ui-tokens}/{package.json,tsconfig.json,src/index.ts}`.
**Tamaño:** M.

## Task T02: Tooling (lint/format/typecheck) + Vitest + CI

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Configurar ESLint + Prettier, **Vitest** (P-2) por paquete y un pipeline de
CI (GitHub Actions) que ejecute lint, typecheck, tests y build. Fija los comandos de
verificación del proyecto.

**Criterios de aceptación:**

- [X] `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test` funcionan en local y en CI.
- [X] CI corre en cada push/PR y falla si algo no está en verde.
- [X] Un test de humo trivial pasa en `core`.

**Verificación:**

- [X] `pnpm lint && pnpm -r typecheck && pnpm -r test`
- [X] Manual: revisar `.github/workflows/ci.yml`.

**Dependencias:** T01.
**Archivos probables:** `.github/workflows/ci.yml`, `eslint.config.js`, `.prettierrc`,
`packages/core/vitest.config.ts`, `packages/core/src/__tests__/smoke.test.ts`.
**Tamaño:** M.

## Task T03: Documentación base (ADR, CONTRIBUTING, ASSETS, DoD)

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Crear la documentación de proceso: plantilla y primer ADR (ADR-0001 con las
decisiones P-1…P-12 del plan), `CONTRIBUTING.md`, `ASSETS.md` (con la regla de licencias y el
registro de Manrope, Inter y Lucide) y una Definición de Terminado (DoD) por tarea alineada
con `AGENTS.md` §8.

**Criterios de aceptación:**

- [x] `docs/decisions/ADR-0001-stack-y-convenciones.md` registra las decisiones P-1…P-12.
- [x] `CONTRIBUTING.md` explica ramas, commits y cómo correr las pruebas (español).
- [x] `ASSETS.md` declara que todo recurso de terceros registra su licencia (OFL/ISC…).
- [x] La DoD exige: criterios cumplidos, lint, tipos y pruebas en verde.

**Verificación:**

- [x] Manual: los cuatro documentos existen y son coherentes con `docs/SPEC.md` y `AGENTS.md`.

**Dependencias:** T01.
**Archivos probables:** `docs/decisions/ADR-0001-stack-y-convenciones.md`,
`CONTRIBUTING.md`, `ASSETS.md`, `docs/definition-of-done.md`.
**Tamaño:** S.

## Task T04: Inventario y organización de `design/`

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Ejecutar la reorganización de la Fase 0 (SPEC §11.2): mover las 7 carpetas de
pantalla a `design/stitch/`, `DESIGN.md` y `DESIGN_RULES.md` a la raíz, los `DESIGN.md` de
temas a `design/themes/`, y eliminar/archivar los documentos contradictorios. Confirmar la
ubicación de `MEMORY.md` y `AGENTS.md`.

**Criterios de aceptación:**

- [x] `design/stitch/<pantalla>/` contiene las 7 pantallas con `screen.png` y `code.html`.
- [x] `design/themes/` agrupa `dragon_night`, `ember_hearth`, `arcane_vault`, `moonlit_frost`.
- [x] `DESIGN.md` y `DESIGN_RULES.md` quedan en la raíz (según SPEC §5.1/§11.2).
- [x] Se verifica que los documentos eliminados (PRD, especificación visual) ya no están.

**Verificación:**

- [x] Manual: recorrer `design/` y comparar con la tabla de SPEC §11.2.

**Dependencias:** T01.
**Archivos probables:** `design/**` (movimientos), `AGENTS.md`, `docs/MEMORY.md`.
**Tamaño:** S. ⚠ Toca solo documentación/estructura, no código.

## Task T05: Calibración de dispositivos y presupuesto de memoria

**Estado:** 🟡 casi listo 2026-10-15 — **smokes 3/3 OK en los 2 teléfonos** (Galaxy S25 Ultra con captura en `docs/capturasT05/Samsung_s25Ultra.jpeg`; POCO F5 Pro en mano). **Versiones fijadas en `ADR-0002` (2026-10-15)**. **Android TV (MiBox 4) queda de lado de momento** (P-43, alcance **solo evidencia**: sigue siendo el equipo mínimo). Se añadió el **panel del tope de imágenes** en `apps/mobile` (`src/ImageCapPanel.tsx`, con tests rojo→verde) para medirlo en un teléfono (P-45). Quedan: que el humano **mida ese tope** y revalidar RNF-1 en release (las mediciones actuales son de desarrollo).

**Descripción.** Aplicación Expo mínima de prueba (shell vacío) que arranque en POCO F5 Pro,
Galaxy S25 Ultra y MiBox 4; medir arranque en frío y presupuesto de memoria; confirmar que el
SDK elegido admite Android 9 (API 28). Smokes de compatibilidad para `@noble/hashes`, `fflate`
y `htmlparser2` en RN. Salida: un ADR con números. **Se mantiene en la Parte 1** (decisión del humano).

**Criterios de aceptación:**

- [x] La app de prueba arranca en los 3 dispositivos. _(la MiBox quedó pospuesta: P-43)_
- [ ] `docs/decisions/ADR-0002-versiones-y-presupuesto.md` fija versiones de Expo/RN/RNTV y el
      tope de imágenes en memoria (medido en un teléfono, **P-45**, provisional hasta la MiBox).
- [x] Se responde la pregunta abierta del SPEC §17.2 sobre Android 9 (mínimo API 28, confirmado en dispositivo).
- [x] Los tres paquetes JS puros corren en RN sin errores (3/3 OK en Galaxy S25 Ultra y POCO F5 Pro; MiBox pendiente por P-43).

**Verificación:**

- [x] `pnpm --filter @ryuunest/mobile exec expo export --platform android` compila el bundle (614 módulos, sin errores; incluye `pagina-calibracion.png`).
- [x] `pnpm --filter @ryuunest/mobile test` — 11 tests (presupuesto de imágenes y builder del PNG), rojo→verde.
- [x] Manual: arranque cronometrado y lectura de memoria en los 3 dispositivos (números en `ADR-0002`; medidos **en desarrollo**, revalidar RNF-1 en release).
- [x] `pnpm --filter @ryuunest/mobile start` en los 2 teléfonos (MiBox pendiente: P-43).
- [X] Manual: **medir el tope de imágenes** en un teléfono con el panel de `ImageCapPanel.tsx` y anotarlo en `ADR-0002`.
- [X] Fijar en `ADR-0002` las versiones de Expo/RN/RNTV (hoy candidatas).

**Dependencias:** Ninguna (transversal a T01–T02).
**Archivos probables:** `apps/mobile/{package.json,app.json,App.tsx}`,
`docs/decisions/ADR-0002-versiones-y-presupuesto.md`.
**Tamaño:** M.

### 🚩 Checkpoint A (tras T01–T05)

- [X] `pnpm install && pnpm -r typecheck && pnpm -r test && pnpm -r build` en verde
- [X] CI activo y en verde
- [X] `design/` organizado según SPEC §11.2
- [X] Presupuesto de memoria documentado
- [X] Revisión humana

---

## Fase 1 — Contrato y arnés

## Task T06: Tipos del contrato + ModuleError

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Implementar en `packages/core` los tipos públicos del contrato (SPEC §6):
`MediaKind` (**incluye `manhwa`**, D-13), `Page<T>`, `ImageRef`, `SeriesSummary`, `Release`,
`Chapter`, `SeriesDetails`, `ChapterPages`, `ModuleManifest`, `ModuleApi`, `Host` y
`ModuleError` con `ModuleErrorCode`. Ayudas para construir errores tipados.

**Criterios de aceptación:**

- [x] Todos los tipos del SPEC §6.1–6.5 existen y compilan en estricto.
- [x] `MediaKind` admite `"manga" | "manhua" | "manhwa" | "comic"`.
- [x] `ModuleError` expone `code` y `details`; se puede instanciar por cada código.
- [x] No hay tipos `any` sin justificación documentada.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test`
- [x] Manual: assert de compilación sobre cada interfaz clave (`contract.types.test-d.ts` vía `tsconfig.test.json`).

**Dependencias:** T01.
**Archivos probables:** `packages/core/src/contract/types.ts`,
`packages/core/src/contract/errors.ts`, `packages/core/src/index.ts`,
`packages/core/src/contract/__tests__/types.test.ts`.
**Tamaño:** M.

## Task T07: Puertos + adaptadores falsos

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Definir las interfaces de los puertos `Storage`, `Http`, `Archive`, `Clock` y
`SecureLock` (SPEC §5.3), e implementar adaptadores falsos para pruebas (`MemoryStorage`
mínimo, `StubHttp`, `FakeArchive`, `FixedClock`, `NoopSecureLock`).

**Criterios de aceptación:**

- [x] Cada puerto es una interfaz pura, sin dependencias de plataforma.
- [x] Existen adaptadores falsos usables en tests del core.
- [x] `SecureLock` es opcional (puede no estar disponible).

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test`
- [x] Manual: un test que inyecta los falsos y ejecuta una operación trivial.

**Dependencias:** T06.
**Archivos probables:** `packages/core/src/ports/*.ts`,
`packages/core/src/ports/__tests__/ports.test.ts`, `packages/core/src/index.ts`.
**Tamaño:** M.

## Task T08: ModuleHost (permisos, tiempo límite, concurrencia, rate-limit)

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** Implementar `ModuleHost` (SPEC §6.5): `fetch` con permisos por dominio, tiempo
límite por petición, máximo de peticiones simultáneas por módulo, pausa mínima al mismo
dominio; `html()` con selectores CSS (P-5); `log()`; `settings`. Se apoya en `Http`/`Clock`.

**Criterios de aceptación:**

- [x] Una URL fuera de `permissions.domains` se rechaza con `ModuleError`.
- [x] Una petición que excede el tiempo límite produce `TIMEOUT`.
- [x] El número de peticiones simultáneas y la pausa entre peticiones se respetan.
- [x] `host.html()` permite `select`/`find`/`attr`/`text` sobre HTML de ejemplo.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test`
- [x] Manual: test con un `Http` que nunca responde (tiempo límite) y otro que cuenta concurrencia.

**Dependencias:** T07.
**Archivos probables:** `packages/core/src/host/ModuleHost.ts`,
`packages/core/src/host/html.ts`, `packages/core/src/host/__tests__/host.test.ts`.
**Tamaño:** M.

## Task T09: Validadores de manifest e índice de repo (SDK)

**Estado:** ✅ hecho 2026-10-13.

**Descripción.** En `packages/module-sdk`, validar el manifest (SPEC §6.1) y el `index.json`
(SPEC §6.7): campos obligatorios, `id` `[a-z0-9-]`, `apiVersion === 1`, `runtime`, `kinds`
(incluido `manhwa`), `permissions.domains`, `sha256`, etc. Devuelve errores descriptivos.

**Criterios de aceptación:**

- [x] Un manifest válido pasa; cada campo inválido produce un error con ruta y motivo.
- [x] Un `index.json` con formato/versión incorrectos se rechaza.
- [x] Se valida `apiVersion` y `minAppVersion` contra la app (`options.appVersion`).

**Verificación:**

- [x] `pnpm --filter @ryuunest/module-sdk test`
- [x] Manual: fixtures de manifests válidos e inválidos (en `tests/manifest.test.ts` y `tests/repoIndex.test.ts`).

**Dependencias:** T06, T01.
**Archivos probables:** `packages/module-sdk/src/manifest.ts`,
`packages/module-sdk/src/repoIndex.ts`, `packages/module-sdk/src/__tests__/*.test.ts`.
**Tamaño:** M.

## Task T10: Paquete `test-site` + arnés de contrato

**Estado:** ✅ hecho 2026-10-14.

**Descripción.** Crear **`packages/test-site`** (P-9, respuesta del humano): paquete reutilizable
con sitios falsos y fixtures que cubran `popular`, `latest`, `search` (paginación), `details`
(capítulos con varias `releases`) y `pages`. Incluye un **arnés reutilizable** que ejecute
cualquier `ModuleApi` contra las fixtures. Debe incluir ya la **segunda arquitectura** (JSON/
cursor) para T32.

**Criterios de aceptación:**

- [x] El paquete exporta fixtures y un servidor/`StubHttp` de prueba reutilizable (`TestSiteHttp`).
- [x] Cubre los 5 métodos del contrato, con al menos 2 `releases` en un capítulo.
- [x] Incluye dos arquitecturas: (a) HTML + paginación numérica; (b) JSON + paginación por cursor.
- [x] El arnés falla con mensaje claro si un módulo no implementa un método requerido.

**Verificación:**

- [x] `pnpm --filter @ryuunest/test-site test && pnpm --filter @ryuunest/core test`
- [x] Manual: el arnés se ejecutó contra un módulo de ejemplo (simulado en `tests/harness.test.ts`; el runtime real llega en T16/T18).

**Dependencias:** T06, T08.
**Archivos probables:** `packages/test-site/src/*`, `packages/test-site/fixtures/**`,
`packages/core/tests/contract/runContract.ts`.
**Tamaño:** M.

## Task T11: CLI del SDK + plantilla de módulo

**Estado:** ✅ hecho 2026-10-14 (rehecha con TDD estricto, P-41).

**Descripción.** CLI de `module-sdk` (SPEC §13): crear un módulo desde plantilla (`create`),
validarlo (`validate`), probarlo contra `test-site` (`test`) y empaquetarlo con su hash
SHA-256 (`pack`). Incluye plantilla declarativa y de script.

**Criterios de aceptación:**

- [x] `pack` genera un `.zip` y calcula su `sha256` y `size`.
- [x] `validate` usa T09 y devuelve código de salida distinto de cero si es inválido.
- [x] `test` ejecuta el arnés de T10 contra una plantilla (la de script; la declarativa se omite hasta T16).
- [x] La plantilla script usa solo `host.*` (sin acceso a red propio).

**Verificación:**

- [x] `pnpm --filter @ryuunest/module-sdk test` (26 tests nuevos; suite escrita antes que la implementación)
- [x] Manual: `node dist/cli.js create demo --template script && validate demo && test demo && pack demo` (contrato OK y hash verificable); con la plantilla declarativa, `validate` OK y `test` avisa de que el runtime llega en T16.

**Dependencias:** T09, T10.
**Archivos probables:** `packages/module-sdk/src/cli.ts`,
`packages/module-sdk/templates/{declarative,script}/*`,
`packages/module-sdk/src/__tests__/cli.test.ts`.
**Tamaño:** M.

### 🚩 Checkpoint B (tras T06–T11)

- [x] `pnpm -r test && pnpm -r build` en verde
- [x] Un módulo de ejemplo se valida y se prueba contra `test-site`
- [X] Revisión humana

---

## Fase 2 — Corte vertical 1: instalar un módulo desde un repo

## Task T12: Repositorios + index.json

**Estado:** ✅ hecho 2026-10-15.

**Descripción.** Dominio de repositorios (SPEC §3.1): añadir un repo por URL HTTPS, descargar
`index.json` vía `Http`, validarlo (T09), persistirlo en `Storage` y listar sus módulos con
metadatos (nombre, tipo, idioma, NSFW, runtime, permisos). Eliminar un repo no desinstala sus
módulos (RF-8) pero marca que no recibirán actualizaciones.

**Criterios de aceptación:**

- [x] Añadir un repo válido lo persiste y sus módulos quedan listables.
- [x] Una URL no-HTTPS o un `index.json` inválido se rechazan con mensaje claro.
- [x] Eliminar un repo conserva sus módulos y marca el aviso de "sin actualizaciones".

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (12 tests nuevos, rojo→verde)
- [x] Manual: repos con `StubHttp` sirviendo un `index.json` de fixture.
- [x] Integración en `module-sdk` (`tests/repoRegistry.test.ts`): el validador real de T09
      inyectado en `RepoRegistry` acepta el índice válido y rechaza el inválido con su motivo.

**Notas:** el validador entra **inyectado** (`RepoIndexValidator`, decisión P-46): el núcleo no
puede importar `module-sdk` (P-37). La **forma** del índice y el resultado de validación se
movieron al núcleo (`contract/repoIndex.ts`, `validation.ts`) y el SDK los reexporta.

**Dependencias:** T07, T09.
**Archivos probables:** `packages/core/src/repo/RepoRegistry.ts`,
`packages/core/src/repo/__tests__/repo.test.ts`, `packages/core/src/ports/storage.ts`.
**Tamaño:** M.

## Task T13: PackageInstaller (descarga, límites, SHA-256, unzip seguro, atomicidad)

**Estado:** ✅ hecho 2026-10-15.

**Descripción.** Implementar el flujo de instalación (SPEC §7.1): descargar el `.zip` con
límite de tamaño, verificar SHA-256 contra el índice, descomprimir de forma segura (sin
zip-slip, límites de tamaño total y de número de archivos), validar el manifest y guardar de
forma **atómica** (si algo falla, no queda nada a medias).

**Criterios de aceptación:**

- [x] Hash incorrecto → rechazo con mensaje claro y sin dejar restos.
- [x] Rutas `../` en el zip → rechazo (zip-slip).
- [x] Se respetan los límites del SPEC §7.1: paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos.
- [x] En fallo, el registro y el disco quedan igual que antes de iniciar.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (18 tests del instalador + 5 de bytes, rojo→verde)
- [x] Manual: fixtures de zip correctos, con hash malo, con zip-slip y bomba de compresión.
- [x] Integración en `module-sdk` (`tests/packageInstaller.test.ts`): el validador real de
      manifest (T09) inyectado en `PackageInstaller` acepta el válido y rechaza el inválido.

**Notas:** el validador de manifest entra **inyectado** (`ManifestValidator`, P-46). El hash
es **real** (`@noble/hashes` en `core`, decisión P-47). El puerto `Http` gana `bytes()` porque
los `.zip` son binarios. La atomicidad se logra comprobando **todo antes** de la única
escritura (`module:<id>`); los archivos se guardan en hexadecimal porque el `Storage`
provisional es de texto (se cierra en T21).

**Dependencias:** T12, T07.
**Archivos probables:** `packages/core/src/install/PackageInstaller.ts`,
`packages/core/src/install/verify.ts`, `packages/core/src/install/__tests__/installer.test.ts`.
**Tamaño:** M.

## Task T14: ModuleRegistry (ciclo de vida)

**Estado:** ✅ hecho 2026-10-15.

**Descripción.** Registro de módulos instalados (SPEC §3.1): activar, desactivar, desinstalar y
actualizar; guardar el último error; en la actualización, volver a pedir confirmación si se
amplían permisos o cambia de declarativo a script.

**Criterios de aceptación:**

- [x] Activar/desactivar cambia el estado sin reinstalar.
- [x] Desinstalar elimina archivos y registro de forma consistente.
- [x] Una actualización que amplía permisos o cambia de runtime exige nueva confirmación.
- [x] `last_error` se guarda y se puede consultar por módulo.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (16 tests, rojo→verde)
- [x] Manual: secuencia instalar→desactivar→actualizar→desinstalar.

**Notas:** el registro trabaja sobre la misma fila `module:<id>` que dejó T13; se le añaden
`enabled` y `lastError` (SPEC §8.1). `update` devuelve `needs-confirmation` con los motivos y
**no** aplica nada hasta repetirse con `{ confirmed: true }`; con confirmación conserva el
estado de activación y limpia el último error. La reducción de permisos y el paso de script a
declarativo no piden confirmación (el SPEC solo menciona la ampliación y declarativo→script).

**Dependencias:** T13.
**Archivos probables:** `packages/core/src/modules/ModuleRegistry.ts`,
`packages/core/src/modules/__tests__/registry.test.ts`.
**Tamaño:** M.

## Task T15: E2E de instalación desde fixture (AC-2, AC-8)

**Estado:** ✅ hecho 2026-10-15.

**Descripción.** Prueba de extremo a extremo: partir de un repo fixture (index.json + zip),
añadir el repo, previsualizar el módulo, confirmar, verificar hash, descomprimir, validar
manifest y activar. Cubre la confirmación manual y el rechazo por hash incorrecto.

**Criterios de aceptación:**

- [x] Flujo completo repo→módulo activo en una sola prueba.
- [x] Hash incorrecto o manifest inválido se rechaza con mensaje claro (**AC-2**).
- [x] Ninguna vía instala sin confirmación manual (**AC-8**).

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test -- install.e2e` (7 tests, rojo→verde)
- [x] Manual: la prueba falla si se salta la confirmación (las pruebas 2 y 3 la exigen).

**Notas:** T15 añade `install/InstallFlow.ts`, el **único punto de entrada** del núcleo para
instalar: `preview()` da los datos de la pantalla de confirmación y `install()` exige
`{ confirmed: true }` (y `reinforced` en módulos script, SPEC §7.1 paso 3). Sin confirmación no
toca la red ni el almacén (AC-8). Además rechaza pisar un módulo ya instalado, para que no se
pueda esquivar la confirmación de actualización de RF-6. El validador de manifest entra
inyectado; sus mensajes reales se prueban en `module-sdk`.

**Dependencias:** T14.
**Archivos probables:** `packages/core/tests/e2e/install.e2e.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint C (tras T12–T15)

- [X] Paquete con hash incorrecto rechazado con mensaje claro
- [X] Nada se instala sin confirmación
- [X] Revisión humana

---

## Fase 3 — Corte vertical 2: módulo declarativo

## Task T16: DeclarativeRuntime + transformaciones

**Estado:** ✅ hecho 2026-10-16.

**Descripción.** Runtime que ejecuta un módulo declarativo (SPEC §6.6): construir URLs con
plantillas (`{baseUrl}`, `{query}`, `{page}`), listar con selectores, extraer campos con
`attr`/`text`/`regex` y aplicar transformaciones (`trim`, `path`, `absoluteUrl`, `regex`,
`number`, `join`, `replace`). Implementa `ModuleApi` sobre `ModuleHost`.

**Criterios de aceptación:**

- [x] `search`, `popular`, `latest` → `Page<SeriesSummary>` desde fixtures.
- [x] `details` y `pages` producen los tipos del contrato.
- [x] Cada transformación tiene prueba unitaria; `absoluteUrl` y `path` manejan URLs relativas.
- [x] `hasNext` se calcula según la configuración.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (34 tests nuevos, rojo→verde)
- [x] Manual: módulo declarativo de ejemplo contra `test-site` (arquitectura HTML).

**Notas:** el formato declarativo se **cierra** en esta fase. Decisión **P-50**: `path` devuelve
el **último segmento** de la ruta (`/serie/dragon-de-ceniza` → `dragon-de-ceniza`), que es el `id`
estable de la serie; coincide con la plantilla script ya revisada. `regex` (campo) se aplica al
valor extraído de `attr` o del texto. Un campo obligatorio que no se puede extraer (o un
`index.json` sin capítulos/imágenes) produce `ModuleError` `PARSE` con `details.selector`.

**Dependencias:** T06, T08.
**Archivos probables:** `packages/core/src/runtimes/DeclarativeRuntime.ts`,
`packages/core/src/runtimes/transforms.ts`,
`packages/core/src/runtimes/__tests__/declarative.test.ts`.
**Tamaño:** M.

## Task T17: E2E declarativo contra el sitio falso

**Estado:** ✅ hecho 2026-10-16.

**Descripción.** Ejecutar el arnés de contrato (T10) contra un módulo declarativo completo que
apunta a las fixtures HTML, cubriendo los 5 métodos y comprobando `releases` múltiples.

**Criterios de aceptación:**

- [x] El arnés pasa para el módulo declarativo de ejemplo.
- [x] Un selector roto produce `ModuleError` con `code` y `details.selector`.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test -- declarative.contract` (4 tests, rojo→verde)
- [x] Manual: romper un selector en la fixture y ver el error tipado (pruebas 2 y 3).

**Notas:** el módulo de ejemplo se publica como **constante TypeScript**
(`packages/test-site/src/exampleDeclarative.ts`, `EXAMPLE_DECLARATIVE`) en vez de
`fixtures/modules/example-declarative.json`: el núcleo no tiene tipos de Node y así lo consume
sin leer ficheros. `test-site` entra en las pruebas del núcleo por **alias a fuentes**
(`packages/core/vitest.config.ts` + `paths` de `tsconfig.test.json`), **no** como dependencia
declarada: `test-site` depende del núcleo y declararla rompería el build con
`ERR_PNPM_TASK_CYCLE`.

**Dependencias:** T16, T10.
**Archivos probables:** `packages/core/tests/contract/declarative.contract.test.ts`,
`packages/test-site/fixtures/modules/example-declarative.json`.
**Tamaño:** S.

### 🚩 Checkpoint D (tras T16–T17)

- [X] `popular`, `latest`, `search`, `details`, `pages` responden desde fixtures
- [X] Revisión humana

---

## Fase 4 — Corte vertical 3: módulo script

## Task T18: ScriptRuntime + frontera de sandbox/host

**Estado:** ✅ hecho 2026-10-16.

**Descripción.** Runtime que carga un módulo script (SPEC §6.5): el módulo exporta
`create(host)` y devuelve un `ModuleApi`. El módulo solo dispone de `host.*`. Documenta la
limitación conocida (D-5: sin aislamiento real en la v1).

**Criterios de aceptación:**

- [x] Un módulo script de ejemplo se carga y devuelve un `ModuleApi` válido.
- [x] El módulo no puede llamar red fuera de `host.fetch` (documentado y verificado).
- [x] Los errores del módulo se convierten en `ModuleError` con código.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (11 tests nuevos, rojo→verde)
- [x] Manual: módulo que llama a `host.fetch` a un dominio no permitido → `ModuleError` `UNSUPPORTED` (prueba cubierta).

**Notas:** la carga del código fuente entra por el **puerto `ScriptLoader`** (contrato en el
núcleo, implementación de plataforma en el cliente) con su doble `FakeScriptLoader`. El runtime
valida el contrato (`search`/`details`/`pages`) y envuelve cada método para que cualquier fallo
sea `ModuleError` (`INTERNAL` por defecto; conserva el código si el módulo lanza un `ModuleError`).
Se documenta **D-5**: sin aislamiento real; la única frontera es el `Host`.

**Dependencias:** T08.
**Archivos probables:** `packages/core/src/runtimes/ScriptRuntime.ts`,
`packages/core/src/runtimes/__tests__/script.test.ts`.
**Tamaño:** M.

## Task T19: E2E script contra el sitio falso

**Estado:** ✅ hecho 2026-10-16.

**Descripción.** Ejecutar el arnés de contrato (T10) contra un módulo script de ejemplo que usa
`host.html()` y `host.fetch` sobre las fixtures (incluida la arquitectura JSON de `test-site`).

**Criterios de aceptación:**

- [x] El arnés pasa para el módulo script de ejemplo (mismo contrato que el declarativo).
- [x] `images` en `pages()` incluye `headers` (`Referer`, `User-Agent`) cuando el módulo los define.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test -- script.contract` (4 tests nuevos, rojo→verde)
- [x] Manual: el informe del arnés del módulo script **es idéntico** al del declarativo
      (`expect(scriptReport).toEqual(declarativeReport)`, dentro de la prueba).

**Notas:** el módulo de ejemplo es una **fábrica TypeScript** en `test-site`
(`src/exampleScript.ts`: `createExampleScript`, `EXAMPLE_SCRIPT_HTML` y `EXAMPLE_SCRIPT_JSON`), no
un `.js` en `fixtures/` (P-52, mismo motivo que P-51). Cubre las **dos arquitecturas**: la HTML con
`host.fetch()` + `host.html()` y selectores CSS, y la JSON con `JSON.parse` y paginación por
cursor. Las cabeceras de las imágenes (RF-24) las declara el propio módulo en su configuración: si
no las define, las imágenes van sin `headers`. La carga del código entra por el puerto
`ScriptLoader` (T18) con su doble, porque el núcleo no toca APIs de plataforma.

**Dependencias:** T18, T10.
**Archivos probables:** `packages/core/tests/contract/script.contract.test.ts`,
`packages/test-site/fixtures/modules/example-script.js`.
**Tamaño:** S.

## Task T20: Carga/selección de ModuleRuntime + mapeo de errores

**Estado:** ✅ hecho 2026-10-16.

**Descripción.** Punto único que, a partir de un módulo instalado, elige el runtime adecuado
(declarativo o script) y devuelve un `ModuleApi`. Centraliza el mapeo de errores (red,
timeout, bloqueo, parseo) a `ModuleErrorCode` y garantiza que un módulo roto no tumba la app
(SPEC RNF-8).

**Criterios de aceptación:**

- [x] `createModuleApi(manifest, entry)` devuelve la implementación correcta.
- [x] Cada fallo se mapea a un `ModuleErrorCode` del SPEC §6.4.
- [x] Un módulo que lanza excepciones no propaga fallos no controlados; expone `last_error`.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (**143** en `core`; 16 nuevos entre los dos cortes)
- [x] Manual: módulo que lanza en `details()` → `ModuleError` contenido (prueba cubierta: el
      fallo se devuelve tipado y `lastError()` lo expone).

**Notas:** `ModuleRuntime` es la **costura** del SPEC §5.4/D-5: la interfaz común que
implementan (estructuralmente) `DeclarativeRuntime` y `ScriptRuntime` (`createApi()`), sin
imports circulares. `createModuleApi(options)` monta la API desde `manifest` + `entry` (el
`index.json` del declarativo o el código fuente del script) y devuelve `{ api, lastError() }`:
la API envuelve cada método para que **ningún fallo salga sin tipar** y deja el último listo
para `ModuleRegistry.setLastError` (SPEC §8.1, RF-5). El mapeo a `ModuleErrorCode` se centraliza
en `src/runtimes/errorMapping.ts` (`toModuleError`, `moduleErrorFromStatus`) y lo usan los dos
runtimes (se retiró la tabla privada que tenía el declarativo). El test vive en
`packages/core/tests/runtimes/runtimeSelection.test.ts` (convención del repo), no en un
`__tests__/` propio.

**Dependencias:** T16, T18.
**Archivos probables:** `packages/core/src/runtimes/ModuleRuntime.ts`,
`packages/core/src/runtimes/__tests__/runtimeSelection.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint E (tras T18–T20)

- [x] Módulo script y declarativo pasan el mismo contrato (T17 y T19: el informe del arnés es
      idéntico en los dos)
- [x] Errores mapeados a `ModuleErrorCode` (T20: mapeo central en `errorMapping.ts`)
- [x] Revisión humana (PRs #6 y #8 fusionados por el humano el 2026-10-17)

---

## Fase 5 — Corte vertical 4: biblioteca local

## Task T21: Storage SQL + esquema/migraciones + adaptador en memoria

**Estado:** ✅ hecho 2026-10-18.

**Descripción.** Implementar el puerto `Storage` sobre un `SqlDriver` fino (SPEC §8.1): esquema
completo (`repo`, `module`, `series`, `folder`, `favorite`, `progress`, `chapter_read`,
`series_pref`, `setting`), índices y migraciones versionadas. Incluye `MemoryStorage` y
`SqliteStorage` probado en Node.

**Criterios de aceptación:**

- [x] El esquema coincide con el SPEC §8.1 (incluidos `title_norm`, `page_total` e índices).
- [x] Las migraciones son idempotentes y versionadas.
- [x] `MemoryStorage` y `SqliteStorage` pasan la misma suite de conformidad.
- [x] `PRAGMA foreign_keys` activo; `favorite.folder_id` usa `ON DELETE SET NULL`.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (21 tests nuevos: 11 de esquema + 10 × 2 de conformidad)
- [x] Manual: aplicar migraciones dos veces sin error (prueba automática en `schema.test.ts`;
      `PRAGMA user_version` queda en 1 y el inventario de objetos no cambia).

**Notas:** decisión del humano (P-55): `MemoryStorage` cubre solo el puerto clave-valor; el
dominio relacional (T22–T24) habla SQL por `SqlDriver` y se prueba con SQLite real
(`node:sqlite` en Node 24, tipos vía `@types/node` en `core`, patrón de P-42). El esquema
añade una tabla `kv` (casa del puerto clave-valor que usan instalador y registros; §8.1 no la
define: está anotado y se retirará cuando esas filas migren a `repo`/`module`). Las
migraciones se versionan con `PRAGMA user_version` dentro de su transacción (verificado: el
rollback revierte también la versión). `MemoryStorage` se promueve de `ports/fakes.ts` a
`src/storage/MemoryStorage.ts` y el doble queda reexpuesto.

**Dependencias:** T03, T07.
**Archivos probables:** `packages/core/src/storage/schema.ts`,
`packages/core/src/storage/SqlDriver.ts`,
`packages/core/src/storage/{MemoryStorage,SqliteStorage}.ts`,
`packages/core/src/storage/__tests__/conformance.test.ts`.
**Tamaño:** M.

## Task T22: Series + favoritos + carpetas (D-12)

**Estado:** ✅ hecho 2026-10-18.

**Descripción.** Dominio de biblioteca: registrar/actualizar series (con `title_norm`),
añadir/quitar favoritos (quitar un favorito no borra su progreso, RF-30) y CRUD de carpetas
(crear, renombrar, reordenar, borrar). Un favorito pertenece a **una** carpeta o a ninguna (D-12).

**Criterios de aceptación:**

- [x] Alta/actualización de serie con normalización de título (minúsculas, sin acentos).
- [x] Un favorito se asigna a una carpeta o a ninguna; moverlo reemplaza la anterior.
- [x] Borrar carpeta deja sus favoritos sin carpeta (`ON DELETE SET NULL`).
- [x] Quitar un favorito conserva la fila de `progress`.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (16 tests en `tests/library/library.test.ts`)
- [x] Manual: secuencia crear carpeta→favoritear→mover→borrar carpeta (cubierta como prueba
      automática en `library.test.ts`; SQLite real aplica el `SET NULL`).

**Notas:** tres módulos (`SeriesStore`, `Folders`, `Favorites`) que reciben `{ driver, clock }`
—el `updated_at` sale del puerto `Clock` inyectable (SPEC §5.3), nunca de `Date.now()`—.
`normalizeTitle` usa NFD + quitar diacríticos + minúsculas + espacios comprimidos. `add` de un
favorito existente conserva `added_at` (reasignar no es «rearañadir»). El reorden de carpetas
va en una transacción (`withTransaction`, P-55). Tipos de fila con `| null` (calco del NULL de
SQLite) para no pelear con `exactOptionalPropertyTypes`.

**Dependencias:** T21.
**Archivos probables:** `packages/core/src/library/SeriesStore.ts`,
`packages/core/src/library/Favorites.ts`, `packages/core/src/library/Folders.ts`,
`packages/core/src/library/__tests__/library.test.ts`.
**Tamaño:** M.

## Task T23: Filtros/orden/búsqueda + carga 3000 series (AC-4)

**Estado:** ✅ hecho 2026-10-18.

**Descripción.** Consultas de biblioteca (SPEC §3.5, §8.2): búsqueda por nombre (`title_norm`
con `LIKE`), filtros por tipo (manga, manhua, manhwa, cómic), fuente, carpeta y NSFW/SFW, y
orden por nombre, último leído y fecha de adición. Chips Todo · Leyendo · Carpetas (sin
«Completado», que es v2). Paginación por cursor y prueba de carga con 3000 series.

**Criterios de aceptación:**

- [x] Todos los filtros y órdenes del SPEC funcionan y se combinan.
- [x] Con 3000 series sintéticas, filtrar/buscar responde < 300 ms en el entorno de CI.
- [x] Con el filtro NSFW apagado, las series NSFW no aparecen (**RF-35**, núcleo).
- [x] No se calculan contadores de no leídos ni totales de capítulos (RF-42 es v2).
- [x] Los resultados usan índices (se verifica con `EXPLAIN QUERY PLAN`).

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test -- library.perf` (10 pruebas: las 6 consultas por
      debajo de 300 ms con 3000 series; medidas dos veces, se toma la segunda)
- [x] Manual: revisar el plan de consulta de la búsqueda por título — hecho y anotado abajo:
      `SCAN s USING INDEX idx_series_title` + `SEARCH f USING INDEX sqlite_autoindex_favorite_1`
      + `SEARCH p USING INDEX ... LEFT-JOIN`; el `TEMP B-TREE` solo para los dos términos de
      desempate del `ORDER BY`. La carpeta filtra por `idx_favorite_folder` (probado).

**Notas:** cursor **keyset** (P-56): JSON opaco con `{order, key}` de las tres expresiones del
orden; SQLite compara valores de fila `(a,b,c) > (?,?,?)`, así insertar/borrar entre páginas no
repite ni salta filas. Un cursor de otro orden o ilegible → `ModuleError` `PARSE`. Las listas
de `kinds`/`moduleIds` se expanden con marcadores de posición (nunca interpolación de texto).
`lastRead` ordena por `COALESCE(p.updated_at, f.added_at)` DESC (las no leídas caen detrás por
su fecha de adición). El `limit` lo pone siempre la pantalla: el núcleo no inventa números. El
chip **«Leyendo»** NO se implementa: el SPEC no define qué cuenta como «leyendo» → pregunta 17
abierta para el humano (la UI F14 queda bloqueada por ahí si quiere filtro, no solo chip).

**Dependencias:** T22.
**Archivos probables:** `packages/core/src/library/queries.ts`,
`packages/core/src/library/__tests__/queries.test.ts`,
`packages/core/tests/perf/library3000.test.ts`.
**Tamaño:** M.

## Task T24: Preferencias por serie (modo de lectura, release preferida)

**Estado:** ✅ hecho 2026-10-18.

**Descripción.** Tabla y dominio `series_pref` (SPEC §8.1): modo de lectura por serie
(vertical/paginado y dirección) y release/grupo preferido por serie (RF-16, RF-18).

**Criterios de aceptación:**

- [x] Guardar/leer modo de lectura y release preferida por `(module_id, series_id)`.
- [x] El modo predeterminado según tipo se aplica cuando no hay preferencia (manhua y manhwa
      vertical, manga D→I, cómic I→D).
- [x] Actualizar una preferencia actualiza `updated_at`.

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (11 tests en `tests/library/prefs.test.ts`)
- [x] Manual: comprobar el valor por defecto por cada tipo — la tabla `esperado` del primer
      test fija los cuatro tipos (manga `paged-rtl`, manhua/manhwa `vertical`, cómic
      `paged-ltr`) contra RF-18.

**Notas:** la columna única `reader_mode` del SPEC codifica modo y dirección en un valor:
`"vertical" | "paged-ltr" | "paged-rtl"` (P-56). `modeFor` devuelve el guardado, si no el del
tipo, y `null` si no hay preferencia **ni** tipo conocido — lo resuelve el ajuste global de
lector (F20); el núcleo no inventa un quinto modo. Un `reader_mode` ilegible en la base lanza
`ModuleError` `PARSE`. Cambiar el modo no borra la release y al revés (dos `ON CONFLICT`
parciales).

**Dependencias:** T22.
**Archivos probables:** `packages/core/src/library/SeriesPrefs.ts`,
`packages/core/src/library/__tests__/prefs.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint F (tras T21–T24)

- [x] Filtro/búsqueda < 300 ms con 3000 series (entorno Node) — `tests/perf/library.perf.test.ts`
- [x] Un favorito pertenece a una carpeta o a ninguna — `library.test.ts` (D-12)
- [ ] Revisión humana

---

## Fase 6 — Corte vertical 5: progreso y lecturas

## Task T25: Progreso atómico y reanudación

**Descripción.** Dominio de progreso (SPEC §3.6, RF-20, RF-31): un registro por serie con
capítulo, `release` y `page_index`, **más `page_total`** (RF-20/RF-41: lo usan el porcentaje
del capítulo en curso y la barra de progreso). Escritura atómica; al reabrir se devuelve la
página exacta. El debounce y "al salir" son de la UI (Parte 2); el núcleo expone
`saveProgress` y `getProgress`.

**Criterios de aceptación:**

- [ ] Guardar y leer `(chapter_id, release_id, page_index, page_total)` por serie.
- [ ] Cerrar y reabrir (simulado) devuelve la misma página.
- [ ] `updated_at` se actualiza en cada escritura.
- [ ] Escrituras concurrentes de la misma serie no corrompen el registro.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: test de escrituras concurrentes.

**Dependencias:** T21.
**Archivos probables:** `packages/core/src/progress/ProgressStore.ts`,
`packages/core/src/progress/__tests__/progress.test.ts`.
**Tamaño:** S.

## Task T26: `chapter_read` (marcar capítulos leídos)

**Descripción.** Tabla y dominio `chapter_read` (RF-32): marcar un capítulo como leído
manualmente o al terminar el capítulo; consultar el estado por serie. (No calcula contadores;
el contador de no leídos es v2, RF-42.)

**Criterios de aceptación:**

- [ ] Marcar/desmarcar un capítulo por `(module_id, series_id, chapter_id)`.
- [ ] Al terminar el capítulo se marca automáticamente.
- [ ] La consulta devuelve el conjunto de capítulos leídos de una serie.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: marcar, desmarcar y volver a marcar.

**Dependencias:** T21.
**Archivos probables:** `packages/core/src/progress/ChapterReadStore.ts`,
`packages/core/src/progress/__tests__/chapterRead.test.ts`.
**Tamaño:** S.

## Task T27: Máquina de estados del lector (headless)

**Descripción.** Estado del lector en el núcleo, sin UI (SPEC §9): modos vertical continuo y
paginado, navegación anterior/siguiente, límites de capítulo, disparo del guardado de progreso
(con `page_total`) y de "capítulo terminado". Políticas de memoria documentadas (el render es Parte 2).

**Criterios de aceptación:**

- [ ] Cambiar de página dentro de un capítulo y saltar entre capítulos funciona en el estado.
- [ ] Cambiar de modo de lectura actualiza la preferencia de la serie (T24).
- [ ] Llegar a la última página señala "capítulo terminado" y ofrece el siguiente capítulo.
- [ ] `page_index` respeta los límites (no negativo, no mayor que `page_total`).

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: recorrer un capítulo de 60 páginas en el estado.

**Dependencias:** T25.
**Archivos probables:** `packages/core/src/reader/ReaderState.ts`,
`packages/core/src/reader/__tests__/readerState.test.ts`.
**Tamaño:** M.

### 🚩 Checkpoint G (tras T25–T27)

- [ ] Guardar y reabrir devuelve la página exacta (núcleo, sin UI)
- [ ] `page_total` se guarda para el porcentaje y la barra (RF-41)
- [ ] Revisión humana

---

## Fase 7 — Corte vertical 6: respaldo

## Task T28: Exportar respaldo JSON

**Descripción.** Generar el respaldo JSON (SPEC §8.3) desde `Storage`: repos, módulos,
carpetas, series, favoritos, progreso (con `pageTotal`), lecturas, preferencias y ajustes.
Sin secretos.

**Criterios de aceptación:**

- [ ] El JSON cumple el esquema del SPEC §8.3 (`format`, `version`, `createdAt`).
- [ ] El progreso incluye `pageTotal`.
- [ ] Incluye todos los repos y las filas de usuario con `updatedAt`.
- [ ] No contiene secretos ni credenciales.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: validar la salida contra un esquema de fixture.

**Dependencias:** T22, T24, T25, T26.
**Archivos probables:** `packages/core/src/backup/export.ts`,
`packages/core/src/backup/schema.ts`,
`packages/core/src/backup/__tests__/export.test.ts`.
**Tamaño:** M.

## Task T29: Importar respaldo (validar/merge/replace/sugerencias)

**Descripción.** Importar un respaldo: validar esquema y tamaño, y fusionar por `updated_at` o
reemplazar. Los repos y módulos del respaldo **no se instalan solos**: se devuelven como
sugerencias para confirmar una por una (RF-38).

**Criterios de aceptación:**

- [ ] Un respaldo inválido o sobredimensionado se rechaza sin tocar los datos.
- [ ] Modo fusión respeta el `updated_at` más reciente.
- [ ] Modo reemplazo restaura el estado del respaldo.
- [ ] Repos/módulos del respaldo se devuelven como sugerencias, sin instalar nada.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: fusionar dos respaldos con progreso en conflicto.

**Dependencias:** T28.
**Archivos probables:** `packages/core/src/backup/import.ts`,
`packages/core/src/backup/__tests__/import.test.ts`.
**Tamaño:** M.

## Task T30: E2E de respaldo (AC-7)

**Descripción.** Prueba de ida y vuelta: poblar una instalación con biblioteca, carpetas,
progreso y repos; exportar; importar en una instalación limpia; comprobar que todo se reproduce.

**Criterios de aceptación:**

- [ ] Biblioteca, carpetas, progreso y repos se reproducen sin pérdidas (**AC-7**).
- [ ] Los módulos/repos no se instalan automáticamente.
- [ ] La fusión por `updated_at` se verifica en un caso con conflicto.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- backup.e2e`
- [ ] Manual: inspeccionar el JSON intermedio.

**Dependencias:** T29.
**Archivos probables:** `packages/core/tests/e2e/backup.e2e.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint H (tras T28–T30)

- [ ] Exportar e importar reproduce biblioteca, carpetas, progreso y repos sin pérdidas
- [ ] Módulos/repos del respaldo no se instalan solos
- [ ] Revisión humana

---

## Fase 8 — Módulos reales y generalidad

## Task T31: Port de `logicTMO.py` a módulo script + fixtures

**Descripción.** Portar `legacyModulos/logicTMO.py` al contrato nuevo (SPEC Apéndice A):
`popular`/`latest`/`search`/`details`/`pages`, con `Referer` y `User-Agent` en
`ImageRef.headers`, usando solo `host.*`. Corregir los 8 defectos del apéndice (errores
tipados, timeouts, sin estado compartido). Guardar fixtures del sitio en `test-site` o en el
repo de módulos (P-8).

**Criterios de aceptación:**

- [ ] Los 5 métodos funcionan contra las fixtures del sitio.
- [ ] Se corrigen los 8 defectos del Apéndice A.4.
- [ ] `pages()` devuelve `Referer`/`User-Agent` en `headers` cuando el sitio lo exige.
- [ ] No hay estado compartido entre llamadas.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- tmo`
- [ ] Manual: ejecución real contra el sitio (fuera de CI) para confirmar.

**Dependencias:** T19.
**Archivos probables:** `packages/test-site/fixtures/tmo/*.html`,
módulo fuera del repo principal según P-8.
**Tamaño:** M.

## Task T32: Segundo sitio falso de otra arquitectura + ADR de congelación de API 1.0

**Descripción.** Validar la generalidad del contrato con el **segundo sitio falso** de
`test-site` (arquitectura JSON + paginación por cursor, sin selectores; ver `plan.md` §8) y
escribir el ADR que congela la API 1.0 o lista los ajustes pendientes. El segundo sitio
**real** se aplaza (decisión del humano): vive en el repo aparte de módulos y se elige antes
de publicar la 1.0.

**Criterios de aceptación:**

- [ ] El contrato pasa con las dos arquitecturas de `test-site`.
- [ ] Se documentan los ajustes de API derivados de dos arquitecturas distintas.
- [ ] `docs/decisions/ADR-000x-congelacion-api-1.0.md` marca la API como estable o enumera
      los cambios requeridos, y lista candidatos de segundo sitio real (sin instalarlos).
- [ ] Se anota el resultado en `MEMORY.md` (preguntas abiertas del SPEC §17.2).

**Verificación:**

- [ ] `pnpm -r test`
- [ ] Manual: revisar el ADR con el autor.

**Dependencias:** T31.
**Archivos probables:** `packages/test-site/fixtures/json-api/**`,
`docs/decisions/ADR-000x-congelacion-api-1.0.md`.
**Tamaño:** M.

### 🚩 Checkpoint I (tras T31–T32)

- [ ] `logicTMO` busca, lista capítulos y entrega imágenes desde un sitio real
- [ ] El contrato pasa con dos arquitecturas distintas
- [ ] La API 1.0 se considera congelable
- [ ] Revisión humana

---

## Fase 9 — Endurecimiento

## Task T33: Pruebas de seguridad

**Descripción.** Batería de seguridad (SPEC §7.2): zip-slip, bomba de compresión, hash
incorrecto, manifest malicioso, respaldo JSON malicioso/sobredimensionado y enlaces profundos
(`ryuunest://add-repo?url=…`) que **nunca** instalan solos.

**Criterios de aceptación:**

- [ ] Cada amenaza de la tabla §7.2 tiene al menos una prueba que falla si se quita la mitigación.
- [ ] Un deep link solo abre la pantalla de confirmación, no instala (**AC-8**).
- [ ] Los límites de tamaño/archivos se cubren con pruebas.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- security`
- [ ] Manual: revisar la correspondencia amenaza↔prueba.

**Dependencias:** T13.
**Archivos probables:** `packages/core/tests/security/*.test.ts`.
**Tamaño:** M.

## Task T34: Pruebas de resiliencia

**Descripción.** Verificar que un módulo roto, lento o bloqueado no tumba la app (SPEC RNF-8):
tiempo límite, errores contenidos, reintento manual, `last_error` visible y límite de
concurrencia/rate-limit del host.

**Criterios de aceptación:**

- [ ] Un módulo que cuelga provoca `TIMEOUT` sin bloquear el hilo del núcleo.
- [ ] Un módulo que lanza excepciones queda contenido y registra `last_error`.
- [ ] El reintento manual vuelve a intentar sin reiniciar la app.
- [ ] El rate-limit por dominio se respeta bajo carga.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- resilience`
- [ ] Manual: módulo que responde tras un fallo transitorio.

**Dependencias:** T08, T14.
**Archivos probables:** `packages/core/tests/resilience/*.test.ts`.
**Tamaño:** S.

## Task T35: Puertas de CI / contrato / cobertura

**Descripción.** Endurecer el CI (SPEC §13, AC-11): lint, tipos estrictos, pruebas del contrato
(declarativo y script) y umbral de cobertura del núcleo. Fija el comando que valida todo el
núcleo antes de fusionar.

**Criterios de aceptación:**

- [ ] El CI falla si baja la cobertura del contrato por debajo del umbral acordado.
- [ ] Las pruebas de contrato de ambos runtimes corren en CI.
- [ ] `pnpm -r test && pnpm -r typecheck && pnpm lint` es la puerta única de fusión (**AC-11**).

**Verificación:**

- [ ] `pnpm -r test && pnpm -r typecheck && pnpm lint`
- [ ] Manual: PR de prueba que rompe el contrato y comprobar que el CI falla.

**Dependencias:** T02, T32.
**Archivos probables:** `.github/workflows/ci.yml` (cobertura), `vitest.config.ts` (thresholds).
**Tamaño:** S.

### 🚩 Checkpoint J — Fin de la Parte 1 (tras T33–T35)

- [ ] Toda la suite y el CI en verde
- [ ] Cobertura del contrato completa
- [ ] **DETENERSE: cambiar de modelo para planificar la Parte 2 (diseño / front-end)**
- [ ] Revisión humana

---

## PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)

> Planificada en esta sesión (P-14). Depende de la Parte 1. Lee `DESIGN_RULES.md`
> completo una vez por sesión y, por pantalla, `screen.png` y `code.html` (SPEC §11.4).
> Orden de autoridad: SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG → HTML → `IDEA.md`.

## Fase 6a — Sistema de diseño

## Task F01: `packages/ui-tokens` (tokens semánticos + tema Dragon Night)

**Descripción.** Implementar los tokens desde **SPEC §11.9** (no del front-matter crudo de
`DESIGN.md`): colores (`bg`, `surface`, `elevated`, `border`, `text-primary`,
`text-secondary`, `accent`, `progress`, `badge-bg`, `positive`, `warning`, `error`),
tipografía (Manrope/Inter con tamaños, pesos, interlineado y tracking), espaciado (rejilla de
4 px), radios y densidades. Incluir solo el tema Dragon Night, con estructura de temas.

**Criterios de aceptación:**

- [x] Todos los tokens de SPEC §11.9 existen como tokens semánticos; los genéricos del front-matter no se usan.
- [x] Existe un mapa de tema Dragon Night y la estructura para añadir temas futuros.
- [x] Ningún componente consumirá valores literales (P2-4).

**Verificación:**

- [x] `pnpm --filter @ryuunest/ui-tokens test && pnpm --filter @ryuunest/ui-tokens build`
- [x] Manual: comparar cada token con `DESIGN.md` y SPEC §11.9.

**Dependencias:** T01, T02.
**Archivos probables:** `packages/ui-tokens/src/{colors,typography,spacing,radii,density,theme}.ts`,
`packages/ui-tokens/src/index.ts`, `packages/ui-tokens/src/__tests__/tokens.test.ts`.
**Tamaño:** M.

## Task F02: Prueba de tokens y contraste (AC-13)

**Descripción.** Prueba automática que compara `ui-tokens` con los tokens de SPEC §11.9 de
`DESIGN.md` y calcula el contraste WCAG de los pares usados (texto sobre `bg`/`surface`/
`elevated`, texto oscuro sobre `accent`/`progress`). Falla si algún par no cumple AA.

**Criterios de aceptación:**

- [x] Los tokens propios coinciden con `DESIGN.md`; si un genérico difiere, se ignora y se anota.
- [x] Todos los pares usados cumplen WCAG AA; los rellenos de `accent`/`progress` llevan texto `bg`.
- [x] La prueba corre en CI (**AC-13**).

**Verificación:**

- [x] `pnpm --filter @ryuunest/ui-tokens test`
- [x] Manual: introducir un color que falle y comprobar que la prueba falla.

**Dependencias:** F01.
**Archivos probables:** `packages/ui-tokens/src/__tests__/contrast.test.ts`, `vitest.config.ts`.
**Tamaño:** S.

## Task F03: Fuentes e iconos empaquetados

**Descripción.** Empaquetar **Manrope** (600/700) e **Inter** (400/500/600) desde archivos
locales (OFL) e integrar **Lucide** (`lucide-react-native` en móvil/TV, `lucide-react` en web).
Sin pesos sintéticos. Registrar en `ASSETS.md`.

**Criterios de aceptación:**

- [x] Las fuentes cargan desde archivos locales; ningún CDN (RNF-5).
- [x] Un único conjunto de iconos SVG (Lucide); sin emojis ni glifos de texto (V4).
- [x] `ASSETS.md` registra Manrope, Inter y Lucide con su licencia.

**Verificación:**

- [x] Manual: arrancar la galería y comprobar que no hay peticiones externas. **Diferida a F05/F28: la galería (primer consumidor visual) llega en F05 (P2.3). Las puertas automáticas cubren ya RNF-5 y V4 en `apps/mobile/tests/fonts.test.ts` e `icons.test.ts`.**
- [x] Playwright: cero peticiones a dominios externos. **Diferida a F05/F28, igual que arriba; en F03 no hay pantalla que servir.**

**Dependencias:** F01.
**Archivos probables:** `apps/mobile/assets/fonts/*`, `packages/ui-tokens/src/fonts.ts`,
`apps/mobile/src/icons.ts`, `ASSETS.md`.
**Tamaño:** S.

## Task F04: Escala y layout por densidad

**Descripción.** Utilidades de escala y layout: rejilla de 4 px, márgenes y separaciones por
punto de corte (móvil < 600, tablet 600–1024, escritorio > 1024), portadas 2:3 y factor TV
1,25×. Base compartida por móvil, web y TV.

**Criterios de aceptación:**

- [x] Un helper de densidad (compacta/cómoda/TV) expone espaciado, márgenes y escala tipográfica.
- [x] La escala TV aplica 1,25× a todos los tamaños (SPEC §11.9).
- [x] Márgenes correctos por punto de corte.

**Verificación:**

- [x] `pnpm --filter @ryuunest/ui-tokens test`
- [ ] Manual: galería en 3 anchos (móvil, tablet, escritorio). _Diferida a F05/F28: la galería llega en F05 (P2.3); mientras, `tests/layout.test.ts` fija los tres tramos y sus límites (599/600/1024/1025)._

**Dependencias:** F01.
**Archivos probables:** `packages/ui-tokens/src/{scale,layout}.ts`,
`packages/ui-tokens/src/__tests__/layout.test.ts`.
**Tamaño:** S.

**Hecho (2026-10-17).** `scale.ts` (factor por estilo con redondeo a píxel entero; el tracking
en em no se escala) y `layout.ts` (`breakpointForWidth`, `layoutForWidth`, `densityLayout`);
19 tests nuevos en `tests/scale.test.ts` y `tests/layout.test.ts`; superficie de `index.test.ts`
actualizada. La **separación de tablet es 16 px** (el SPEC da 12 móvil y 24 escritorio pero nada
entre medias): elegido por el humano, P-54. Las densidades comparten la rejilla de 4 px: el
factor 1,25 de TV es tipográfico (así lo fija §11.9 bajo la tabla de tipografía), así que
`densityLayout` escala solo la tipografía y deja `spacing` intacto.

## Task F05: Galería de componentes (pantalla de desarrollo)

**Descripción.** Pantalla solo para desarrollo que muestra cada componente en todos sus
estados (normal, presionado, foco, deshabilitado, cargando, error). Es la base de AC-12 y
AC-13 y del trabajo por pantallas (Regla 3 y 5 de `AGENTS.md`).

**Criterios de aceptación:**

- [x] La galería lista todos los componentes y sus estados. _(Las 8 secciones de tokens/datos están; la sección de componentes nace vacía con sus 6 estados declarados y la llenan F06+.)_
- [x] Compila para web (base de la verificación con Playwright).
- [x] Sin valores literales; todo sale de `ui-tokens`. _(Puerta `tests/galleryTokens.test.tsx` + `styleAudit`.)_

**Verificación:**

- [x] Playwright: abrir la galería y comprobar estados y cero peticiones externas. _(Las 8 secciones renderizan; solo peticiones a `localhost`; los 3 anchos responden con el layout de F04.)_

**Dependencias:** F01, F03, F04.
**Archivos probables:** `apps/mobile/src/gallery/*` (o `apps/web/src/gallery/*`).
**Tamaño:** M.

**Hecho (2026-10-17).** Galería en `apps/mobile/src/gallery/`: `registry.ts` (8 secciones;
la de componentes nace vacía con los 6 estados de la Regla 3), `fontSources.ts` (mapa para
`useFonts` desde el manifiesto `fontFiles` de F03), `GalleryScreen.tsx` (todo desde tokens,
puerta anti-literales con `styleAudit`), `renderGallery.ts` (harness que fija la estructura
sin Metro) y `App.tsx` montando la galería. Dependencias aprobadas: `react-dom`,
`react-native-web`, `@expo/metro-runtime`, `expo-font` (vía `expo install`) y el enlace
`@ryuunest/test-site`. `metro.config.js` con monorepo pnpm (los `@ryuunest/*` por `dist`).
`expo export --platform web` compila; Playwright: 8 secciones, cero dominios externos (RNF-5)
y los 3 anchos con el layout de F04 (cierra la verificación diferida de F04). Evidencia en
`docs/capturasF05/`. **47 tests en mobile (357 en el repo).**

## Task F06: Componentes base 1 (botones, campos, casillas, chips, insignias)

**Descripción.** Componentes reutilizables con props tipadas y todos sus estados: botón
primario/secundario/destructivo (SPEC §11.10), campo de texto y búsqueda, casillas y radios,
chip de filtro (36 px + `hitSlop`), insignia de tipo/estado (24 px, **neutra** según V1).

**Criterios de aceptación:**

- [x] Un botón primario por pantalla; relleno `accent`/`progress` con texto `bg`. _(Inversión fijada en `buttonStyles`; contraste por la puerta AA de ui-tokens.)_
- [x] Chips e insignias con `hitSlop` para llegar a 48 dp (RNF-7). _(Chip 36→48, casilla/radio 20→48; la insignia no es interactiva.)_
- [x] Todos los estados en la galería; animaciones solo `transform`/`opacity` (Regla 4). _(Los 5 componentes con variantes/estados; el presionado usa opacidad/capa.)_

**Verificación:**

- [x] Playwright sobre la galería; comprobación de áreas táctiles y contraste. **(Los 5 componentes renderizan; cero dominios externos; evidencia en `docs/capturasF05/`.)**

**Dependencias:** F05.
**Archivos probables:** `apps/mobile/src/components/{Button,TextField,Checkbox,Chip,Badge}.tsx`.
**Tamaño:** M.

**Hecho (2026-10-18).** Componentes en `apps/mobile/src/components/`, con la lógica de color/
forma separada en `*Styles.ts` (pura, testeable sin Metro) y el componente `*.tsx` montándola:
**botón** (primario/secundario/destructivo, 48 px, inversión `bg` sobre `accent`, capa accent
10 % al pulsar el secundario), **campo de texto** (surface/border, 48 px, foco accent sin
brillo), **casilla y radio** (20×20, borde 1,5 px, marcado accent/glifo bg, hitSlop a 48),
**chip de filtro** (pill 36 px, seleccionado badge-bg/accent, hitSlop a 48) e **insignia**
(pill 24 px **neutra** elevated/text-secondary, V1). Registrados en la galería con sus estados.
**65 tests en mobile (375 en el repo)**; Playwright: renderizan y cero peticiones externas.

## Task F07: Componentes base 2 (tarjeta, fila de capítulo, cabecera, navegación, hojas)

**Descripción.** Tarjeta de portada (2:3, radio 12, borde `border`, barra de progreso de 3 px
RF-41, **sin contador de no leídos**), fila de capítulo (3 estados: sin leer, en curso con
porcentaje, completado atenuado con ✓), fila de ajustes, encabezado único (logo local), barra
inferior de 5 destinos / riel, hojas y diálogos (esquinas superiores 24 px).

**Criterios de aceptación:**

- [x] La fila de capítulo muestra máximo dos señales por estado (V8). _(Leído atenuado + ✓ sin tachar; en curso marcador + porcentaje.)_
- [x] La cabecera y la barra inferior son las mismas en todas las pantallas (T1, V5). _(Componentes `Header`/`BottomNav` únicos, 5 destinos T1.)_
- [x] Sin sombras; profundidad por niveles de superficie (RNF-12). _(Cabecera/barra/hoja `elevated` con `elevation: 0` y `shadowOpacity: 0`.)_

**Verificación:**

- [x] Playwright sobre la galería; comprobación de estados de capítulo y barra de progreso. _(Renderizan los 6 componentes; cero dominios externos; evidencia en `docs/capturasF05/`.)_

**Dependencias:** F06.
**Archivos probables:** `apps/mobile/src/components/{CoverCard,ChapterRow,Header,BottomNav,Sheet,Dialog}.tsx`.
**Tamaño:** M.

**Hecho (2026-10-18).** Componentes en `apps/mobile/src/components/` (patrón `*Styles.ts` puro +
componente): **tarjeta de portada** (2:3, radio 12, borde, barra de progreso 3 px RF-41, sin
contador), **fila de capítulo** (56 px, 3 estados, máximo dos señales V8), **cabecera única**
(elevated, sin sombra, logo local V5), **barra inferior de 5 destinos** (T1, elevated 95 %,
sin sombra, activo accent), **fila de ajustes** y **hoja/diálogo** (nivel 2, esquinas
superiores, sin sombra). Registrados en la galería. **79 tests en mobile (389 en el repo)**;
Playwright: renderizan y cero peticiones externas. `typecheck` de mobile ahora corre tsc con
stack ampliado (TS 6 recurría en profundidad y agotaba el stack por defecto).

## Task F08: Estados vacíos y de error + dragón marcador

**Descripción.** Componentes de estado vacío, sin resultados, error de módulo (causa, código,
reintentar, ver detalle) y carga breve, con el dragón marcador de `assets/placeholder/` y una
acción siguiente (SPEC §11.12). Sin tarjetas-mascota (T4).

**Criterios de aceptación:**

- [x] Cada estado lleva dragón (según §11.12/§11.5), título en Manrope y una acción. _(Dragón mediano 96 en vacío/error, pequeño 48 en carga breve - tokens `markers` de `ui-tokens`, P-57. La acción de la carga breve no aplica: §11.12 reserva la acción siguiente para vacío y error.)_
- [x] El error de módulo incluye detalle técnico desplegable (módulo, URL, código, selector). _(`detailLines` en `stateStyles.ts`, probado; desplegable «Ver detalle» verificado en la galería.)_
- [x] El dragón es un marcador local (sin obras reales ni texto). _(Silueta SVG original del proyecto en `assets/placeholder/dragon.svg`, registrada como temporal en su `README.md` y en `ASSETS.md`; sin texto, sin URLs y sin obras de terceros — puerta `tests/placeholder.test.ts`.)_

**Verificación:**

- [x] Playwright sobre la galería; revisar la lista de 20 s. _(Los 3 estados renderizan; solo peticiones a `localhost` (fuentes embebidas en el bundle); cero errores de consola; sin desbordamiento horizontal; áreas táctiles ≥ 48; el desplegable muestra las 4 líneas técnicas. Evidencia en `docs/capturasF05/galeria-f08-vacio.png` y `galeria-f08-error.png`.)_

**Dependencias:** F07.
**Archivos probables:** `apps/mobile/src/components/{EmptyState,ErrorState,LoadingState}.tsx`,
`assets/placeholder/README.md`.
**Tamaño:** M.

> **Nota (F08):** las pantallas de estados vacíos y de error no tienen diseño en
> Stitch (pregunta abierta 1); se componen con `DESIGN.md` y `DESIGN_RULES.md`
> y quedan marcadas «sin diseño» hasta que se generen (Ver `DIFFS.md`).

## Task FA1: Arte final del dragón (subtarea independiente)

**Descripción.** Encargar a un artista el arte definitivo del dragón (logo, ilustración de
bienvenida, marcador de estados) y sustituir los marcadores temporales de
`apps/mobile/assets/placeholder/` (F08), registrando licencia y obra en `ASSETS.md` y en el
`README` de esa carpeta (SPEC §12). **No depende de ninguna task**: se puede hacer en
cualquier momento antes de la v1.0 pública.

**Criterios de aceptación:**

- [ ] Arte original del artista con licencia aceptada en un repo GPL-3.0 (SPEC §12).
- [ ] Los marcadores de `assets/placeholder/` se sustituyen o se confirma su situación.
- [ ] `DragonMarker.tsx` (o el recurso que lo sustituya) sigue sin texto y sin URLs remotas.
- [ ] `ASSETS.md` y el `README` de `assets/placeholder/` actualizados; se retira la marca TEMPORAL.

**Verificación:**

- [ ] Puerta `apps/mobile/tests/placeholder.test.ts` en verde con el arte final.
- [ ] Galería verificada con Playwright (RNF-5: cero dominios externos).

**Dependencias:** ninguna (decisión del humano, 2026-10-20).
**Archivos probables:** `apps/mobile/assets/placeholder/*`, `apps/mobile/src/components/DragonMarker.tsx`, `ASSETS.md`.
**Tamaño:** S (proceso) + coste del encargo.

## Task F09: Lint de diseño (sin literales en `apps/*`)

**Descripción.** Regla de lint que prohíbe colores hexadecimales y medidas literales de fuente,
radio o espacio en `apps/*` (SPEC §11.11, AC-13). Fuerza a usar tokens.

**Criterios de aceptación:**

- [x] El lint falla ante un `#RRGGBB` o un `padding: 13` literal en `apps/*`. _(Regla `ryuunest/no-design-literals` (`tools/eslint-plugin-ryuunest/`), aplicada solo al código de `src` en `apps/`; probada con `RuleTester` (15 casos) y con la configuración real vía `ESLint` (3 tests de integración, incluida la prueba de que un literal de prueba hace fallar el lint).)_
- [x] La regla corre en CI junto al resto. _(`pnpm lint` la aplica; el paquete del plugin entra en `pnpm -r test`, que el CI ejecuta.)_
- [x] Excepciones documentadas (si las hay) con comentario. _(`ImageCapPanel.tsx`: panel de calibración del tope de imágenes (T05/P-45), de un solo uso y fuera de la interfaz; `eslint-disable` con motivo. Valores estructurales permitidos: `0`, `1`, `transparent`.)_

**Verificación:**

- [x] `pnpm lint` _(limpio sobre todo el repo, con la regla activa)_
- [x] Manual: introducir un literal y comprobar que falla. _(Automatizado: `tests/config-integration.test.ts` lintea un literal contra la configuración real y exige el error; sensibilidad comprobada rompiendo la regla.)_
- [x] Playwright sobre la galería (regla de `AGENTS.md` §12): renderiza, cero dominios externos, cero errores de consola; el refactor a `withAlpha` conserva el color calculado `rgba(27, 34, 48, 0.95)` de la barra inferior. Evidencia en `docs/capturasF05/galeria-f09-lint.png`.

**Dependencias:** T02, F01.
**Archivos probables:** `eslint.config.js` (regla personalizada), `tools/eslint-plugin-ryuunest/*`.
**Tamaño:** S.

## Task F10: Internacionalización (archivo de traducciones)

**Descripción.** Archivo de traducciones en español desde el inicio (RF-40) con todas las
cadenas de la interfaz; ninguna cadena literal en los componentes. Fechas y números con
formato local (RNF-11).

**Criterios de aceptación:**

- [x] Todas las cadenas visibles viven en el archivo de traducciones. *(`apps/mobile/src/i18n/es.json` + `index.ts`; galería, estados, detalle del error, etiquetas de la barra inferior y el nombre accesible del marcador se leen con `t("…")`. Puerta `tests/i18nUsage.test.ts`: toda clave usada existe, ninguna clave queda sin usar y **ninguna cadena del catálogo aparece escrita a mano** fuera de `src/i18n/`.)*
- [x] Existe la estructura para añadir inglés después. *(`LocaleCode`, `catalogs` por idioma, `supportedLocales`, `setLocale`; añadir inglés es rellenar un catálogo y registrarlo. Hoy el tipo y el guardia de ejecución rechazan «en», con prueba.)*
- [x] Los componentes de la galería ya usan claves de traducción. *(Los componentes reciben texto por props y la **galería** los alimenta desde el catálogo; el registro guarda claves. Los valores de API —variante del botón, estado del capítulo, destino de la barra— siguen siendo identificadores y **no** son copy.)*

**Verificación:**

- [x] `pnpm --filter @ryuunest/core test` (o paquete i18n) y revisión de la galería. *(`apps/mobile/tests/i18n.test.ts` (7 tests: claves, interpolación, fallo ruidoso, estructura de idiomas) y `tests/i18nUsage.test.ts` (3 tests). **102 tests en mobile (523 en el repo)**; lint, tipos y build en verde.)*
- [x] Playwright sobre la galería (regla de `AGENTS.md` §12): renderiza con las cadenas del catálogo (nav, estados, detalle, capítulos), **cero dominios externos**, cero errores de consola, sin desbordamiento. Evidencia en `docs/capturasF05/galeria-f10-i18n.png`.

**Dependencias:** F05.
**Archivos probables:** `apps/mobile/src/i18n/{es.json,index.ts}`.
**Tamaño:** S.

**Hecho (2026-10-20).** `es.json` (catálogo plano por claves) e `index.ts` (`t` con
interpolación y fallo ruidoso, `catalogs`/`supportedLocales`/`setLocale`, `formatNumber` y
`formatDate` por localidad). La galería, los tres estados, el detalle del error, las etiquetas
de la barra inferior (`nav.*`, destinos por id) y el nombre accesible del marcador se leen del
catálogo; el registro guarda claves. Puertas: `i18n.test.ts` (7) e `i18nUsage.test.ts` (3).
Playwright: renderiza desde el catálogo, cero dominios externos. **102 tests en mobile (523 en
el repo)**. Límite deliberado: valores de API (variant «primary», estado «in-progress», destino
«library») **no** son copy.

### 🚩 Checkpoint P-A (tras F01–F10)

- [ ] `ui-tokens` coincide con `DESIGN.md`; contraste WCAG en verde (AC-13)
- [ ] Galería revisada con todos los estados; fuentes e iconos locales (cero CDN)
- [ ] Lint de diseño activo; cadenas externalizadas
- [ ] Revisión humana

---

## Fase 6b — Interfaz móvil (un corte vertical por pantalla)

## Task F11: Shell: navegación de 5 destinos + cabecera única

**Descripción.** Estructura de navegación `Inicio · Biblioteca · Descubrir · Fuentes · Ajustes`
(SPEC §11.6), con barra inferior flotante (nivel 2) en móvil y cabecera única reutilizable
(logo local, nombre, etiqueta de sección, búsqueda; sin campana ni avatar).

**Criterios de aceptación:**

- [ ] Una sola cabecera y una sola barra inferior, iguales en todas las pantallas (T1).
- [ ] Etiquetas funcionales por destino; sin nombres temáticos como etiqueta de pantalla (11.7).
- [ ] El destino activo se marca con `accent` (V1).

**Verificación:**

- [ ] Playwright: navegar entre los 5 destinos; comprobar cabecera y barra.
- [ ] Manual: verificar en el POCO F5 Pro.

**Dependencias:** Checkpoint P-A; T35 (núcleo estable).
**Archivos probables:** `apps/mobile/src/navigation/*`, `apps/mobile/src/shell/*`.
**Tamaño:** M.

## Task F12: Primer uso (3 pasos) + estado vacío inicial

**Descripción.** Flujo de primer uso (SPEC §11.8): bienvenida con dragón grande, añadir
repositorio (campo + pegar del portapapeles + "Importar respaldo"), e instalar un módulo; al
terminar, "Ir a leer". Cubre el estado inicial sin módulos (RF-1, AC-1).

**Criterios de aceptación:**

- [ ] Guía hasta añadir un repo y activar un módulo; el estado vacío lleva a "Añadir repositorio".
- [ ] Nada se instala sin confirmación (AC-8).
- [ ] En TV, el paso 2 prioriza "Importar respaldo" (nota de SPEC §11.8).

**Verificación:**

- [ ] Playwright del flujo completo con `test-site`; AC-1.
- [ ] Manual: primer uso en dispositivo.

**Dependencias:** F11, F16 (fuentes) y T15 (instalación).
**Archivos probables:** `apps/mobile/src/screens/onboarding/*`.
**Tamaño:** M.

## Task F13: Inicio (Guarida)

**Descripción.** Pantalla Inicio (RF-14, RF-33, RF-41): encabezado compacto, tarjeta grande
"Continuar" (abre en la página exacta), filas de Recientes y Tesoros, y Descubrir solo si hay
módulos. Si no hay lectura en curso, "Empieza algo nuevo" → Descubrir.

**Criterios de aceptación:**

- [ ] La tarjeta "Continuar" es lo primero que atrae; el dragón no compite (SPEC §11.4/§11.12).
- [ ] Máximo 4 secciones; sin "Novedades de Portales" ni contadores (RF-42).
- [ ] El porcentaje/barra sale de `page_index / page_total` (RF-41).

**Verificación:**

- [ ] Playwright contra `inicio_guarida/screen.png` (móvil).
- [ ] Manual en POCO F5 Pro.

**Dependencias:** F11; T25/T27 (progreso/estado).
**Archivos probables:** `apps/mobile/src/screens/home/*`.
**Tamaño:** M.

## Task F14: Biblioteca (Tesoros)

**Descripción.** Biblioteca única de favoritos (RF-26 a RF-30, RF-41): búsqueda siempre
visible, chips Todo · Leyendo · Carpetas, filtros por tipo/fuente/carpeta/NSFW, orden por
nombre/último leído/fecha, cuadrícula virtualizada de tarjetas y gestión de carpetas.

**Criterios de aceptación:**

- [ ] Chips Todo · Leyendo · Carpetas (sin «Completado», v2).
- [ ] Un solo acceso a carpetas por pantalla (V6); títulos a dos líneas sin "…" (T7).
- [ ] Con NSFW apagado, no aparecen series NSFW (RF-35).
- [ ] Los filtros muestran los cuatro tipos: manga, manhua, manhwa, cómic (P2-8).

**Verificación:**

- [ ] Playwright contra `biblioteca_tesoros/screen.png`.
- [ ] Manual: 3000 series de ejemplo; desplazamiento fluido (AC-4 en dispositivo).

**Dependencias:** F11; T23 (filtros/consultas).
**Archivos probables:** `apps/mobile/src/screens/library/*`.
**Tamaño:** M (si supera una sesión, dividir en F14a cuadrícula+filtros y F14b carpetas+orden).

## Task F15: Descubrir (Aventuras)

**Descripción.** Descubrir (RF-9 a RF-12): selector de módulo (recuerda el último) con chips de
fuente, filas `popular` y `latest` si el módulo las ofrece, búsqueda con paginación y el patrón
de error de módulo con detalle desplegable (RF-11).

**Criterios de aceptación:**

- [ ] Se recuerda el último módulo; un módulo NSFW no aparece con el filtro apagado (RF-35).
- [ ] Error de módulo con causa, código, reintentar y ver detalle (SPEC §11.5).
- [ ] Sin orden/filtro por género (fuera de la v1).

**Verificación:**

- [ ] Playwright contra `descubrir_aventuras/screen.png` con `test-site`.
- [ ] Manual: buscar y paginar.

**Dependencias:** F11; T20 (runtime), T10 (`test-site`).
**Archivos probables:** `apps/mobile/src/screens/discover/*`.
**Tamaño:** M.

## Task F16: Fuentes (Portales)

**Descripción.** Fuentes (RF-1 a RF-8): lista de repositorios y módulos instalados con nombre,
tipo, idioma, NSFW, runtime y permisos; activar/desactivar/desinstalar/actualizar; último
error; confirmación normal y **reforzada** para script (mantener pulsado); protección de
instalación (RF-7).

**Criterios de aceptación:**

- [ ] La confirmación muestra permisos y hash; en script exige mantener pulsado.
- [ ] RF-7: pide bloqueo del dispositivo si está activa (vía `SecureLock`).
- [ ] Actualizar con ampliación de permisos vuelve a pedir confirmación (RF-6).

**Verificación:**

- [ ] Playwright contra `fuentes_portales/screen.png`.
- [ ] Manual: instalar un módulo `script` y comprobar la confirmación reforzada.

**Dependencias:** F11; T14 (registro), T15 (instalación).
**Archivos probables:** `apps/mobile/src/screens/sources/*`.
**Tamaño:** M.

## Task F17: Serie (detalle)

**Descripción.** Pantalla de serie (RF-13 a RF-17): portada, título, tipo · fuente · estado,
botón principal "Continuar cap. N"/"Empezar", descripción colapsable, géneros, títulos
alternativos, lista de capítulos con 3 estados (sin leer, en curso con porcentaje, completado),
orden y salto al último leído, selector de `release` y favorito con carpeta.

**Criterios de aceptación:**

- [ ] Fila de capítulo con máximo dos señales por estado (V8) y porcentaje desde `page_total`.
- [ ] Favorito con un toque; carpeta desde el menú o al mantener pulsado (RF-17).
- [ ] Release preferida recordada por serie (RF-16).

**Verificación:**

- [ ] Playwright contra `detalle_pantalla/screen.png`.
- [ ] Manual: cambiar de release y de estado de capítulo.

**Dependencias:** F11; T22, T24, T26 (biblioteca/prefs/lecturas).
**Archivos probables:** `apps/mobile/src/screens/series/*`.
**Tamaño:** M.

## Task F18: Lector 1 (modos, zonas, controles, progreso)

**Descripción.** Lector (RF-18 a RF-22): modos vertical continuo y paginado con dirección por
tipo, zonas táctiles izquierda/centro/derecha (invertidas en D→I), controles mínimos (cerrar,
título, selector de capítulo, modo) en barras `elevated` al 95 % con borde `border`, guardado
de progreso con debounce y al salir, y tarjeta "Siguiente capítulo".

**Criterios de aceptación:**

- [ ] El modo se recuerda por serie (RF-18); el centro muestra/oculta controles (RF-19).
- [ ] Se guarda `page_index` y `page_total`; reabrir lleva a la página exacta (RF-20).
- [ ] Nada decorativo sobre el contenido (RF-22); sin animaciones en el lector (Regla 4).

**Verificación:**

- [ ] Playwright contra `pantalla_lector/screen.png` (controles visibles).
- [ ] Manual: leer 60 páginas en la MiBox 4 sin OOM (AC-6).

**Dependencias:** F17; T25, T27 (progreso/estado del lector).
**Archivos probables:** `apps/mobile/src/screens/reader/*` (parte 1).
**Tamaño:** M.

## Task F19: Lector 2 (zoom, pantalla encendida, errores, precarga)

**Descripción.** Complementos del lector (RF-21, RF-23, RF-24): zoom con pellizco, pantalla
encendida mientras se lee, reintento por imagen con detalle técnico, precarga de las primeras
imágenes del siguiente capítulo, y cabeceras `Referer`/`User-Agent` en las imágenes.

**Criterios de aceptación:**

- [ ] Las imágenes se piden con las cabeceras del módulo (`ImageRef.headers`, RF-24).
- [ ] Un fallo de imagen ofrece reintento individual; no se descarta el capítulo.
- [ ] La precarga respeta el presupuesto de memoria de la Fase 0.

**Verificación:**

- [ ] Manual: romper una imagen y reintentar; medir memoria durante la precarga.
- [ ] Playwright: zoom y controles.

**Dependencias:** F18; T05 (presupuesto de memoria).
**Archivos probables:** `apps/mobile/src/screens/reader/*` (parte 2), `apps/mobile/src/reader/*`.
**Tamaño:** M.

## Task F20: Ajustes (Configuración)

**Descripción.** Ajustes (RF-37 a RF-40): idioma de la interfaz, Mostrar NSFW, protección de
instalación, modo de lectura predeterminado, gestión de caché, respaldo (exportar/importar) y
"Acerca de y licencias". Se omiten perfil, sincronización, descargas y "Optimizar SQLite".

**Criterios de aceptación:**

- [ ] El interruptor NSFW está apagado por defecto (RF-34).
- [ ] No hay «Modo OLED negro puro», «Zonas táctiles» ni «Precarga» como ajustes (SPEC §11.5).
- [ ] El selector de tema no se muestra (solo Dragon Night).

**Verificación:**

- [ ] Playwright contra `ajustes_pantalla/screen.png`.
- [ ] Manual: cambiar NSFW y comprobar Biblioteca/Descubrir.

**Dependencias:** F11; T25 (settings/progreso).
**Archivos probables:** `apps/mobile/src/screens/settings/*`.
**Tamaño:** M.

## Task F21: Respaldo (UI)

**Descripción.** Interfaz de respaldo (RF-37, RF-38): exportar JSON a archivo y compartir;
importar con validación, elección fusión/reemplazo y lista de repos/módulos sugeridos para
confirmar uno por uno (nunca se instalan solos).

**Criterios de aceptación:**

- [ ] Exportar e importar reproducen biblioteca, carpetas, progreso y repos (AC-7, UI).
- [ ] Los repos/módulos del respaldo se muestran como sugerencias, sin instalar automáticamente.
- [ ] Un respaldo inválido se rechaza con mensaje claro.

**Verificación:**

- [ ] Playwright: exportar y reimportar en una instalación limpia.
- [ ] Manual: compartir el archivo.

**Dependencias:** F20; T28, T29 (respaldo núcleo).
**Archivos probables:** `apps/mobile/src/screens/settings/backup/*`.
**Tamaño:** M.

### 🚩 Checkpoint P-B (tras F11–F21)

- [ ] AC-1, AC-3 y AC-12 (móvil); AC-6 medido en la MiBox 4
- [ ] Ningún valor literal; componentes en la galería; estados resueltos
- [ ] Revisión humana

---

## Fase 7 — TV

## Task F22: Riel lateral + navegación espacial + foco

**Descripción.** Adaptación a TV: riel lateral izquierdo con foco (sin barra inferior),
navegación espacial, anillo de foco de 2 px `accent` con separación de 2 px y escala
tipográfica 1,25×. Reutiliza los componentes de la galería.

**Criterios de aceptación:**

- [ ] Foco siempre visible (no solo color) en todos los elementos interactivos.
- [ ] Escala 1,25× aplicada; márgenes seguros de TV.
- [ ] Navegación completa con D-pad.

**Verificación:**

- [ ] Manual en la MiBox 4: recorrer los 5 destinos con el control remoto.
- [ ] Playwright (web/TV emulado) para el foco con teclado.

**Dependencias:** Checkpoint P-B.
**Archivos probables:** `apps/mobile/src/tv/*`, ajustes en `apps/mobile/src/shell/*`.
**Tamaño:** M.

## Task F23: Lector para TV (D-pad)

**Descripción.** Mapeo del D-pad en el lector (RF-25): arriba/abajo desplazan o cambian de
página, izquierda/derecha cambian de página, OK muestra/oculta controles, Atrás sale. Foco
visible en los controles.

**Criterios de aceptación:**

- [ ] Todas las acciones del lector funcionan solo con el control remoto (**AC-9**).
- [ ] Los controles son grandes y el foco es visible.
- [ ] Sin animaciones en el lector.

**Verificación:**

- [ ] Manual: leer un capítulo completo en la MiBox 4 con D-pad (AC-9, AC-6).

**Dependencias:** F22, F18, F19.
**Archivos probables:** `apps/mobile/src/screens/reader/tv/*`.
**Tamaño:** M.

### 🚩 Checkpoint P-C (tras F22–F23)

- [ ] AC-9: todas las pantallas usables solo con el control remoto
- [ ] Revisión humana

---

## Fase 8 — Web + extensión

## Task F24: Cliente web (React + Vite): shell y riel

**Descripción.** Cliente web separado (D-3) que comparte `ui-tokens` y componentes con una
densidad compacta: riel lateral de 240 px, rejilla de 8 columnas, márgenes de escritorio.

**Criterios de aceptación:**

- [ ] Reutiliza tokens y componentes; no reimplementa estilos.
- [ ] Riel de 240 px y densidad compacta (SPEC §11.9).
- [ ] Sin peticiones externas (RNF-5), fuentes locales.

**Verificación:**

- [ ] Playwright: ancho de escritorio y móvil; cero peticiones externas.

**Dependencias:** Checkpoint P-C (o Checkpoint P-B para empezar), F04.
**Archivos probables:** `apps/web/{package.json,vite.config.ts,src/**}`.
**Tamaño:** M.

## Task F25: Pantallas web

**Descripción.** Portar las pantallas de la v1 al cliente web reutilizando componentes, con el
layout de escritorio (riel, rejilla). Ajustar los puntos de corte.

**Criterios de aceptación:**

- [ ] Las pantallas de la v1 funcionan en web con densidad compacta.
- [ ] Misma terminología y una sola etiqueta por concepto (SPEC §11.7).
- [ ] Estados de carga/vacío/error resueltos.

**Verificación:**

- [ ] Playwright: recorrer las pantallas web y comparar composición con los PNG.

**Dependencias:** F24, Checkpoint P-B.
**Archivos probables:** `apps/web/src/screens/*`.
**Tamaño:** M.

## Task F26: Extensión de navegador (protocolo HTTP)

**Descripción.** Extensión (SPEC §10) que recibe `{ id, url, method, headers, body? }`, comprueba
que el origen de la página es el de la app y que el dominio está autorizado, hace la petición y
responde `{ id, status, headers, body }`. Permisos opcionales por dominio.

**Criterios de aceptación:**

- [ ] Sin autorización de dominio no hay petición (SPEC §7.2).
- [ ] Responde solo al origen de la app.
- [ ] Cuerpo en texto o base64 según corresponda.

**Verificación:**

- [ ] Manual: cargar la extensión, autorizar un dominio y hacer una petición.
- [ ] Pruebas del manifiesto/permisos de la extensión.

**Dependencias:** F24.
**Archivos probables:** `apps/extension/{manifest.json,src/background.ts}`.
**Tamaño:** M.

## Task F27: Puente web ↔ extensión (Host sobre mensajes)

**Descripción.** Implementar el puerto `Http` de la web como mensajes a la extensión, y ejecutar
los módulos en un Web Worker sin DOM (SPEC §10). El núcleo no cambia: solo se añade el adaptador.

**Criterios de aceptación:**

- [ ] Los módulos corren en un Web Worker sin DOM.
- [ ] `Http` de la web pasa por la extensión; sin petición directa.
- [ ] Se lee un capítulo desde el navegador (**AC-10**).

**Verificación:**

- [ ] Manual: con la extensión instalada, leer un capítulo desde la web.
- [ ] Playwright: comprobar que las peticiones salen por la extensión.

**Dependencias:** F25, F26.
**Archivos probables:** `apps/web/src/ports/http.ts`, `apps/web/src/worker/*`.
**Tamaño:** M.

### 🚩 Checkpoint P-D (tras F24–F27)

- [ ] AC-10: se lee un capítulo desde el navegador con la extensión
- [ ] Revisión humana

---

## Verificación final (Parte 2)

## Task F28: Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12)

**Descripción.** Verificar cada pantalla con Playwright contra su `screen.png` (composición,
tokens, áreas táctiles, foco, cero peticiones externas), registrar diferencias aceptadas en
`design/stitch/DIFFS.md` y pasar la lista de 20 segundos de `DESIGN_RULES.md` §6. Incluye la
captura en dispositivo para AC-12.

**Criterios de aceptación:**

- [ ] Cada pantalla de la v1 comparada con su `screen.png`; sin diferencias de color, tipografía, radio ni espaciado.
- [ ] Diferencias registradas en `design/stitch/DIFFS.md`.
- [ ] Comprobaciones automáticas del `AGENTS.md` §5 en verde.

**Verificación:**

- [ ] Playwright sobre la **galería compilada para web**; captura en el POCO F5 Pro y la MiBox 4 (P2-9).
- [ ] Revisión humana de la lista de 20 s.

**Dependencias:** Checkpoint P-D.
**Archivos probables:** `apps/web/tests/e2e/*`, `design/stitch/DIFFS.md`.
**Tamaño:** M.

### 🚩 Checkpoint P-E — Fin de la Parte 2

- [ ] Todas las pantallas verificadas; diferencias registradas
- [ ] AC-12 y AC-13 completos; galería revisada
- [ ] Revisión humana y publicación de la primera versión

---

# Archivo 2 — Bloques completados podados del todo.md (2026-10-28 → 2026-11-08)

> Movidos aquí el 2026-11-12 al podar `tasks/todo.md` (queda solo pendientes).
> Contenido sin editar; las verificaciones 🧍 en dispositivo que quedaban dentro de
> estos bloques se consolidan en la sección «🧍 Verificaciones humanas pendientes» de `todo.md`.

### T05b Identidad de la app (P-71) `[Ops · Baja · N1]` ✅

Dep: P-71 · S · `apps/mobile/app.json`

- [x] `name` = `RyuuNest`, `slug` = `ryuunest`, `android.package` = `io.github.davidluciol.ryuunest`
- Verif: `expo config --type public` (los tres valores)
- **Hecho (2026-10-23):** aplicado en `apps/mobile/app.json`; el APK de calibración anterior queda como otra app al cambiar el package.
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
| --- | --- | --- |
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

### T32b ADR de congelación de API 1.0 `[BE · Alta · N5]` ✅

Dep: T32a · S · `docs/decisions/ADR-0003-congelacion-api-1.0.md`

- [x] El ADR marca la API 1.0 como estable o enumera los cambios requeridos; lista candidatos de 2.º sitio real (sin instalarlos)
- [x] Resultado anotado en `MEMORY.md` (preguntas abiertas SPEC §17.2)
- Verif: 🧍 revisar el ADR con el autor
- **Aceptado por el autor (2026-10-29):** D1 = A, D2 = `pages.imageHeaders`, D3 = `m440` (con `zonatmo`); valores propuestos aceptados. R1–R4 son T37–T40 y la puerta del 2.º sitio es T41 (abajo). SPEC §6.2–§6.6 y §17.2 actualizados en la misma rama.
- **Hecho (2026-10-29):** ADR-0003 (rama `docs/T32b-adr-congelacion-api-1.0`). Veredicto: la API 1.0 **no se congela todavía**. El modelo de datos y las firmas sí son congelables (3 módulos reales y 2 sitios falsos sin cambios de tipo); antes hay que hacer **R1** (ejecución y empaquetado de `script`: los tres módulos publicados son ES de 11–12 archivos y `ScriptLoader.load(source)` solo recibe la entrada), **R2** (formato declarativo sin documento ni validador; el CLI `test` omite los declarativos), **R3** (índice tolerante por entrada y `minAppVersion` real) y **R4** (semántica escrita y forma validada en ejecución). P-74 y P-75 se congelan; P-76 es herramienta del SDK. Decisiones del autor: **D1** (cómo se ejecutan los `script`), **D2** (cabeceras de imagen en declarativo) y **D3** (2.º sitio real; `m440` recomendado). El estado de SPEC §17.2 está en el ADR. Sin cambios de código ni de SPEC.
### T37 Contrato escrito y validado en ejecución (R4) `[BE · Intermedia · N3]` ✅

Dep: T32b · M · `docs/SPEC.md` §6.2–§6.5 (ya actualizado), `packages/core/src/contract/types.ts`, `runtimes/ModuleRuntime.ts`, `core/tests/contract/*`

- [x] Quitar las marcas «⚠️ Provisional» de `HostRequestInit`, `HostResponse`, `HtmlElement` y `HtmlDocument` (sin cambios de forma)
- [x] `guardApi` valida la forma **mínima** que exige el contrato (`Page`, `SeriesDetails`, `ChapterPages`: campos obligatorios y tipos básicos) y devuelve `PARSE` si falta; tolera campos extra (`related` de `zonatmo`)
- [x] Fixtures de `zonatmo`, `m440` y `yupmanga` como regresión: pasan la validación
- [x] Pruebas del arnés y de `guardApi` en rojo antes de implementar
- Verif: `pnpm --filter @ryuunest/core test`
- **Hecho (2026-11-01):** rama `feature/T37-guardapi-contract-shape`. `contractShape.ts` (validadores puros) aplicado en `guardApi` por método; reglas de forma (ADR-0003): `items` vacía válida (m440/yupmanga paginan a una sola página), `chapters` vacía válida (T39 L2), `images` nunca vacía (la app ya lo trataba como `PARSE` en `ReadingSource`) y `releases` con al menos una edición por capítulo. Fixtures con las **formas** leídas del código publicado (zonatmo 0.2.0, m440 0.1.0, yupmanga 0.1.0; valores inventados, sin red) montadas por el camino real (`createModuleApi` + módulo script), más un daño mínimo por módulo que la validación debe cazar. TDD: 17 casos en rojo primero. La validación cazó un fixture de web fuera de contrato (`seriesData.test.ts`, capítulos sin releases) y se corrigió el fixture. **Hallazgo para T41:** `runContract` exige «al menos un capítulo con dos releases» y m440/yupmanga nunca la cumplen (una release por capítulo por construcción): T41 debe relajar esa regla del arnés o ambos módulos no pueden pasar su puerta.
### T34 Pruebas de resiliencia `[BE · Intermedia · N3]` ✅

Dep: T08, T14 · S · `core/tests/resilience/*.test.ts`

- [x] Módulo que cuelga → `TIMEOUT` sin bloquear el núcleo (con `maxConcurrent: 1`, la siguiente petición solo funciona si el slot se liberó); excepciones contenidas con `last_error` (error tipado → su código; error suelto → `INTERNAL`)
- [x] Reintento manual sin reiniciar (falla la 1.ª llamada, la 2.ª resuelve); rate-limit por dominio respetado bajo carga (6 peticiones concurrentes, inicios espaciados ≥ `minDelayMs` − holgura) y dominios distintos no se bloquean entre sí
- Verif: `pnpm --filter @ryuunest/core test -- resilience` (467 en verde)
- **Hecho (2026-11-01, rama `feature/T34-T35-resilience-ci-gates`):** el test en rojo cazó que `respectDelay` no era atómico (bajo carga, dos inicios con 1 ms de diferencia); arreglo en `ModuleHost` con cadena de promesas por dominio. Mutaciones verificadas: quitar `release()` o `record()` hace fallar los tests. Timers: retardos reales cortos (decisión del humano).

### T35 Puertas de CI / contrato / cobertura (AC-11) `[Ops · Baja · N2]` ✅

Dep: T02, T32a · S · `.github/workflows/ci.yml`, `core/tests/contract/gate.test.ts`

- [x] CI falla si la cobertura del contrato baja: cobertura **funcional** (decisión del humano 2026-11-01, sin paquete de coverage nuevo) — `core/tests/contract/gate.test.ts` recorre la matriz runtime (declarativo-HTML, script-HTML, script-JSON) × 5 métodos vía `createModuleApi` y falla si falta alguno; corre en el paso «Contrato» del CI (`vitest run contract`). Mutación verificada: exigir un método extra hace caer los 4 tests del gate
- [x] `pnpm -r test && pnpm -r typecheck && pnpm lint` es la puerta única de fusión (un paso del job `ci` en `.github/workflows/ci.yml`); contratos de ambos runtimes corren en CI en el paso «Contrato»
- [x] AC-11 «compilación del APK»: paso «Bundle Android» con `expo export -p android` en `apps/mobile` (decisión del humano 2026-11-01; bundle nativo sin APK firmado ni credenciales)
- Verif: `pnpm -r test && pnpm -r typecheck && pnpm lint` en verde + 🧍 PR de prueba que rompe el contrato y falla el CI (pendiente del humano)

### T36 Núcleo de diagnóstico y errores (P-72) `[BE · Intermedia · N3]` ✅

Dep: T21 · M · `packages/core/src/diagnostics/*`, `packages/core/src/storage/{schema,migrations}.ts` (+test)

- [x] Migración nueva con tabla `log` (`at`, `level`, `code`, `message`, `context`, `app_version`, `platform`); tope **500 entradas** (borra las más viejas)
- [x] `record`/`list`/`clear`/`export`; niveles `info`/`warn`/`error`; contexto saneado
- [x] Redacción estricta: sin credenciales, cookies, cabeceras, HTML, títulos, URLs completas ni rutas locales
- [x] Export **JSON + texto legible**; sin red ni telemetría
- Verif: `pnpm --filter @ryuunest/core test`
- **Origen:** P-72 (2026-10-23); independiente del Checkpoint J.
- **Hecho (2026-10-28):** rama `feature/T36-diagnostics-log`, PR #49. `createLogStore` (`record`/`list`/`clear`/`export` json+texto) + `sanitize.ts` (URLs, cabeceras con credenciales, HTML, rutas Android/Windows; trunca mensaje 500 y contexto 2500). Migración 2 con `log` (sin índice propio: 500 filas hacen scan acotado; el test de esquema quedó intacto salvo la tabla nueva). 16 tests; core 419 en verde. El test en rojo cazó un fallo real: el patrón de cabeceras dejaba el valor tras `Bearer `.
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
- [x] Al tocar una serie, navegar a la ficha (F17)
- Verif: [x] Vitest (10 tests nuevos: adaptador `Http`, fuente instalada sobre SQLite real, `setting`) · [x] Playwright sin cambios de comportamiento en web (`discover.cjs` y `library.cjs` en verde) · [ ] 🧍 POCO con un módulo instalado desde F16

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
- Verif: [x] Vitest (SQLite real: auto-registro, descarte, restaurar, fallo) · [x] Playwright (`sources.cjs` y `settings.cjs` sin regresión) · [x] 🧍 POCO con el repo real

### F12 Primer uso (3 pasos) + estado vacío `[FE · Intermedia · N3]` ✅

Dep: F11, FB1, F16, T15 · M · `apps/mobile/src/screens/onboarding/*`

- [x] Guía hasta añadir un repo (URL del repo oficial ya puesta, P-85) y activar un módulo con la confirmación de Fuentes (hoja `InstallSheet` compartida); nada se instala sin confirmación (AC-8); «Saltar» en cada paso (decisión del humano)
- [x] En TV se omite «Importar respaldo» hasta F21b (anotado en `design/stitch/DIFFS.md`)
- [x] La puerta sustituye a Inicio en el primer uso real (sin repos ni módulos; marca `onboarding.completed`); en web nunca hay primer uso (P-79)
- Verif: [x] Vitest (controlador 8, puerta 3) · [x] Playwright del flujo en la galería (`tests/e2e/onboarding.cjs`, 426 y 1440, AC-8 comprobado; capturas en `docs/capturasF12/`) · [ ] 🧍 dispositivo
### F18 Lector 1 `[FE · Alta · N4]` ✅

Dep: F17; T25, T27 · M · `apps/mobile/src/screens/reader/*`

- [x] Modo recordado por serie; centro muestra/oculta controles; guarda `page_index`+`page_total`; reabre en la página exacta
- [x] Nada decorativo sobre el contenido; sin animaciones en el lector
- Verif: [x] Playwright (`tests/e2e/reader.cjs`, 426 y 1440 px; capturas en `docs/capturasF18/`) vs `pantalla_lector/screen.png` · [ ] 🧍 60 páginas en MiBox 4 sin OOM (AC-6)
- **Hecho (2026-10-28, rama `feature/F18-F19-reader`, junto con F19):** ruta `reader/[moduleId]/[seriesId]/[chapterId]?release=` fuera del shell; vertical continuo (solo se montan las imágenes de la ventana del núcleo) y paginado (D→I / I→D, laterales invertidas); barras `elevated` al 95 %; hojas de modo y de capítulo; tarjeta de siguiente capítulo; `ReaderController` (guardado con retraso de 800 ms, `close()` al salir, reabre en la página exacta). La ficha (F17) ya lee `details()` real con progreso y leídos, y abre el lector. Núcleo: `ReaderState` acepta `defaultMode` (aditivo).

### F19 Lector 2 `[FE · Alta · N4]` ✅

Dep: F18; T05 · M · `apps/mobile/src/{screens/reader,reader}/*`

- [x] Imágenes con `ImageRef.headers` (RF-24); fallo de imagen → reintento individual, sin descartar el capítulo
- [x] Zoom con pellizco, pantalla encendida; precarga dentro del presupuesto de memoria de la Fase 0
- Verif: [x] Playwright (zoom con dos dedos por CDP, imagen rota y reintento, WakeLock) · [ ] 🧍 romper una imagen y medir memoria en precarga (POCO)
- **Hecho (2026-10-28):** `expo-image` (cabeceras, caché a disco, `prefetch`) y `expo-keep-awake` (autorizadas por el humano); zoom con `PanResponder` (sin gesture-handler); precarga a disco de las páginas por delante (paginado) y de las 2 primeras del siguiente capítulo al acercarse al final. **Pendiente de medir (P-45):** `READER_IMAGE_BUDGET_MB` es `null`; sin cifra no hay tope de memoria, solo el máximo fijo.

### F20 Ajustes `[FE · Baja · N2]`

✅ Ajustes globales conectados con Biblioteca, Descubrir y el lector; OLED, zonas
táctiles, precarga configurable y temas se omiten por no pertenecer a la v1.

Dep: F11, FB1; T25 · M · `apps/mobile/src/screens/settings/*`

- [x] Idioma español preparado para futuras traducciones, NSFW apagado por defecto (RF-34), protección de instalación (RF-7), modo global de lectura y vaciado de caché (RF-39)
- [x] NSFW se propaga a Biblioteca y Descubrir; el modo global llega al lector como fallback sin pisar la preferencia de una serie
- Verif: [x] Vitest, lint, tipos, build/export web y auditoría web interactiva · [ ] Playwright oficial bloqueado porque el entorno no incluye el paquete `playwright` · 🧍 POCO pendiente
- **Hecho (2026-10-28):** `SettingsService` persiste `settings.nsfwVisible` y `settings.defaultReaderMode`, comparte cambios entre pantallas, usa `expo-image` para vaciar caché nativa y mantiene español como único idioma disponible en v1. La UI usa componentes existentes, tokens e i18n; la captura de Stitch se toma solo como composición y no se inventan cifras de almacenamiento.

### Hallazgos UX/UI consolidados antes del merge

Estos hallazgos se incorporan a las tareas pendientes existentes; no se corrigen dentro de F20:

- **F14a/F14b:** los filtros de tipo y fuente siguen siendo chips provisionales; el orden cicla al pulsar y necesita un menú explícito; la fuente debe mostrar el nombre del `ModuleRegistry`, no el id técnico.
- **F17:** favorito, carpeta y release preferida todavía no sobreviven a un reinicio; la ficha necesita cerrar esa persistencia antes de considerarse completa.
- **F21a–F21c:** falta toda la experiencia de respaldo en Ajustes: exportar, importar, confirmar reemplazo y revisar sugerencias sin instalar automáticamente.
- **FB2/F29–F31:** faltan patrones consistentes de toast, modal, banner, diagnóstico, estados vacíos/error y registro saneado de errores; además, F20/F16 no muestran todavía una confirmación de éxito del vaciado de caché.
- **F22/F23:** falta la experiencia TV completa: navegación espacial, foco visible, márgenes seguros y lector usable solo con D-pad.
- **F24–F27:** el cliente web, sus pantallas, la extensión y el puente HTTP todavía no existen como recorrido funcional.
- **F28/F33:** queda una revisión transversal de copy, overflow, estados, contraste, foco, red externa y comparación con Stitch en móvil, escritorio y TV; Playwright debe estar disponible para cerrar la verificación automática.

### F21 Respaldo (UI) — dividida en tres tareas (2026-10-23)

> El humano pidió tratar como tareas separadas lo que quedó fuera de T29. F21a–F21c sustituyen a la F21 única; FB1 se lee en las tres.

#### F21a Exportar y compartir respaldo `[FE · Intermedia · N3]` ✅

Dep: F20, FB1; T28 · S · `apps/mobile/src/screens/settings/backup/*`

- [x] Exporta con `exportBackup` y comparte el archivo con la hoja del sistema (RF-37)
- [x] Estado de error si falla la escritura o el compartir
- Verif: [x] Playwright en web (`tests/e2e/backup.cjs`, descarga real verificada) · [ ] 🧍 compartir el archivo en un teléfono

#### F21b Importar respaldo `[FE · Intermedia · N3]` ✅

Dep: F21a, F29; T29, T36 · M · `apps/mobile/src/screens/settings/backup/*`

- [x] Elegir archivo, leerlo y aplicar `merge` o `replace` con `importBackup` (RF-38)
- [x] Rechazo `TOO_LARGE` / `NOT_JSON` / `INVALID` con mensaje claro y sin tocar datos (diálogo con motivo y detalle)
- [x] Confirmación explícita antes de `replace` (destructivo)
- Verif: [x] Playwright exportar/reimportar en web (hoja de modo, confirmación de reemplazo, rechazo NOT_JSON) · [ ] 🧍 archivo real en el teléfono

#### F21c Sugerencias de repos y módulos `[FE · Baja · N2]` ✅

Dep: F21b; T29 · S · `apps/mobile/src/screens/settings/backup/*`

- [x] Lista las sugerencias de `importBackup` en una hoja tras importar; nada se instala solo (AC-8)
- [x] Descarta los repos ya registrados (`RepoRegistry.listRepos`) y los repetidos
- [x] Confirmar un repo lo registra (descarga su índice, RF-2); un módulo apunta a Fuentes con su flujo de instalación y confirmación (RF-38)
- Verif: [x] Playwright + tests de la lógica de filtrado (sobre SQLite real)

- **Hecho (2026-10-28):** rama `feature/F21-backup-ui`, un commit para F21a+F21b+F21c (P-102: comparten capa de datos, flujo y componentes; un corte intermedio no compilaría solo). Puerto de archivos `data/backupFiles{,.native}.ts` (expo-sharing/file-system/document-picker en nativo; descarga + input file en web). Sección «Respaldo» en Ajustes (P-96), diálogo merge/replace con confirmación explícita (P-97), hoja de sugerencias tras importar (P-98), «Importar respaldo» habilitado en el paso 2 del primer uso en TV y en la galería/web (P-99). 23 tests nuevos (9 capa de datos sobre SQLite real + 14 flujo/controlador); e2e `backup.cjs` en 426 y 1440 px con capturas en `docs/capturasF21/`; e2e de settings y onboarding ampliados y en verde. Sin diseño en Stitch (P-30, DIFFS.md); prompt en `design/stitch/PROMPT-FB2-respaldo-errores.md`.
### FB2 Diseño en Stitch de errores y Diagnóstico `[Ops · Baja · N2]` ✅

Dep: FB1, F06, F20 · S · `design/stitch/` (PNG/HTML)

- [x] Toast, modal y banner con estados (info, warning, error, con acción, expandido) — los dos diseños de Stitch (`banner_inline_de_error_y_toast_dragon_night`, `di_logo_de_error_bloqueante_dragon_night`) los añadió el humano en `8c1457c`
- [x] Ajustes → Diagnóstico: lista, exportar, copiar, borrar y estado vacío (`ajustes_diagnostico_dragon_night`, `diagnostico_confirmar_borrado_dragon_night`, `diagnostico_vacio_dragon_night`, `ajustes_fila_diagnostico_dragon_night`)
- [x] Estados vacíos a pantalla completa (dragón, título y acción): `estados_vacios_dragon_night` (Biblioteca, Descubrir, sin resultados)
- Verif: 🧍 revisión y exportación a `design/stitch/`
- **Hecho (2026-10-29):** rama `feature/FB2-F30-diagnostics`. Diseños compuestos con `stitch-design-taste` + `ui-ux-pro-max` (confirmación destructiva, vacío con acción) sobre `DESIGN.md` y los tokens, como HTML local (`design/stitch/_shared/dragon-night.css`, fuentes locales, cero CDN) y PNG renderizado con Playwright. Los diseños del humano traen avatar «L», búsqueda inerte y un toast truncado con «…»: se anotan en `DIFFS.md` y entran en F34.

### F29 Componentes de error: toast, modal y banner `[FE · Intermedia · N3]` ✅

Dep: F06, F10, FB2 · M · `apps/mobile/src/components/*`

- [x] Toast 4 s, una línea y acción opcional; no bloquea
- [x] Modal (diálogo) con título, explicación simple, código, detalle expandible y acciones (cerrar, reintentar)
- [x] Banner inline para error de módulo con causa, código, reintentar y detalle (F15)
- [x] Todos los estados en la galería; tokens, i18n y sin animación en el lector
- Verif: Playwright + galería
- **Hecho (2026-10-28):** rama `feature/F29-error-components`, PR #50. `Toast`, `ErrorBanner`, `ErrorDialog` + `errorNoticeStyles.ts` (lógica pura, 11 tests). Severidad info/warning/error fija el color del borde y del código. Sin diseño en Stitch (P-30, anotado en DIFFS.md): FB2 los rediseñará; el prompt para generarlos está en `design/stitch/PROMPT-FB2-respaldo-errores.md`. La acción «copiar/exportar» del modal queda para F30 (Diagnóstico), cuando exista el informe que copiar. `Button` ganó `testID` (faltaba para los e2e); `ModuleRow` ganó `hint`.

### F30 Ajustes → Diagnóstico `[FE · Baja · N2]` ✅

Dep: F20, F29, T36 · S · `apps/mobile/src/screens/settings/diagnostics/*`

- [x] Ver últimos registros, exportar (JSON + texto), copiar informe y borrar
- [x] Estado vacío y confirmación antes de borrar
- Verif: [x] Playwright (`tests/e2e/diagnostics.cjs`, 426 y 1440 px, descarga y portapapeles reales) · 🧍 compartir el archivo y copiar en el POCO
- **Hecho (2026-10-29):** ruta `/diagnostics` (fuera de pestañas, `dismissTo("/settings")`) con la fila «Registro de diagnóstico» en Ajustes. Núcleo: `formatLogEntries` (puro, compartido por la tienda SQLite y el servicio de ejemplo). App: `DiagnosticsService`, flujo (reductor puro) y controlador (fallos con texto fijo, sin detalle técnico), vista pura (nivel, «Hoy/Ayer/Hace N días», detalle), puertos `diagnosticsFiles{,.native}` y `clipboard{,.native}` (dependencia `expo-clipboard ~57.0.2`, autorizada por el humano), componente `LogEventRow` en la galería. Un solo primario («Exportar informe»); confirmación de borrado en `SheetModal`. Chip y EmptyState dejaban de verse en serif: ahora usan `textStyle` (el resto de componentes afectados va a F34). 34 tests nuevos (core 3, mobile 31).
### F24 Cliente web (React + Vite) `[FE · Intermedia · N3]`

Dep: P-B (o P-C), F04 · M · `apps/web/{package.json,vite.config.ts,src/**}`

- [x] Reutiliza tokens/componentes; riel 240 px, rejilla de 8 columnas; fuentes locales, cero peticiones externas (RNF-5) — hecho en `feature/F24-F25-web-client` (P-110 a P-115): tokens como CSS virtual generado en vivo por el plugin de Vite (`emitTokensCss`, puerta `tokensCss.test.ts` contra literales), componentes DOM propios con tokens, fuentes en `apps/web/public/fonts/`, `base: "/"` para rutas profundas, i18n en `@ryuunest/i18n` (P-112). Stack fijado: react-router 7.18.5, vite 8.3.5, sql.js 1.15.2, lucide-react 1.66.0 (P-110).
- Verif: Playwright en ancho escritorio y móvil — e2e `apps/web/tests/e2e/{shell,sources,discover,reader,settings}.cjs` en verde a 1440/426 px con 0 errores de consola y 0 peticiones externas no autorizadas; capturas en `docs/capturasF24/`.
### F26 Extensión de navegador (protocolo HTTP) `[Sec · Alta · N4]`

Dep: F24 · M · `apps/extension/{manifest.json,src/background.ts}`

- [x] Recibe `{id,url,method,headers,body?}`; responde solo al origen de la app; sin dominio autorizado no hay petición (SPEC §7.2) — hecho en `feature/F26-F27-extension-bridge` (un PR con F27, decisión del humano; commits etiquetados `F26`/`F27`). Paquete compartido `@ryuunest/extension-protocol` (mensajes estrictos + base64); `apps/extension` (Vite 8.3.5 + `@types/chrome`): manifiesto MV3 único para Chrome/Edge y Firefox (`service_worker` + `scripts`), `optional_host_permissions`, content script solo en `localhost:5173/4173` (P-116), fondo con `handleMessage` (origen → host exacto autorizado → `fetch` sin credenciales → texto con charset o base64), `Referer`/`Origin`/`User-Agent` con reglas `declarativeNetRequest` de sesión por URL exacta, y página de opciones React con los componentes de la web (autorizar varios hosts con un solo gesto/aviso, quitar permiso). P-116 a P-120.
- Verif: pruebas del manifiesto/permisos (9) + lógica del fondo, puente y opciones (~120 en total) · e2e en Chromium con la extensión real (`apps/extension/tests/e2e/{extension,options}.cjs`, capturas en `docs/capturasF26/`) · 🧍 cargar la extensión **en Chrome y en Firefox** y autorizar un dominio con el aviso real del navegador (ver `apps/extension/README.md`; Playwright no puede pulsar ese aviso)

### F27 Puente web ↔ extensión `[FE/BE · Alta · N4]`

Dep: F25, F26 · M · `apps/web/src/{ports/http.ts,worker/*}`

- [x] Módulos en Web Worker sin DOM (ya desde F25); `Http` web solo vía extensión; se lee un capítulo en el navegador (AC-10) — `createExtensionHttp` (ping compartido, validación previa, correlación por id, errores → `ExtensionHttpError`), `openWebServices` sin `fetch` directo (**retira el TEMPORARY P-111**), aviso `Banner`/`ExtensionNotice` (falta la extensión → Recargar; dominio por autorizar → Abrir extensión), y las imágenes del lector con cabeceras por la extensión (`fetchImageBlob`); sin cabeceras siguen en `<img>` directo (decisión del humano, P-118).
- Verif: e2e `bridge.cjs` con **todo real** (web construida + extensión real + servidor HTTPS local con módulo `script`, `Referer` exigido y `.zip` verificado por SHA-256; la página no habla con el sitio; control negativo comprobado) · e2e `extensionNotice.cjs` y los cinco e2e previos con un doble de la extensión (`fakeExtension.cjs`) a 1440/426 px · 🧍 leer un capítulo con la extensión instalada en tu navegador y con un sitio real
- [ ] Pendiente (no bloquea el PR): iconos de la extensión (no hay arte; el manifiesto va sin `icons`), origen de producción de la PWA (hoy solo `localhost`, P-116) y ficha de publicación en las tiendas.
### F32 Recorrido real mínimo: módulo → Descubrir → ficha → lector `[FE/QA · Alta · N4]` 🧍

Dep: F16, F17, F18, F19 · M · dispositivo Android con red real y un módulo del repo oficial

> **Nota (2026-11-07, P-139):** F32 se escribió antes de que existiera `RyuuNest-Models` y pedía un módulo **declarativo**. Los tres módulos oficiales son `script` y ya se ejecutan en el dispositivo (T40, P-137), así que el recorrido se hace con un módulo `script` del repo oficial. Se trata como **revisión**: si el recorrido pasa se marca hecha y se anotan las observaciones; si falla, se abre una tarea con código, URL y paso exacto.

- [x] Desde el repo oficial, instalar manualmente un módulo; confirmar permisos, hash y resultado. (YupManga desinstalado y reinstalado desde Portales: la hoja muestra permisos y la huella SHA-256 igual a la del índice, y «mantén pulsado» para instalar; **P-131 no se reproduce**.)
- [x] Abrir Descubrir, seleccionar el módulo instalado y **buscar** una obra. (Búsqueda «kiss» en M440: resultados en la sección Catálogo, con la tecla «buscar» del teclado.)
- [x] Abrir la ficha de la obra desde Descubrir y comprobar metadatos y capítulos (título completo, alternativos, géneros, sinopsis, 42 capítulos). **Portada en blanco** en M440 y YupManga (ver observaciones).
- [x] Abrir un capítulo y confirmar que el lector carga una imagen real: M440, «Kiss the Coming Apocalypse», cap. 1, 11 páginas en vertical continuo. El fallo deja estado accionable: YupManga muestra `UNSUPPORTED` con Reintentar, Ver detalle y Volver; con el Wi-Fi y los datos apagados ZonaTMO muestra «No se pudo cargar la página 26» con Reintentar, que recupera la imagen al volver la red.
- [x] Registrar módulo, obra, dispositivo, versión de la app, resultado y capturas (ver MEMORY.md, hito F32).
- Verif: recorrido manual en S25 Ultra (SM-S938B, Expo Go 57.0.9, app 0.0.0) el 2026-11-07/08. POCO F5 Pro: sustituido por el S25 Ultra (decisión del humano). MiBox 4: fuera por ahora. Este recorrido cubre AC-2, AC-3 y AC-8 con datos reales y no se sustituye por fixtures.

### F33 Revisión general UX/UI observable `[FE/QA · Intermedia · N3]` ✅ 🧍

Dep: F20, F21, F22, F28, F32 · S · pantallas móviles, escritorio y TV disponibles

> **Entregable (decisión del humano, 2026-11-08):** solo el análisis, sin desarrollar. Vive en `tasks/Analisis.md` (separado de este archivo) con 64 hallazgos clasificados, capturas en `docs/capturasF33/` y las tareas propuestas F40 a F45.

- [x] Recorrer Inicio, Biblioteca, Descubrir, Fuentes, Ajustes, ficha y lector con datos vacíos, datos normales y error cuando aplique. (Web 273 a 1600 px con Playwright y nativo en el S25 Ultra; primer uso real tras borrar los datos de Expo Go.)
- [x] Revisar copy y jerarquía: una etiqueta por concepto, sin jerga técnica, sin funciones v2 anunciadas y sin títulos truncados.
- [x] Revisar visualmente tokens, contraste, foco, áreas táctiles, overflow, estados no dependientes solo del color, fuentes locales y ausencia de peticiones externas.
- [ ] Revisar la navegación con teclado/D-pad y la legibilidad a 426 px, 1440 px y la densidad TV; anotar toda diferencia aceptada en `design/stitch/DIFFS.md`. (426 y 1440 px hechos; **TV y D-pad siguen en F22/F23/F37**.)
- [x] Clasificar cada hallazgo como bloqueante, importante o menor; cada bloqueante/importante enlaza a una tarea existente o propuesta (F40 a F45, F35, F38).
- Verif: lista de 20 segundos pasada en `tasks/Analisis.md` §9. 🧍 Pendiente (R1): hoja «Actualizar módulo» (a la espera de una actualización real de un módulo), hojas de Respaldo, diálogos de error nativos y modo paginado I → D.
- [x] **Parches de Expo SDK 57 actualizados** (hecho 2026-11-05, autorizado por el humano; misma rama/PR): `expo` 57.0.32, `@expo/metro-runtime` 57.0.18, `expo-constants` 57.0.23, `expo-router` 57.0.30 y `expo-sharing` 57.0.25. `npx expo install --check` y `expo-doctor` en **21/21**; gate completo en verde (lint, typecheck, 1534 tests, build) y e2e web `shell`/`library` en verde. `pnpm-workspace.yaml` recibió los `minimumReleaseAgeExclude` de los paquetes nuevos (política de suministro de pnpm 12).
- [x] **URGENTE — Fuentes no lista los módulos del repo instalado** (hecho 2026-11-06, rama `fix/urgente-fuentes-modulos-repo`). Tres causas encadenadas, comprobadas en el S25 Ultra: (1) la ruta de Fuentes no pasaba `nsfwVisible` y `SourcesScreen` ocultaba los 3 módulos oficiales (todos NSFW; RF-35 solo cubre Inicio, Biblioteca y Descubrir); (2) la app móvil no tenía `ScriptLoader`, así que Descubrir no listaba módulos `script` (T40): ahora `createFunctionScriptLoader` (`new Function`, el spike confirmó que Hermes lo admite, P-83 corregido); (3) `useDiscoverData` elegía el módulo inicial con `nsfwVisible=false` fijo y quedaba vacío aunque se activara NSFW (`reconcileSelectedModuleId`). Descubrir además avisa «Tus portales están ocultos» con botón a Ajustes. Recorrido verificado: Fuentes → instalar ZonaTMO → Descubrir → ficha → capítulo con 31 imágenes visibles en modo vertical. Con la tarea T40 (spike y cargador) queda hecha en la parte de dispositivo; falta el spike de `m440` y `yupmanga`, y T41 (🧍).
- [x] **Renombrar las secciones con el mundo dragón** (hecho 2026-11-06, rama `feature/rename-secciones-dragon`): Inicio → **Guarida**, Biblioteca → **Tesoros**, Descubrir → **Aventuras**, Fuentes → **Portales**. Decisión del humano: solo textos visibles (las claves i18n y las rutas no cambian) y todos los literales de UI que nombran la sección; nota de nomenclatura en SPEC §1. Capturas de F11 regrabadas; e2e del shell en verde. Lista de textos cambiados en el PR.

---

## Tareas completadas retiradas de `todo.md` el 2026-11-16 (reorganización por secciones)

### T38 Compatibilidad hacia delante ejecutable (R3) `[BE · Intermedia · N4]`

Dep: T37 · M · `packages/module-sdk/src/{repoIndex,manifest,cli}.ts`, `packages/core/src/{contract/repoIndex,repo/RepoRegistry}.ts`, `apps/mobile/{app.json,src/screens/sources/useSourcesData.ts}`

- [x] Índice tolerante **por entrada**: `apiVersion`, `runtime` o `kinds` desconocidos marcan la entrada «no compatible» y no invalidan el repo; las rotas se descartan con aviso
- [x] `minAppVersion?` opcional en `RepoModuleEntry` (aditivo) y la app oculta/etiqueta lo incompatible antes de descargar
- [x] `app.json` con versión real y la app la pasa al validador (`Constants.expoConfig?.version`); `minAppVersion` se aplica de verdad
- [x] El CLI no comprueba `minAppVersion` salvo con `--app-version`
- [x] Pruebas: un índice con un módulo `apiVersion: 2` sigue listando los de v1
> **Hecho (2026-11-14, `feature/T38-compatibilidad-hacia-delante`):** `app.json` en 0.1.0; `validateRepoIndex` devuelve `modules` (compatibles) + `incompatible` + `warnings`; `RepoRegistry.listIncompatible`; `SourcesData.incompatible` (sin etiqueta visual: queda para una tarea de UI).
- Verif: `pnpm -r test` + 🧍 corregir en `RyuuNest-Models` la frase «un campo de más o de menos lo rechaza» de su `AGENTS.md`


### T39 Formato declarativo cerrado y comprobable (R2, D2) `[BE · Alta · N4]`

Dep: T38 · L (dividir en 2 PRs si pasa de ~5 archivos por corte) · `docs/declarative-format.md`, `packages/core/src/runtimes/{DeclarativeRuntime,transforms}.ts`, `packages/module-sdk/src/*`, `packages/module-sdk/templates/declarative/*`

- [x] `pages.imageHeaders` (mapa de cabeceras con `{baseUrl}`, `{chapterId}`, `{releaseId}`) rellena `ImageRef.headers`; el lector ya las aplica
- [x] Serie sin capítulos devuelve `chapters: []` en vez de `PARSE` (L2)
- [x] `validateDeclarativeConfig` en `module-sdk`, usado por `ryuunest-module validate`
- [x] `ryuunest-module test` ejecuta el arnés también con módulos declarativos (retirar la omisión de `cli.test.ts`)
- [x] `docs/declarative-format.md` normativo a partir del Anexo B del ADR; SPEC §6.6 lo enlaza
- [x] L3–L6 del ADR (extra, fechas, id sin codificar, mapas de `status`/`kind`): decidir aquí cuáles entran; el resto queda como aditivo → **entran los cuatro** (decisión del humano)
- Verif: `pnpm -r test` + contrato declarativo con `imageHeaders`
> **Hecho (2026-11-14, `feature/T39-formato-declarativo`):** `extra`, `date`, `{x:raw}` y `map` además de L1/L2; todo «desde la app 0.2.0» (la plantilla declara `minAppVersion`). Detalle en `MEMORY.md` P-144.


### T40 Ejecución y empaquetado de módulos `script` (R1, D1 = A) `[BE · Alta · N4 → N5]`

Dep: T38 · L · `packages/core/src/ports/scriptLoader.ts`, `runtimes/{ScriptRuntime,ModuleRuntime}.ts`, `apps/mobile/src/data/moduleMounter.ts`, cargador de plataforma (nuevo)

> **Ya hecho (2026-11-06, `fix/urgente-fuentes-modulos-repo`):** el spike de dispositivo con `zonatmo` confirma que Hermes admite `new Function` (P-83 corregido); la app móvil tiene `createFunctionScriptLoader` y Descubrir lista módulos `script`. Falta lo de abajo.

- [x] `ScriptLoader.load` recibe el paquete (ruta → texto) y la ruta de entrada; el montador deja de pasar solo `manifest.entry`
- [x] Contrato a autores documentado: módulo ES, `export default create(host)`, solo imports relativos dentro del paquete, sin `import()` ni paquetes, entorno ECMAScript estándar (SPEC §6.5) → SPEC §6.5 con las formas admitidas + README de la plantilla `script`
- [x] 🧍 **Spike de `m440` y `yupmanga`** en el dispositivo (el de `zonatmo` ya pasó); si falla: marcar `script` como experimental (plan C del ADR), anotar la decisión y reabrir D1; escalar a N5 → **hecho (2026-11-14, S25 Ultra, Expo Go, agent-device):** M440 0.1.0 (listas, ficha de 378 capítulos con la lista cifrada, capítulo de 18 páginas con imágenes) y YupManga 0.1.1 instalado por `InstallFlow` (listas, ficha de 7 capítulos, capítulo de 152 páginas con imágenes). Portadas en blanco en ambos (F35). M440 se actualizó a 0.2.0 después, en T43.
- [x] Desbloquear en la app los módulos `script` (`createInstalledMounter` deja de lanzar `UNSUPPORTED`): Descubrir y Lector montan con `createFunctionScriptLoader`
- [x] `ryuunest-module test` carga los `script` con el mismo cargador que la app (decisión del humano)
- Verif: pruebas del cargador con paquetes de varios archivos + 🧍 spike en el dispositivo
> **Hecho (2026-11-14, `feature/T40-modulos-script`):** CLI con el cargador de la app; los tres módulos publicados (zonatmo 0.3.0, m440 0.2.0, yupmanga 0.1.1) cargan con `createFunctionScriptLoader` en Node. «script» deja de ser experimental (decisión del humano); el spike de M440/YupManga pasó en el dispositivo. Detalle en `MEMORY.md` P-145.


### T41 Puerta del 2.º sitio real: `zonatmo` y `m440` en la app (D3) `[Ops · Baja · N2]` 🧍

Dep: T39, T40 · S · sin código (salvo ajustes que salgan)

- [x] Ambos módulos pasan su arnés con fixtures propias (repo `RyuuNest-Models`) — la regla «un capítulo con dos releases» se relaja con la opción **opt-in** `singleReleasePerChapter` de `runContract` (decisión del humano); m440 la usa, zonatmo no la necesita
- [x] Se instalan por `InstallFlow` en el dispositivo y ejecutan `popular` o `latest`, `search`, `details` y `pages`, y se ve una imagen en el lector
- [x] Ningún cambio de tipos del modelo de datos; si hace falta uno, se reabre el ADR
- Verif: 🧍 prueba en el dispositivo (S25 Ultra; POCO si vuelve a estar disponible)
> **Hecho (2026-11-14, `feature/T41-puerta-segundo-sitio` + rama `test/T41-arnes-fixtures-propias` en `RyuuNest-Models`):** `runContract` acepta `singleReleasePerChapter`; los tests de zonatmo y m440 en `RyuuNest-Models` llaman al arnés con sus fixtures (m440 añade ficha con capítulos cifrados y capítulo, datos inventados). En el S25 Ultra (Expo Go, agent-device, red real): ZonaTMO 0.3.0 instalado por `InstallFlow`, listas, búsqueda «dragon», ficha de 30 capítulos y lector de 80 páginas con imagen; M440 0.2.0 listas, búsqueda «kobayashi», ficha de 186 capítulos y lector de 17 páginas con imagen. Portadas de M440 en blanco (F35, causa en la app). Detalle en `MEMORY.md` P-147.


### F25 Pantallas web — restante `[FE · Baja · N2]`

- [x] Pantallas de la v1 sobre base real (sql.js + IndexedDB, P-113), módulos `script` en Web Worker (P-114) — hecho en `feature/F24-F25-web-client`; detalle en `todo.archive.md`
- [x] **Subir react a 19.3.1+ y react-router a 8** (P-110): ADR-0002 fija react 19.2.3 por Expo SDK 57; al subir react, react-router 8 pasa a ser compatible. Sin tocar Expo: solo `apps/web`. — hecho: react/react-dom 19.3.1 en `apps/web` y `apps/extension`, react-router 8.5.1, `resolve.dedupe` de react en la web (mobile-src sigue en 19.2.3). Lint, typecheck, tests y e2e web en verde salvo `reader.cjs` a 426 px, intermitente también en `HEAD` (preexistente).
- Verif: `pnpm -r test` + e2e web en verde


### F31 Integrar errores en las pantallas — verificación restante `[FE · Baja · N2]`

Dep: hecha la integración (errorLog, ErrorState, ErrorBanner, registro en `log`) · S · `apps/mobile/src/screens/*`

- [x] Integración en Descubrir, Fuentes, Respaldo y lector, con registro en `log` (hecha 2026-10-31; detalle en `todo.archive.md`)
- [x] Playwright por pantalla: `screenErrors.cjs` cubre los errores visibles de la ficha y el lector a 426 y 1440 px (Fuentes y Respaldo ya en `sources.cjs`/`backup.cjs`; Descubrir web no puede fallar con los datos de ejemplo, lo cubre `apps/web/tests/e2e/discover.cjs`, F39) — rama `test/F31-e2e-errores-por-pantalla`
- Verif: `apps/mobile/tests/e2e/*.cjs` en verde


### F35 Portadas en blanco de M440 y YupManga `[FE/Ops · Intermedia · N3]`

Dep: F32 · S · S25 Ultra con red real

- [x] Reproducir con prueba en rojo: la `imageRef` de la portada llega a `LibraryCard` con `Referer`/`User-Agent` (P-137), ZonaTMO sí carga y M440/YupManga no; averiguar si falla el módulo (cabeceras o dominio no declarado en `permissions.domains`) o la app (expo-image con cabeceras) → **es de la app**: el `Image` de React Native no envía `source.headers` en Android
- [x] Si es del módulo, corregir en `RyuuNest-Models` (otro repo) y subir versión; si es de la app, arreglar con test y verificar en el teléfono
- [x] Comprobar portadas en Descubrir (listas y catálogo) y ficha → visibles en el S25 Ultra: listas de M440 y YupManga, cuadrícula de búsqueda/catálogo de M440 («alya») y fichas de M440 y YupManga (la de YupManga usa `og:image` con la cookie de la sesión). **Guarida/Tesoros:** no muestran portadas de ningún módulo (las tarjetas no reciben `cover` y la biblioteca solo guarda `cover_url`, sin cabeceras): queda como pregunta al humano (P-148)
- Verif: 🧍 S25 Ultra (portadas visibles en M440 y YupManga).
> **Hecho (2026-11-14, `fix/F35-portadas-cabeceras`):** `LibraryCard` y `SeriesScreen` pintan con `expo-image` (como el lector); `remoteImageUsage.test.ts` impide volver al `Image` de React Native salvo recursos locales y tres tarjetas que aún no reciben portadas remotas (la lista solo mengua). Detalle en `MEMORY.md` P-148.


### T43 Capacidades `home`/`list`/`filters` rompen instalar y actualizar módulos `[BE · Intermedia · N3]`

Dep: T40 · S · `packages/core/src/contract/types.ts`, `runtimes/{contractShape,ModuleRuntime,ScriptRuntime}.ts`, `packages/module-sdk/src/manifest.ts`, SPEC §6.1/§6.3

> Origen (2026-11-14): al probar «Gestionar» en el S25 Ultra, el panel sí abre y ofrece «Actualizar a v0.2.0» (el fallo que se sospechaba no existe), pero actualizar M440 0.1.0 → 0.2.0 fallaba con «Manifest inválido: capabilities[5..7]». M440 0.2.0 y ZonaTMO 0.3.0 declaran `home`, `list` y `filters` (contrato dinámico de `RyuuNest-Models`, `AGENTS.md` §7) y el validador solo admitía cinco valores.

- [x] `ModuleCapability` y `MODULE_CAPABILITIES` admiten `home`, `list` y `filters` (decisión del humano: añadirlas al contrato)
- [x] `ModuleApi` con `home?()`, `list?(sectionId, page)`, `filters?()` y `search(query, page, filters?)`; `ScriptRuntime` y `guardApi` los pasan y validan la forma mínima
- [x] SPEC §6.1 y §6.3
- [x] 🧍→ hecho con agent-device: M440 se actualiza a 0.2.0 en el S25 Ultra y sus listas cargan
- [ ] Fuera de alcance: usar `home`/`list`/`filters` en la app (UI de Descubrir con secciones y filtros) — tarea aparte
- Verif: `pnpm -r test` + actualización real en el dispositivo
> **Hecho (2026-11-14, `fix/T43-capacidades-home-list-filters`):** ver `MEMORY.md` P-146.


### F48 e2e `discover.cjs` en verde: portadas del sitio falso servidas en local `[QA · Baja · N2]`

Dep: — · S · `apps/mobile/tests/e2e/discover.cjs` (y los e2e que pinten portadas de `test-site`)

> Origen (P-148): desde que Descubrir pinta portadas (P-137), las del sitio falso apuntan a `https://sitio-html.test/img/*.svg`; el e2e aborta todo lo externo y eso deja `ERR_FAILED` en consola y entradas en `external`. Falla igual en `master`.

- [x] Rojo: el e2e comprueba que las portadas del sitio falso **se ven** (no solo que no hay errores)
- [x] El e2e atiende `sitio-html.test` y `api-json.test` con `route.fulfill` (un SVG en línea; `test-site` no tiene SVG en disco); cualquier otro host sigue abortado y contado (RNF-5 intacto) — rama `test/F48-e2e-descubrir-portadas-locales`
- [x] `library`, `series` y `home` pasan sin cambios
- Verif: `discover.cjs` en verde a 426 y 1440 px, 2–3 ejecuciones seguidas


### QAw1 Ruta guardado: instalar → descubrir → guardar → biblioteca `[FE/QA · Intermedia · N3]`

- [x] Abrir la aplicación web.
- [x] Ir a **Fuentes** e instalar un módulo.
- [x] Moverse a **Descubrir**.
- [x] Seleccionar algún manga o cómic al azar.
- [x] Guardarlo en alguna carpeta o en favoritos.
- [x] Buscarlo en **Biblioteca**.
- [x] Seleccionarlo y **debería mostrar de nuevo la pantalla de detalle** para ese manga o cómic.
- Verif: la obra guardada aparece en Biblioteca y al abrirla se ve su ficha (detalle) completa. — verificado por e2e `apps/web/tests/e2e/discover.cjs` (paso 4: busca en Biblioteca, abre la ficha con capítulos y «Guardada») a 1440/426 px; el bloqueo de «Favorito» ya lo resolvió P-126. Sin cambios nativos, no hay verificación en el teléfono.

### F50 Botón de filtros por etiquetas en el buscador de Descubrir `[FE · Intermedia · N3]`

Dep: F38 (botón «Buscar»), T43 (`filters()` en el contrato) · M · `apps/mobile/src/screens/discover/*`, `packages/core/src/contract/types.ts` (solo lectura)

> Origen (petición del humano, 2026-11-16).

- [x] Botón «Filtros» junto al buscador que abre una hoja con las etiquetas (p. ej. Sekai, Aventuras, Horror, Seinen, Shonen…), multiselección y «Limpiar»
- [x] Las etiquetas salen de `ModuleApi.filters()` del módulo elegido (tipo `tags`); si el módulo no declara `filters`, el botón no aparece. **Pregunta abierta:** ¿lista fija común a todos los módulos o la de cada módulo? (recomendado: la de cada módulo, sin inventar etiquetas)
- [x] `search(query, page, filters?)` recibe la selección; chip/contador de filtros activos y la búsqueda funciona también sin texto
- [x] Textos en el catálogo i18n, componente en la galería con todos sus estados, solo tokens
- Verif: Vitest + Playwright 426/1440 px + 🧍 S25 con ZonaTMO o M440 (declaran `filters`)

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.


### F59 Descubrir usa las capacidades `home`, `list` y `filters` de los módulos `[FE · Alta · N4]`

Dep: T43 (hecha) · M · `apps/mobile/src/screens/discover/*`

> Origen: lo dejó fuera de alcance T43. Los módulos M440 y ZonaTMO ya las declaran.

- [x] Secciones de portada desde `home()` y listas paginadas desde `list(sectionId, page)`, con reserva a `popular`/`latest` si el módulo no las declara
- [x] Los filtros de `filters()` alimentan F50 (no duplicar)
- Verif: Vitest + 🧍 S25 con M440 o ZonaTMO

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.


### F38 Descubrir: refresco al recuperar el foco `[FE · Baja · N2]`

- [x] Sin confirmar: `discover.tsx` llama a `refreshModules` al recuperar el foco; no se probó en el teléfono instalar/desinstalar en Portales y volver
- Verif: S25 Ultra

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.


### F60 Búsqueda global de la cabecera `[FE · Intermedia · N3]`

Dep: F38 · M · `apps/mobile/src/components/Header.tsx`

> Origen: `MEMORY.md` §4 punto 8 («pendiente de F15»). **Comprobar al empezar si sigue vigente.**

- [x] Búsqueda desde la cabecera que lleva a Aventuras con la consulta ya escrita
- Verif: Vitest + Playwright 426/1440 px

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.


### F77 Descubrir: texto de error del lector de imagen en la web `[FE · Baja · N2]`

- [x] Sin decidir: el error de imagen del lector web solo muestra el título; valorar el mismo mensaje por tipo que en móvil (ver también F39)
- Verif: Playwright 1440/426 px

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.


### QAw3 Intercalar entre servidores: dos módulos y cambio de fuente `[FE/QA · Intermedia · N3]`

- [x] Abrir la aplicación web; aparece la sección de Inicio.
- [x] Instalar **2 módulos** en caso de que no haya ninguno (los módulos necesarios para la prueba).
- [x] Navegar a la sección **Descubrir**.
- [x] Por defecto se debe cargar un módulo si hay alguno instalado.
- [x] Seleccionar en los filtros para cambiar de módulo.
- [x] Verificar que cargan correctamente los mangas del **segundo** módulo.
- Verif: el filtro de módulo cambia la fuente y la rejilla muestra series del módulo elegido, sin errores y sin mezclar resultados del anterior.

> **Hecho (2026-11-17):** ver `MEMORY.md` P-171.



---

# Poda del 2026-11-27: copia íntegra de `tasks/todo.md` antes de la limpieza

> Las tareas terminadas que estaban en `todo.md` (A1–A6, Guarida, Tesoros, Aventuras, Ajustes, F51, F17/F39/F36/F43, FA1/FA2/F72/F73, AB1–AB3, T44, T33, G1, G6, R1, T42, F61/F63/F64/F45/F98/F99…) quedan aquí tal como estaban.

# todo.md — RyuuNest (solo pendientes) · 2026-11-12

> Historial completo de lo hecho → `tasks/todo.archive.md` (podado el 2026-11-12: aquí solo queda lo pendiente). Contexto → `tasks/plan.md`.
> **Identificadores sin renumerar** (decisión del humano, 2026-11-12): los códigos T/F/QAw siguen siendo válidos en `docs/MEMORY.md`, `tasks/Analisis.md`, ADR-0003 y el SPEC.
> **Al iniciar sesión leer `tasks/complexity.md` §1 (reglas).** Si fallas 2 veces el mismo error: **«modelo con poca potencia cambiar.»**
> Autoridad: SPEC → `docs/DESIGN_RULES.md` → `docs/DESIGN.md` → PNG/HTML de `design/` → `IDEA.md`.
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

## ▶️ RETOMAR AQUÍ — Auditoría de módulos para el APK de release (P-192, pausada 2026-11-26)

> Si el humano dice «continúa donde te quedaste ayer», es esto. Contexto completo: `docs/MEMORY.md` P-192 (§3), el hito del 2026-11-26 (§2) y §4 «Del humano».
> Proceso pedido por el humano: un módulo a la vez; dificultad → modelo del subagente (alta: Opus 5.5 esfuerzo medio · intermedia: Sonnet 5.5 esfuerzo medio · baja: Haiku); cada subagente trabaja en una rama hija de la rama de integración (en Models, en su propio `git worktree`); el agente principal revisa el código, lo prueba (Node + teléfono) y lo fusiona con `--no-ff`; los PR finales a `master`/`main` los **fusiona el humano**.

**Ramas (ya en GitHub):**
- App `RyuuNest`: `fix/auditoria-modulos-release` (desde `master`). Ya lleva: claves únicas en Portales (`moduleRowKey`), montador que remonta si cambia el paquete instalado (`installedMounter.ts`) y MEMORY. Gate (lint/typecheck/test/build) en verde el 2026-11-26.
- Models `RyuuNest-Models`: `audit-release` (desde `main`). Ya lleva: zonatmo 0.3.1, visormanga 0.1.1, e-hentai/fanfox/hitomi/mangation 0.1.2, luscious 0.1.3, `tools/hermes-patterns.test.mjs` y AGENTS.md §1.9. Los 11 tests en verde e `index.json` íntegro (sha256/size).

**Cómo probar en el S25 (Expo Go):** `adb reverse tcp:8081 tcp:8081`; en `apps/mobile`, `CI=1 npx expo start --localhost --port 8081` (añade `--clear` si cambiaste de rama: Metro sirvió un bundle viejo); abrir `exp://127.0.0.1:8081` con agent-device. En el teléfono está añadido el repo de prueba `https://raw.githubusercontent.com/davidluciol/RyuuNest-Models/audit-release/index.json` y los módulos auditados se reinstalaron desde él. Herramienta para ejecutar un módulo como lo hace la app en Node (`createFunctionScriptLoader` + `ModuleHost` + validador de forma): estaba en el scratchpad de la sesión (`apprun.mjs`); si ya no está, se rehace en 30 líneas con `packages/core/dist`.

**Estado por módulo (S25, 2026-11-26):**
| Módulo | Estado |
|---|---|
| ZonaTMO 0.3.1 | ✅ lista → ficha → lector con imágenes |
| FanFox 0.1.2 | ✅ completo |
| E-Hentai 0.1.2 | ✅ completo (imágenes H@H en puerto `:9001` cargan) |
| Hitomi 0.1.2 | ✅ completo |
| Mangation 0.1.2 | ✅ completo (no hizo falta probar métodos alternativos: el fallo era el de Hermes) |
| Luscious 0.1.3 | ⚠️ inicio y ficha ✅ (sin verificación de Cloudflare: el cliente nativo pasa); **lector: `TIMEOUT` en `AlbumListOwnPictures`** (2 de 2 intentos) |
| VisorManga 0.1.1 | ❌ del sitio: su único CDN de imágenes `imgvtmo.com` está aparcado (DNS → Porkbun, TLS falla). Ficha OK |

**Tareas para mañana (en orden):**
- [x] **A1 Luscious `pages` TIMEOUT** ✅ 2026-11-27: no es del módulo (conexión muerta de Expo Go, G6); de paso luscious 0.1.4 lee álbumes de >1000 imágenes. Era: `[Models · Intermedia]` → subagente Sonnet. Medir la latencia de `AlbumListOwnPictures` (Node recibe 403 de Cloudflare; hay que pasar por `tools/tls-proxy.py`/curl_cffi, y el clasificador de auto mode bloqueó ejecutarlo: **pedir permiso al humano** antes). Hipótesis: la consulta con `display:"date_newest"` + orden por `position` es lenta en el servidor, o la conexión muerta de Expo Go (sin el OkHttp con ping de G6). Probar en el teléfono otra vez y con el APK. Si es el servidor: menos elementos por página o la consulta que use el lector web del sitio.
- [x] **A2 VisorManga** ✅ 2026-11-27: retirado de `index.json` (decisión del humano). Era: (🧍 decisión del humano): retirarlo del `index.json` hasta que vuelva su CDN, o dejarlo publicado con el error claro. Comprobar antes que `imgvtmo.com` sigue caído.
- [x] **A3 Hallazgos menores de la app** ✅ 2026-11-27: (a) no se reprodujo tras actualizar (verificar con APK); (b) solo Expo Go: el APK tiene `readTimeout` 30 s y ping (G6); (c) arreglado en la app (`chapterRowTitle`, chip sin id crudo) y mangation 0.1.3. Era: `[FE · Baja]` → Haiku, uno por rama hija: (a) tras instalar/actualizar un módulo, el primer toque en Portales/Aventuras se pierde (algo de la hoja recién cerrada lo intercepta); (b) en Expo Go una instalación se quedó colgada con la hoja bloqueada, hasta «Cancelar» y la X (probablemente una petición colgada sin tiempo límite en el instalador: revisar si `PackageInstaller`/`InstallFlow` pasan por el `TimedHttp`); (c) cosmético en VisorManga/Mangation: el capítulo se titula «Capítulo 103: Capítulo 103.00» y la release muestra el id crudo (`jinx-103.00`).
- [x] **A4 Volver a probar en el S25** ✅ 2026-11-27 parcial: Luscious, Mangation y ZonaTMO de punta a punta, dos actualizaciones sin reiniciar; FanFox/E-Hentai/Hitomi sin cambios desde el 26 (repasar con APK). Era: los 7 módulos de punta a punta con el bundle final, incluida una **actualización** de módulo sin reiniciar la app (prueba del montador; Luscious 0.1.2→0.1.3 ya pasó).
- [x] **A5 Cierre:** ✅ 2026-11-27: gate en verde, worktrees y ramas hijas borrados, PR app #170 y Models #29 abiertos (sin fusionar). Era: `pnpm lint && pnpm -r typecheck && pnpm -r test && pnpm -r build`; `graphify update .`; abrir PR `fix/auditoria-modulos-release` → `master` y PR `audit-release` → `main` (Models; el `index.json` va dentro por decisión del humano) con la evidencia; **no fusionar**. Borrar los worktrees `../RyuuNest-Models-{hermes,visor,luscious}` y las ramas hijas ya fusionadas.
- [x] **A6** ✅ 2026-11-27 (POCO, Expo Go con `master`): el POCO solo tenía el repo `main` (el `audit-release` estaba en el S25); sincronizado y actualizados Hitomi 0.1.2, M440 0.2.2 y ZonaTMO 0.3.1 (YupManga 0.2.0 ya al día); instalados E-Hentai, FanFox, Luscious y Mangation (8/8, 0 pendientes) y cada uno carga Aventuras. Logo verificado en cabecera, Acerca de (versión 1.0.0) y pantalla de carga. APK 1.0.0 lanzado con EAS `preview`. Falta 🧍: quitar `audit-release` del S25 si sigue ahí.

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

> Origen: `docs/MEMORY.md` §4 «Biblioteca (restos de F14)». **Comprobar al empezar si sigue vigente.**

- [x] Hoja de filtros real (`FilterSheet`): **tipo, fuente y NSFW** (decisión del humano 2026-11-17; RF-27 ajustado), cada chip aplica al instante, «Limpiar» vacía tipo y fuente, «Listo» cierra
- [x] Nombre visible de la fuente desde `ModuleRegistry` (sin módulo instalado, su id)
- Verif: ✅ Vitest + ✅ Playwright 426/1440 px (`library.cjs`) · 🧍 S25 pendiente

### F58 Menú de orden real y `reading: true` al núcleo `[FE/BE · Baja · N2]`

Dep: F52 · S · `apps/mobile/src/screens/library/*`, `packages/core/src/library/queries.ts`

> Origen: `docs/MEMORY.md` §4 (restos de F14). **Comprobar al empezar si sigue vigente.**

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

> Origen (petición del humano, 2026-11-17, opcional). **Leer `docs/DESIGN_RULES.md` antes: decide cómo se usa el color.**

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
- Verif: ✅ capturas de las variantes a 426 px en `docs/capturasF86/` (`variante-a|b|c.png`, Expo web + Playwright) · ✅ decisión en `docs/MEMORY.md` (P-177) · ✅ código revisado en `DiscoverScreen.tsx`

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
- [x] 🧍 POCO F5 Pro (2026-11-21, Expo Go, m440 Blue Lock): tras forzar el cierre, la serie sigue «En favoritos» y en su modo. Los chips de un solo grupo salen como etiqueta
- [ ] 🧍 Hoja «Elegir grupo» en el teléfono: **no se puede con m440** (una release por capítulo, P-147); falta un módulo real con ≥ 2 grupos por capítulo (en web probada con el ejemplo)
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

- [x] 🧍 Hecho en el **POCO F5 Pro** (2026-11-21, decisión del humano: POCO en vez de S25): Wi‑Fi cortado → pág. 13 de Blue Lock (m440) falla con «No hay conexión…»; «Ver detalle» muestra la URL completa en dos líneas sin «…» y `código: NETWORK`
- Verif: S25 Ultra

### F43 Lector, Diagnóstico y escritorio (propuesta de F33, sin aprobar) `[FE · Intermedia · N3]`

- [x] Aprobada (humano, 2026-11-21). Auditoría: R12 y W19 ya resueltos; N17/R10/R11/R6 parciales; R7, W14, W15 abiertos; W17 en la web de Expo
- [x] N17 un solo indicador (sin «%») · R11 sin botones ‹ › · R10 «Derecha a izquierda (manga)» / «Izquierda a derecha (cómic)»
- [x] R6 eventos repetidos agrupados («×N») · R7 chips «Texto» / «Datos»
- [x] W14 banner del lector web con margen, código y «Ver detalle» · W15 selector de capítulo en la barra del lector web
- [x] W17 Guarida y Tesoros con tope `gridMaxWidth` 1100 px y rejilla por tramo (P-188)
- [x] 🧍 POCO F5 Pro (2026-11-21): barra inferior «Pág. 2 / 77» sin ‹ › ni «%», y hoja de modo con «Derecha a izquierda (manga)» / «Izquierda a derecha (cómic)»
- Verif: ✅ Vitest + Playwright (`reader`, `settings`, `diagnostics`, `library`, `home`, `shell` en móvil; `reader`, `settings`, `f28Screens` en `apps/web`)

### 🧍 Lector en el POCO (F18/F19) `[FE · Baja · N2]`

- [x] 🧍 Hecho 2026-11-21 (Expo Go, m440 Blue Lock cap. 2): cambio a D→I y deslizar avanza; pellizco ~2,5×; pantalla encendida (`SCREEN_BRIGHT_WAKE_LOCK` de Expo Go); Wi‑Fi cortado → pág. 13 falla y «Reintentar» la carga al volver la red; `dumpsys meminfo` PSS ≈ 709 MB al abrir y ≈ 758 MB en precarga (Native Heap ≈ 396–414 MB, Graphics ≈ 81–145 MB)

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

> Hallazgos de explorar la app (2026-11-16): **todos** los estados vacío, de error y de carga usan el mismo `DragonMarker` (silueta marcador en `assets/placeholder/`, TEMPORAL); la barra inferior usa iconos de `lucide`; no hay ilustración propia por pantalla ni arte para las carpetas por defecto; los iconos de la app (`icon.png`, `android-icon-*`, `splash-icon.png`) y los de la extensión no tienen arte final. Solo tokens de color de `ui-tokens`, arte original GPL-3.0, sin recursos externos (RNF-5); cada recurso se registra en `docs/ASSETS.md`.

> **Regla para todo el arte de artistas (FA1–FA3, F70–F75):** el artista se acredita en Ajustes → Acerca de añadiéndolo a `ARTISTS` (`apps/mobile/src/about/artists.ts`) con su foto y sus redes (FA3), y cada recurso se registra en `docs/ASSETS.md` con licencia compatible GPL-3.0.

### FA1 Arte final del dragón `[Ops · Baja · N1]` 🧍 (sin dependencias; antes de v1.0 pública)

- [x] 🧍 Logo del humano (P-197, CC BY-NC-ND 4.0) sustituye al dragón marcador: `components/dragonPath.ts`; `placeholder/dragon.svg` es ya copia del logo (las páginas del lector siguen como marcador)
- [x] `docs/ASSETS.md` y `README` de placeholder actualizados; el dragón deja de ser TEMPORAL
- Verif: `apps/mobile/tests/placeholder.test.ts` en verde + galería con Playwright (RNF-5)

### FA2 Logo de cabecera y bienvenida de primer uso `[Arte · Baja · N2]` 🧍

- [x] Logo pequeño del dragón para la cabecera y la ilustración grande de bienvenida (SPEC §11, tabla del dragón: «Encabezado» y «Primer uso»), con arte del artista
- [x] `DragonMarker` dibuja el logo, así que `AppShell` y `OnboardingScreen` lo muestran sin cambios (P-197)
- Verif: Playwright + galería + 🧍 S25

### FA3 Alta de artista en «Acerca de» `[Datos · Baja · N1]` 🧍

- [ ] 🧍 Pasar nombre artístico, foto, redes y agradecimiento de cada artista
- [ ] Foto en `apps/mobile/assets/artists/<id>.webp` (local, RNF-5) importada con `import foto from "…webp"` (no `require`, que Vite no entiende: la web reutiliza `ARTISTS`), entrada en `ARTISTS`, texto en `es.json` (`about.artists.<id>.bio`), registro en `docs/ASSETS.md`
- Verif: `tests/about/artists.test.ts` + galería + 🧍 S25 (tocar cada red abre el navegador)

---


### F70 Ilustraciones propias por estado vacío `[FE/Arte · Intermedia · N3]`

Dep: F56 · M · `apps/mobile/src/components/{EmptyState,DragonMarker}.tsx`

- [ ] (Riesgo de F73/P-197: hoy todos los estados muestran el mismo logo) Una ilustración SVG distinta por vacío: Guarida (sin lecturas), Tesoros (sin series), Aventuras (sin módulos / sin resultados), Portales (sin repos), Diagnóstico (sin eventos); F56 aporta la de «sin resultados»
- [ ] `EmptyState` acepta la ilustración por prop; todas en la galería (dos escalas)
- Verif: Playwright 426/1440 px + 🧍 S25

### F71 Ilustraciones de error y de carga `[FE/Arte · Baja · N2]`

- [ ] `ErrorState` y `LoadingState` con ilustración propia (hoy comparten el dragón marcador); sin animación en el lector
- Verif: Playwright + galería

### F72 Iconos de la extensión `[Arte · Baja · N1]` 🧍

- [x] `icons` y `action.default_icon` 16/32/48/128 px (`apps/extension/icons/`; ≤32 px con el logo sin pupila, P-197); el build los copia a `dist/`
- Verif: construir la extensión y cargarla

### F73 Icono de la app, adaptativo y pantalla de inicio `[Arte · Baja · N1]` 🧍

- [x] `icon.png` (1024 opaco, iPhone), adaptativo (fondo `#0B0E14` + `foreground`/`monochrome` al 50 %, zona segura) y favicons con el logo (P-197); `android-icon-background.png` y `splash-icon.png` borrados (nada los usaba). Web: `favicon.svg`, `favicon.png` y `apple-touch-icon.png`. Versión 1.0.0. Falta 🧍 ver cajón y arranque en el teléfono
- Verif: 🧍 S25 (cajón de apps y arranque)

### F74 Iconos y colores de iconos `[FE · Baja · N2]`

Dep: — · S · `apps/mobile/src/icons`, `BottomNav.tsx`

- [x] Iconos temáticos libres de Lucide ya (decisión 2026-11-27; hecho en AB2/AB3, P-195): Guarida `Castle`, Tesoros `Gem`, Aventuras `Map`, Portales `DoorOpen`, Ajustes `Settings`, en móvil/TV y web; sustituir por el arte del artista cuando llegue
- [ ] Auditar iconos de la barra inferior y la cabecera: un solo juego (`lucide`), tamaños y colores por estado (activo/inactivo/foco) tomados de `ui-tokens`; iconos con nombres temáticos coherentes (Guarida, Tesoros, Aventuras, Portales, Ajustes)
- Verif: Playwright + galería

### F75 Iconos de las carpetas por defecto y del botón «+» `[FE/Arte · Baja · N2]`

Dep: F52, F53 · XS

- [ ] Iconos para «Favoritos» (estrella) y «Gemas» (gema) en `FolderCard`, y el «+» verde del botón flotante, con tokens
- Verif: galería + Playwright

### F101 Pantalla de bienvenida (splash) con el logo `[FE/Arte · Baja · N2]` 🧍

Dep: F73 · S · `apps/mobile/app.json` (riesgo hallado en F73, P-197)

- [ ] La app no configura `expo-splash-screen`: Android 12+ muestra el icono adaptativo sobre el fondo por defecto (posible destello blanco antes del tema oscuro). Configurar el splash con el logo con pupila sobre `#0B0E14` (`dragonNightColors.bg`), Android e iPhone; consultar Context7 para el plugin de SDK 57 y **pedir permiso** si hace falta instalar el paquete
- [ ] Sin animación ni texto en el splash; respeta la regla de tokens (el color sale del tema)
- Verif: test de `app.json` + 🧍 APK en el POCO/S25 (arranque en frío sin destello blanco)

### F102 Configuración para iPhone (iOS) `[Ops · Baja · N2]` 🧍

Dep: F73 · S · `apps/mobile/app.json`, `eas.json` (riesgo hallado en F73, P-197)

- [ ] `ios.bundleIdentifier` (propuesta: `io.github.davidluciol.ryuunest`, como Android), `supportsTablet`, icono (ya cubierto por `icon.png` 1024 opaco) y perfil de EAS para iOS
- [ ] 🧍 Decidir la distribución: SPEC P-3 solo contempla APK y PWA; iOS exige cuenta de Apple Developer (TestFlight/App Store) o instalación lateral. Si cambia el alcance, actualizar `docs/SPEC.md` antes de compilar
- Verif: `eas build -p ios --profile preview` (o `expo prebuild -p ios` sin compilar) sin errores de configuración

**Lote sugerido:** F70 → F71 → F74 → F75 → F101 → F102 (FA1, FA2, F72 y F73 hechas con el logo del humano, P-197).

### AB1–AB3 Ajustes → «Acerca de» con sección de Artistas `[FE · Intermedia · N3]`

Plan aprobado el 2026-11-27. Logos de redes de Tabler (MIT, solo trazos copiados); las redes sin logo usan el genérico de Lucide.

- [x] AB1 Datos y tarjeta: `about/socialIcons.ts`, `about/artists.ts` (`safeLinks` solo `https:`), `SocialIcon`, `ArtistCard` + galería, `docs/ASSETS.md`
- [x] AB2 Pantalla móvil/TV: `AboutScreen` (versión, GPL-3.0, sin telemetría, enlaces; «Artistas» oculta si no hay; recursos de terceros), ruta `/about` y fila en Ajustes
- [x] AB3 Web: `AboutScreen` web, `SocialIcon` web, ruta y fila en Ajustes web
- Verif: Playwright 426/1440 (sin desbordes, ≥48×48, cero peticiones al cargar) + agent-device en el teléfono

---

## 🗂️ General (abarca varias secciones o ninguna)

### F103 «Mandar reporte»: reporte de errores revisado por el usuario → issues de GitHub `[FE/Ops · Intermedia · N3]` 🧍

Dep: F30 (Diagnóstico), T36 (`core/diagnostics/sanitize.ts`) · M · Pedido del humano 2026-11-27

> **Bloqueo de SPEC:** RNF-5 dice «sin servicios de terceros; los datos solo salen del dispositivo por exportación manual». Un reporte que el usuario **revisa y envía a mano** con una app suya (navegador, correo, Telegram, hoja de compartir) cabe en RNF-5. Un envío directo desde la app a un servidor o relé (opción C abajo) **exige cambiar el SPEC antes**. 🧍 Elegir canal(es) y, si hace falta, aprobar el cambio de RNF-5.

**Flujo en la app (sin envío automático):**
- [ ] Botón «Mandar reporte» en los diálogos/avisos de error (`ErrorDialog`, `ErrorBanner`, error por página del lector) y en Ajustes → Diagnóstico
- [ ] Hoja/tarjeta de revisión con **todo** lo que saldrá, en texto plano y editable solo en el campo «Detalles» del usuario:
  - **Obligatorio:** código de error (`ModuleErrorCode` o código propio de la app), módulo + versión, versión de la app (`about/appInfo.ts`), plataforma (Android/web/TV) y versión del SO, huella del error (ver abajo), fecha
  - **Opcional:** detalles del usuario (texto libre, tope de caracteres) y las últimas N entradas del registro de diagnóstico
- [ ] **Limpieza de privacidad obligatoria:** todo pasa por `sanitize.ts` (sin URLs completas, cookies, cabeceras, HTML, rutas locales ni títulos de obras) y además se quitan dominio del sitio, IDs de series/capítulos y el texto del usuario se avisa como «público». Pruebas con fixtures que contengan cada tipo de dato sensible
- [ ] El usuario ve el texto final y pulsa «Enviar» → se abre el canal elegido con el reporte ya rellenado; nada sale sin esa pulsación
- [ ] Textos en i18n, componente en la galería, áreas ≥48, sin animación en el lector

**Huella para duplicados (misma lógica en la app y en el procesado):**
- [ ] `fingerprint = sha256(código + id del módulo + versión mayor.menor del módulo + mensaje normalizado + 3 primeros marcos de la pila normalizados)` y se usan 12 hex. Normalizar = quitar números, URLs, hashes, rutas y comillas; así «TIMEOUT tras 30123 ms» y «TIMEOUT tras 29870 ms» dan la misma huella. Tests de que errores iguales dan la misma huella y distintos no
- [ ] La huella va en el título (`[fp:ab12cd34ef56] TIMEOUT en m440 0.2`) y en el cuerpo, para poder buscarla

**Lado de GitHub (repo `RyuuNest`):**
- [ ] Plantilla `.github/ISSUE_TEMPLATE/reporte-error.yml` con los campos obligatorios; la app abre `issues/new?template=…&title=…&body=…` (cuidar el límite de ~8 KB de la URL; si no cabe, se recorta el registro)
- [ ] Antes de abrir, la app puede buscar la huella con la API pública de búsqueda (sin token, límite bajo de peticiones por minuto) y, si ya existe, ofrecer «Ya está reportado: ver issue / sumar mi caso» en vez de abrir uno nuevo
- [ ] GitHub Action al abrir un issue con `fp:`: si ya hay uno abierto con la misma huella → comentar en el original («+1, versión X»), sumar la etiqueta de ocurrencias y cerrar el nuevo como duplicado; si no → etiqueta `reporte-usuario` + código de error y alta en **GitHub Projects** (columna «Pendiente») con un campo numérico «Ocurrencias»
- [ ] Vista del Project ordenada por «Ocurrencias» para saber qué se repite más

**Usuarios sin cuenta de GitHub (gratis):** el reporte es el mismo texto con huella; solo cambia el canal. 🧍 Elegir uno o varios:
- [ ] **A. Telegram (propuesta del humano):** la app abre Telegram con el texto listo para un bot o un grupo de reportes, por enlace `t.me/<bot>` + hoja de compartir. El bot del humano lo convierte en issue con la misma lógica de huella. **No** se mete el token del bot en la app (cualquiera podría sacarlo del APK y usarlo para spam). El usuario necesita cuenta de Telegram
- [ ] **B. Correo (`mailto:`):** abre la app de correo con asunto (`[fp:…]`) y cuerpo rellenados hacia un buzón del proyecto. Cero infraestructura, cualquier usuario tiene correo; el procesado es manual o con un filtro/script que lea el buzón. Expone el correo del usuario al proyecto (avisarlo en la tarjeta)
- [ ] **C. Relé sin servidor propio (Cloudflare Workers, plan gratis):** la app hace POST del reporte ya limpio; el Worker guarda el token de GitHub, calcula duplicados por huella y crea o comenta el issue. Es la opción más automática y sin cuenta, pero **es un servicio de terceros y cambia RNF-5** (y hay que ponerle límite de peticiones contra spam)
- [ ] **D. Hoja de compartir del sistema / copiar al portapapeles:** el usuario elige Discord, WhatsApp, Telegram, correo… y lo pega donde quiera (o en un formulario o discusión). Es lo más simple y siempre funciona como respaldo, pero no es automático
- [ ] **E. Formulario web gratis (por ejemplo Google Forms o Tally) prerrellenado por URL:** sin cuenta y con hoja de cálculo para contar huellas. Es un tercero que recibe los datos; revisar su política antes
- Recomendación del agente: **GitHub (con cuenta) + D (siempre disponible) + A o B** sin tocar RNF-5; dejar C para cuando haya volumen y aprobar el cambio de SPEC
- Verif: tests de limpieza y de huella, galería + Playwright (web) + 🧍 POCO (enviar un reporte de prueba a un repo o canal de pruebas, nunca al real)

### T44 ✅ 58 archivos de test fallaban en `vitest run` desde la raíz `[Ops · Intermedia · N3]`

- [x] Resuelto (2026-11-21): no eran tests rotos. Faltaba la config de la raíz (`vitest.config.ts` con `projects`: cada paquete con su config y sus alias) y 19 tests leían rutas relativas a `process.cwd()` (ahora parten de `import.meta.dirname`). Raíz 231/231 y `pnpm -r test` en verde.
- [x] ~~Revisar y resolver.~~ Medido el 2026-11-20 con `npx vitest run` desde la raíz: **58 archivos / 44 tests fallan**, y fallan igual sin los cambios de `HostResponse.bytes()` (comprobado con `git stash`). Reparto por paquete: `apps/mobile` 44, `apps/web` 7, `packages/core` 4, `tools/eslint-plugin-ryuunest` 2, `packages/ui-tokens` 1.
- Pista: varios dan `ENOENT: scandir '<raíz>\src'` (asumen cwd = paquete). Probar `pnpm -r test` y comparar con la raíz; decidir si es la configuración de vitest o tests rotos de verdad. Hasta resolverlo, la suite global no sirve como puerta de calidad.

### T05 cierre `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Confirmar que `ADR-0002` fija versiones Expo/RN/RNTV y el tope de imágenes medido; marcar T05 ✅
- Aparte (no bloquea): MiBox 4 pospuesta (P-43); revalidar RNF-1 en release.

### T33 ✅ Pruebas de seguridad `[Sec · Alta · N4]` (PR #164, 2026-11-21)

Dep: T13 · M · `core/tests/security/*.test.ts` · sin dependencia del cierre de la API (en paralelo)

- [x] Cada amenaza de SPEC §7.2 tiene prueba (`core/tests/security/`); 19 mitigaciones quitadas una a una, todas dejan rojo. Arreglada la bomba zip con tamaños declarados (P-189)
- [x] Un deep link `ryuunest://add-repo?url=…` no instala (AC-8; `apps/mobile/tests/security/deepLink.test.ts`). Ojo: no hay manejador, así que tampoco abre la confirmación → tarea G5
- [x] Límites de tamaño/archivos cubiertos
- Verif: `pnpm --filter @ryuunest/core test -- security` + revisar correspondencia amenaza↔prueba


### G1 Calibrar políticas del host (T35) `[BE · Intermedia · N3]`

- [x] Instrumento (2026-11-21): `apps/mobile/src/data/timedHttp.ts` deja en la consola de desarrollo `[host-timing] {host,status,startedAt,ms}` por petición de módulo (Descubrir y lector; solo host, sin ruta)
- [x] Calibrado en el POCO (2026-11-21, Wi‑Fi, zonatmo + m440, ~20 peticiones): 59–1266 ms, p90 ≈ 1,3 s, concurrencia real ≤ 2, separación mínima 257 ms → **se mantienen 15 s / 4 / 250 ms** (humano). m440 dio dos 403 con ~250 ms entre peticiones: ajustar por módulo si se repite
- [x] 🧍 PR de prueba que rompe el contrato y hace fallar el CI

- [x] TIMEOUT de m440 al «Retomar» investigado en el POCO (2026-11-22): tras ~4–5 min sin tráfico al host, la primera petición tarda 124–154 s y acaba en 200; dos peticiones colgadas acabaron en el mismo milisegundo → conexión reutilizada que el servidor ya cerró. React Native crea OkHttp sin límites (`connectTimeout/readTimeout/writeTimeout` = 0, `OkHttpClientProvider.kt`) y el `TIMEOUT` del host (15 s) no cancela la petición, así que «Reintentar» va por la misma conexión muerta. No es la cola del host: el temporizador empieza tras `acquire`/`respectDelay`
- [x] Arreglo decidido (humano, 2026-11-22): OkHttp nativo con ping + `network.minDelayMs` en el manifest → **G6**

### G6 OkHttp con ping y pausa por módulo `[BE · Alta · N4]` (PR #166 → `feature/general-lote`; Models PR #17)

- [x] Plugin `apps/mobile/plugins/withOkHttpPing.js` (ping 10 s, conexión 15 s, lectura 30 s; conserva caché y cookies) + test + prebuild comprobado
- [x] `network.minDelayMs?` (250–5000 ms) en manifest, SDK y `installedMounter`; SPEC §6.1 y ADR-0003
- [x] m440 0.2.2 declara 600 ms (Models PR #17); tests 5/5
- [x] PR de `index.json` en Models con m440 0.2.2 (tras fusionar #17 y #166)
- [x] 🧍 APK EAS `preview` (build `b345fb0e`) en el POCO (2026-11-22): tras 5,5 min sin tráfico, «Retomar» de m440 abre la página en 1,2 s y 0,4 s (2/2); en Expo Go, sin el arreglo, 124–154 s (2/2). Los 600 ms de m440 se comprobarán al publicar 0.2.2 en `index.json`

### G2 Plataforma: deudas del núcleo `[BE · Intermedia · N3]`

- [x] La app nativa rellena `HttpResponse.url` (P-74): visto en el POCO (`finalUrl: "same"` en `[host-timing]`, no `none`); sin redirección real a mano, pero el valor llega de `XMLHttpRequest.responseURL`
- [x] Filas `kv` migradas a `repo`/`module` y `kv` retirada (migración 6, PR #163, P-189)
- [x] POCO (2026-11-21): tras la migración 6 siguen el repo RyuuNest-Models y sus 4 módulos; «Sincronizar» funciona
- [ ] Si los `paths` entre paquetes se complican, migrar a *project references* de TypeScript (condicional: hoy no hace falta)
- [ ] `react-native-tvos` sin confirmar contra SDK 57 (pospuesto con P-43)

### F22 Riel lateral + navegación espacial + foco `[FE · Alta · N4]`

Dep: P-B · M · `apps/mobile/src/tv/*`

- [x] Riel lateral, foco 2 px `accent`, ×1,25 en el riel, márgenes seguros, teclado en web (PR #165; Playwright `tests/e2e/tvRail.cjs` a 960/1440/426)
- [ ] Preguntas abiertas (PR #165): ancho del riel TV (hoy 240 de escritorio), márgenes seguros (48×32), zoom del elemento enfocado vs escalar tamaños, escalar ×1,25 el resto de pantallas, `isTvLike()` del primer uso → `isTvDevice`
- Verif: Playwright (foco con teclado) · 🧍 recorrer los 5 destinos en la MiBox 4


### F37 Repetir F32 en la MiBox 4 y el POCO F5 Pro `[FE/QA · Baja · N2]` 🧍

Dep: F32 · S · dispositivos

- [x] POCO (2026-11-21): recorrido F32 con M440 (búsqueda, ficha con portada, lector) en verde; PSS ≈ 828 MB en precarga. m440 da 403 a ~250 ms entre peticiones y un TIMEOUT al retomar (ver MEMORY §4)
- [ ] Repetir el recorrido de F32 en la MiBox 4 (piso de rendimiento, Android 9, 2 GB) y en el POCO F5 Pro cuando haya módulo y red; anotar diferencias frente al S25 Ultra.
- [ ] Medir la memoria del lector con `adb shell dumpsys meminfo` durante la precarga (fija `READER_IMAGE_BUDGET_MB`, P-90) y AC-6 (60 páginas verticales sin cierres) en la MiBox 4.
- Verif: 🧍 dispositivos.


### F28 Playwright por pantalla + `DIFFS.md` + lista de 20 s (AC-12) — restante `[FE/QA · Baja · N2]` 🧍

- [x] 🧍 POCO F5 Pro (2026-11-22): las 8 pantallas capturadas y comparadas con `screen.png`; diferencias en `DIFFS.md` (fila AC-12)
- [ ] 🧍 Capturas en la MiBox 4 (AC-12 no se cierra sin ella)


### G3 Medidas con APK compilado `[Ops · Baja · N2]` 🧍

- [x] 🧍 RNF-1 con APK en el POCO (2026-11-22): ~1,8 s hasta Guarida útil (antes, en desarrollo, 4580 ms); primer frame 274–333 ms (`am start -W`). Ojo: Guarida vacía (el APK tiene datos aparte). PSS del lector ≈ 491 MB (Expo Go: 758–828 MB)
- [ ] 🧍 Medir el tope de imágenes (P-45): `ImageCapPanel` no está montado en ninguna pantalla; decidir dónde exponerlo. Cierra T05

### G4 Proceso y limpieza `[Ops · Baja · N1]` 🧍

- [ ] 🧍 Definir el proceso Scrum en una sesión aparte (AGENTS.md §16) · [ ] 🧍 Reservar el org npm `@ryuunest` · [ ] 🧍 Decidir qué hacer con las ramas remotas ya fusionadas
- [x] `stash@{0}` descartado y worktree residual de F07 borrado (2026-11-21, con permiso del humano)
- [ ] `AGENTS.md` pide una entrada de bitácora por sesión (P-15) que este archivo ya no lleva: decidir dónde va

### Hallazgo (2026-11-21) · ZonaTMO falla en algunas fichas `[BE · Baja · N2]` (repo `RyuuNest-Models`)

- [ ] «El Mejor Ingeniero del Mundo» (`/library/manhwa/30664/…`) da `PARSE`: falta `h1.element-title`. Revisar el selector del módulo con un fixture guardado

### G5 Manejador del enlace `ryuunest://add-repo` `[FE · Intermedia · N3]` (de T33)

- [ ] Hoy Expo Router manda el enlace a una ruta inexistente. Abrir Portales con la hoja «Añadir repositorio» y la URL puesta (SPEC §7.2), sin instalar; ampliar `deepLink.test.ts`

### V2 · Dependencias obsoletas de `eas-cli` `[Ops · Baja · N1]` (v2)

> Al ejecutar `npx eas-cli@latest login` (2026-11-22), npm avisó de paquetes obsoletos. Son dependencias **del propio `eas-cli`** (lo descarga `npx`), no de RyuuNest: no se arreglan en este repo; se revisan cuando Expo publique un `eas-cli` que las actualice.

- [ ] `inflight@1.0.6` (pierde memoria) → sustituto `lru-cache`
- [ ] `rimraf@2.4.5` → v4 o superior
- [ ] `glob@6.0.4` y `glob@10.5.0` (vulnerabilidades conocidas) → versión actual
- [ ] `http-call@5.3.0` → `@heroku/http-call`
- [ ] `uuid@7.0.3` y `uuid@8.3.2` → `uuid@11` (CommonJS) o la última (ESM)
- [x] Ninguno está en `pnpm-lock.yaml` de RyuuNest (2026-11-22: solo `glob@13.0.6` y `glob@14.0.3`, vigentes)

### R1 Cola de carga de páginas del lector `[FE · Alta · N4]` (P-190)

- [x] `reader/pageQueue.ts`: prioridad por cercanía, tope de concurrencia, timeout, reintentos con backoff y jitter, cancelación de lo encolado, `dispose` por capítulo; 14 tests
- [x] `useReaderPrefetch` usa la cola; el aviso «Cargando imágenes» se conserva
- [x] Línea base en el POCO (2026-11-23, Expo Go, `master`, m440 Kusuriya cap. 87, registro VERBOSE de Glide): al abrir, **15 descargas de red para 10 páginas** (las 1–5 dos veces: prefetch + vista); scroll rápido 17 para 15; 0,6 % de cuadros con retraso; 0 OOM/ANR/`too large bitmap`

### R2 Estados visibles por página en el lector `[FE · Intermedia · N3]` (P-190)

- [x] Placeholder por página (`ReaderPagePlaceholder`: número, estado, spinner nativo o icono con movimiento reducido), error con «Puedes continuar leyendo» y reintento ≥48
- [x] `<Image>` solo con la página en disco (`pageView`, sin descarga doble); filas memoizadas en vertical; estados en la galería; Playwright 426/1440 (`reader.cjs` + galería)
- [x] En el POCO (2026-11-23, Expo Go en modo desarrollo, cap. 86 y 1): **7 descargas para 7 páginas al abrir y 15 para 15 en scroll rápido, sin duplicadas**; tráfico al abrir 2,9 MB frente a 4,9 MB; sin Wi‑Fi cada página muestra «No se pudo cargar la página N · No hay conexión… Puedes continuar leyendo» y «Reintentar» la carga al volver la red; 0 OOM/ANR. Glide comparte caché: la clave de disco es la URL sin cabeceras (visto en el registro)
- [ ] 🧍 Medir cuadros y memoria de R2 con APK (Expo Go en producción reutiliza el bundle en caché; la medición de R2 fue en modo desarrollo) y en un capítulo de ~100 páginas (los de m440 probados tienen 15–49)
- [x] Al volver la red, las páginas en error del rango se reintentan solas (`retryFailed` + `expo-network` 57.0.3, aprobado por el humano 2026-11-23); comprobado en el POCO: sin Wi‑Fi la página 30 en error, al encenderla carga sola en ~5 s sin pulsar nada
- [ ] Hallazgo: «Vaciar caché de imágenes» no vació la caché de disco en Expo Go (las páginas siguieron saliendo de disco); comprobar con APK
- [ ] Hallazgo (V2/upstream): `Image.prefetch` de expo-image decodifica cada página a tamaño original solo para dejarla en disco (mediana 44 ms y un bitmap completo por página); no hay opción «solo descargar» en JS

### 🚩 Checkpoints `[Ops · Baja · N1]`

- [ ] **I:** API 1.0 congelable (T37–T41 hechas; lo decide el humano) · 🧍 Revisión
- [ ] **P-C:** AC-9 · 🧍 Revisión
- [ ] **J — Fin de la Parte 1:** suite y CI en verde · cobertura del contrato completa · 🧍 Revisión → cierre formal

---
