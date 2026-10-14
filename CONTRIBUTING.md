# Contribuir a RyuuNest

Gracias por querer aportar. RyuuNest es un lector local y de código abierto de manga,
manhua, manhwa y cómics, con licencia **GPL-3.0**. Este documento explica cómo preparar el
entorno, cómo se nombran las ramas y los commits y cómo se comprueba que un cambio está listo.

> Antes de tocar nada, lee `AGENTS.md` (reglas de trabajo), `MEMORY.md` (decisiones) y la
> sección del `docs/SPEC.md` que corresponda a tu tarea. El orden de autoridad está en la
> cabecera del SPEC.

## Requisitos

- **Node.js ≥ 22** y **pnpm 12** (`corepack enable` o `npm i -g pnpm@12`).
- Git.
- Para la app móvil (Parte 2): Android Studio / un dispositivo con Android 9 o superior.

## Preparar el entorno

```bash
pnpm install
```

`pnpm install` enlaza los paquetes del workspace (`@ryuunest/*`) sin publicarlos.

## Comandos de verificación

Son los mismos que corre el CI (`.github/workflows/ci.yml`):

| Comando | Qué comprueba |
|---|---|
| `pnpm lint` | ESLint sobre todo el repo |
| `pnpm -r typecheck` | TypeScript estricto, sin emitir |
| `pnpm -r test` | Vitest en cada paquete |
| `pnpm -r build` | Compilación de cada paquete |

Prueba focalizada de un paquete:

```bash
pnpm --filter @ryuunest/core test
```

Formato: `pnpm format` (escribe) o `pnpm format:check` (solo comprueba).

**Un cambio no está terminado hasta que lint, tipos y pruebas están en verde.** La lista
completa está en `docs/definition-of-done.md`.

## Ramas

- `main` siempre en verde.
- Ramas de trabajo con prefijo según el tipo de cambio:
  - `feat/<tarea>` para una tarea nueva (por ejemplo `feat/t03-documentacion-base`).
  - `fix/<asunto>` para corregir un fallo.
  - `docs/<asunto>`, `chore/<asunto>`, `refactor/<asunto>` para el resto.
- Una rama = una tarea del plan (`tasks/todo.md`). No mezcles tareas.

## Commits

Se usa **Conventional Commits** con descripción **en español**:

```text
<tipo>(<alcance>): <descripción en imperativo>
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`.

Ejemplos:

```text
feat(core): añade los tipos del contrato y ModuleError
docs: registra ADR-0001 con el stack y las convenciones
fix(sdk): rechaza manifests con apiVersion distinta de 1
```

Reglas:

- Un commit = un cambio lógico. Nada de `git add -A` a ciegas.
- No mezcles un refactor con una función nueva en el mismo commit.
- Mantén el proyecto compilable entre commits.

## Flujo de trabajo

1. Crea tu rama desde `main`.
2. Implementa la tarea siguiendo `tasks/todo.md` y sus criterios de aceptación.
3. Añade o actualiza las pruebas (Vitest); el enfoque es *test-first*.
4. Ejecuta la verificación completa (lint, tipos, pruebas, build).
5. Actualiza la documentación que corresponda (`MEMORY.md`, ADRs, `design/stitch/DIFFS.md`…).
6. Abre un Pull Request describiendo qué cambia y qué criterio cumple.

Si tocas interfaz, además se aplican las reglas de componentes, animaciones y verificación
con Playwright de `AGENTS.md` (secciones 3, 4 y 5).

## Estilo de código

- TypeScript en modo estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Identificadores de código en inglés; documentación y commits en español.
- Nada de `any` sin justificar.
- Sin colores ni medidas literales fuera de los tokens (`ui-tokens`); ver `DESIGN_RULES.md`.
- Sin dependencias nuevas sin discutirlo antes en un *issue* (Regla 1 de `AGENTS.md`).

## Recursos de terceros

Todo recurso de terceros (fuentes, iconos, imágenes) registra su licencia en `ASSETS.md`.
En un repositorio GPL-3.0 **no entran** recursos con licencias no libres o no comerciales.

## Módulos de sitios reales

Los módulos de sitios concretos **no van en este repositorio**: viven en un repo aparte, no
afiliado a la app (SPEC §15). Aquí solo entran el contrato, el SDK y los sitios **falsos** de
prueba (`packages/test-site`).

## Preguntas

Ante una duda real, se pregunta antes de inventar (Regla 1 de `AGENTS.md`): datos de ejemplo,
versiones, textos de interfaz, nombres de módulos o licencias no se suponen.
