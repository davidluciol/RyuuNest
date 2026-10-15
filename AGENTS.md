# AGENTS.md: reglas para quien trabaje en RyuuNest

> Lo leen todos los agentes (Opencode u otros) al empezar. Si cambias de agente o de herramienta, estas reglas siguen igual.
> Proyecto: lector personal y de código abierto de manga, manhua, manhwa y cómics con módulos de scraping instalables (GPL-3.0).

## 0. Al empezar cada sesión

1. Lee `MEMORY.md` completo: estado actual, decisiones y preguntas abiertas.
2. Lee de `SPEC.md` las secciones que toca tu tarea (el orden de autoridad está en su cabecera).
3. Si tocas interfaz, lee `DESIGN_RULES.md` y `DESIGN.md`, y abre el `screen.png` y el `code.html` de la pantalla en `design/stitch/`.
4. No uses documentos fuera de ese orden de autoridad para decidir nada.
5. Manten el desarollo actuaizado cualquier herramienta, libreria o framework que uses para el proyecto. usando Context7 para obtener la documentacion mas actualizada. Si ctx7 no tiene la documentacion, busca en internet y anota en `MEMORY.md` la fuente.

## 1. Regla 1: ante la duda, pregunta al humano

**Preguntar es mejor que inventar.** No rellenes huecos con suposiciones.

- Pregunta cuando falte un dato, un requisito sea ambiguo, el SPEC no cubra el caso, dos documentos se contradigan o una decisión tenga consecuencias que no se puedan deshacer fácilmente.
- No inventes: datos de ejemplo con obras reales, versiones de librerías (se fijan en la Fase 0), URLs, textos de la interfaz que el diseño no tenga, cifras, nombres de módulos o licencias.
- Una buena pregunta es concreta: di qué necesitas, da 2 o 3 opciones con tu recomendación y el efecto de cada una. Una pregunta por tema.
- Mientras esperas respuesta, sigue con lo que no dependa de ella y deja claro qué quedó bloqueado.
- Cuando el humano responda, anota la decisión en `MEMORY.md`.

## 2. Regla 2: `MEMORY.md` se actualiza en cada sesión

- **Cada sesión agrega al menos una entrada** en la bitácora de `MEMORY.md`, aunque solo sea «sin cambios relevantes; se avanzó en X».
- `MEMORY.md` guarda solo lo importante: decisiones, elecciones del humano, recomendaciones aceptadas o descartadas, hitos y preguntas abiertas. No es un registro de comandos ni de cambios menores.
- Si una decisión cambia, no borres la anterior: marca la vieja como reemplazada y enlaza la nueva.
- Antes de terminar, repasa la lista de cierre (sección 8).

## 3. Regla 3: todo en componentes reutilizables

- Todo elemento de interfaz que se use o pueda usarse más de una vez es un **componente reutilizable** con props tipadas: botones, chips, insignias, tarjetas de portada, filas de capítulo, campos, hojas, diálogos, barras, estados vacíos y de error, etiquetas de sección.
- Antes de crear uno, busca si ya existe uno igual o parecido y amplíalo. No dupliques.
- Los componentes no llevan colores, tamaños, radios ni espacios literales: solo tokens de `ui-tokens`.
- Cada componente nuevo se añade a la **galería de componentes** con todos sus estados (normal, presionado, foco, deshabilitado, cargando, error si aplica).
- **Excepción:** un elemento individual solo se permite con una razón real (es único de una pantalla y no tiene sentido fuera de ella). Márcalo con un comentario `// single-use: <razón>` y si dudas, pregunta (Regla 1).
- La carpeta exacta de los componentes se define en la Fase 0 y queda en `MEMORY.md`.

## 4. Regla 4: animaciones ligeras

Se prefieren detalles de movimiento sutiles que den vida a la interfaz, dentro de los límites del diseño:

- **Sí:** estados al presionar y al enfocar, selección de chips, entrada y salida de hojas y diálogos, cambio de pestaña, aparición de la barra de progreso. Duración de 150 a 200 ms con `ease-out`.
- **Solo `transform` y `opacity`.** Nada que fuerce recalcular el diseño de listas largas.
- **Nunca en el lector** (ni animaciones ambientales, ni decorativas).
- Se respeta `prefers-reduced-motion` y el ajuste equivalente del sistema.
- En la Xiaomi MiBox 4 (2 GB) se miden; si algo se nota lento, se desactiva en TV y se anota en `MEMORY.md`.
- Las animaciones son componentes o hooks compartidos (por ejemplo, un `Pressable` animado), no código repetido en cada pantalla.

## 5. Regla 5: verificar las pantallas con Playwright

Cada pantalla o componente de interfaz se verifica con **Playwright** antes de darse por terminado, comparándolo con su `screen.png`.

**Alcance honesto.** Playwright controla un navegador: sirve para el cliente web y para la galería de componentes cuando corre en web. No controla la app nativa de Android. Cómo verificar la app nativa (por ejemplo, con la galería también compilada para web, o con capturas desde el dispositivo) es una **decisión pendiente**: pregúntala al humano (ver `MEMORY.md`) y mientras tanto no des por verificada una pantalla nativa solo por haber pasado en web.

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

## 6. Reglas de alcance y diseño

- **El SPEC manda sobre la funcionalidad.** Si el diseño muestra algo fuera de la v1, se omite (RF-44) y se anota en `DIFFS.md`.
- **Nunca copies el HTML de `design/stitch/`.** Es referencia de estructura; se traduce a React Native con tokens (SPEC §11.3).
- Ningún hexadecimal ni medida literal fuera de `ui-tokens`. Solo los tokens de SPEC §11.9.
- Datos de ejemplo: un único conjunto de fixtures coherente, con series inventadas y portadas sin texto (`DESIGN_RULES.md` D1 a D5).
- Una etiqueta por concepto, sin tarjetas-mascota ni promesas que la v1 no cumple (`DESIGN_RULES.md`).
- Los textos de la interfaz van al archivo de traducciones; ninguno literal en los componentes.
- Sin telemetría, sin cuentas, sin servicios de terceros, sin CDN.
- Nada se instala de forma automática: toda instalación de módulos pasa por confirmación manual (SPEC §7).

## 7. Calidad y dependencias

- TypeScript en modo estricto. Lint, tipos y pruebas deben pasar antes de dar una tarea por terminada.
- **Desarrollo guiado por pruebas (obligatorio).** Cada tarea empieza por una prueba que **falla** (rojo); después se implementa lo mínimo para pasarla (verde) y se limpia. Si no hay ningún test en rojo, la tarea todavía no ha empezado: **nunca se implementa antes de tener su prueba**. Se avanza por cortes pequeños (rojo → verde) dentro de la misma tarea, verificando la suite en cada corte, y cada tarea termina con su commit.
- Las pruebas del contrato de módulos usan HTML guardado (fixtures), no sitios reales.
- **No añadas dependencias sin preguntar.** Las versiones de Expo, React Native y librerías se fijan en la Fase 0 (Regla 1).
- Dispositivos de prueba: POCO F5 Pro, Galaxy S25 Ultra y Xiaomi MiBox 4 (Android 9, 2 GB), que fija el piso de rendimiento.
- Convenciones por defecto (el humano puede cambiarlas): identificadores de código en inglés, igual que el contrato del SPEC; documentos, mensajes de commit y respuestas al humano en español.

## 8. Lista de cierre de sesión

- [ ] Lint, tipos y pruebas en verde.
- [ ] Pantallas tocadas verificadas con Playwright (o anotado que falta la verificación nativa).
- [ ] Componentes nuevos en la galería; ningún valor literal.
- [ ] Diferencias aceptadas en `design/stitch/DIFFS.md`.
- [ ] Entrada nueva en `MEMORY.md`: qué se hizo, decisiones, siguiente paso.
- [ ] Preguntas sin resolver listadas en `MEMORY.md` y dichas al humano.
