# AGENTS.md: reglas para quien trabaje en RyuuNest

> Lo leen todos los agentes (OpenCode u otros) al empezar. Si cambias de agente o de herramienta, estas reglas siguen igual.
> Proyecto: lector personal y de código abierto (GPL-3.0) de manga, manhua, manhwa y cómics con módulos de scraping instalables. Monorepo pnpm + TypeScript estricto.

## 0. Autoridad y arranque de sesión

**Orden de autoridad** (si dos documentos se contradicen):

1. `docs/SPEC.md`: **qué** hace la app.
2. `DESIGN_RULES.md`: **qué se toma del diseño y cómo se usa el color**.
3. `DESIGN.md`: **cómo se ve** cada componente.
4. Los `screen.png` de `design/stitch/`: composición.
5. Los `code.html`: solo referencia de estructura.
6. `docs/IDEA.md`: contexto.

- Lee `MEMORY.md`, `tasks/todo.md` y las secciones del SPEC que toques. Si tocas UI, lee además `DESIGN_RULES.md`, `DESIGN.md` y el `screen.png`/`code.html` de esa pantalla.
- **SPEC:** `docs/SPEC.md`. **PLAN:** `tasks/plan.md`. **TODO:** `tasks/todo.md`. `tasks/complexity.md` §1 fija el tamaño de sesión y el escalado.
- Antes de buscar código, consulta Graphify (§10); después lee solo los archivos y rangos localizados.
- Para APIs de librerías, frameworks o CLI usa **Context7**: `npx ctx7@latest library <nombre> "<tema>"` y luego `npx ctx7@latest docs <id> "<tema>"`. Si no tiene la documentación, busca en internet y anota la fuente en `MEMORY.md`.
- Si el humano escribe `/graphify`, usa la skill o instrucciones de Graphify antes de hacer otra cosa.
- No uses documentos fuera de este orden para decidir nada.

## 1. Ante la duda, pregunta (Regla 1)

**Preguntar es mejor que inventar.** No rellenes huecos con suposiciones.

- Pregunta cuando falte un dato, un requisito sea ambiguo, el SPEC no cubra el caso, dos documentos se contradigan o una decisión tenga consecuencias difíciles de deshacer.
- No inventes: datos de ejemplo con obras reales, versiones de librerías (se fijan en la Fase 0), URLs, textos de interfaz que el diseño no tenga, cifras, nombres de módulos o licencias.
- Una buena pregunta es concreta: di qué necesitas, da 2 o 3 opciones con tu recomendación y el efecto de cada una. Una pregunta por tema.
- Mientras esperas respuesta, sigue con lo que no dependa de ella y deja claro qué quedó bloqueado.
- Cuando el humano responda, anota la decisión en `MEMORY.md` (§3) y, si cambia el alcance, actualiza `tasks/todo.md`.

## 2. MEMORY.md (Regla 2)

- `MEMORY.md` guarda solo lo importante: decisiones, elecciones del humano, recomendaciones aceptadas o descartadas, hitos y preguntas abiertas. **No es un registro de comandos ni de cambios menores.**
- Cada sesión lo actualiza si hay algo importante: al cerrar un hito, añade o edita su línea en §2; las decisiones nuevas o cambiadas van en §3; las preguntas respondidas pasan de §4 a §3.
- No borres una decisión: marca la anterior como reemplazada y enlaza la nueva.
- Las preguntas sin resolver se listan en §4 y se dicen al humano al cerrar.
- Antes de terminar, repasa la lista de cierre (§13).

## 3. Alcance (Regla 3)

- **Una tarea por sesión** y **~5 archivos como máximo**. Si hace falta más, para y propón dividir la tarea.
- Antes de editar, ten claro: objetivo, archivos permitidos, pruebas que debes ejecutar y criterios de aceptación. Si no están claros, pregunta.
- No arregles «de paso» nada fuera del alcance: anótalo en `tasks/todo.md` o `MEMORY.md` y sigue.
- No añadas dependencias, cambies versiones, hagas refactors masivos ni migraciones no pedidas. Las versiones se fijan en la Fase 0.
- **El SPEC manda sobre la funcionalidad.** Si el diseño muestra algo fuera de la v1, se omite (RF-44) y se anota en `design/stitch/DIFFS.md`.
- `tasks/plan.md` es el PLAN; `tasks/todo.md` es el TODO. Al cerrar, marca `[x]` y deja el siguiente paso.
- Si el humano pide algo que contradice el SPEC, pregunta antes de implementarlo.

## 4. TDD y calidad (Regla 4)

- **Rojo → verde → limpio.** Cada tarea de código empieza por una prueba que **falla**; sin test rojo no se implementa. No edites un test para que pase salvo que el criterio de aceptación lo exija.
- La regla anterior aplica a código ejecutable. En tareas solo de documentación o configuración, valida enlaces, JSON y formato, y pasa el gate; no inventes un test artificial.
- Avanza por cortes pequeños (rojo → verde) y verifica la suite en cada corte. Cada tarea termina con su commit.
- Gate final: `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm -r build`. En Windows, si Vitest falla con `.vitest-cache` o workers, repite con `pnpm -r --workspace-concurrency=1 test`; no es un fallo del código.
- Las pruebas del contrato de módulos usan fixtures HTML/JSON guardados, **nunca sitios reales**.
- TypeScript en modo estricto; sin `any` sin justificar; sin código muerto.
- Dispositivos de prueba: POCO F5 Pro, Galaxy S25 Ultra y Xiaomi MiBox 4 (Android 9, 2 GB), que fija el piso de rendimiento.

## 5. Intentos, bloqueos y escalado (Regla 5)

- Cada intento debe probar una **hipótesis distinta**. No repitas el mismo comando, cambio o parche esperando otro resultado.
- **Máximo 2 intentos por el mismo error o test.** Si el segundo falla, **detente** y entrega:
  1. qué falla (error o test exacto);
  2. qué probaste en cada intento;
  3. archivos tocados;
  4. estado de lint, tipos y tests;
  5. tu siguiente hipótesis o la decisión que necesitas del humano.

  Escribe exactamente: **«modelo con poca potencia cambiar.»**
- **Detente de inmediato, sin esperar al segundo intento**, si:
  - hay un bloqueo de arquitectura o de contrato público;
  - la decisión es irreversible o toca seguridad/permisos;
  - falta un dato que solo el humano puede dar (mediciones, versiones, diseño, licencia);
  - el coste se sale del límite asignado.
- Escala de uno en uno (N1 → N2 → N3…). No saltes niveles ni uses modelos de reserva sin permiso.
- Si el primer intento pasa y los criterios se cumplen, **no escales** ni pidas otra revisión completa sin una razón concreta.
- No ocultes un fallo: si un test queda en rojo, dilo y no lo marques como terminado.

## 6. Componentes, UI y animaciones (Regla 6)

**Componentes reutilizables**

- Todo elemento de interfaz que se use o pueda usarse más de una vez es un **componente reutilizable** con props tipadas: botones, chips, insignias, tarjetas de portada, filas de capítulo, campos, hojas, diálogos, barras, estados vacíos y de error, etiquetas de sección.
- Antes de crear uno, busca si ya existe uno igual o parecido y amplíalo. No dupliques.
- Los componentes no llevan colores, tamaños, radios ni espacios literales: solo tokens de `packages/ui-tokens`.
- Cada componente nuevo se añade a la **galería de componentes** con todos sus estados (normal, presionado, foco, deshabilitado, cargando, error si aplica).
- **Excepción:** un elemento individual solo se permite con una razón real (es único de una pantalla y no tiene sentido fuera de ella). Márcalo con `// single-use: <razón>` y, si dudas, pregunta (Regla 1).
- Los textos de interfaz van al catálogo de traducciones; **ninguno literal** en los componentes.
- **Nunca copies el HTML de `design/stitch/`.** Es referencia de estructura; se traduce a React Native con tokens (SPEC §11.3).

**Animaciones**

- Se prefieren detalles sutiles: estados al presionar/enfocar, selección de chips, entrada/salida de hojas y diálogos, cambio de pestaña, aparición de la barra de progreso. Duración de **150 a 200 ms** con `ease-out`.
- **Solo `transform` y `opacity`.** Nada que fuerce recalcular el diseño de listas largas.
- **Nunca en el lector** (ni animaciones ambientales ni decorativas).
- Se respeta `prefers-reduced-motion` y el ajuste equivalente del sistema.
- En la Xiaomi MiBox 4 (2 GB) se miden; si algo se nota lento, se desactiva en TV y se anota en `MEMORY.md`.
- Las animaciones son componentes o hooks compartidos (por ejemplo, un `Pressable` animado), no código repetido en cada pantalla.

**Diseño**

- Ningún hexadecimal ni medida literal fuera de `ui-tokens`. Solo los tokens de SPEC §11.9.
- Datos de ejemplo: un único conjunto de fixtures coherente, con series inventadas y portadas sin texto (`DESIGN_RULES.md` D1 a D5).
- Una etiqueta por concepto, sin tarjetas-mascota ni promesas que la v1 no cumple (`DESIGN_RULES.md`).
- Sin telemetría, sin cuentas, sin servicios de terceros, sin CDN.
- Nada se instala de forma automática: toda instalación de módulos pasa por confirmación manual (SPEC §7).

## 7. Verificación web y galería con Playwright (Regla 7)

Cada pantalla o componente de interfaz se verifica con **Playwright** antes de darse por terminado, comparándolo con su `screen.png`.

**Alcance honesto.** Playwright controla un navegador: sirve para el cliente web y para la galería de componentes cuando corre en web. No controla la app nativa de Android: esa se verifica con **agent-device** (MCP) según la Regla 8. No des por verificada una pantalla nativa solo por haber pasado en web: Playwright no la cubre.

**Procedimiento**

1. Levanta el cliente web o la galería.
2. Abre la pantalla con el ancho del `screen.png` de referencia (móvil) y, para web, con ancho de escritorio (más de 1024 px).
3. Toma la captura y ponla junto a `screen.png`. Revisa composición, jerarquía, espaciado, tipografía y color.
4. Ejecuta comprobaciones automáticas:
   - sin desbordamiento horizontal de la página;
   - ningún título o dato importante cortado con «…» (`DESIGN_RULES.md` T7);
   - áreas interactivas de al menos 48 × 48 (con `hitSlop` o equivalente);
   - colores calculados dentro de los tokens; texto oscuro sobre `accent` y `progress`;
   - Manrope e Inter cargadas desde archivos locales;
   - foco visible al navegar con teclado (equivale al D-pad en TV);
   - sin errores de consola;
   - **sin peticiones a dominios externos** (CDN de fuentes, Tailwind, imágenes remotas): RNF-5.
5. Un diff de píxeles contra `screen.png` no sirve: los datos de ejemplo son otros. Solo se usa contra capturas base propias para detectar regresiones.
6. Registra las diferencias aceptadas en `design/stitch/DIFFS.md` y pasa la lista de 20 segundos de `DESIGN_RULES.md` (§6).

La verificación web es automática: no pidas al humano que repita a mano lo que Playwright puede comprobar.

## 8. Verificación nativa con agent-device (Regla 8)

La app nativa (móvil, Android TV) se verifica con **agent-device**: CLI y servidor MCP que abren la app en el dispositivo real o en el emulador, leen el árbol de accesibilidad y actúan por refs. Reparto: **Playwright para el web, agent-device para lo nativo** (P-127). Documentación: `agent-device.dev/docs` (repo `callstack/agent-device`); guarda en `MEMORY.md` la fuente si la consultas de nuevo.

**Si el MCP o el CLI no existen en el PC** (compruébalo antes de asumir que están):

1. ¿Está el CLI? `agent-device --version` (requiere Node ≥ 22.12, que el monorepo ya exige). ¿Está el MCP? Aparece como servidor `agent-device` con sus herramientas en el catálogo de Code Mode; si no lo ves, búscalo con `search("agent-device")` antes de creer que falta.
2. Si falta el CLI o el MCP no carga, **pregunta al humano (Regla 1)** antes de ejecutar `npm install -g agent-device@latest` y `agent-device doctor`. La entrada del servidor ya vive en `~/.config/opencode/opencode.jsonc` (`"command": ["agent-device", "mcp"]`); si hay que añadirla o repararla, propón el cambio exacto y reinicia la sesión.

**Flujo (inspect → act → verify):**

1. `devices` lista dispositivos (teléfono, emulador, TV, `kind`); `open` con `foreground: true` devuelve el snapshot inicial con refs `@eN`. App desconocida: `devices` → `apps` → `open`; nunca inventes identificadores.
2. Lee el `snapshot` (árbol de accesibilidad con roles y etiquetas) y actúa con `press`/`fill`/`scroll` y `settle: true`; cada acción devuelve un diff con los cambios y los refs nuevos.
3. Verifica: `wait` (texto o selector), `is`, `get` o `find`. La captura (`screenshot`) es **evidencia**, no el medio primario de inspección.
4. `close` al terminar: libera el claim exclusivo del dispositivo. Si un claim queda huérfano, `agent-device device release --stale`.

**Advertencias encontradas en este PC (2026-11-03):**

- En bash de Windows, `emulator` no está en PATH: usa `"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe"` (`-list-avds` para los AVD).
- El emulador Android no arranca sin aceleración de hardware: error `x86_64 emulation currently requires hardware acceleration!` («Android Emulator hypervisor driver is not installed on this machine»). En este PC falta el hipervisor (no hay AEHD instalado ni WHPX activo); instalar AEHD o habilitar WHPX toca el sistema con permisos de administrador → **pregunta al humano (Regla 1)** y no ejecutes instaladores silenciosos por tu cuenta. Mientras tanto, usa el teléfono físico.
- Firma de `press` en el MCP: `press({ target: { kind: "ref", ref: "@eN", label: "…" }, settle: true, verify: true })`. No pases el ref plano: falla.
- Tras reiniciar el servidor de OpenCode cambia el catálogo de Code Mode y las herramientas del MCP pueden no estar listadas: búscalas con `search(...)` antes de llamarlas; no asumas rutas de la sesión anterior.
- Los refs `@eN` solo valen en la última salida: haz snapshot de nuevo si el diff no trae lo que necesitas.
- Estado y logs de sesión viven en `~/.agent-device/sessions/`, acotados a la sesión y al workspace (worktree) que reclama el dispositivo.

## 9. Skills por categoría (Regla 9)

Carga **solo** las skills de la categoría de la tarea. Empieza por el `*-category-pointer` y luego la skill concreta que indique; si no existe o no basta, pide permiso antes de instalar. Máximo 2–3 skills por tarea y no cargues skills de diseño/marketing para tests, tokens o backend.

| Categoría | Skills recomendadas |
|---|---|
| UI/UX web | `ui-ux-pro-max`, `ui-taste`, `design-system`, `ui-styling`, `web-dev-category-pointer` |
| UI móvil/Android/TV | `ui-ux-pro-max`, `ui-taste`, `design-system`; `ios-design` solo si es iPhone (no es el objetivo) |
| Diseño visual, logo, banner, social, slides | `design-category-pointer` → `design`, `design-system`, `banner-design`, `brand`, `slides`; solo si el encargo es visual |
| Tests y verificación | `testing-category-pointer` → skill concreta; Playwright/agent-device según §7/§8 |
| Backend / núcleo | `backend-dev-category-pointer` |
| Base de datos | `database-category-pointer` |
| Seguridad | `security-category-pointer` |
| DevOps / CI | `devops-category-pointer` |
| Git / PR | `git-category-pointer` |
| Revisión de código | `code-review-category-pointer` |
| Explorar código | `codebase-memory` + Graphify (§10) |
| Documentación / textos | `writing-category-pointer` |
| OpenCode / agentes / tooling | `opencode`, `agents-category-pointer`, `tooling-category-pointer`, `report` |
| Marketing | `marketing-category-pointer`; solo si el humano lo pide |

- Si dos skills se solapan, quédate con la más específica.
- No cargues una skill solo porque su nombre suene relacionado; lee su descripción y disparadores.
- Si la skill requiere una dependencia o instalación, pregunta antes.

## 10. Graphify (Regla 10)

- `graphify-out/graph.json` es la vía para explorar código. **Antes del primer grep, búsqueda o lectura de código**, ejecuta `graphify query "<pregunta>"`; usa `graphify path "A" "B"` para relaciones y `graphify explain "X"` para conceptos.
- Si existe `graphify-out/wiki/index.md`, úsalo para navegación amplia. `GRAPH_REPORT.md` solo para arquitectura general o cuando query/path/explain no den contexto.
- Tras modificar código, ejecuta `graphify update .` (AST, sin coste de API). Un `graph.json` sucio o un diff grande es esperado; no lo descartes ni lo marques como churn.
- Indexa todos los paquetes del monorepo. Si el grafo no existe, créalo antes de explorar.
- Si falta el CLI: `uv tool install "graphifyy[mcp]"` (aporta `graphify` y `graphify-mcp`); si falta la skill de Claude: `graphify install --platform claude --project`. Si la instalación toca el sistema, pide permiso.
- El MCP puede configurarse en `.mcp.json` (`graphify-mcp --graph graphify-out/graph.json`) o en la configuración del agente; si no está disponible, usa el CLI.
- Si el humano escribe `/graphify`, usa la skill o instrucciones de Graphify antes de otra cosa.

## 11. Git (Regla 11)

- Antes de empezar: `git pull origin master` (rama principal actual; si cambia, usa la que indique el repo). Trabaja en una rama propia: `feature/<Tarea>-<slug>`, `fix/<slug>` o `docs/<slug>`.
- **Nunca** hagas push directo a `master`.
- Commits atómicos y descriptivos: `<tipo>: <descripción breve>` (`feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `chore`). Documentos, commits y respuestas al humano en español; identificadores de código en inglés.
- Antes de commit: `pnpm lint`, `pnpm -r typecheck`, `pnpm -r test` (y `pnpm -r build` si toca). Si algo falla, arréglalo antes de hacer push.
- Al terminar: `gh pr create` con título, qué/por qué, criterios de aceptación, capturas si hay UI y evidencia del gate. **No fusiones el PR**: lo revisa y lo fusiona el humano.
- No dejes ramas huérfanas. Si una tarea se cancela, borra su rama.

## 12. Definición de terminado (Regla 12)

Una tarea está terminada solo si:

- [ ] Build, lint, tipos y pruebas en verde.
- [ ] Criterios de aceptación cumplidos y verificaciones de la tarea ejecutadas.
- [ ] Sin cambios fuera del alcance ni dependencias innecesarias.
- [ ] Sin regresiones; sin `any` sin justificar ni código muerto.
- [ ] Revisión visual cuando corresponda (Playwright/agent-device).
- [ ] Componentes nuevos en la galería; sin valores literales; textos traducidos.
- [ ] Diferencias aceptadas en `design/stitch/DIFFS.md`.
- [ ] `MEMORY.md` actualizado (hito/decisiones) y preguntas abiertas comunicadas.
- [ ] Intervención manual registrada, si la hubo.
- [ ] Coste y número de iteraciones documentados en la tarea o en `MEMORY.md`.

**Criterio económico:** `coste por éxito = coste total de las ejecuciones / tareas completadas correctamente`.

## 13. Cierre de sesión (Regla 13)

- [ ] Gate en verde (`pnpm lint`, `pnpm -r typecheck`, `pnpm -r test`; `pnpm -r build` si toca).
- [ ] App nativa tocada verificada con agent-device: sesión cerrada con `close` y dispositivo liberado (o anotado que falta).
- [ ] Pantallas tocadas verificadas con Playwright (cliente web y galería).
- [ ] Componentes nuevos en la galería; ningún valor literal.
- [ ] Diferencias aceptadas en `design/stitch/DIFFS.md`.
- [ ] `MEMORY.md` actualizado y preguntas sin resolver listadas y comunicadas.
- [ ] Rama y PR listos; sin cambios sin confirmar del trabajo de la tarea.

## 14. Evitar (Regla 14)

- Repetir una auditoría o un gate que ya está en verde.
- Rehacer una implementación anterior sin una regresión concreta.
- Refactors, renombres o formateos masivos fuera del alcance.
- Añadir dependencias, cambiar versiones o instalar herramientas sin permiso.
- Generar ADRs, planes de fase, capturas o documentación que nadie pidió.
- Ofrecer opciones de diseño cuando el encargo es una corrección técnica.
- Cargar todas las skills o skills de diseño/marketing en tareas de tokens, tests o backend.
- Copiar HTML de `design/stitch/` o usar valores literales fuera de `ui-tokens`.
- Meter `fetch` directo a dominios externos, CDN, telemetría, cuentas o servicios de terceros.
- Inventar datos, versiones, URLs, textos, licencias o mediciones.
- Hacer push a `master`, fusionar el PR o dejar ramas huérfanas.
- Implementar antes de tener un test en rojo.
- Ignorar un fallo de test o saltarte el gate «porque solo es documentación».
- Usar `any` sin justificar, código muerto o tests tautológicos.
- Ocultar un bloqueo o un test en rojo.

## 15. Scrum (pendiente de definir)

- A partir de ahora el proyecto se gestiona con **Scrum**. Las ceremonias, artefactos, duraciones, roles y métricas se definirán en una sesión aparte; **no los inventes**.
- Mientras se define, `tasks/plan.md` (PLAN) y `tasks/todo.md` (TODO) siguen siendo la fuente de trabajo, y `MEMORY.md` la de decisiones.
- Cuando el humano cierre el proceso, actualiza esta sección y `MEMORY.md` con la decisión.
