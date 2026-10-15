# ADR-0001: Stack y convenciones de la fundación

- **Estado:** aceptado
- **Fecha:** 2026-10-13
- **Tarea:** T03 (Fase 0)
- **Autoridad:** `docs/SPEC.md` (§5.4, §13, §15) y `MEMORY.md` §2

## Contexto

RyuuNest es un monorepo *greenfield* (lector local de manga, manhua, manhwa y cómics)
con núcleo TypeScript puro y módulos de scraping instalables. Antes de escribir código
de producto hay que fijar el stack, las decisiones de arquitectura y las convenciones
de trabajo, de modo que cualquier agente o persona sepa qué está decidido y de dónde sale.

Este ADR **registra** decisiones ya tomadas; no abre debate nuevo.

## Decisión 1 — Arquitectura del sistema

Se adoptan las decisiones `D-1`…`D-13` de `docs/SPEC.md` §5.4 tal cual:

| ID | Decisión |
|---|---|
| D-1 | Monorepo con núcleo TS puro |
| D-2 | React Native (Expo) con variante TV |
| D-3 | Cliente web separado |
| D-4 | Módulos en dos niveles (declarativo y script) |
| D-5 | Script con confianza total en la v1, tras la interfaz `ModuleRuntime` |
| D-6 | Paquete `.zip` con manifest y hash |
| D-7 | SQLite en móvil e IndexedDB en web |
| D-8 | Sin servidor ni cuentas |
| D-9 | Android 9 como mínimo (cubre la MiBox 4) |
| D-10 | Respaldo JSON en la v1; sincronización en la v2 |
| D-11 | Licencia GPL-3.0 |
| D-12 | Un favorito pertenece a **una** carpeta o a ninguna |
| D-13 | Tipos de obra: manga, manhua, manhwa y cómic |

## Decisión 2 — Producto y proceso

Se adoptan las decisiones `P-1`…`P-12` de `MEMORY.md` §2:

| ID | Decisión |
|---|---|
| P-1 | Nombre del proyecto: **RyuuNest**; público y con contribuciones de la comunidad |
| P-2 | Todo el scraping corre en el dispositivo; sin servidor propio ni cuentas |
| P-3 | Distribución por APK directo y PWA; sin tiendas |
| P-4 | Licencia **GPL-3.0** |
| P-5 | App en React Native (Expo) con variante TV; web como cliente separado con extensión |
| P-6 | Módulos como paquetes `.zip` con `manifest.json`, código y hash; en dos niveles |
| P-7 | La v1 no incluye sincronización ni descargas; respaldo en JSON |
| P-8 | Sitios con anti-bot: se informa `BLOCKED` y se deja para la v2 |
| P-9 | Se desarrolla con Opencode; sin fecha límite y sin experiencia previa en React Native |
| P-10 | Dispositivos de prueba: POCO F5 Pro, Galaxy S25 Ultra y Xiaomi MiBox 4 |
| P-11 | Interfaz en español al inicio, con cadenas externalizadas |
| P-12 | El diseño es la plantilla de Stitch «RyuuNest Dragon Nest Themed UI» |

El resto de decisiones de producto y proceso (`P-13`…`P-35`) viven en `MEMORY.md` §2, que es
la **fuente canónica** y se actualiza en cada sesión.

## Decisión 3 — Stack y tooling

Estas elecciones provienen de `tasks/plan.md` §3 y se adoptan aquí como referencia estable:

| Área | Elección | Motivo |
|---|---|---|
| Monorepo / runner | **pnpm workspaces** | Rápido; enlaza paquetes del workspace sin publicar |
| Pruebas | **Vitest** | Nativo TS/ESM; el núcleo es puro y usa fixtures |
| Descompresión `.zip` | **fflate** | Pequeña, JS puro, corre en Node y RN |
| SHA-256 | **@noble/hashes** | JS puro (RN no trae Web Crypto) |
| Parseo HTML del host | **htmlparser2 + css-select** | Selectores CSS sin APIs de Node |
| Almacenamiento | Puerto `Storage` abstracto; `SqlDriver` fino + `SqliteStorage` + `MemoryStorage` | El núcleo no depende de plataforma |
| Driver SQL de CI | **better-sqlite3** (solo dev/test) | Síncrono y simple para pruebas |
| Módulos de sitios reales | Viven **fuera** del repo principal | Requisito legal (SPEC §15) |
| Sitio falso de pruebas | Paquete reutilizable **`packages/test-site`** | Reutilizable por el SDK y por la galería |
| Límites de módulo | Los del SPEC §7.1 (paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos) | Defensa anti-bomba |
| TypeScript | Fijado a la **6.x** por ahora | `typescript-eslint` aún no soporta TS 7 (ver `MEMORY.md` P-34) |
| ESLint / Prettier / Vitest / typescript-eslint | Versiones al día (ver `MEMORY.md` P-34) | — |

## Nota sobre los identificadores de decisión

`tasks/plan.md` §3 numera sus propias decisiones como `P-1`…`P-14`, y `MEMORY.md` §2 usa
`P-1`…`P-35` para decisiones **distintas**: los números chocan. Para evitarlo:

1. La **fuente canónica** de decisiones de producto/proceso es `MEMORY.md` §2.
2. Las decisiones de arquitectura se citan por su ID del SPEC (`D-n`).
3. `tasks/plan.md` §3 queda como **histórico local del plan**; sus `P-n` **no se citan**.
   Resuelto en `MEMORY.md` P-35.

## Consecuencias

- Cualquier tarea nueva cita decisiones por `D-n` (SPEC) o `P-n` (`MEMORY.md`), nunca por el
  `P-n` local de `tasks/plan.md`.
- Cambiar una decisión no borra la anterior: se marca como reemplazada y se enlaza la nueva
  (`MEMORY.md`, «Cómo se mantiene»).
- Fijar TypeScript en 6.x se revisa cuando `typescript-eslint` soporte TS 7.
