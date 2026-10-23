# complexity.md — Complejidad, modelo y límites de sesión (RyuuNest)

> Generado 2026-10-20 · Precios de OpenCode Zen por 1M tokens (entrada/salida), de `opencode.ai/docs`. Cambian: confirma con `/models`.
> Los niveles se asignan por **precio y familia del modelo**, no por benchmark propio. Si un modelo rinde distinto, muévelo de nivel aquí.

## 1. Reglas de sesión (obligatorias)

1. **Una tarea por sesión** (dos solo si ambas son Baja). Lee solo la sección de esa tarea en `todo.md`.
2. **Máx. ~5 archivos tocados.** Si hace falta más: parar y proponer dividir la tarea.
3. **Regla de 2 intentos.** Mismo error o test fallido → máximo 2 intentos de arreglo. Si haría falta un 3.º: **detenerse, no tocar más código** y escribir exactamente:
   **«modelo con poca potencia cambiar.»**
   + resumen de ≤5 líneas: qué falla, qué se probó, archivos tocados, estado de los tests.
4. **Escalar de uno en uno** (N1→N2→N3→N4→N5). Si N5 falla 2 veces: parar y preguntar al humano. No usar los modelos de reserva sin permiso.
5. **Contexto:** cerrar con resumen al llegar a ~100 K tokens (algunos modelos suben de precio por encima de ese umbral).
6. **Verificar con el comando focalizado de la tarea.** `pnpm -r …` completo solo en checkpoints.
7. **TDD:** test rojo → verde. No editar un test para que pase, salvo que el criterio de aceptación lo exija.
8. **Duda o dato faltante → preguntar, no inventar.** Las mediciones en dispositivo (POCO, Galaxy, MiBox) son 🧍 del humano.
9. **Al cerrar:** marcar `[x]` y añadir 1 línea a `MEMORY.md`.
10. **Fuera del alcance** de la tarea → anotarlo, no hacerlo.

Cambiar de modelo: `/models` en la TUI de OpenCode (`opencode/<id>`). En sesión nueva, pegar el resumen de la regla 3.

## 2. Qué significa cada complejidad

| Nivel | Criterio |
|---|---|
| **Baja** | Copia un patrón que ya existe en el repo; 1–3 archivos; criterios mecánicos |
| **Intermedia** | Lógica nueva acotada o integración de 2–3 piezas; casos límite moderados |
| **Alta** | Razonamiento de diseño, seguridad, concurrencia, rendimiento/memoria, o define un patrón/contrato que otros copiarán |

Tipo: **BE** back-end/núcleo · **FE** interfaz · **Ops** CI/docs · **Sec** seguridad.

## 3. Niveles de modelo (OpenCode Zen)

| Nivel | Para qué | Modelos (entrada/salida por 1M) | Default |
|---|---|---|---|
| **N1 Bajo** | Docs, marcar checklists, correr comandos, ediciones triviales | Gratis (sin retención): `glm-5.3-flash-free`, `deepseek-v4.1-flash-free`, `minimax-m3.1-flash-free`, `longcat-2.5-preview-free` · Gratis ⚠ recopilan datos/trial: `big-pickle`, `mimo-v2.5-free`, `mimo-v2.6-flash-free`, `nemotron-3.5-lightning-free` · Pago: `gpt-6-luna` $0.10/$0.50, `claude-haiku-5-5` $0.10/$0.50, `gpt-5-nano` $0.05/$0.40 | `glm-5.3-flash-free` |
| **N2 Intermedio-bajo** | Copiar patrones existentes, tests sencillos, CRUD, YAML | `qwen3.8-flash` $0.15/$0.47 · `glm-5.3-flash` $0.15/$0.50 · `gpt-5.6-luna` $0.20/$1.20 · `deepseek-v4.1-flash` $0.30/$1.20 (caché $0.006) · `minimax-m3` $0.30/$1.20 · `gemini-3.5-flash-lite` $0.30/$2.50 · `qwen3.7-plus` $0.40/$1.60 | `deepseek-v4.1-flash` |
| **N3 Intermedio** | Lógica nueva acotada, integraciones, pantallas con datos, casos mixtos simples y complejos | `kimi-k2.7-code` $0.95/$4.00 · `mistral-large-4` $0.68/$2.09 (50 % off) · `grok-build-0.1` $1/$2 · `muse-spark-1.3` $1.25/$4.25 · `glm-5.3` $1.40/$4.40 · `deepseek-v4-pro` $1.74/$3.48 · `qwen3.8-max` $2/$6 | `kimi-k2.7-code` (alt.: `glm-5.3`, `deepseek-v4-pro`) |
| **N4 Intermedio-alto** | Razonamiento de BE, seguridad, rendimiento, patrones fundacionales de FE | `gemini-3.8-flash` $1.50/$7.50 · `claude-sonnet-5-5` $2/$10 · `gpt-6.1-sol` $2/$10 · `gpt-6-sol` $2/$10 · `gpt-5.6-terra` $2/$12 · `gemini-3.1-pro` $2/$12 | `claude-sonnet-5-5` o `gpt-6.1-sol` |
| **N5 Alto (frontera)** | Decisiones de contrato público, seguridad crítica, fallos que N4 no resolvió | `kimi-k3` $3/$15 · `gemini-4-argon` $4/$20 (50 % off hasta 2026-11-30) · `claude-opus-5-5` $4/$20 · `gpt-5.6-sol` $4/$20 | `claude-opus-5-5` o `gpt-5.6-sol` |
| **Reserva** (pedir permiso) | Último recurso | `claude-fable-5-1` $10/$50 · `gpt-6-astra` $10/$50 | — |

Notas:
- **Evitar** modelos en la lista de deprecados de Zen (p. ej. GLM 5, Kimi K2.5, MiniMax M2.5).
- Los modelos gratis son **temporales**; si desaparecen, subir un nivel.
- Aunque el repo será público (GPL-3.0), **nunca** meter `.env`, claves ni datos personales en el contexto de un modelo gratis ⚠.
- Umbrales de precio por contexto: Haiku 5.5 sube >100 K; Gemini 3.1 Pro >200 K; GPT 6/5.6/5.5 >272 K.
- Cada recarga de créditos cobra 4.6 % + $0.31: recargar en montos grandes.
- **FE con captura PNG** (comparar contra `screen.png`): usar un modelo con **visión** (Claude, GPT, Gemini; confirma los demás en `/models`). Si el modelo elegido no ve imágenes, un modelo con visión compara y el otro escribe el código.

## 4. Complejidad por tarea pendiente

`Nivel` = modelo inicial. `Escalar` = siguiente nivel tras 2 intentos fallidos.

### Parte 1 — Núcleo

| Tarea | Tipo | Complejidad | Nivel | Escalar | Motivo |
|---|---|---|---|---|---|
| T05 cierre | Ops | Baja | N1 | — | 🧍 confirmar ADR-0002 |
| T25+T26 Progreso y chapter_read (1 sesión) | BE | Baja | N2 | N3 | Copian el patrón de T22/T24 |
| T27 Estado del lector | BE | Intermedia | N3 | N4 | Máquina de estados e invariantes |
| T28 Exportar respaldo | BE | Intermedia | N3 | N4 | Esquema SPEC §8.3 sobre todas las tablas |
| T29a Importar: tests y esquema | BE | **Alta** | N4 | N5 | Define fusión, atomicidad y entrada hostil |
| T29b Importar: implementación | BE | Intermedia | N2 | N3 → N4 | Implementar hasta verde sin tocar los tests |
| T30 E2E respaldo | BE | Baja | N2 | N3 | Solo ida y vuelta |
| T31 Port `logicTMO` | BE | **Alta** | N4 | N5 | Python→TS, 8 defectos, sitio real |
| T32a 2.º sitio falso | BE | Intermedia | N3 | N4 | Fixtures JSON + cursor |
| T32b ADR congelación API | BE | **Alta** | N5 | — | Congelar API pública es juicio de diseño |
| T33 Seguridad | Sec | **Alta** | N4 | N5 | Pensamiento adversarial |
| T34 Resiliencia | BE | Intermedia | N3 | N4 | Timers/async, tests inestables |
| T35 Puertas de CI | Ops | Baja | N2 | N3 | YAML + umbral de cobertura (dep. T32a) |
| FA1 Arte dragón | Ops | Baja | N1 | — | 🧍 proceso con artista; solo docs |

### Parte 2 — Interfaz

| Tarea | Tipo | Complejidad | Nivel | Escalar | Motivo |
|---|---|---|---|---|---|
| F11 Shell/navegación | FE | **Alta** | N4 | N5 | Fundacional: fija el patrón de pantalla |
| F13 Inicio | FE | Intermedia | N3 | N4 | 1.ª pantalla con datos reales |
| FB1 Plano de pantalla (tras F14b) | Ops | Baja | N4 | — | 1 página con datos reales de biblioteca (T22/T23) que luego copian modelos baratos |
| F14a Biblioteca: cuadrícula y filtros | FE | Intermedia | N3 | N4 | Virtualización (3000) + filtros |
| F14b Biblioteca: carpetas y orden | FE | Intermedia | N3 | N4 | Gestión de carpetas |
| F15 Descubrir | FE | Intermedia | N2 | N3 | Con plano: módulo + paginación + error |
| F16 Fuentes | FE | **Alta** | N4 | N5 | UX de seguridad: permisos, hash, mantener pulsado |
| F12 Primer uso | FE | Intermedia | N3 | N4 | Flujo multipaso; va después de F16 |
| F17 Serie | FE | Intermedia | N2 | N3 | Con plano: lista de capítulos + releases |
| F18 Lector 1 | FE | **Alta** | N4 | N5 | Gestos, modos, RTL, progreso, memoria |
| F19 Lector 2 | FE | **Alta** | N4 | N5 | Zoom y precarga con presupuesto de memoria |
| F20 Ajustes | FE | Baja | N2 | N3 | Filas de ajustes con componentes existentes |
| F21 Respaldo UI | FE | Intermedia | N3 | N4 | Archivos/compartir + validación |
| F22 TV riel+foco | FE | **Alta** | N4 | N5 | Foco espacial; difícil de probar sin dispositivo |
| F23 Lector TV | FE | **Alta** | N4 | N5 | D-pad sobre el lector |
| F24 Cliente web | FE | Intermedia | N3 | N4 | Vite + reutilización de componentes |
| F25 Pantallas web | FE | Intermedia | N2 | N3 | Con plano: portar pantallas, densidad compacta |
| F26 Extensión | Sec | **Alta** | N4 | N5 | MV3: origen, permisos por dominio |
| F27 Puente web↔ext. | FE/BE | **Alta** | N4 | N5 | Web Worker + mensajes |
| F28 Verificación | FE | Intermedia | N3 | N4 | Mucha comparación visual (requiere visión) |
| UP1 Actualización total a SDK 58 (plan listo en `tasks/upgrade-sdk58.md`; pendiente de autorización) | Ops/FE | **Alta** | N4 | N5 | Toca el andamio de todo lo hecho (F03–F14b): deps, build, Playwright, gates; P-66 queda reemplazada para esta tarea por orden del humano |
| UP1b Fuentes variables/multifamilia (post-UP1) | FE | Intermedia | N3 | N4 | Mejora de F03 que el SDK 58 ya ofrece: `expo-font` con `fontDefinitions` |
| Checkpoints | Ops | Baja | N1 | — | Correr comandos; 🧍 revisión |

## 5. Flujos que ahorran tokens

- **Plano de pantalla (FB1):** un modelo N4 documenta el patrón tras F11, F13 y F14a/F14b (primera pantalla con datos reales de biblioteca); F12, F15, F17, F20, F21 y F25 lo leen en vez de explorar el repo, por eso bajan de nivel.
- **Tests primero (T29):** el modelo fuerte escribe los tests y el esquema (T29a); el barato implementa hasta verde sin editarlos (T29b).
- **Sesiones unidas:** T25+T26 van juntas porque comparten patrón y archivos.
