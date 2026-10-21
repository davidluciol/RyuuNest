# Complejidad, modelo y esfuerzo por tarea — RyuuNest

> Documento de planificación. Fecha: 20 de octubre de 2026.
> Alcance: **solo las tareas pendientes** de `tasks/plan.md` y `tasks/todo.md`.
> Orden de autoridad: `docs/SPEC.md` → `DESIGN_RULES.md` → `DESIGN.md` → PNG/HTML → `docs/IDEA.md`.
> No sustituye a `tasks/todo.md` (criterios de aceptación): aquí va **qué modelo usar y cuánto cuesta**.
> Los identificadores de modelo son los del proveedor gestionado `opencode` del workspace.

---

## 1. Por qué este documento

El proyecto tiene un orden de autoridad muy estricto (SPEC → reglas → diseño → PNG) y un TDD
obligatorio (P-41): cada tarea empieza en rojo, se implementa por cortes pequeños y termina con
commit + PR. Eso cambia lo que el modelo tiene que hacer:

- **El razonamiento caro se gasta una sola vez por tarea**: interpretar el SPEC, decidir la forma
  del dominio y detectar las decisiones que hay que preguntarle al humano (Regla 1).
- **Los cortes posteriores son mecánicos**: escribir el test que falla, implementar lo mínimo,
  limpiar, repetir. Aquí un modelo rápido y barato rinde igual que uno caro.
- **El razonamiento caro vuelve en la revisión**: cuando algo ya no pasa (2 intentos fallidos,
  §10 de `AGENTS.md`), el escalado debe ser a un modelo mayor, no a otro modelo igual.

Por eso la recomendación no es «usa el mejor modelo para todo», sino: **un modelo de front-end o
back-end distinto según el nivel de la tarea, y el mismo nivel para el par (diseño, implementación)
cuando la decisión y el código van de la mano**.

---

## 2. Taxonomía de niveles

| Nivel | Qué la caracteriza | Riesgo si falla |
| --- | --- | --- |
| **N1 · Mecánica** | Un archivo, criterio de aceptación literal, sin decisión de diseño | bajo |
| **N2 · Local** | 1–3 archivos, un solo paquete, el SPEC ya dice qué hacer | bajo |
| **N3 · Integración** | 3–6 archivos, cruza dos paquetes (núcleo ↔ UI) o dos dominios | medio |
| **N4 · Sistema** | >6 archivos, varios paquetes, toca rendimiento/permisos/UX, se verifica en dispositivo | alto |
| **N5 · Crítica** | Define comportamiento público (API, esquema, protocolo) o mueve datos del usuario; la decisión es difícil de revertir | muy alto |

Regla práctica: **N3 = el modelo cumple solo**. **N4 = el modelo elige el diseño y otro lo
implementa**. **N5 = diseño con el modelo más fuerte, implementación con el de siempre, revisión
con el más fuerte**.

---

## 3. Escalones de modelo (workspace `opencode`)

| Escalón | Modelos disponibles | Para qué |
| --- | --- | --- |
| **A · Frontier** | `claude-opus-5-5`, `gpt-6.1-sol`, `gpt-5.5-pro`, `grok-4.6`, `gemini-4-argon` | N5: arquitectura, semántica de merge, protocolo de la extensión, máquina de estados del lector, diseño de la pantalla más densa |
| **B · Equilibrado** | `claude-sonnet-5-5`, `gpt-6-astra`, `kimi-k3`, `glm-5.3`, `mistral-large-4`, `deepseek-v4-pro` | N3–N4: el caballo de batalla. Implementa bien, respeta convenciones, no alucina APIs |
| **C · Rápido** | `claude-haiku-5-5`, `qwen3.6-plus`, `qwen3.5-plus`, `gpt-5.4-mini` | N2, y los cortes de refactor/tests de un N3–N4 ya diseñado |
| **D · Gratis** | `minimax-m3.1-flash-free`, `nemotron-3.5-super-vl-free`, `deepseek-v4.1-flash-free`, `qwen3.8-flash`, `glm-5.3-flash`, `qwen3.5-codex-spark` | N1–N2, y respaldo si el presupuesto manda |

Notas de la casa:

- El historial del repo muestra que **el escalón D ya ha ejecutado bien** las tareas con TDD
  estricto y SPEC cerrado (F06–F09, T21–T24). No hay que pagar frontier para eso.
- `gpt-5.3-codex` / `qwen3.5-codex-spark` van bien para **tests y refactors mecánicos**.
- El coste se mide por **coste por tarea completada** (§11 de `AGENTS.md`): una tarea N5 que
  necesita dos sesiones de frontier sale mejor con un N4 bien LEAD antes que con frontier de
  principio a fin.

---

## 4. Escala de esfuerzo

| Símbolo | Significado |
| --- | --- |
| **R** (razonamiento) | Nº de decisiones que exigen leer el SPEC y/o preguntar al humano (Regla 1) |
| **C** (código) | Volumen de archivos y complejidad de estado (componentes reutilizables, máquinas de estado) |
| **H** (herramientas) | Coste de andamiaje: Playwright, `expo export`, Metro, Vite, `node:sqlite`, plugin de ESLint, Web Worker |
| **V** (verificación) | Automatizable vs. requiere dispositivo o acierto humano |
| **S** (sesiones) | Sesiones de agente estimadas (una sesión ≈ 1 tarea con sus cortes R→G) |

---

## 5. Parte 1 — Núcleo / back-end (pendientes)

| Tarea | Nivel | Modelo (diseño → implementación) | R | C | H | V | S | Notas de esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **T05** (cierre: medir tope de imágenes, revalidar RNF-1 en release) | N1 | humano + escalón D para el APK | 0 | 0 | 1 | 2 | 0.3 | La medición es del humano (P-45). Solo regenerar el APK release y anotar en `ADR-0002` |
| **T25** Progreso atómico y reanudación (`page_total`) | N3 | B (`claude-sonnet-5-5`) → D/C | 1 | 2 | 0 | 1 | 1 | `ProgressStore` sobre `SqlDriver`; escrituras concurrentes y `updated_at` por el puerto `Clock`. SPEC §3.6 es claro |
| **T26** `chapter_read` | N2 | D (`minimax-m3.1-flash-free`) | 0 | 1 | 0 | 0 | 0.5 | La tabla ya existe en el esquema §8.1; solo el dominio y las pruebas |
| **T27** Máquina de estados del lector (headless) | N4 | **A** (`claude-opus-5-5`) → B | 3 | 3 | 0 | 1 | 2 | Hay que definir transiciones, límites con `page_total` y el disparo de «capítulo terminado» (Regla 1: 1–2 preguntas). Es el diseño que luego consumen F18/F19/F23 |
| **T28** Exportar respaldo JSON | N3 | B → C | 1 | 2 | 0 | 0 | 1 | Traducir §8.3 literalmente; el riesgo es inventar campos |
| **T29** Importar respaldo (validar/merge/replace/sugerencias) | **N5** | **A** (`gpt-5.5-pro` o `claude-opus-5-5`) → B → revisión A | 3 | 3 | 0 | 2 | 2–3 | La semántica del merge por `updated_at` y del «replace» no está especificada: **decisión de Regla 1**. Toca datos del usuario: merece revisión |
| **T30** E2E de respaldo (AC-7) | N2 | D → C | 0 | 1 | 0 | 0 | 0.5 | Prueba de ida y vuelta sobre `SqliteStorage` |
| **T31** Port de `logicTMO.py` a módulo script + fixtures | N4 | **A/B** (`gpt-6.1-sol`) → B | 2 | 3 | 2 | 2 | 2–3 | Corregir los 8 defectos del Apéndice A.4, `Referer`/`User-Agent` (RF-24), sin estado compartido. El módulo vive **fuera** del repo principal (P-8): hay trabajo de fixtures del sitio real y ejecución manual |
| **T32** Segundo sitio falso (JSON + cursor) + ADR de congelación API 1.0 | N4 | **A** para el ADR → B para las fixtures | 2 | 2 | 1 | 1 | 2 | Congelar la API 1.0 es una decisión pública; el ADR enumera los ajustes que salen de dos arquitecturas |
| **T33** Pruebas de seguridad | N4 | **A** (`claude-opus-5-5`) | 3 | 2 | 0 | 1 | 2 | Aquí el modelo tiene que pensar **adversarialmente** (SPEC §7.2: zip-slip, bomba, hash, manifest, deep link). Cada amenaza necesita una prueba que falle si se quita la mitigación |
| **T34** Pruebas de resiliencia | N3 | B → C | 1 | 1 | 0 | 0 | 1 | Timeout, error contenido, reintento, `last_error`, rate-limit |
| **T35** Puertas de CI / contrato / cobertura | N2 | C (`claude-haiku-5-5`) → D | 1 | 1 | 1 | 0 | 1 | Umbral de cobertura + contrato de los dos runtimes en CI. Ojo: la cobertura global puede ser ruidosa; mejor umbral por paquete |

### Notas de la Parte 1

- **T27 es la pieza de más razonamiento de la Parte 1** y bloquea F18/F19/F23. Conviene hacerla con el
  escalón A **antes** de las pantallas del lector, no después.
- **T29 + T30 son el par de mayor riesgo de datos.** T29 con A, T30 con D: la prueba es mecánica
  una vez que la semántica está decidida.
- **T31/T32 son las que puede bloquear la congelación de la API 1.0.** No se pueden hacer «a
  medias» para ganar tiempo.

---

## 6. Parte 2 — Sistema de diseño y front-end (pendientes)

### 6.1 Fase 6a — Sistema de diseño

| Tarea | Nivel | Modelo | R | C | H | V | S | Notas de esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **F10** Internacionalización | N2 | C (`claude-haiku-5-5`) → D | 0 | 1 | 0 | 1 | 1 | Convertir la galería (mucho texto) a claves + estructura para inglés. Sin decisiones de producto |
| **FA1** Arte final del dragón | N1 | humano (artista) | — | — | — | — | — | Proceso, no código. La puerta `tests/placeholder.test.ts` debe seguir en verde |

### 6.2 Fase 6b — Interfaz móvil (una pantalla = un corte)

| Tarea | Nivel | Modelo | R | C | H | V | S | Notas de esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **F11** Shell: navegación de 5 destinos + cabecera | N4 | **A** → B | 2 | 3 | 2 | 1 | 2 | Es el esqueleto del que dependen las 9 pantallas. **Decisión de dependencia nueva** (librería de navegación) → Regla 1. Primera app RN real: Metro, estado de navegación, safe areas |
| **F12** Primer uso (3 pasos) | N4 | B alto (`claude-sonnet-5-5`) | 2 | 3 | 1 | 2 | 2 | Depende de F16 y T15. Portapapeles, «Importar respaldo», instalación con confirmación. En TV el paso 2 cambia: condicional de plataforma |
| **F13** Inicio (Continuar, Recientes, Tesoros, Descubrir) | N3 | B → C | 1 | 2 | 1 | 1 | 1–2 | Depende de T25/T27 para el «Continuar». Máximo 4 secciones (V1) |
| **F14** Biblioteca (búsqueda, chips, filtros, carpetas, orden) | **N5** | **A** (`claude-opus-5-5` / `gpt-6.1-sol`) → B | 3 | 4 | 2 | 2 | 3–4 | La pantalla más densa: cuadrícula virtualizada con 3000 series (AC-4 en dispositivo), hoja de filtros, gestión de carpetas, tres órdenes. **Bloqueada por la pregunta 17** («Leyendo» no está definido en el SPEC) |
| **F15** Descubrir (selector de módulo, popular/latest, búsqueda) | N3 | B → C | 1 | 3 | 1 | 1 | 2 | Paginación + error de módulo con detalle desplegable (RF-11). Es la primera pantalla que consume un módulo real: tensión con T20 |
| **F16** Fuentes (repos y módulos, confirmación reforzada) | **N5** | **A** (diseño del flujo) → B | 3 | 3 | 1 | 2 | 2–3 | Confirmación **manteniendo pulsado** en módulos script, permisos y hash visibles, `SecureLock` (RF-7), re-confirmación al ampliar permisos (RF-6). Flujo de seguridad: el diseño va con A |
| **F17** Serie (detalle) | N4 | B alto | 2 | 3 | 1 | 1 | 2 | Descripción colapsable, lista de capítulos con 3 estados, selector de release, favorito con carpeta. Depende T22/T24/T26 |
| **F18** Lector 1 (modos, zonas, controles, progreso) | **N5** | **A** (diseño) → B (código) | 3 | 4 | 2 | 2 | 3 | Vertical continuo y paginado con dirección por tipo, zonas táctiles invertidas, debounce + «al salir», sin animaciones (Regla 4). Riesgo AC-6/OOM en la MiBox con el tope de imágenes provisional (P-45) |
| **F19** Lector 2 (zoom, pantalla encendida, precarga, errores) | **N5** | **A** → B | 3 | 3 | 3 | 2 | 2–3 | Zoom con pellizco, pantalla encendida (**dependencia nueva**), reintento por imagen, precarga que debe respetar el presupuesto de memoria. La precarga × OOM es el riesgo principal |
| **F20** Ajustes | N3 | B → C | 1 | 2 | 0 | 1 | 1–2 | Interruptores, selector de modo de lectura, caché, «Acerca de y licencias». NSFW apagado por defecto (RF-34) |
| **F21** Respaldo (UI) | N4 | B alto | 2 | 3 | 1 | 2 | 2 | Exportar a archivo y compartir, importar con fusión/reemplazo, **sugerencias que nunca instalan solas** (RF-38). Depende de T28/T29 |

### 6.3 Fase 7 — TV

| Tarea | Nivel | Modelo | R | C | H | V | S | Notas de esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **F22** Riel lateral + navegación espacial + foco | **N5** | **A** | 3 | 4 | 3 | 2 | 2–3 | Foco espacial con D-pad (no hay puntero), anillo de 2 px `accent`, escala 1,25×, márgenes seguros de TV. **React Native TVOS sin confirmar** (P-43/P-110 pendiente) → el andamiaje es la parte más incierta |
| **F23** Lector para TV (mapeo D-pad) | N4 | B alto | 2 | 3 | 1 | 2 | 1–2 | Mapeo de teclas completo, OK muestra/oculta, foco visible en los controles, sin animaciones. Depende de F18/F19 |

### 6.4 Fase 8 — Web + extensión

| Tarea | Nivel | Modelo | R | C | H | V | S | Notas de esfuerzo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **F24** Cliente web (React + Vite) | N4 | B alto (`claude-sonnet-5-5`) | 2 | 3 | 3 | 1 | 2–3 | App nueva con su propio pipeline (Vite + monorepo pnpm), densidad compacta, riel de 240 px, rejilla de 8 columnas, fuentes locales sin CDN (RNF-5). El riesgo es el **dual de render** (RN-Web vs React DOM) de los componentes compartidos |
| **F25** Pantallas web | N4 | B | 1 | 4 | 1 | 2 | 3 | Reutilizar los componentes base con otra densidad. Mecánico si F24 salió bien; caro si el dual de render forced cambios en F06–F08 |
| **F26** Extensión de navegador (protocolo HTTP) | N4 | B alto → **A** para el protocolo | 2 | 3 | 2 | 2 | 2 | Manifest V3, service worker, permisos por dominio, `postMessage` validando el origen, cuerpo en texto o base64. La superficie de seguridad exige buen diseño |
| **F27** Puente web ↔ extensión (Host sobre mensajes) | **N5** | **A** (`gpt-6.1-sol`) → B | 3 | 4 | 3 | 2 | 2–3 | El punto más frágil de todo el proyecto (SPEC §10): el core dentro de un **Web Worker sin DOM**, el puerto `Http` reimplementado sobre mensajes, y el `ScriptLoader` sobre el worker. Si esto se hace mal, AC-10 no se cumple |
| **F28** Playwright por pantalla + `DIFFS.md` + lista de 20 s | N4 | B (scripting) → A para `DIFFS.md` | 2 | 2 | 3 | 2 | 2–3 | Automatizar las comprobaciones de `AGENTS.md` §5 sobre ~10 pantallas: sin desbordamiento, sin «…», áreas ≥ 48, tokens, foco visible, cero peticiones externas. Es trabajo de **harness**, no de diseño |

---

## 7. Resumen: qué modelo para qué fase

| Tramo | Modelo por defecto | Modelo de escalada |
| --- | --- | --- |
| T25–T26, T30, T34, T35, F10 | D / C | B si la prueba no queda verde en 2 intentos |
| T27, T28, T31, T32, T33 | B (diseño con A en T27/T32/T33) | A |
| F11–F21 (móvil) | B (A en F11/F14/F16/F18/F19) | A |
| F22–F23 (TV) | A (F22), B (F23) | A |
| F24–F27 (web + extensión) | B (A en F27) | A |
| F28 | B | A |

## 8. Coste por tipo de tarea (estimación de uso)

| Nivel | Sesiones | Tokens de entrada aprox. | Tokens de salida aprox. | Modelo típico |
| --- | --- | --- | --- | --- |
| N1 | 0.3 | 40–80 k | 10–20 k | D |
| N2 | 0.5–1 | 80–200 k | 20–60 k | D/C |
| N3 | 1–2 | 200–500 k | 60–150 k | B |
| N4 | 2–3 | 500 k–1,2 M | 150–350 k | B (+A en el corte de diseño) |
| N5 | 3–4 | 1–2,5 M | 300–700 k | A + B |

Los rangos son órdenes de magnitud para comparar entre tareas, no una promesa: el gasto real
depende de cuántas veces haya que leer SPEC/DESIGN y de los fallos del ciclo R→G.

## 9. Advertencias

1. **El nivel no es el tamaño en archivos.** F10 toca menos archivos que T35 y ambas son N2.
   Lo que sube de nivel es la **decisión**, no el volumen.
2. **Una tarea N4 bien LEAD con un escalón B sale más barata que una N4 empezada con A.**
   El gasto se paga en el primer corte (interpretar y decidir), no en el resto.
3. **No saltar de modelo dentro de una tarea sin motivo.** Si el modelo actual falla dos veces
   (§10 de `AGENTS.md`), se escala a un escalón superior y se anota el coste en `MEMORY.md`.
4. **El andamiaje no lo arregla un modelo mejor.** F22 y F24 tienen la mayor incertidumbre en
   dependencias y toolchain, no en razonamiento: ahí el riesgo es de versión y de API, y la
   respuesta es `ctx7` + la documentación oficial, no un frontier.
5. **Las tareas bloqueadas por una decisión del humano no se empiezan.** F14 (pregunta 17),
   F19 y F22 (versiones de TV) y T29 (semántica del merge) son N5 en parte porque dependen de
   respuestas, no solo de código.
