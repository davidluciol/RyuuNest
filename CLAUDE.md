# CLAUDE.md - RyuuNest

> Reglas para Claude Code. Léelas al inicio de cada sesión. Límite: 2000 tokens.
> Lector local y open source (GPL-3.0) de manga, manhua, manhwa y cómic; monorepo pnpm, TypeScript estricto. Sin servidor, cuentas, telemetría ni CDN.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

RyuuNest: local, open-source (GPL-3.0) reader for manga/manhua/manhwa/comics with installable scraping modules. pnpm monorepo, strict TypeScript, Node ≥ 22. No server, accounts, telemetry, CDN or third-party services.

**`AGENTS.md` is the authoritative rule set (in Spanish) and applies to Claude Code too — read it at session start.** It is not repeated here. Key points: document authority order is `docs/SPEC.md` > `DESIGN_RULES.md` > `DESIGN.md` > `design/stitch/*/screen.png`; also read `MEMORY.md` (decisions) and `tasks/todo.md`; strict red→green TDD; one task per session (~5 files); max 2 attempts on the same error, then stop and escalate; ask rather than invent; work on a branch (`feature/…`, `fix/…`, `docs/…`), never push to `master`, don't merge PRs. Docs, commits and replies to the user are in Spanish; code identifiers in English.

## Commands

```bash
pnpm install
pnpm lint                      # eslint . (includes the custom @ryuunest/eslint-plugin)
pnpm -r typecheck
pnpm -r test                   # vitest in every workspace
pnpm -r build
pnpm format:check              # prettier
```

Final gate = `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm -r build`. On Windows, if Vitest fails with `.vitest-cache`/worker errors, rerun with `pnpm -r --workspace-concurrency=1 test` (not a code failure).

Single test: `pnpm --filter @ryuunest/core exec vitest run path/to/file.test.ts` (add `-t "name"` to filter by test name).

Per app: `pnpm --filter @ryuunest/web dev` (Vite), `pnpm --filter @ryuunest/mobile start|android|web` (Expo; its typecheck needs `--stack-size`, so use the package script), `pnpm --filter @ryuunest/extension build`.

## Architecture

Workspaces: `apps/*`, `packages/*`, `tools/*`.

- `packages/core` — platform-agnostic domain logic (library, reader, progress, backup, diagnostics, module install/runtimes, repo index, storage, `ports` for platform I/O). Apps depend on it; it must not depend on apps.
- `packages/module-sdk` — module manifest/validation/semver/repo index plus a CLI for authors of scraping modules. Module contract tests use saved HTML/JSON fixtures, never real sites (`packages/test-site` provides the fake site).
- `packages/extension-protocol` — messages shared between the browser extension and the app.
- `packages/ui-tokens` — the only place for colors, sizes, radii and spacing. `packages/i18n` — translation catalog; no literal UI strings in components.
- `apps/mobile` (Expo / React Native, Android phone + Android TV) — Expo Router in `src/app/(tabs)`, screens in `src/screens/<area>`, reusable components in `src/components` (each must also appear in `src/gallery`, the component gallery, with all states). Also runs on web via Expo.
- `apps/web` (Vite client), `apps/extension` (browser extension; options page under `src/options`).
- `tools/eslint-plugin-ryuunest` — custom lint rules enforcing project conventions (e.g. no literal values outside `ui-tokens`); lint failures here usually mean a convention violation, not style.
- `modules/` holds module-related material; `legacyModulos/*.py` are old Python scrapers kept for reference only.

Docs: `docs/SPEC.md` (v1 scope; anything outside is omitted and logged in `design/stitch/DIFFS.md`), `tasks/plan.md`, `tasks/todo.md`, `tasks/complexity.md`, `docs/definition-of-done.md`.

## Project-specific gotchas

- Never copy HTML from `design/stitch/` (reference only); translate to React Native using tokens. Animations: only `transform`/`opacity`, 150–200 ms, never in the reader.
- UI verification: Playwright for web/gallery; **agent-device** (MCP in `.mcp.json`) for the native app — web passing does not verify native. The Android emulator doesn't start on this PC (no hypervisor); use the physical phone.
- Code exploration: query Graphify first (`graphify query "<question>"`, `graphify-out/graph.json`), and run `graphify update .` after modifying code.
- Library API docs: use Context7 (`npx ctx7@latest library <name> "<topic>"`), not memory.
- Versions are pinned (Phase 0); don't add dependencies or bump versions without asking. The pnpm workspace uses `minimumReleaseAgeExclude` for specific Expo pins.

## 0. Autoridad, alcance y dudas

1. `docs/SPEC.md` decide **qué** hace la app.
2. `DESIGN_RULES.md` decide **qué se toma del diseño y cómo se usa el color**.
3. `DESIGN.md` decide **cómo se ve** cada componente.
4. Los `screen.png` de `design/stitch/` deciden la composición; los `code.html` son solo referencia.
5. `MEMORY.md` guarda decisiones, hitos y preguntas abiertas.
6. **SPEC:** `docs/SPEC.md`. **PLAN:** `tasks/plan.md`. **TODO:** `tasks/todo.md`. `tasks/complexity.md` §1 fija el tamaño de sesión y el escalado.

- Ante duda, dato faltante o contradicción: **pregunta al humano** con 2–3 opciones y una recomendación. No inventes requisitos, datos, versiones, URLs, textos ni licencias. Avanza en lo independiente y anota el bloqueo.
- Una tarea por sesión y ~5 archivos como máximo. Si fallas dos veces el mismo error, detente y escala; no sigas tocando código.
- Nada fuera de la v1 del SPEC. Sin telemetría, cuentas, servicios de terceros ni CDN. Ningún módulo se instala solo: toda instalación exige confirmación manual.

## 1. Inicio de sesión

- Lee `MEMORY.md`, `tasks/todo.md` y las secciones del SPEC que toques. Si tocas UI, lee además `DESIGN_RULES.md`, `DESIGN.md` y el `screen.png`/`code.html` de esa pantalla.
- Antes de buscar código, consulta Graphify (§4); después lee solo los archivos y rangos localizados.
- Para APIs de librerías, frameworks o CLI usa **Context7**: `npx ctx7@latest library <nombre> "<tema>"` y luego `npx ctx7@latest docs <id> "<tema>"`. No respondas de memoria.

## 2. TDD y verificación

- **Rojo → verde → limpio.** Toda tarea empieza por una prueba que falla; sin test rojo no se implementa. No edites un test para que pase salvo que el criterio de aceptación lo exija.
- Gate final: `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm -r build`.
- Contrato de módulos: fixtures HTML/JSON guardados, nunca sitios reales.
- **Web y galería:** verifica con Playwright en ancho móvil y escritorio. Comprueba: sin overflow horizontal, sin textos cortados que quepan (T7: tarjetas, 3 líneas), áreas interactivas ≥48×48, foco visible, consola sin errores y **cero peticiones externas** (RNF-5). Compara con `screen.png`; registra diferencias en `design/stitch/DIFFS.md`.
- **App nativa:** Playwright no la cubre. Usa **agent-device** (MCP) con `open` → `snapshot` → `press`/`fill` → `wait`; cierra con `close` y libera el dispositivo.
- No añadas dependencias ni instales nada sin preguntar. Las versiones se fijan en la Fase 0.
- En Windows, si Vitest falla con `.vitest-cache` o workers, repite con `pnpm -r --workspace-concurrency=1 test`; no es un fallo del código.

## 3. Código y UI

- TypeScript estricto; sin `any` sin justificar. Identificadores en inglés; documentos, commits y respuestas en español.
- Componentes reutilizables con props tipadas. Antes de crear uno, busca uno existente; añade todos sus estados a la galería.
- Solo tokens de `packages/ui-tokens`: prohibidos hexadecimales, medidas, radios, espacios y colores literales.
- Textos de UI en el catálogo de traducciones; nunca literales en componentes.
- Animaciones solo `transform`/`opacity`, 150–200 ms `ease-out`; respeta `prefers-reduced-motion`; **ninguna animación en el lector**.
- No copies el HTML de `design/stitch/`; tradúcelo a React Native con tokens.
- La Xiaomi MiBox 4 (2 GB) es el piso de rendimiento; si algo se nota lento, mídelo y desactívalo en TV anotándolo en `MEMORY.md`.

## 4. Graphify

- Si existe `graphify-out/graph.json`, es la vía para explorar código. **Antes del primer grep o lectura de código**, ejecuta `graphify query "<pregunta>"`. Usa `graphify path "A" "B"` para relaciones y `graphify explain "X"` para conceptos.
- Si existe `graphify-out/wiki/index.md`, úsalo para navegación amplia. `GRAPH_REPORT.md` solo para arquitectura general.
- Tras modificar código: `graphify update .` (AST, sin coste de API). El diff grande de `graph.json` es esperado; no lo descartes.
- El MCP vive en `.mcp.json` (`graphify-mcp --graph graphify-out/graph.json`); si falta, créalo. Si falta el CLI: `uv tool install "graphifyy[mcp]"` (aporta `graphify` y `graphify-mcp`), luego `graphify install --platform claude --project` y reindexa con `graphify update .`. Si la instalación toca el sistema, pide permiso.

## 5. MEMORY.md

- Cada sesión actualiza `MEMORY.md` con lo importante (no un registro de comandos): al cerrar un hito, añade o edita su línea en §2; las decisiones nuevas o cambiadas van en §3.
- No borres una decisión: márcala como reemplazada y enlaza la nueva. Las preguntas sin resolver se listan en §4 y se dicen al humano al cerrar.

## 6. Git

- Antes de empezar: `git pull origin master`; trabaja en una rama propia `feature/<Tarea>-<slug>` (o `fix/`, `docs/`). **Nunca** pushees directo a `master`.
- Commits atómicos: `<tipo>: <descripción>` (`feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `chore`).
- Antes de commit: `pnpm lint && pnpm -r typecheck && pnpm -r test` (y `pnpm -r build` si toca).
- Al terminar: `gh pr create` con título, qué/por qué, criterios cumplidos, capturas si hay UI y evidencia del gate. **No fusiones el PR**; lo revisa el humano. No dejes ramas huérfanas.

## 7. Cierre

- [ ] Gate en verde y criterios de aceptación cumplidos.
- [ ] Sin cambios fuera del alcance ni dependencias innecesarias.
- [ ] Playwright/agent-device según corresponda; componentes nuevos en la galería; sin valores literales.
- [ ] `MEMORY.md` actualizado y preguntas abiertas comunicadas.
