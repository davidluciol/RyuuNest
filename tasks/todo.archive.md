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
