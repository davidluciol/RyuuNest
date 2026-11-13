# Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo) + Parte 2 (Diseño y Front-end)

> Documento de planificación. Estado: **en ejecución** (revisado por el humano; no aprobado formalmente).
> Fuentes (orden de autoridad): `docs/SPEC.md` → `DESIGN_RULES.md` → `DESIGN.md`
> → PNG de `design/stitch/` → HTML de `design/stitch/` → `docs/IDEA.md`. Contexto: `docs/SPEC_Legacy.md`,
> `legacyModulos/*.py`, `AGENTS.md`, `MEMORY.md`.
> Fecha: 13 de octubre de 2026 · Licencia: GPL-3.0.
> **Actualizado: 12 de noviembre de 2026** — estados sincronizados con lo hecho y `tasks/todo.md` podado a solo pendientes (historial en `tasks/todo.archive.md`).
> Complejidad, modelo y esfuerzo por tarea pendiente: `tasks/complexity.md`. Registro de cambios: §12.

## 1. Resumen

RyuuNest es un lector local de manga, manhua, manhwa y cómics sin servidor: monorepo
pnpm + TypeScript estricto con `packages/core` (núcleo), `packages/module-sdk`,
`packages/test-site`, `packages/ui-tokens`, `apps/mobile` (móvil + TV), `apps/web`,
`apps/extension` y repo aparte de módulos (`RyuuNest-Models`).

**Estado actual (2026-11-12):** la Parte 1 (núcleo) está **casi cerrada**: faltan T33
(seguridad), el cierre de la API 1.0 (T38–T41, ADR-0003) y los checkpoints I/J. La Parte 2
está **avanzada**: sistema de diseño completo (F01–F10), móvil con todas las pantallas v1
(F11–F21) más errores y diagnóstico (FB2/F29/F30), extensión y puente web hechos (F26/F27),
cliente web y sus pantallas hechos (F24/F25); quedan TV (F22/F23), correcciones F31/F34/F40–F45,
pulidos F35–F39, QA web (QAw1–3) y verificación en dispositivo (AC-12/AC-6, 🧍).

## 2. Alcance

**Parte 1 (núcleo):** contrato y errores, puertos + falsos, `ModuleHost`, runtimes
(declarativo y script), instalador, registro de módulos, repos, biblioteca, progreso,
estado del lector, respaldo, SDK/CLI, `test-site`, CI, ADRs. Interfaces de puertos sí;
implementaciones de plataforma de la UI, no (Parte 2). La app de calibración (T05) toca
Expo por decisión del humano. Contador de no leídos y filtro «Completado» son v2 (RF-42).

**Parte 2 (diseño/front-end):** `ui-tokens`, móvil (React Native/Expo) y variante TV,
web (React + Vite), extensión, pantallas, galería y estados. Funciones fuera de la v1 que
aparecen en las capturas se omiten y anotan en `design/stitch/DIFFS.md` (RF-44).

## 3. Decisiones de arquitectura

Las decisiones D-1…D-13 de `SPEC.md` §5.4 se respetan sin cambios. Decisiones técnicas
del plan (registradas en `docs/decisions/ADR-0001-stack-y-convenciones.md`; ⚠️ estos `P-n`
son del plan y **colisionan** con los de `MEMORY.md` §2 — no citarlos):

| # | Decisión |
|---|---|
| P-1 | Monorepo con **pnpm workspaces** |
| P-2 | Pruebas con **Vitest** |
| P-3 | Descompresión `.zip` con **fflate** |
| P-4 | SHA-256 con **@noble/hashes** |
| P-5 | Parseo HTML en el host con **htmlparser2 + css-select** |
| P-6 | `Storage` abstracto; `SqlDriver` fino + `SqliteStorage` + `MemoryStorage` |
| P-7 | Driver SQL de CI: **better-sqlite3** (solo dev/test) |
| P-8 | Módulos de sitios reales **fuera** del repo (SPEC §15) |
| P-9 | Sitio falso de pruebas = paquete reutilizable `packages/test-site` |
| P-10 | 2.º sitio real → prueba de generalidad con 2.º sitio falso JSON/cursor (T32a) |
| P-11 | Límites de módulo: los del SPEC §7.1 (2 MB / 5 MB / 50 archivos) |
| P-12 | Tracker: `bd` local → GitHub Issues |
| P-13 | `MEMORY.md` en la raíz |
| P-14 | La Parte 2 se planificó en la misma sesión del plan |
| P-15 | División de tareas (T25+T26 juntos; T29a/b; T32a/b) por complejidad/modelo |
| P-16 | Gestión por complejidad en `tasks/complexity.md` (N1–N5, regla de 2 intentos) |

## 4. Grafo de dependencias y estado

```text
FASE 0 — Fundación (infra)                    T01–T04 ✅ · T05 🟡 (cierre 🧍)
  T01 Monorepo + TS estricto (pnpm)
   ├─ T02 Tooling + CI (vitest) ✅
   ├─ T03 Documentación base / ADRs / ASSETS / DoD ✅
   ├─ T04 Inventario y organización de design/ ✅
   └─ T05 Calibración + presupuesto de memoria 🟡

FASE 1 — Contrato y arnés                     T06–T11 ✅ (Checkpoint B ✅)
FASE 2 — Instalación                          T12–T15 ✅ (Checkpoint C ✅) → AC-2, AC-8
FASE 3 — Declarativo                          T16–T17 ✅ (Checkpoint D ✅)
FASE 4 — Script                               T18–T20 ✅ (Checkpoint E ✅)
FASE 5 — Biblioteca                           T21–T24 ✅ (Checkpoint F ✅) → AC-4
FASE 6 — Progreso                             T25/T26/T27 ✅ + T25b ✅ (Checkpoint G ✅)
FASE 7 — Respaldo                             T28–T30 ✅ + T30b ✅ (Checkpoint H ✅, falta 🧍) → AC-7
FASE 8 — Generalidad                          T31 ✅ (retirado del repo, P-80) · T32a ✅ · T32b ✅ (ADR-0003)
  Cierre API 1.0: T37 ✅ → T38 → T39 → T40 → T41 🧍 (Checkpoint I ⏳)
FASE 9 — Endurecimiento                       T34 ✅ · T35 ✅ (AC-11) · T36 ✅ · T33 ⏳ (Checkpoint J ⏳)
  FA1 Arte del dragón 🧍 (independiente; antes de v1.0 pública)

FASE 10 — PARTE 2
  6a Sistema de diseño: F01–F10 ✅ (Checkpoint P-A 🟡 revisión 🧍)
  6b Móvil: F11–F21 ✅ · FB2/F29/F30 ✅ · F31 🟡 · F34 🟡 · F17 🟡 · F40–F45 ⏳ (propuestas de F33)
  7 TV: F22, F23 ⏳ (Checkpoint P-C ⏳)
  8 Web+extensión: F24/F25 ✅ (subida react/router 8 ⏳) · F26/F27 ✅ (restos 🧍) · QAw1–3 ⏳
  Verificación final: F28 🟡 (web ✅, dispositivo 🧍) · Checkpoint P-E ⏳
  Extras del recorrido: F32 ✅ · F33 ✅ → F35–F39, T42 ⏳
```

Regla de orden: de abajo hacia arriba; cada fase termina en un **checkpoint** verificable.
Las tareas de alto riesgo (instalación, runtimes, memoria) van temprano.

## 5. Estrategia de cortes verticales

No se construye "toda la base, luego toda la API, luego toda la UI": cortes completos y
verificables con el arnés de pruebas como punta. Cada **pantalla** de la Parte 2 también es
un corte vertical (componentes → datos → estados → Playwright vs `screen.png`). Cada corte
deja el sistema funcional y con pruebas en verde. Detalle en `tasks/todo.md` y
`docs/screen-blueprint.md` (FB1, patrón documentado para pantallas nuevas).

## 6. Índice de tareas y checkpoints

El detalle (criterios, verificación, dependencias y archivos) de lo **pendiente** está en
`tasks/todo.md`; lo hecho, en `tasks/todo.archive.md`. Resumen:

### Fase 0 — Fundación
- [x] T01 Monorepo (pnpm) + TS estricto · T02 Tooling + Vitest + CI · T03 Documentación base · T04 Organización de `design/`
- [ ] T05 Calibración y presupuesto de memoria (🟡 cierre 🧍: confirmar versiones en `ADR-0002`)

### ✅ Checkpoint A (tras T01–T05) 🟡 — falta T05 y revisión humana

### Fases 1–5 — Núcleo (T06–T24)
- [x] Contrato y arnés (T06–T11) · instalación (T12–T15, **AC-2/AC-8**) · declarativo (T16–T17) · script (T18–T20) · biblioteca (T21–T24, **AC-4**)

### ✅ Checkpoints B, C, D, E, F — en verde (revisiones humanas hechas salvo B/C/D/F 🧍 menores)

### Fase 6 — Progreso
- [x] T25 Progreso atómico (con `page_total`, RF-41) · T26 `chapter_read` (RF-32) · T27 `ReaderState` headless · T25b borrado al quitar serie (P-62/P-73)

### ✅ Checkpoint G ✅

### Fase 7 — Respaldo
- [x] T28 Exportar · T29 Importar (merge/replace/sugerencias, P-68/P-69) · T30 E2E (**AC-7**) · T30b Filtro «Leyendo» (P-70)

### ✅ Checkpoint H — criterios en verde; falta 🧍 revisión

### Fase 8 — Módulos reales y generalidad
- [x] T31 Port TMO (retirado del repo 2026-10-26, P-80; legado conservó P-74/P-75/P-76) · T32a 2.º sitio falso JSON/cursor · T32b ADR-0003 (aceptado 2026-10-29: D1=A, D2=`pages.imageHeaders`, D3=m440)
- [x] T37 Contrato escrito y validado en ejecución (R4, `guardApi` + formas)
- [ ] T38 Compatibilidad hacia delante (R3) · T39 Formato declarativo (R2/D2) · T40 Empaquetado `script` (R1/D1) · T41 Puerta del 2.º sitio real (D3) 🧍

### ⏳ Checkpoint I — faltan T38–T41 y revisión humana

### Fase 9 — Endurecimiento
- [x] T34 Resiliencia · T35 Puertas de CI/contrato/cobertura (**AC-11**: gate funcional + paso «Contrato» + «Bundle Android») · T36 Diagnóstico (tabla `log`, redacción, export JSON+texto, P-72)
- [ ] T33 Pruebas de seguridad (amenazas SPEC §7.2 ↔ pruebas; deep link AC-8)

### ⏳ Checkpoint J — Fin de la Parte 1: suite/CI en verde, cobertura completa, 🧍 revisión

### FA1 Arte final del dragón 🧍 (antes de v1.0 pública)

### Fase 10 — PARTE 2 (detalle abajo, §P2.5)

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| MiBox 4 (2 GB) OOM en el lector | Alto | Presupuesto medido (T05/T37); ventana de memoria en `ReaderState` (T27); medición 🧍 (F37, P-90) |
| Contrato ajustado a pocos sitios | Alto | 2 sitios falsos (T32a) + 3 módulos reales como regresión (T37) + puerta T41 antes de congelar |
| Instalación insegura (zip-slip, bomba) | Alto | Límites del SPEC §7.1; T33 pendiente como red de seguridad |
| Verificación nativa con Playwright | Medio | Decidido (P2-9): web/galería con Playwright + capturas de dispositivo (AC-12, 🧍) |
| Rendimiento en TV/MiBox | Alto | Animaciones solo `transform`/`opacity` (Regla 4); medir en F22/F23/F37 |
| Diseño HTML de Stitch mal traducido | Medio | Reglas SPEC §11.1–11.4, lint de diseño (F09), DIFFS.md |
| Módulos con anti-bot / reto JS (YupManga) | Medio | `BLOCKED` en la v1 (P-8); T42 ajusta el módulo en `RyuuNest-Models` |

## 8. Segundo sitio y congelación de la API 1.0 (resuelto)

Propuesta de §8 aceptada: generalidad demostrada con 2 sitios falsos (T32a) y el 2.º sitio
real aplazado sin bloquear. ADR-0003 (aceptado 2026-10-29) decide: no congelar todavía;
primero T38–T41. Los módulos reales viven en `RyuuNest-Models` (P-8, P-78).

## 9. Preguntas abiertas (requieren decisión humana)

Resueltas: límites del módulo (SPEC §7.1), tracker, ubicación de `MEMORY.md`, segundo sitio
(§8), nombre y disponibilidad (P-71: repo `davidluciol`, scope `@ryuunest`,
`applicationId` `io.github.davidluciol.ryuunest`), verificación nativa (P2-9), tipos en
filtros (los 4) y temas (solo Dragon Night).

Pendientes:

1. **Pantallas sin diseño** (SPEC §11.5): se decide al llegar a ellas (P2-11); mientras,
   se componen solo con `DESIGN.md` y se marcan «sin diseño» (P-30).
2. **`accent-alt` violeta** (SPEC §17.2.9): regla provisional es no usarlo en la v1; confirmar.
3. **`expo-updates`/EAS**: necesita la cuenta de Expo del humano (tarea bloqueada en `todo.md`).

## 10. Verificación del propio plan

- [x] Tareas con criterios de aceptación, verificación, dependencias y tamaño ~≤5 archivos.
- [x] Checkpoints entre fases; complejidad/modelo en `tasks/complexity.md`.
- [x] Registro de tareas en `tasks/todo.md` (pendientes) y `tasks/todo.archive.md` (historial).
- [ ] Revisión y aprobación formal del plan por el humano. ⬅ **pendiente**

## 11. Gestión por complejidad y modelo

Detalle en `tasks/complexity.md` (N1–N5 de OpenCode Zen). Una tarea por sesión (excepciones
anotadas), máx. ~5 archivos por corte; regla de 2 intentos y escalada de uno en uno
(N1→N5); los pasos de dispositivo (S25 Ultra, POCO F5 Pro, MiBox 4) son del humano (🧍).

## 12. Registro de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-20 | Creación del plan; división T29a/b, T32a/b, T25+T26; FB1; F12 tras F16; F14a/b | Asignar cada pieza al modelo más barato que la resuelve |
| 2026-10-28 | `tasks/todo.md` pasa a solo pendientes; historial a `tasks/todo.archive.md` | Menos tokens por sesión |
| 2026-10-29 | ADR-0003 aceptado (D1/D2/D3); nacen T37–T41 y T42 | Cierre de la API 1.0 |
| 2026-10-31/11-08 | F31 (integración errores), F33 → propuestas F40–F45; F32 tratado como revisión (P-139) | Hallazgos del recorrido real |
| 2026-11-12 | **Poda de contexto**: `todo.md` solo pendientes (identificadores sin renumerar, decisión del humano); bloques completados a `todo.archive.md` (Archivo 2); este plan condensado y con estados reales | Reducir contexto innecesario por sesión |

---

# PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)

> Planificada en la sesión del plan (P-14). Depende del núcleo (contrato, estado, casos de
> uso). Detalle de lo pendiente en `tasks/todo.md`; lo hecho en `todo.archive.md`.

## P2.1 Resumen y alcance

Construir el sistema de diseño y las interfaces a partir de las **7 pantallas de Stitch**
(`design/stitch/<pantalla>/screen.png` y `code.html`) siguiendo el orden de autoridad
(SPEC §11.1). La **galería de componentes** es la base de verificación (AC-12/AC-13) y de
reutilización (Regla 3 de `AGENTS.md`). Plataformas: móvil (React Native/Expo), TV (variante)
y web (React + Vite + extensión). Tema v1: **solo Dragon Night** con tokens semánticos.

## P2.2 Decisiones

| # | Decisión |
|---|---|
| P2-1 | `ui-tokens` se genera desde los tokens de **SPEC §11.9** |
| P2-2 | v1 con **solo Dragon Night**; tokens semánticos para más temas |
| P2-3 | Manrope, Inter y JetBrains Mono (F34.2) + Lucide **empaquetados localmente** (RNF-5) |
| P2-4 | Literales de color/tamaño/radio/espacio prohibidos con **lint** en `apps/*` (AC-13) |
| P2-5 | Componentes y animaciones **reutilizables** (Reglas 3 y 4) |
| P2-6 | Verificación con **Playwright** (web/galería) + lista de 20 s; capturas de dispositivo para AC-12 |
| P2-7 | Datos de ejemplo: un solo conjunto coherente de fixtures inventadas (D1–D5) |
| P2-8 | Filtros de Biblioteca con los **cuatro tipos** de obra |
| P2-9 | Verificación visual: galería compilada para web con Playwright + capturas de dispositivo |
| P2-11 | Pantallas sin diseño: se decide al llegar a ellas; mientras, solo `DESIGN.md` (P-30) |
| P2-12 | **Plano de pantalla** (`docs/screen-blueprint.md`, FB1, hecho) documentado con F13 (fixtures) y F14c (datos reales); F12, F15, F17, F20, F21 y F25 lo leen |
| P2-13 | F14 dividida en F14a/F14b; F12 después de F16 |

## P2.3 Grafo y estado

```text
Parte 1 (núcleo) ── contrato, estado y casos de uso
6a Sistema de diseño: F01–F10 ✅ (FA1 🧍 pendiente)
6b Móvil: F11 shell ✅ · F13 Inicio ✅ · F14a/b/c Biblioteca ✅ · FB1 plano ✅
   F15/F15b Descubrir ✅ · F16/F16b/F16c Fuentes ✅ · F12 primer uso ✅
   F17 ficha 🟡 (persistencia) · F18/F19 lector ✅ · F20 Ajustes ✅ · F21a–c respaldo ✅
   Errores: FB2 ✅ · F29 ✅ · F30 ✅ · F31 🟡 · F34 🟡 (Inicio al 200 %)
   Propuestas de F33 (por aprobar): F40 → F45 → F41/F42 → F43 → F44
7 TV: F22 riel+foco ⏳ → F23 lector D-pad ⏳
8 Web+extensión: F24 ✅ · F25 ✅ (subida react/router ⏳) · F26 ✅ · F27 ✅ (restos 🧍) · QAw1–3 ⏳
Verificación: F28 🟡 (web ✅; POCO/MiBox 🧍) · Checkpoints P-B/P-C/P-D/P-E ⏳
```

## P2.4 Estrategia

Cada **pantalla es un corte vertical**: componentes reutilizables → pantalla con datos
(fixtures o base real) → estados de carga/vacío/error → verificación con Playwright contra
`screen.png` (y capturas de dispositivo para AC-12). La Fase 6a es la fundación compartida.

## P2.5 Índice de tareas y checkpoints (Parte 2)

### Fase 6a — Sistema de diseño
- [x] F01 `ui-tokens` · F02 tokens vs `DESIGN.md` y contraste WCAG (**AC-13**) · F03 fuentes/iconos locales · F04 escala/layout · F05 galería · F06/F07 componentes base · F08 estados vacíos/error · F09 lint de diseño (**AC-13**) · F10 i18n (RF-40)
- [ ] FA1 Arte final del dragón 🧍

### ✅ Checkpoint P-A 🟡 — criterios en verde; falta revisión humana

### Fase 6b — Interfaz móvil
- [x] F11 Shell · F13 Inicio · F14a/b Biblioteca · F14c conexión al núcleo (P-79) · FB1 plano de pantalla · F15/F15b Descubrir · F16/F16b/F16c Fuentes y repo oficial (P-85) · F12 primer uso · F18/F19 Lector · F20 Ajustes · F21a–c Respaldo UI · FB2/F29/F30 errores y diagnóstico (P-72) · F34.1–F34.3 casi todo
- [ ] F17 cierre (persistencia favorito/carpeta/release) · F31 verificación Playwright por pantalla · F34 restante (Inicio al 200 %) · F40–F45 (propuestas de F33, por aprobar)

### ⏳ Checkpoint P-B — falta AC-6 en MiBox 4 (F37), AC-12 (F28 🧍) y revisión humana

### Fase 7 — TV
- [ ] F22 Riel lateral + foco (2 px `accent`) + escala 1,25× · F23 Lector D-pad (AC-9)

### ⏳ Checkpoint P-C

### Fase 8 — Web + extensión
- [x] F24 Cliente web (tokens como CSS virtual, P-110–P-115) · F25 pantallas web sobre base real (sql.js + IndexedDB) · F26 extensión MV3 (P-116–P-120) · F27 puente y AC-10 con e2e real
- [ ] F25 subida react/react-router 8 (P-110) · F26/F27 restos 🧍 (Chrome/Firefox, AC-10 en tu navegador; iconos, origen de producción, tiendas) · QAw1–3

### ⏳ Checkpoint P-D — AC-10 e2e hecho; falta AC-10 en el navegador del humano y revisión

### Verificación final
- [~] F28 (**AC-12**): parte web hecha (34 capturas, checks de `AGENTS.md` §5, lista de 20 s, `F28-verificacion.md`); falta 🧍 POCO F5 Pro / MiBox 4

### ⏳ Checkpoint P-E — Fin de la Parte 2: pantallas verificadas, AC-12/AC-13 completos, 🧍 revisión y publicación v1

### Extras del recorrido real (F32/F33)
- [x] F32 Recorrido real mínimo (S25 Ultra, 2026-11-07/08; AC-2/AC-3/AC-8 con datos reales)
- [x] F33 Revisión UX/UI → análisis en `tasks/Analisis.md` (64 hallazgos) → propuestas F40–F45
- [ ] F35 portadas M440/YupManga · T42 reto del lector YupManga · F36 URL sin «…» · F37 MiBox/POCO · F38/F39 pulidos

## P2.6 Riesgos (Parte 2)

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Copiar HTML/Tailwind o inventar estilos | Alto | Reglas SPEC §11.1–11.4 y 11.11; lint (F09); AC-12/AC-13 |
| El diseño muestra funciones fuera de la v1 | Medio | RF-44; omitir y anotar en `DIFFS.md` |
| Pantallas sin diseño (SPEC §11.5) | Medio | Componer solo con `DESIGN.md`; marcar «sin diseño» (P-30) |
| Rendimiento en TV/MiBox | Alto | Animaciones solo `transform`/`opacity`; medir en F22/F23/F37 |
| Una etiqueta por concepto (AI-slop) | Medio | Glosario SPEC §11.7; lista de 20 s |

## P2.7 Preguntas abiertas (Parte 2)

Resueltas: verificación nativa (P2-9), tipos de obra (los cuatro), temas (solo Dragon
Night), nombre y `applicationId` (P-71). Pendientes: pantallas sin diseño (al llegar) y
`accent-alt` violeta (§9 de este plan).
