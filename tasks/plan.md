# Plan de Implementación: RyuuNest — Parte 1 (Back-end / Núcleo)

> Documento de planificación. Estado: **borrador para revisión humana**.
> Fuentes (orden de autoridad): `docs/SPEC.md` → `DESIGN_RULES.md` → `DESIGN.md`
> → PNG de `design/` → HTML de `design/` → `docs/IDEA.md`. Contexto: `docs/SPEC_Legacy.md`,
> `legacyModulos/*.py`, `AGENTS.md`, `docs/MEMORY.md`.
> Fecha: 13 de octubre de 2026 · Licencia: GPL-3.0.
> Actualizado: 20 de octubre de 2026 (reordenación de tareas y gestión por complejidad; ver §11 y §12).
> Complejidad, modelo y esfuerzo por tarea pendiente: `tasks/complexity.md`.

## 1. Resumen

RyuuNest es un lector local de manga, manhua, manhwa y cómics sin servidor. El proyecto es
un monorepo **greenfield** (el repositorio no tiene commits ni código): hoy solo existen los
documentos (`docs/`, `design/`), los módulos Python de referencia (`legacyModulos/`) y la
planificación (`tasks/`).

Este plan cubre **únicamente la Parte 1 (Back-end / Núcleo)**: todo lo que no es interfaz
gráfica. La Parte 2 (diseño y front-end: `packages/ui-tokens`, `apps/mobile` móvil y TV,
`apps/web`, `apps/extension`, pantallas y galería) corresponde a la **Fase 6a, 6b, 7 y 8**
del SPEC y se planificará en una sesión aparte, con otro modelo, al cerrar esta.

**"Back-end" aquí** = el núcleo TypeScript puro y su infraestructura: contrato de módulos,
runtimes, host, instalador de paquetes, repositorios, almacenamiento local, biblioteca,
progreso, respaldo, SDK/CLI y CI. Se ejecuta sin UI y se verifica con pruebas automatizadas.

### Estado de las decisiones de planificación (respuestas del humano, 2026-10-13)

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Gestor de monorepo y runner | **Confirmado:** pnpm workspaces + Vitest. |
| 2 | T04 (app de calibración) | **Se mantiene en la Parte 1.** |
| 3 | Sitio falso de pruebas | **Paquete reutilizable** (`packages/test-site`). |
| 4 | Límites del módulo | **Se mantienen los del SPEC §7.1** (paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos). Se descarta subir a 150 MB. |
| 5 | Segundo sitio real | **Se acepta la propuesta de §8**: segundo sitio falso de otra arquitectura + sitio real aplazado (T32b). |
| 6 | Tracker de tareas | **`bd` local ahora**; migrar a GitHub Issues cuando exista el repositorio. |
| 7 | `MEMORY.md` | **Se mueve a la raíz** en la Fase 0 (T04). |
| 8 | Parte 2 (diseño/front-end) | **Se planifica en esta misma sesión** (ver la Parte 2 más abajo). |

## 2. Alcance de la Parte 1

### Incluido
- `packages/core`: contrato, errores, host, runtimes (declarativo y script), instalador,
  registro de módulos, biblioteca, progreso, estado del lector, respaldo.
- `packages/module-sdk`: tipos públicos, validador de manifest, CLI y plantilla.
- `packages/test-site`: paquete reutilizable con sitios falsos de prueba (fixtures).
- Infraestructura: monorepo, TS estricto, lint, tests, CI, ADRs, limpieza de `design/`.
- Calibración de dispositivos y presupuesto de memoria (Fase 0).
- Port del primer módulo real desde `logicTMO.py`.
- Endurecimiento (seguridad, resiliencia) y puertas de CI del núcleo.

### Excluido (Parte 2 — diseño y front-end)
- `packages/ui-tokens` y el sistema de diseño (**Fase 6a**, AC-13).
- `apps/mobile` (React Native / Expo, móvil y variante TV) — **Fase 6b y 7**.
- `apps/web` (React + Vite) y `apps/extension` — **Fase 8**.
- Pantallas, galería de componentes, dragón, estados vacíos y microcopy (AC-12).
- Adaptadores de puertos específicos de UI (`SecureLock` real, `Http` vía extensión,
  `Storage` sobre IndexedDB) más allá de las interfaces y los falsos de prueba.
- Contador de no leídos y filtro «Completado» (**v2**, RF-42): el back-end **no** calcula
  totales de capítulos.

> Nota: las **interfaces** de los puertos (`Storage`, `Http`, `Archive`, `Clock`,
> `SecureLock`) sí son Parte 1; sus **implementaciones de plataforma** de la UI son Parte 2.
> La **app de calibración** (T05) es la única tarea de la Parte 1 que toca Expo, por decisión del humano.

## 3. Decisiones de arquitectura

Las decisiones D-1…D-13 de `SPEC.md` §5.4 se respetan sin cambios. Estas son las decisiones
técnicas que el plan necesita y que el SPEC deja abiertas:

> ⚠️ **Identificadores locales (P-35).** Los `P-n` de esta tabla son **propios de este plan** y
> colisionan con los `P-n` (distintos) de `MEMORY.md` §2. La fuente canónica de decisiones es
> `MEMORY.md` §2 (producto/proceso) y `docs/SPEC.md` §5.4 (`D-n`, arquitectura); estas decisiones
> técnicas quedan registradas en `docs/decisions/ADR-0001-stack-y-convenciones.md`. **No citar los
> `P-n` de esta sección.**

| # | Decisión | Motivo | Alternativas |
|---|---|---|---|
| P-1 | Monorepo con **pnpm workspaces** | Rápido, enlaza paquetes del workspace sin publicar | npm workspaces, Turborepo |
| P-2 | Pruebas con **Vitest** | Nativo TS/ESM, rápido; core puro y fixtures | Jest, node:test |
| P-3 | Descompresión `.zip` con **fflate** | Pequeña, pura JS, Node y RN | JSZip, adm-zip |
| P-4 | SHA-256 con **@noble/hashes** | Puro JS (RN no trae Web Crypto) | Web Crypto, quick-crypto |
| P-5 | Parseo HTML en el host con **htmlparser2 + css-select** | Selectores CSS sin APIs de Node; compatible con RN | cheerio, linkedom |
| P-6 | `Storage` abstracto; `SqlDriver` fino + `SqliteStorage` + `MemoryStorage` | El core no depende de plataforma | SQLite directo en el core |
| P-7 | Driver SQL de CI: **better-sqlite3** (solo dev/test) | Síncrono y simple para pruebas | sql.js |
| P-8 | Los módulos de sitios reales viven **fuera** del repo principal | Requisito legal (SPEC §15) | — |
| P-9 | Sitio falso de pruebas = **paquete reutilizable** `packages/test-site` | Respuesta del humano; reutilizable por SDK y por la galería | HTML dentro de `core/tests` |
| P-10 | Segundo sitio real sustituido por **prueba de generalidad** con un segundo sitio falso de otra arquitectura (JSON/API, paginación por cursor) | Respuesta del humano: no se conoce el sitio | Bloquear la Fase 8 |
| P-11 | Límites de módulo: **los del SPEC §7.1** (2 MB / 5 MB / 50 archivos) | Confirmado; se descarta subir a 150 MB por la defensa anti-bomba | 150 MB descomprimido |
| P-12 | Seguimiento con **`bd` local** ahora; migrar a **GitHub Issues** cuando exista el repo | Respuesta del humano | `tasks/todo.md` como única fuente |
| P-13 | `MEMORY.md` se mueve a la raíz en la Fase 0 | Coincide con SPEC §5.1 | Dejarlo en `docs/` |
| P-14 | La Parte 2 (diseño/front-end) se planifica en esta misma sesión | Respuesta del humano | Esperar al cambio de modelo |
| P-15 | Reordenación de tareas (2026-10-20): T25+T26 en una sola sesión; T29 en dos pasos (T29a tests y esquema, T29b implementación); T32 dividida en T32a (sitio falso) y T32b (ADR) | Cada pieza se asigna al modelo más barato que la resuelve; el juicio de diseño (ADR) va al modelo más fuerte | Mantener T29/T32 como tareas únicas |
| P-16 | Gestión por complejidad y modelo en `tasks/complexity.md` (niveles N1–N5 de OpenCode Zen, regla de 2 intentos) | Controlar costo y evitar bucles de arreglo | Un solo modelo para todo |

## 4. Grafo de dependencias

```text
FASE 0 — Fundación (infra)
  T01 Monorepo + TS estricto (pnpm)
   ├─ T02 Tooling + CI (vitest)
   ├─ T03 Documentación base / ADRs / ASSETS / DoD
   ├─ T04 Inventario y organización de design/
   └─ T05 Calibración de dispositivos + presupuesto de memoria

FASE 1 — Contrato y arnés  (fundación delgada, base de todos los cortes)
  T06 Tipos del contrato + ModuleError (incluye manhwa)
   ├─ T07 Puertos + adaptadores falsos
   │    └─ T08 ModuleHost (permisos, tiempo límite, concurrencia, rate-limit)
   ├─ T09 Validadores de manifest e índice de repo (SDK)
   └─ T10 Paquete `test-site` + arnés de contrato
        └─ T11 CLI del SDK + plantilla

FASE 2 — Corte vertical 1: instalar un módulo desde un repo
  T12 Repos: fetch/validar/persistir index.json   (T07, T09)
   └─ T13 PackageInstaller                          (T12, T07)
        └─ T14 ModuleRegistry (ciclo de vida)      (T13)
             └─ T15 E2E instalación desde fixture  (T14)   → AC-2, AC-8

FASE 3 — Corte vertical 2: módulo declarativo
  T16 DeclarativeRuntime + transformaciones (T06, T08)
   └─ T17 E2E declarativo contra el sitio falso (T16, T10)

FASE 4 — Corte vertical 3: módulo script
  T18 ScriptRuntime + frontera de sandbox/host (T08)
   └─ T19 E2E script contra el sitio falso (T18, T10)
        └─ T20 Carga/selección de ModuleRuntime + mapeo de errores (T16, T18)

FASE 5 — Corte vertical 4: biblioteca local
  T21 Storage SQL + esquema/migraciones + adaptador en memoria (T03)
   └─ T22 Series + favoritos + carpetas (D-12) (T21)
        ├─ T23 Filtros/orden/búsqueda + carga 3000 series (T22)  → AC-4
        └─ T24 Preferencias por serie (modo, release preferida) (T22)

FASE 6 — Corte vertical 5: progreso y lecturas
  T25 Progreso atómico + reanudación (con page_total) (T21)   ⇄ T25+T26: una sola sesión
   ├─ T26 chapter_read (marcar al terminar) (T21)
   └─ T27 Máquina de estados del lector (headless) (T25)

FASE 7 — Corte vertical 6: respaldo
  T28 Exportar respaldo JSON (T22, T24, T25, T26)
   └─ T29 Importar respaldo (validar/merge/replace/sugerencias) (T28)
        [T29a tests+esquema (modelo fuerte) → T29b implementación (modelo barato)]
        └─ T30 E2E de respaldo (T29)   → AC-7

FASE 8 — Módulos reales y generalidad
  T31 Port de logicTMO.py a módulo script (T19)
   └─ T32a 2.º sitio falso de arquitectura distinta (T31)
        └─ T32b ADR congelación API 1.0 (T32a)

FASE 9 — Endurecimiento
  T33 Pruebas de seguridad (zip-slip, bomba, hash, manifest, deep link) (T13)
   ├─ T34 Pruebas de resiliencia (timeout, concurrencia, rate-limit, last_error) (T08, T14)
   └─ T35 Puertas de CI / contrato / cobertura (T02, T32a)   → AC-11 (núcleo)

FASE 10 — PARTE 2 (PENDIENTE, otro modelo)
  Fase 6a sistema de diseño · Fase 6b móvil · Fase 7 TV · Fase 8 web+extensión.
```

Regla de orden: se construye de abajo hacia arriba. Cada fase termina en un **checkpoint**
verificable. Las tareas de alto riesgo (instalación, runtimes, memoria) van temprano.

## 5. Estrategia de cortes verticales

No se construye "toda la base de datos, luego toda la API, luego toda la UI". Se construyen
**caminos completos y verificables**, con el arnés de pruebas como punta (la UI es Parte 2):

1. **Instalar un módulo desde un repo** → repo + descarga + hash + unzip + manifest + registro.
2. **Un módulo declarativo devuelve resultados** → runtime declarativo + host + fixture.
3. **Un módulo script devuelve resultados** → runtime script + host + fixture.
4. **Biblioteca local** → series + favoritos + carpetas + filtros sobre almacenamiento real.
5. **Progreso** → guardar/reanudar (con `page_total`) + capítulos leídos + estado del lector.
6. **Respaldo** → exportar/importar ida y vuelta.

Cada corte deja el sistema en estado funcional y con pruebas en verde.

## 6. Índice de tareas y checkpoints

El detalle (criterios de aceptación, verificación, dependencias, archivos y tamaño) está en
`tasks/todo.md`. Resumen por fase:

### Fase 0 — Fundación
- [x] T01 Monorepo (pnpm) + TS estricto
- [x] T02 Tooling (lint/format/typecheck) + Vitest + CI
- [x] T03 Documentación base: ADR-0001 + CONTRIBUTING + ASSETS.md + DoD
- [x] T04 Inventario y organización de `design/` (+ ubicación de MEMORY/AGENTS)
- [ ] T05 Calibración de dispositivos y presupuesto de memoria (🟡 app y ADR-0002 preparados; faltan mediciones)

### ✅ Checkpoint A (tras T01–T05)
- [ ] `pnpm install && pnpm -r typecheck && pnpm -r test && pnpm -r build` en verde
- [ ] CI ejecuta en cada push
- [ ] `design/` organizado según SPEC §11.2; documentos contradictorios eliminados
- [ ] Presupuesto de memoria medido y documentado (MiBox 4)
- [ ] Revisión humana

### Fase 1 — Contrato y arnés
- [x] T06 Tipos del contrato + ModuleError (incluye `manhwa`)
- [x] T07 Puertos + adaptadores falsos
- [x] T08 ModuleHost
- [x] T09 Validadores de manifest e índice de repo
- [x] T10 Paquete `test-site` + arnés de contrato
- [x] T11 CLI del SDK + plantilla

### ✅ Checkpoint B (tras T06–T11)
- [x] `pnpm -r test` y `pnpm -r build` en verde
- [x] Un módulo de ejemplo se valida y se prueba contra `test-site`
- [ ] Revisión humana

### Fase 2 — Corte vertical 1: instalación
- [x] T12 Repos + index.json
- [x] T13 PackageInstaller
- [x] T14 ModuleRegistry
- [x] T15 E2E de instalación desde fixture (**AC-2, AC-8**)

### ✅ Checkpoint C (tras T12–T15)
- [x] Un paquete con hash incorrecto se rechaza con mensaje claro
- [x] Nada se instala sin confirmación
- [ ] Revisión humana

### Fase 3 — Corte vertical 2: declarativo
- [x] T16 DeclarativeRuntime + transformaciones
- [x] T17 E2E declarativo contra el sitio falso

### ✅ Checkpoint D (tras T16–T17)
- [x] `popular`, `latest`, `search`, `details` y `pages` responden desde fixtures
- [ ] Revisión humana

### Fase 4 — Corte vertical 3: script
- [x] T18 ScriptRuntime + frontera de sandbox/host
- [x] T19 E2E script contra el sitio falso
- [x] T20 Carga/selección de runtime + mapeo de errores

### ✅ Checkpoint E (tras T18–T20)
- [x] Módulo script y declarativo pasan el mismo contrato (T17 declarativo, T19 script)
- [x] Los errores se mapean a `ModuleErrorCode` (T20)
- [x] Revisión humana

### Fase 5 — Corte vertical 4: biblioteca
- [x] T21 Storage SQL + esquema/migraciones + en memoria
- [x] T22 Series + favoritos + carpetas (D-12)
- [x] T23 Filtros/orden/búsqueda + carga 3000 series (**AC-4**)
- [x] T24 Preferencias por serie

### ✅ Checkpoint F (tras T21–T24)
- [x] Filtro/búsqueda < 300 ms con 3000 series sintéticas (entorno Node)
- [x] Un favorito pertenece a una carpeta o a ninguna
- [ ] Revisión humana

### Fase 6 — Corte vertical 5: progreso
- [x] T25 Progreso atómico y reanudación (con `page_total`) — una sola sesión con T26
- [x] T26 `chapter_read`
- [x] T27 Máquina de estados del lector (headless)

### 🚩 Checkpoint G (tras T25–T27)
- [x] Guardar y reabrir devuelve la página exacta (núcleo, sin UI)
- [x] `page_total` se guarda para el porcentaje y la barra (RF-41)
- [ ] Revisión humana

### Fase 7 — Corte vertical 6: respaldo
- [ ] T28 Exportar respaldo JSON (incluye `pageTotal`)
- [ ] T29 Importar respaldo — en dos pasos: T29a tests y esquema · T29b implementación
- [ ] T30 E2E de respaldo (**AC-7**)

### ✅ Checkpoint H (tras T28–T30)
- [ ] Exportar e importar reproduce biblioteca, carpetas, progreso y repos sin pérdidas
- [ ] Los módulos/repos del respaldo no se instalan solos
- [ ] Revisión humana

### Fase 8 — Módulos reales y generalidad
- [ ] T31 Port de `logicTMO.py` a módulo script + fixtures
- [ ] T32a Segundo sitio falso de otra arquitectura (JSON + cursor)
- [ ] T32b ADR de congelación de API 1.0

### ✅ Checkpoint I (tras T31–T32b)
- [ ] `logicTMO` busca, lista capítulos y entrega imágenes desde un sitio real
- [ ] El contrato pasa con dos arquitecturas de sitio distintas
- [ ] La API 1.0 se considera congelable
- [ ] Revisión humana

### Fase 9 — Endurecimiento
- [ ] T33 Pruebas de seguridad
- [ ] T34 Pruebas de resiliencia
- [ ] T35 Puertas de CI / contrato / cobertura (**AC-11 núcleo**)

### ✅ Checkpoint J — Fin de la Parte 1 (tras T33–T35)
- [ ] Toda la suite de pruebas y el CI en verde
- [ ] Cobertura del contrato completa
- [ ] **Fin de la Parte 1: se pasa a la Parte 2 (diseño / front-end)**, planificada al final de este documento
- [ ] Revisión humana

### Fase 10 — Parte 2 (diseño y front-end)
- [ ] Ver el bloque **PARTE 2** al final de este documento (Fases 6a, 6b, 7 y 8 del SPEC)

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin experiencia previa en RN/Expo | Medio | El núcleo es TS puro (Parte 1); la Parte 2 es donde más ayuda hace falta |
| MiBox 4 (2 GB) hace OOM en el lector | Alto | Presupuesto medido en Fase 0 (T05); políticas de memoria en el estado del lector (T27) |
| `htmlparser2 + css-select` no cubre todos los selectores reales | Medio | `test-site` (T10) + dos arquitecturas distintas (T32a) + sitio real (T31) |
| `@noble/hashes` / `fflate` en RN | Bajo | JS puro; smoke test en la app de calibración (T05) |
| Contrato ajustado a un solo sitio | Alto | Segundo sitio falso de otra arquitectura (T32a) + sitio real (T31) antes de congelar |
| Instalación insegura (zip-slip, bomba) | Alto | Límites del SPEC §7.1 y pruebas explícitas (T13, T33) |
| Driver SQL distinto entre Node y RN | Medio | `SqlDriver` fino + pruebas en ambos (T21) |
| Diseño exportado como HTML web (riesgo del SPEC §17.1) | Medio | Fase 6a/6b aplican 11.1–11.4 y el lint de diseño; fuera del alcance de esta Parte 1 |

## 8. Propuesta para el segundo sitio (respuesta a la pregunta 5)

Como aún no hay un segundo sitio real, y congelar la API 1.0 con un solo sitio es un riesgo
(SPEC §17.1), se propone **no bloquear el plan**:

1. **Prueba de generalidad con un segundo sitio falso, de arquitectura distinta.** El paquete
   `test-site` incluye dos sitios ficticios con formas opuestas: uno HTML + paginación por
   número de página + selectores CSS (declarativo), y otro con respuesta JSON, paginación por
   cursor y sin selectores (solo script). Así el contrato se valida contra dos arquitecturas
   sin depender de un sitio real ni de anti-bot.
2. **Aplazar el segundo sitio real, sin bloquear.** El sitio real se busca antes de **congelar
   publicamente** la API 1.0 y vive en el repo aparte de módulos (SPEC §15), no en el
   principal. T32b deja el ADR con lo aprendido y la lista de candidatos.
3. **Spike de candidatos (opcional, sin comprometerlos).** Evaluar 2–3 sitios con licencia/
   condiciones compatibles para ver si son viables (selectores, redirecciones, anti-bot) y
   anotarlos en `MEMORY.md`. Si ninguno es viable, la prueba de generalidad (punto 1) ya
   desbloquea la congelación.

## 9. Preguntas abiertas (requieren decisión humana)

Resueltas en esta sesión: límites del módulo (SPEC §7.1 sin cambios), tracker (`bd` local →
GitHub), ubicación de `MEMORY.md` (raíz) y segundo sitio (propuesta de §8 aceptada).

Pendientes:

1. **Nombre y disponibilidad** (SPEC §15, §17.2): sigue pendiente y bloquea el repositorio,
   los Issues de GitHub y el `applicationId`.
2. **Verificación visual de la app nativa** (MEMORY §4.3): Playwright solo cubre el
   navegador. ¿La galería de componentes se compila también para web, o las pantallas nativas
   se verifican con capturas del dispositivo? Afecta a la Parte 2 (§P2.9).

## 10. Verificación del propio plan

- [x] Cada tarea tiene criterios de aceptación.
- [x] Cada tarea tiene pasos de verificación.
- [x] Las dependencias están identificadas y ordenadas.
- [x] Las tareas se registran en `tasks/todo.md` (se migrarán a `bd` local; `plan.md` §P2.2).
- [x] No se sobrescribió ningún plan previo (no existía `tasks/`).
- [x] Ninguna tarea toca más de ~5 archivos (tamaño S/M).
- [x] Hay checkpoints entre fases.
- [x] Cada tarea pendiente tiene complejidad, nivel de modelo y límites en `tasks/complexity.md`.
- [ ] El humano ha revisado y aprobado el plan. ⬅ **pendiente**

## 11. Gestión por complejidad y modelo

Detalle en `tasks/complexity.md` (niveles N1–N5 de OpenCode Zen, tabla por tarea). Resumen:

- Una tarea por sesión (T25+T26 son la excepción, por compartir patrón), máx. ~5 archivos.
- **Regla de 2 intentos:** ante el mismo error, tras 2 intentos fallidos el modelo se detiene y escribe «modelo con poca potencia cambiar.» con un resumen para el siguiente nivel.
- Escalada de uno en uno (N1→N5); si N5 falla 2 veces, se pregunta al humano.
- Flujos que ahorran tokens: plano de pantalla (FB1), tests primero (T29a/T29b) y la división de T32 y F14.
- Los pasos de dispositivo (POCO, Galaxy, MiBox 4) son del humano (🧍); el agente no inventa mediciones.

## 12. Registro de cambios (2026-10-20)

| Cambio | Motivo |
|---|---|
| T32 → T32a (sitio falso) + T32b (ADR) | El ADR es juicio de diseño: modelo N5; los fixtures, N3 |
| T29 → T29a (tests y esquema) + T29b (implementación) | El modelo fuerte define; el barato implementa |
| T25 + T26 en una sola sesión | Mismo patrón y archivos |
| F12 después de F16 | F12 depende de F16 |
| F14 → F14a + F14b | No cabe en una sesión |
| Nueva FB1 (plano de pantalla) | Reduce nivel de modelo y tokens en F12, F15, F17, F20, F21 y F25 |
| FA1 añadida al índice de la Parte 2 | Ya existía en `todo.md` y faltaba aquí |
| `tasks/todo.md` pasa a contener solo pendientes; el anterior se archiva como `tasks/todo.archive.md` | Menos tokens por sesión |

---

# PARTE 2 — DISEÑO Y FRONT-END (Fases 6a, 6b, 7 y 8 del SPEC)

> Se planifica en esta sesión por decisión del humano (P-14). Depende de la Parte 1
> (contrato, estado y casos de uso del núcleo). Detalle de tareas en `tasks/todo.md`.

## P2.1 Resumen y alcance

Construir el sistema de diseño y las interfaces a partir de las **7 pantallas de Stitch**
(`design/<pantalla>/screen.png` y `code.html`) siguiendo el orden de autoridad (SPEC §11.1):
SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG → HTML. La **galería de componentes** es la base
de la verificación (AC-12/AC-13) y de la reutilización (Regla 3 de `AGENTS.md`).

**Plataformas:** móvil (React Native/Expo), Android TV (variante) y web (React + Vite +
extensión). **Tema de la v1:** solo Dragon Night, con tokens semánticos que permitan añadir
temas (pregunta abierta 7 del SPEC).

**Fuera de esta parte:** funciones fuera de la v1 que aparecen en las capturas se omiten y se
anotan en `design/stitch/DIFFS.md` (RF-44, `DESIGN_RULES.md` §4): sincronización, descargas,
contador de no leídos, campana, perfiles, marcador en el lector, etc.

## P2.2 Decisiones

| # | Decisión | Motivo |
|---|---|---|
| P2-1 | `ui-tokens` se genera desde los tokens de **SPEC §11.9** (no del front-matter crudo de `DESIGN.md`) | El front-matter mezcla tokens propios y genéricos que se contradicen |
| P2-2 | v1 con **solo Dragon Night**; tokens semánticos para más temas | Solo Dragon Night tiene las 7 pantallas |
| P2-3 | **Manrope** (600/700) e **Inter** (400/500/600) y **Lucide** empaquetados localmente | RNF-5: sin CDN |
| P2-4 | Los valores literales de color/tamaño/radio/espacio se prohíben con **lint** en `apps/*` | AC-13 |
| P2-5 | Componentes y animaciones **reutilizables** (Regla 3 y 4 de `AGENTS.md`) | Consistencia y rendimiento |
| P2-6 | Cada pantalla se verifica con **Playwright** (web/galería) y lista de 20 s; captura en dispositivo para AC-12 | `AGENTS.md` §5; nativo pendiente de decisión |
| P2-7 | Datos de ejemplo: **un solo conjunto coherente** de fixtures inventadas, portadas sin texto | `DESIGN_RULES.md` D1–D5 |
| P2-8 | Los filtros de Biblioteca muestran los **cuatro tipos** (manga, manhua, manhwa, cómic) | Coherente con D-13; una opción más que en el diseño |
| P2-9 | Verificación visual: **galería compilada para web con Playwright + capturas de dispositivo** para AC-12 | Playwright no controla la app nativa |
| P2-10 | Confirmado: la v1 trae **solo Dragon Night** | Solo ese tema tiene las 7 pantallas |
| P2-11 | Pantallas sin diseño: se **deciden más adelante** (al llegar a ellas) | Respuesta del humano |
| P2-12 | **Plano de pantalla** (`docs/screen-blueprint.md`, tarea FB1): tras F11 y F13 un modelo fuerte documenta el patrón en una página; F12, F15, F17, F20, F21 y F25 lo leen | Menos tokens y consistencia; permite usar modelos más baratos |
| P2-13 | **F14 se divide** en F14a (cuadrícula, búsqueda y filtros) y F14b (carpetas y orden); **F12 va después de F16** | F14 no cabe en una sesión; F12 depende de F16 |

## P2.3 Grafo de dependencias

```text
Parte 1 (núcleo, Checkpoint J) ───────────────┐  (contrato, estado, casos de uso)
                                               ▼
FASE 6a — Sistema de diseño (puede empezar tras T02)
  F01 ui-tokens ─ F02 test tokens/contraste (AC-13)
  F03 fuentes+iconos ─ F04 escala/layout
  F05 galería ─ F06 componentes base 1 ─ F07 componentes base 2 ─ F08 estados vacíos/error
  F09 lint de diseño (AC-13) ─ F10 i18n
        │
        ▼
FASE 6b — Interfaz móvil (necesita el núcleo)
  F11 shell/navegación+cabecera
   ├─ F13 Inicio ─ FB1 plano de pantalla (docs/screen-blueprint.md)
   │                 └─ F15, F17, F20, F21 (y F25 web) leen el plano
   ├─ F14a Biblioteca: cuadrícula+filtros ─ F14b carpetas+orden
   ├─ F15 Descubrir
   ├─ F16 Fuentes ─ F12 primer uso (después de F16)
   ├─ F17 Serie
   ├─ F18 Lector (1) ─ F19 Lector (2)
   ├─ F20 Ajustes
   └─ F21 Respaldo (UI)
        │
        ▼
FASE 7 — TV:  F22 riel+foco ─ F23 lector D-pad
        │
        ▼
FASE 8 — Web + extensión:  F24 cliente web ─ F25 pantallas web ─ F26 extensión ─ F27 puente
        │
        ▼
Verificación: F28 Playwright por pantalla + DIFFS.md + galería
```

## P2.4 Estrategia de cortes verticales

Cada **pantalla es un corte vertical** completo: componentes reutilizables → pantalla con
datos de ejemplo → estados de carga/vacío/error → verificación con Playwright contra
`screen.png`. La Fase 6a es la fundación compartida (tokens, componentes, galería).

## P2.5 Índice de tareas y checkpoints (Parte 2)

### Fase 6a — Sistema de diseño
- [x] F01 `ui-tokens` (colores §11.9, tipografía, espaciado, radios, densidades) + tema Dragon Night
- [x] F02 Prueba de tokens vs `DESIGN.md` y contraste WCAG (**AC-13**)
- [x] F03 Fuentes (Manrope/Inter) e iconos (Lucide) empaquetados + `ASSETS.md`
- [x] F04 Escala y layout por densidad (móvil/web/TV), rejilla de 4 px
- [x] F05 Galería de componentes (pantalla de desarrollo)
- [x] F06 Componentes base 1: botones, campos, casillas/radios, chips, insignias
- [x] F07 Componentes base 2: tarjeta de portada, fila de capítulo, filas de ajustes, cabecera, navegación, hojas/diálogos
- [x] F08 Estados vacíos y de error + dragón marcador
- [ ] FA1 Arte final del dragón (subtarea independiente; 🧍 artista; antes de la v1.0 pública)
- [x] F09 Lint de diseño (prohíbe literales en `apps/*`) (**AC-13**)
- [x] F10 Internacionalización: archivo de traducciones (RF-40)

### ✅ Checkpoint P-A (tras F01–F10)
- [ ] `ui-tokens` coincide con `DESIGN.md`; contraste WCAG en verde (AC-13)
- [ ] Galería revisada con todos los estados; fuentes e iconos locales (cero CDN)
- [ ] Revisión humana

### Fase 6b — Interfaz móvil
- [ ] F11 Shell: navegación de 5 destinos + cabecera única — 🟡 implementado y verificado en web; falta la verificación POCO (P-65: P-A/T35 siguen pendientes)
- [ ] F13 Inicio (Continuar, Recientes, Tesoros, Descubrir) — RF-14, RF-33, RF-41
- [ ] FB1 Plano de pantalla (`docs/screen-blueprint.md`, 1 página; modelo fuerte)
- [ ] F14a Biblioteca: cuadrícula, búsqueda y filtros — RF-26 a RF-30
- [ ] F14b Biblioteca: carpetas y orden
- [ ] F15 Descubrir (selector de módulo, popular/latest, búsqueda, error de módulo) — RF-9 a RF-12
- [ ] F16 Fuentes (repos y módulos, confirmación normal y reforzada, permisos, NSFW) — RF-1 a RF-8
- [ ] F12 Primer uso (3 pasos) + estado vacío inicial (después de F16)
- [ ] F17 Serie (detalle: portada, metadatos, continuar, capítulos, releases, favorito) — RF-13 a RF-17
- [ ] F18 Lector 1 (modos, zonas táctiles, controles, progreso, siguiente capítulo)
- [ ] F19 Lector 2 (zoom, pantalla encendida, errores/reintento, precarga)
- [ ] F20 Ajustes (idioma, NSFW, protección, modo de lectura, caché, respaldo, acerca de) — RF-37 a RF-40
- [ ] F21 Respaldo (exportar/compartir, importar, lista de sugerencias) — RF-37, RF-38

### ✅ Checkpoint P-B (tras F11–F21)
- [ ] AC-1, AC-3 y AC-12 (móvil); AC-6 medido en la MiBox 4
- [ ] Ningún valor literal; componentes en la galería; estados resueltos
- [ ] Revisión humana

### Fase 7 — TV
- [ ] F22 Riel lateral + navegación espacial + foco (2 px `accent`) + escala 1,25×
- [ ] F23 Lector para TV (mapeo D-pad)

### ✅ Checkpoint P-C (tras F22–F23)
- [ ] AC-9: todas las pantallas usables solo con el control remoto
- [ ] Revisión humana

### Fase 8 — Web + extensión
- [ ] F24 Cliente web (React + Vite): shell y riel de 240 px, rejilla de 8 columnas
- [ ] F25 Pantallas web reutilizando componentes (densidad compacta)
- [ ] F26 Extensión: protocolo HTTP con permisos por dominio
- [ ] F27 Puente web ↔ extensión (el `Host` sobre mensajes)

### ✅ Checkpoint P-D (tras F24–F27)
- [ ] AC-10: se lee un capítulo desde el navegador con la extensión
- [ ] Revisión humana

### Verificación final (Parte 2)
- [ ] F28 Playwright por pantalla + `design/stitch/DIFFS.md` + lista de 20 s (**AC-12**)

### ✅ Checkpoint P-E — Fin de la Parte 2
- [ ] Todas las pantallas verificadas; diferencias registradas
- [ ] Revisión humana y publicación de la primera versión

## P2.6 Riesgos (Parte 2)

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Copiar HTML/Tailwind o inventar estilos | Alto | Reglas SPEC §11.1–11.4 y 11.11; lint de diseño (F09); AC-12/AC-13 |
| El diseño muestra funciones fuera de la v1 | Medio | RF-44 y `DESIGN_RULES.md` §4; omitir y anotar en DIFFS.md |
| Pantallas sin diseño (SPEC §11.5) | Medio | Componer solo con `DESIGN.md`; decidir si se generan en Stitch antes de 6b |
| Verificación nativa con Playwright | Medio | Decisión pendiente (§P2.7); mientras, capturas de dispositivo para AC-12 |
| Rendimiento en TV/MiBox | Alto | Animaciones solo `transform`/`opacity` (Regla 4); sin sombras; medir en TV |
| Una etiqueta por concepto (AI-slop) | Medio | Glosario SPEC §11.7; lista de 20 s |

## P2.7 Preguntas abiertas (Parte 2)

Resueltas en esta sesión: verificación nativa (galería en web + capturas de dispositivo),
tipos de obra en los filtros (los cuatro) y temas (solo Dragon Night). Pendientes:

1. **Pantallas sin diseño** (SPEC §11.5): se decide más adelante; mientras, se componen solo
   con `DESIGN.md` y se marcan «sin diseño» (primer uso, confirmación de instalación, hoja de
   filtros, estados vacíos y de error).
2. **`accent-alt` violeta** (SPEC §17.2.9): regla provisional es no usarlo en la v1; confirmar.
3. **Disponibilidad del nombre** (SPEC §15): bloquea el repo, los Issues y el `applicationId`.
