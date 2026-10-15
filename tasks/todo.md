# Lista de tareas — RyuuNest Parte 1 (Back-end / Núcleo)

> Detalle de `tasks/plan.md`. Orden de autoridad: `docs/SPEC.md` → `DESIGN_RULES.md`
> → `DESIGN.md` → PNG/HTML de `design/` → `docs/IDEA.md`.
> Convención de comandos (se fijan en T01/T02): `pnpm -r typecheck` · `pnpm -r test` ·
> `pnpm -r build` · `pnpm lint` · focalizada: `pnpm --filter @ryuunest/core test`.
> Estados: `[ ]` pendiente · `[x]` hecho · `[-]` descartado/bloqueado.
> Tracker: pendiente elegir GitHub Issues o `bd` (ver pregunta abierta 2 de `plan.md`).

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

**Estado:** 🟡 casi listo 2026-10-14 — **smokes 3/3 OK en los 2 teléfonos** (Galaxy S25 Ultra con captura en `docs/capturasT05/Samsung_s25Ultra.jpeg`; POCO F5 Pro en mano). **Android TV (MiBox 4) queda de lado de momento** (P-43, alcance **solo evidencia**: sigue siendo el equipo mínimo). Se añadió el **panel del tope de imágenes** en `apps/mobile` (`src/ImageCapPanel.tsx`, con tests rojo→verde) para medirlo en un teléfono (P-45). Quedan: que el humano mida ese tope, fijar las versiones en el ADR y revalidar RNF-1 en release (las mediciones actuales son de desarrollo).

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

- [ ] Paquete con hash incorrecto rechazado con mensaje claro
- [ ] Nada se instala sin confirmación
- [ ] Revisión humana

---

## Fase 3 — Corte vertical 2: módulo declarativo

## Task T16: DeclarativeRuntime + transformaciones

**Descripción.** Runtime que ejecuta un módulo declarativo (SPEC §6.6): construir URLs con
plantillas (`{baseUrl}`, `{query}`, `{page}`), listar con selectores, extraer campos con
`attr`/`text`/`regex` y aplicar transformaciones (`trim`, `path`, `absoluteUrl`, `regex`,
`number`, `join`, `replace`). Implementa `ModuleApi` sobre `ModuleHost`.

**Criterios de aceptación:**

- [ ] `search`, `popular`, `latest` → `Page<SeriesSummary>` desde fixtures.
- [ ] `details` y `pages` producen los tipos del contrato.
- [ ] Cada transformación tiene prueba unitaria; `absoluteUrl` y `path` manejan URLs relativas.
- [ ] `hasNext` se calcula según la configuración.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: módulo declarativo de ejemplo contra `test-site` (arquitectura HTML).

**Dependencias:** T06, T08.
**Archivos probables:** `packages/core/src/runtimes/DeclarativeRuntime.ts`,
`packages/core/src/runtimes/transforms.ts`,
`packages/core/src/runtimes/__tests__/declarative.test.ts`.
**Tamaño:** M.

## Task T17: E2E declarativo contra el sitio falso

**Descripción.** Ejecutar el arnés de contrato (T10) contra un módulo declarativo completo que
apunta a las fixtures HTML, cubriendo los 5 métodos y comprobando `releases` múltiples.

**Criterios de aceptación:**

- [ ] El arnés pasa para el módulo declarativo de ejemplo.
- [ ] Un selector roto produce `ModuleError` con `code` y `details.selector`.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- declarative.contract`
- [ ] Manual: romper un selector en la fixture y ver el error tipado.

**Dependencias:** T16, T10.
**Archivos probables:** `packages/core/tests/contract/declarative.contract.test.ts`,
`packages/test-site/fixtures/modules/example-declarative.json`.
**Tamaño:** S.

### 🚩 Checkpoint D (tras T16–T17)

- [ ] `popular`, `latest`, `search`, `details`, `pages` responden desde fixtures
- [ ] Revisión humana

---

## Fase 4 — Corte vertical 3: módulo script

## Task T18: ScriptRuntime + frontera de sandbox/host

**Descripción.** Runtime que carga un módulo script (SPEC §6.5): el módulo exporta
`create(host)` y devuelve un `ModuleApi`. El módulo solo dispone de `host.*`. Documenta la
limitación conocida (D-5: sin aislamiento real en la v1).

**Criterios de aceptación:**

- [ ] Un módulo script de ejemplo se carga y devuelve un `ModuleApi` válido.
- [ ] El módulo no puede llamar red fuera de `host.fetch` (documentado y verificado).
- [ ] Los errores del módulo se convierten en `ModuleError` con código.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: módulo que llama a `host.fetch` a un dominio no permitido → error.

**Dependencias:** T08.
**Archivos probables:** `packages/core/src/runtimes/ScriptRuntime.ts`,
`packages/core/src/runtimes/__tests__/script.test.ts`.
**Tamaño:** M.

## Task T19: E2E script contra el sitio falso

**Descripción.** Ejecutar el arnés de contrato (T10) contra un módulo script de ejemplo que usa
`host.html()` y `host.fetch` sobre las fixtures (incluida la arquitectura JSON de `test-site`).

**Criterios de aceptación:**

- [ ] El arnés pasa para el módulo script de ejemplo (mismo contrato que el declarativo).
- [ ] `images` en `pages()` incluye `headers` (`Referer`, `User-Agent`) cuando el módulo los define.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- script.contract`
- [ ] Manual: comparar la salida contra el runtime declarativo.

**Dependencias:** T18, T10.
**Archivos probables:** `packages/core/tests/contract/script.contract.test.ts`,
`packages/test-site/fixtures/modules/example-script.js`.
**Tamaño:** S.

## Task T20: Carga/selección de ModuleRuntime + mapeo de errores

**Descripción.** Punto único que, a partir de un módulo instalado, elige el runtime adecuado
(declarativo o script) y devuelve un `ModuleApi`. Centraliza el mapeo de errores (red,
timeout, bloqueo, parseo) a `ModuleErrorCode` y garantiza que un módulo roto no tumba la app
(SPEC RNF-8).

**Criterios de aceptación:**

- [ ] `createModuleApi(manifest, entry)` devuelve la implementación correcta.
- [ ] Cada fallo se mapea a un `ModuleErrorCode` del SPEC §6.4.
- [ ] Un módulo que lanza excepciones no propaga fallos no controlados; expone `last_error`.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: módulo que lanza en `details()` → `ModuleError` contenido.

**Dependencias:** T16, T18.
**Archivos probables:** `packages/core/src/runtimes/ModuleRuntime.ts`,
`packages/core/src/runtimes/__tests__/runtimeSelection.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint E (tras T18–T20)

- [ ] Módulo script y declarativo pasan el mismo contrato
- [ ] Errores mapeados a `ModuleErrorCode`
- [ ] Revisión humana

---

## Fase 5 — Corte vertical 4: biblioteca local

## Task T21: Storage SQL + esquema/migraciones + adaptador en memoria

**Descripción.** Implementar el puerto `Storage` sobre un `SqlDriver` fino (SPEC §8.1): esquema
completo (`repo`, `module`, `series`, `folder`, `favorite`, `progress`, `chapter_read`,
`series_pref`, `setting`), índices y migraciones versionadas. Incluye `MemoryStorage` y
`SqliteStorage` probado en Node.

**Criterios de aceptación:**

- [ ] El esquema coincide con el SPEC §8.1 (incluidos `title_norm`, `page_total` e índices).
- [ ] Las migraciones son idempotentes y versionadas.
- [ ] `MemoryStorage` y `SqliteStorage` pasan la misma suite de conformidad.
- [ ] `PRAGMA foreign_keys` activo; `favorite.folder_id` usa `ON DELETE SET NULL`.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: aplicar migraciones dos veces sin error.

**Dependencias:** T03, T07.
**Archivos probables:** `packages/core/src/storage/schema.ts`,
`packages/core/src/storage/SqlDriver.ts`,
`packages/core/src/storage/{MemoryStorage,SqliteStorage}.ts`,
`packages/core/src/storage/__tests__/conformance.test.ts`.
**Tamaño:** M.

## Task T22: Series + favoritos + carpetas (D-12)

**Descripción.** Dominio de biblioteca: registrar/actualizar series (con `title_norm`),
añadir/quitar favoritos (quitar un favorito no borra su progreso, RF-30) y CRUD de carpetas
(crear, renombrar, reordenar, borrar). Un favorito pertenece a **una** carpeta o a ninguna (D-12).

**Criterios de aceptación:**

- [ ] Alta/actualización de serie con normalización de título (minúsculas, sin acentos).
- [ ] Un favorito se asigna a una carpeta o a ninguna; moverlo reemplaza la anterior.
- [ ] Borrar carpeta deja sus favoritos sin carpeta (`ON DELETE SET NULL`).
- [ ] Quitar un favorito conserva la fila de `progress`.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: secuencia crear carpeta→favoritear→mover→borrar carpeta.

**Dependencias:** T21.
**Archivos probables:** `packages/core/src/library/SeriesStore.ts`,
`packages/core/src/library/Favorites.ts`, `packages/core/src/library/Folders.ts`,
`packages/core/src/library/__tests__/library.test.ts`.
**Tamaño:** M.

## Task T23: Filtros/orden/búsqueda + carga 3000 series (AC-4)

**Descripción.** Consultas de biblioteca (SPEC §3.5, §8.2): búsqueda por nombre (`title_norm`
con `LIKE`), filtros por tipo (manga, manhua, manhwa, cómic), fuente, carpeta y NSFW/SFW, y
orden por nombre, último leído y fecha de adición. Chips Todo · Leyendo · Carpetas (sin
«Completado», que es v2). Paginación por cursor y prueba de carga con 3000 series.

**Criterios de aceptación:**

- [ ] Todos los filtros y órdenes del SPEC funcionan y se combinan.
- [ ] Con 3000 series sintéticas, filtrar/buscar responde < 300 ms en el entorno de CI.
- [ ] Con el filtro NSFW apagado, las series NSFW no aparecen (**RF-35**, núcleo).
- [ ] No se calculan contadores de no leídos ni totales de capítulos (RF-42 es v2).
- [ ] Los resultados usan índices (se verifica con `EXPLAIN QUERY PLAN`).

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test -- library.perf`
- [ ] Manual: revisar el plan de consulta de la búsqueda por título.

**Dependencias:** T22.
**Archivos probables:** `packages/core/src/library/queries.ts`,
`packages/core/src/library/__tests__/queries.test.ts`,
`packages/core/tests/perf/library3000.test.ts`.
**Tamaño:** M.

## Task T24: Preferencias por serie (modo de lectura, release preferida)

**Descripción.** Tabla y dominio `series_pref` (SPEC §8.1): modo de lectura por serie
(vertical/paginado y dirección) y release/grupo preferido por serie (RF-16, RF-18).

**Criterios de aceptación:**

- [ ] Guardar/leer modo de lectura y release preferida por `(module_id, series_id)`.
- [ ] El modo predeterminado según tipo se aplica cuando no hay preferencia (manhua y manhwa
      vertical, manga D→I, cómic I→D).
- [ ] Actualizar una preferencia actualiza `updated_at`.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test`
- [ ] Manual: comprobar el valor por defecto por cada tipo.

**Dependencias:** T22.
**Archivos probables:** `packages/core/src/library/SeriesPrefs.ts`,
`packages/core/src/library/__tests__/prefs.test.ts`.
**Tamaño:** S.

### 🚩 Checkpoint F (tras T21–T24)

- [ ] Filtro/búsqueda < 300 ms con 3000 series (entorno Node)
- [ ] Un favorito pertenece a una carpeta o a ninguna
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

- [ ] Todos los tokens de SPEC §11.9 existen como tokens semánticos; los genéricos del front-matter no se usan.
- [ ] Existe un mapa de tema Dragon Night y la estructura para añadir temas futuros.
- [ ] Ningún componente consumirá valores literales (P2-4).

**Verificación:**

- [ ] `pnpm --filter @ryuunest/ui-tokens test && pnpm --filter @ryuunest/ui-tokens build`
- [ ] Manual: comparar cada token con `DESIGN.md` y SPEC §11.9.

**Dependencias:** T01, T02.
**Archivos probables:** `packages/ui-tokens/src/{colors,typography,spacing,radii,density,theme}.ts`,
`packages/ui-tokens/src/index.ts`, `packages/ui-tokens/src/__tests__/tokens.test.ts`.
**Tamaño:** M.

## Task F02: Prueba de tokens y contraste (AC-13)

**Descripción.** Prueba automática que compara `ui-tokens` con los tokens de SPEC §11.9 de
`DESIGN.md` y calcula el contraste WCAG de los pares usados (texto sobre `bg`/`surface`/
`elevated`, texto oscuro sobre `accent`/`progress`). Falla si algún par no cumple AA.

**Criterios de aceptación:**

- [ ] Los tokens propios coinciden con `DESIGN.md`; si un genérico difiere, se ignora y se anota.
- [ ] Todos los pares usados cumplen WCAG AA; los rellenos de `accent`/`progress` llevan texto `bg`.
- [ ] La prueba corre en CI (**AC-13**).

**Verificación:**

- [ ] `pnpm --filter @ryuunest/ui-tokens test`
- [ ] Manual: introducir un color que falle y comprobar que la prueba falla.

**Dependencias:** F01.
**Archivos probables:** `packages/ui-tokens/src/__tests__/contrast.test.ts`, `vitest.config.ts`.
**Tamaño:** S.

## Task F03: Fuentes e iconos empaquetados

**Descripción.** Empaquetar **Manrope** (600/700) e **Inter** (400/500/600) desde archivos
locales (OFL) e integrar **Lucide** (`lucide-react-native` en móvil/TV, `lucide-react` en web).
Sin pesos sintéticos. Registrar en `ASSETS.md`.

**Criterios de aceptación:**

- [ ] Las fuentes cargan desde archivos locales; ningún CDN (RNF-5).
- [ ] Un único conjunto de iconos SVG (Lucide); sin emojis ni glifos de texto (V4).
- [ ] `ASSETS.md` registra Manrope, Inter y Lucide con su licencia.

**Verificación:**

- [ ] Manual: arrancar la galería y comprobar que no hay peticiones externas.
- [ ] Playwright: cero peticiones a dominios externos.

**Dependencias:** F01.
**Archivos probables:** `apps/mobile/assets/fonts/*`, `packages/ui-tokens/src/fonts.ts`,
`apps/mobile/src/icons.ts`, `ASSETS.md`.
**Tamaño:** S.

## Task F04: Escala y layout por densidad

**Descripción.** Utilidades de escala y layout: rejilla de 4 px, márgenes y separaciones por
punto de corte (móvil < 600, tablet 600–1024, escritorio > 1024), portadas 2:3 y factor TV
1,25×. Base compartida por móvil, web y TV.

**Criterios de aceptación:**

- [ ] Un helper de densidad (compacta/cómoda/TV) expone espaciado, márgenes y escala tipográfica.
- [ ] La escala TV aplica 1,25× a todos los tamaños (SPEC §11.9).
- [ ] Márgenes correctos por punto de corte.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/ui-tokens test`
- [ ] Manual: galería en 3 anchos (móvil, tablet, escritorio).

**Dependencias:** F01.
**Archivos probables:** `packages/ui-tokens/src/{scale,layout}.ts`,
`packages/ui-tokens/src/__tests__/layout.test.ts`.
**Tamaño:** S.

## Task F05: Galería de componentes (pantalla de desarrollo)

**Descripción.** Pantalla solo para desarrollo que muestra cada componente en todos sus
estados (normal, presionado, foco, deshabilitado, cargando, error). Es la base de AC-12 y
AC-13 y del trabajo por pantallas (Regla 3 y 5 de `AGENTS.md`).

**Criterios de aceptación:**

- [ ] La galería lista todos los componentes y sus estados.
- [ ] Compila para web (base de la verificación con Playwright).
- [ ] Sin valores literales; todo sale de `ui-tokens`.

**Verificación:**

- [ ] Playwright: abrir la galería y comprobar estados y cero peticiones externas.

**Dependencias:** F01, F03, F04.
**Archivos probables:** `apps/mobile/src/gallery/*` (o `apps/web/src/gallery/*`).
**Tamaño:** M.

## Task F06: Componentes base 1 (botones, campos, casillas, chips, insignias)

**Descripción.** Componentes reutilizables con props tipadas y todos sus estados: botón
primario/secundario/destructivo (SPEC §11.10), campo de texto y búsqueda, casillas y radios,
chip de filtro (36 px + `hitSlop`), insignia de tipo/estado (24 px, **neutra** según V1).

**Criterios de aceptación:**

- [ ] Un botón primario por pantalla; relleno `accent`/`progress` con texto `bg`.
- [ ] Chips e insignias con `hitSlop` para llegar a 48 dp (RNF-7).
- [ ] Todos los estados en la galería; animaciones solo `transform`/`opacity` (Regla 4).

**Verificación:**

- [ ] Playwright sobre la galería; comprobación de áreas táctiles y contraste.

**Dependencias:** F05.
**Archivos probables:** `apps/mobile/src/components/{Button,TextField,Checkbox,Chip,Badge}.tsx`.
**Tamaño:** M.

## Task F07: Componentes base 2 (tarjeta, fila de capítulo, cabecera, navegación, hojas)

**Descripción.** Tarjeta de portada (2:3, radio 12, borde `border`, barra de progreso de 3 px
RF-41, **sin contador de no leídos**), fila de capítulo (3 estados: sin leer, en curso con
porcentaje, completado atenuado con ✓), fila de ajustes, encabezado único (logo local), barra
inferior de 5 destinos / riel, hojas y diálogos (esquinas superiores 24 px).

**Criterios de aceptación:**

- [ ] La fila de capítulo muestra máximo dos señales por estado (V8).
- [ ] La cabecera y la barra inferior son las mismas en todas las pantallas (T1, V5).
- [ ] Sin sombras; profundidad por niveles de superficie (RNF-12).

**Verificación:**

- [ ] Playwright sobre la galería; comprobación de estados de capítulo y barra de progreso.

**Dependencias:** F06.
**Archivos probables:** `apps/mobile/src/components/{CoverCard,ChapterRow,Header,BottomNav,Sheet,Dialog}.tsx`.
**Tamaño:** M.

## Task F08: Estados vacíos y de error + dragón marcador

**Descripción.** Componentes de estado vacío, sin resultados, error de módulo (causa, código,
reintentar, ver detalle) y carga breve, con el dragón marcador de `assets/placeholder/` y una
acción siguiente (SPEC §11.12). Sin tarjetas-mascota (T4).

**Criterios de aceptación:**

- [ ] Cada estado lleva dragón (según §11.12/§11.5), título en Manrope y una acción.
- [ ] El error de módulo incluye detalle técnico desplegable (módulo, URL, código, selector).
- [ ] El dragón es un marcador local (sin obras reales ni texto).

**Verificación:**

- [ ] Playwright sobre la galería; revisar la lista de 20 s.

**Dependencias:** F07.
**Archivos probables:** `apps/mobile/src/components/{EmptyState,ErrorState,LoadingState}.tsx`,
`assets/placeholder/README.md`.
**Tamaño:** M.

## Task F09: Lint de diseño (sin literales en `apps/*`)

**Descripción.** Regla de lint que prohíbe colores hexadecimales y medidas literales de fuente,
radio o espacio en `apps/*` (SPEC §11.11, AC-13). Fuerza a usar tokens.

**Criterios de aceptación:**

- [ ] El lint falla ante un `#RRGGBB` o un `padding: 13` literal en `apps/*`.
- [ ] La regla corre en CI junto al resto.
- [ ] Excepciones documentadas (si las hay) con comentario.

**Verificación:**

- [ ] `pnpm lint`
- [ ] Manual: introducir un literal y comprobar que falla.

**Dependencias:** T02, F01.
**Archivos probables:** `eslint.config.js` (regla personalizada), `tools/eslint-plugin-ryuunest/*`.
**Tamaño:** S.

## Task F10: Internacionalización (archivo de traducciones)

**Descripción.** Archivo de traducciones en español desde el inicio (RF-40) con todas las
cadenas de la interfaz; ninguna cadena literal en los componentes. Fechas y números con
formato local (RNF-11).

**Criterios de aceptación:**

- [ ] Todas las cadenas visibles viven en el archivo de traducciones.
- [ ] Existe la estructura para añadir inglés después.
- [ ] Los componentes de la galería ya usan claves de traducción.

**Verificación:**

- [ ] `pnpm --filter @ryuunest/core test` (o paquete i18n) y revisión de la galería.

**Dependencias:** F05.
**Archivos probables:** `apps/mobile/src/i18n/{es.json,index.ts}`.
**Tamaño:** S.

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
