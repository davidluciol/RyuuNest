# IDEA: Lector personal de manga, manhua y cómics (sin anuncios)

> Nombre del proyecto: **RyuuNest**
> Estado: idea afinada, listo para especificar (SPEC.md) y empezar a construir · Hoja de ruta v1 a v3 en la sección 9 · Crítica de diseño aplicada en la sección 16
> Licencia: **GPL-3.0** (copyleft: los derivados también deben ser código abierto) · Proyecto personal

## 1. Problema

Las apps de referencia para leer manga y cómics online dejan de funcionar cuando los sitios cambian o la app deja de mantenerse, y muchos sitios están llenos de anuncios. Quiero una app propia, mantenible por mí, que lea de las fuentes que yo elija y cuyo mantenimiento sea cambiar un módulo, no la app entera.

## 2. Visión

Una app que es solo el **núcleo** (lector, favoritos, progreso, gestor de módulos). Todo lo que sabe de un sitio concreto vive en **módulos** que el usuario instala desde un repositorio cuya URL él mismo añade. Corre **en el dispositivo**, sin servidor propio.

## 3. Alcance de la v1

**Contenido:** manga, manhua y cómics (lectura). Libros y anime quedan para después.

**Plataformas:** Android (APK), Android TV y Web/PWA.

**La v1 está lista cuando se puede:**

1. Buscar y leer un capítulo usando un módulo.
2. Guardar favoritos con carpetas y filtros (tipo, fuente, carpeta, nombre, NSFW/SFW).
3. Guardar y retomar el progreso de lectura por serie.
4. Instalar módulos desde la URL de un repositorio.

## 4. Fuera de la v1 (por ahora)

- Lectura sin conexión / descargas (v2).
- Anime y reproducción de video (v3).
- Libros (EPUB) y cómics locales (CBZ) (v3).
- Noticias de anime (opcional, ver sección 9).
- Sincronización entre dispositivos (v2, ver sección 9).
- Publicación en Github (link al repositorio).

## 5. Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Dónde corre el scraping | En el dispositivo, sin backend propio |
| Stack | Capacitor + React + TypeScript (Vite) |
| Módulos | Mixtos: declarativos (JSON con selectores) y scripts JS en sandbox para casos complejos |
| Distribución de módulos | La app no trae módulos; el usuario añade la URL de un repo |
| Web/PWA | El scraping se hace mediante una extensión de navegador que ejecuta las peticiones |
| NSFW | Etiqueta y filtro, oculto por defecto |
| Sincronización (v2) | Drive/Dropbox del propio usuario; mientras tanto, solo respaldo manual en JSON |
| Distribución de la app | APK directo y PWA, fuera de las tiendas |
| Herramienta de desarrollo con IA | Opencode (Go y Zen) |
| Licencia | GPL-3.0 (copyleft) |
| Sitios con protección anti-bot | Se posponen; sin solución en la v1 (ver sección 11) |

## 6. Arquitectura general

```txt
┌────────────────────────────── App (Capacitor + React) ──────────────────────────────┐
│  UI (móvil / TV / web)   Lector   Favoritos y carpetas   Progreso   Gestor de repos │
│                                    │                                               │
│                          Contrato de módulo (TS)                                    │
│                     ┌──────────────┴───────────────┐                                │
│             Módulo declarativo (JSON)     Módulo script (JS en Worker)              │
│                     └──────────────┬───────────────┘                                │
│                         Capa de red del host                                        │
│      Android/TV: HTTP nativo (sin CORS)     Web: puente a la extensión              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- **Capa de red del host:** los módulos nunca hacen peticiones por su cuenta; piden al host (`host.fetch`), que aplica cabeceras, cookies y permisos.
- **Persistencia local:** propuesta de IndexedDB con Dexie, porque funciona igual en web y en el WebView. Se puede revisar.
- **TV:** navegación por control remoto (D-pad) con una librería de navegación espacial.

## 7. Contrato de módulo (borrador)

```ts
interface SourceModule {
  meta: {
    id: string; name: string; version: string;
    lang: string; nsfw: boolean;
    kind: "manga" | "manhua" | "comic";
    baseUrl: string;
  };
  popular(page: number): Promise<SeriesSummary[]>;
  latest(page: number): Promise<SeriesSummary[]>;
  search(query: string, page: number): Promise<SeriesSummary[]>;
  details(seriesUrl: string): Promise<SeriesDetails>;   // incluye lista de capítulos
  pages(chapterUrl: string): Promise<string[]>;         // URLs de imágenes
}
```

**Módulo declarativo:** describe con selectores CSS dónde está cada dato; el núcleo implementa las funciones.
**Módulo script:** implementa el contrato en JS y solo puede usar la API que le da el host (`host.fetch`, `host.parseHtml`, `host.log`). Declara los dominios a los que necesita acceder.

**Índice del repositorio (`index.json`):** lista de módulos con `id`, `name`, `version`, `kind`, `lang`, `nsfw`, `url` y `sha256` para verificar integridad.

## 8. Modelo de datos (borrador)

- `Source`: módulo instalado (id, versión, repo de origen).
- `Series`: identificada por (`sourceId`, `url`); título, portada, tipo, `nsfw`, `updatedAt`.
- `Favorite`: serie, carpeta, fecha.
- `Folder`: nombre y orden.
- `Progress`: serie, capítulo, página, `updatedAt`.
- `Repo`: URL, nombre y fecha en que se añadió. Se incluye en el respaldo JSON para poder reinstalar los módulos en otro dispositivo.
- `ReadingLog` (v2): una fila por capítulo leído, para el historial y las estadísticas.

Todas las filas llevan `updatedAt` para facilitar la sincronización de la v2.

## 9. Hoja de ruta (v1 a v3 y más allá)

**Cómo leer las estimaciones.** No sé cuántas horas por semana tendrás, así que uso puntos de esfuerzo relativos: **S = 1, M = 3, L = 5, XL = 8**. No son días. La complejidad incluye la incertidumbre técnica, no solo la cantidad de código. Al cerrar la fase 1 de la v1, mide cuántos puntos haces por semana y convierte el resto a calendario. Los puntos son una estimación inicial y se pueden revisar.

**Criterio de orden.** Primero lo que cumple el objetivo inmediato (leer mis mangas). Después lo que permite continuar en otros dispositivos. Al final los medios nuevos, que son lo más caro y arriesgado.

**Regla:** no se empieza una versión sin cerrar la anterior, y cada módulo grande arranca con un SPEC corto.

### v1: Leer (objetivo actual, ≈ 31 puntos)

| Módulo | Complejidad | Puntos |
| --- | --- | --- |
| Contrato de módulo + primer módulo (port de `logicTMO.py`) | L | 5 |
| Lector (vertical y paginado, reanudar donde quedaste) | M | 3 |
| Base local: favoritos, carpetas, filtros, progreso | L | 5 |
| Gestor de repos + módulos declarativos | M | 3 |
| Módulos script en sandbox | L | 5 |
| Empaquetado Android (APK) | S | 1 |
| Adaptación Android TV (D-pad, foco) | M | 3 |
| Web/PWA + extensión de navegador | L | 5 |
| Respaldo manual en JSON (incluye repos) | S | 1 |

### v2: Continuar en cualquier dispositivo (≈ 30 puntos, 33 con Dropbox)

Se entrega en tres etapas, de menos a más complejidad.

| Etapa | Módulo | Complejidad | Puntos | Depende de | Riesgo |
| --- | --- | --- | --- | --- | --- |
| 2.0 | Actualización de módulos (aviso de versión nueva, verificación por hash) | S | 1 | Gestor de repos | Bajo |
| 2.0 | Historial de lecturas (`ReadingLog`) | S | 1 | Modelo de datos | Bajo |
| 2.0 | Temas (Dragon Night + uno alterno) | S | 1 | Tokens de tema | Bajo |
| 2.0 | Búsqueda global entre módulos | M | 3 | Contrato | Bajo |
| 2.0 | Detección de capítulos nuevos en favoritos | M | 3 | `latest()` / `details()` | Medio: en Android depende de tareas en segundo plano; en la PWA solo al abrir |
| 2.1 | Descargas para lectura sin conexión | L | 5 | Lector | Medio: almacenamiento, cola, errores a medias |
| 2.1 | Anti-bot con WebView y cookies | L | 5 | Plugin nativo | Alto: no garantizado y cambia con el tiempo |
| 2.2 | Sincronización con Google Drive (carpeta privada, fusión por `updatedAt`, borrados) | XL | 8 | Modelo de datos, respaldo JSON | Alto: OAuth en tres plataformas y conflictos |
| 2.2 | Inicio de sesión en TV con código de dispositivo | M | 3 | Sincronización | Medio |
| 2.2 | Dropbox (opcional) | M | 3 | Sincronización | Medio |

Si necesitas la TV antes que las descargas, se puede adelantar la etapa 2.2. Mientras tanto, el respaldo JSON de la v1 (con los repos incluidos) cubre el traspaso manual.

### v3: Más medios (≈ 27 puntos)

| Módulo | Complejidad | Puntos | Depende de | Riesgo |
| --- | --- | --- | --- | --- |
| Contrato v2 (tipos `anime` y `book`, episodios, streams) compatible con módulos de la v1 | M | 3 | Contrato | Medio |
| Cómics locales (CBZ y carpetas de imágenes) | M | 3 | Lector | Bajo |
| Libros EPUB | L | 5 | Lector, contrato v2 | Medio |
| Anime base: lista de episodios, extracción de streams, reproductor con progreso por tiempo | XL | 8 | Contrato v2 | Alto: los streams suelen venir en reproductores embebidos y cambian |
| Reproductor en TV (controles para D-pad, foco) | M | 3 | Anime base | Medio |
| Extractores adicionales y subtítulos | L | 5 | Anime base | Alto: mantenimiento continuo |
| Noticias de anime por RSS (opcional, no es un requisito) | S | 1 | Ninguna | Bajo |

### Más adelante: semillas de la sección 14.15

Ninguna entra sin pasar por el filtro de alcance.

| Idea | Complejidad | Depende de |
| --- | --- | --- |
| Crónicas (historial visual de lectura) | S-M | `ReadingLog` (v2) |
| Estadísticas presentadas como "oráculo" | M | `ReadingLog` (v2) |
| Dragón personal con distintas apariencias | M | Arte original |
| Guarida personalizable | M | Temas (v2) |
| Recomendaciones "alquimia" | L | `ReadingLog`; opt-in, sin enviar datos sin consentimiento. Podrían usar un modelo de lenguaje con la clave del propio usuario. |
| Mapa de descubrimiento de géneros | L | Recomendaciones |

### Trazabilidad de los objetivos originales

| Objetivo | Versión |
| --- | --- |
| Ver mangas y manhuas | v1 |
| Ver cómics | v1 (online), v3 (locales) |
| Favoritos con filtros (tipo, fuente, carpeta, nombre, NSFW/SFW) | v1 |
| Módulos que se descargan dinámicamente | v1 |
| Sincronizar favoritos y continuar en la TV | v2 (respaldo JSON en la v1) |
| Leer libros | v3 |
| Ver anime | v3 |
| Noticias de anime | Opcional |

## 10. Orden de construcción sugerido

1. Contrato de módulo + primer módulo portado desde `logicTMO.py` (Python actual), leyendo un capítulo en una pantalla mínima.
2. Base de datos local, favoritos, carpetas, filtros y progreso.
3. Gestor de repos e instalación de módulos (declarativos primero, scripts después).
4. Empaquetado Android y adaptación a TV.
5. Web/PWA y extensión de navegador.

## 11. Riesgos y notas

- **Los sitios cambian o bloquean:** por diseño, arreglar un sitio es actualizar un módulo.
- **Cloudflare y protecciones anti-bot:** los sitios afectados quedan **pendientes**, sin solución en la v1. Ideas para más adelante: Playwright no puede correr dentro de una app Capacitor, pero sirve en escritorio para desarrollar y probar módulos; en el dispositivo la alternativa habitual es abrir el sitio en un WebView, dejar que resuelva el desafío (a veces con ayuda del usuario) y reutilizar sus cookies y User-Agent en las peticiones nativas. Eso requeriría un plugin nativo propio.
- **Extensión y móvil:** Chrome en Android no soporta extensiones (Firefox Android sí); el scraping en la PWA será sobre todo de escritorio.
- **Seguridad de scripts de terceros:** sandbox estricto, permisos por dominio, verificación por hash y aviso al instalar desde un repo desconocido.
- **Legal:** el proyecto no aloja ni incluye contenido ni módulos de sitios concretos; el usuario es responsable de los repos que añade y de respetar los derechos de autor y los términos de cada sitio.
- **TVs económicas:** vigilar el rendimiento del WebView con tiras largas de imágenes (virtualizar).

## 12. Guía para los agentes de IA (Opencode)

- TypeScript en modo estricto; sin `any` salvo justificación.
- Trabajar por fases (sección 10), con cambios pequeños y verificables.
- Escribir primero una especificación corta (SPEC.md) y tests del contrato de módulo antes de portar sitios.
- No agregar módulos de sitios reales al repositorio principal.
- Mantener la lógica del núcleo independiente de la plataforma; lo específico de Android, TV o web va detrás de interfaces.
- Documentar decisiones importantes en `docs/decisions/`.
- La sección 14 es una propuesta de diseño: no se implementa antes de la fase 4. Hasta entonces, la UI usa componentes neutros y **tokens de tema** (variables CSS) para poder aplicar la identidad visual después sin reescribir pantallas.
- Las especificaciones funcionales de UX de la sección 16 (navegación, primer uso, pantalla de serie y lector) sí se aplican desde la v1. Lo que espera es el arte y los extras temáticos.
- Toda cadena visible para el usuario va en un archivo de traducciones, no dentro de los componentes.
- Todo recurso gráfico, fuente o icono de terceros se registra en `ASSETS.md` con su licencia (ver sección 15).

## 13. Preguntas abiertas

- Base de datos definitiva (Dexie/IndexedDB vs. SQLite nativo en Android).
- Formato exacto de los módulos declarativos (cómo expresar paginación, transformaciones de URL y limpieza de texto).
- Sitios con protección anti-bot: decidido posponerlos (sección 11).
- Prioridad real de anime frente a la sincronización: el orden v2/v3 puede invertirse si el anime pesa más que continuar en la TV.
- Cómo introducir repos en la TV sin escribir URLs largas con el control remoto (ver 16.4).

## 14. Dirección visual y experiencia (propuesta)

> **Nota:** Esta sección es una propuesta creativa de interfaz/UX. No modifica las decisiones de arquitectura ni amplía por sí misma el alcance funcional de la v1. La intención es darle identidad al proyecto desde el principio y dejar una guía que pueda convertirse después en SPEC/UI. Las secciones 15 y 16 ajustan esta propuesta; donde difieran, prevalecen 15 y 16.

### 14.1 Idea general

La aplicación debe sentirse como una **guarida digital personal para historias**, no como un simple lector de manga ni como un dashboard administrativo.

La idea visual central es:

**biblioteca fantástica + estética otaku + interfaz moderna + un dragón como mascota/guardián.**

El dragón no debe convertir la aplicación en un RPG. Es principalmente un elemento de identidad, ambientación y personalidad. La arquitectura y los flujos siguen siendo simples y técnicos por debajo.

Concepto de presentación:

> **Tu biblioteca es una guarida. Las historias son tesoros. Las fuentes son portales. El lector es el centro de la experiencia.**

### 14.2 Personalidad visual

Tono deseado:

- Misterioso, aventurero y ligeramente excéntrico.
- Otaku sin caer en una estética excesivamente infantil.
- Fantasía moderna mezclada con UI de software.
- Oscuro por defecto, pero con buena legibilidad.
- El dragón debe sentirse como un personaje recurrente, no como un logo pegado en una esquina.
- Humor ocasional en estados vacíos, errores y pequeños mensajes, sin convertir toda la interfaz en un meme.

Evitar:

- Interfaces recargadas tipo MMORPG.
- Exceso de dorado, pergaminos, texturas y ornamentación.
- Que cada botón tenga temática fantástica si perjudica la usabilidad.
- Gamificación obligatoria.
- Animaciones constantes que distraigan durante la lectura.

### 14.3 Paleta inicial propuesta

Paleta base oscura:

| Uso | Color | Hex aproximado |
| --- | --- | --- |
| Fondo principal | Negro azulado profundo | `#0B0E14` |
| Superficie | Azul carbón | `#141923` |
| Superficie elevada | `#1B2230` |
| Texto principal | Blanco cálido | `#F2F0EA` |
| Texto secundario | Gris azulado | `#9BA5B5` |
| Acento dragón | Verde esmeralda | `#35C98A` |
| Acento fuego | Naranja/ámbar | `#FF9F43` |
| Acento arcano | Violeta | `#9B7BFF` |
| Estado positivo | Verde | `#4DD599` |
| Estado advertencia | Ámbar | `#F5C451` |
| Estado error | Rojo oscuro/coral | `#F06A6A` |

Regla visual sugerida: usar **un color de acento principal** para la interfaz y reservar los demás para estados, categorías o elementos especiales. No convertir la pantalla en un arcoíris.

Posibles temas posteriores:

- **Dragon Night:** oscuro, esmeralda + ámbar.
- **Arcane:** oscuro, violeta + azul.
- **Ember:** oscuro, naranja + rojo.
- **Moon:** oscuro, azul frío + lavanda.

Los temas pueden ser una posibilidad futura, no una necesidad de v1.

### 14.4 Tipografía

Dirección sugerida:

- Interfaz: **Inter**, **Manrope** o una sans-serif equivalente.
- Títulos especiales: una tipografía display con personalidad, usada con moderación.
- Lectura de manga/cómic: no modificar innecesariamente la experiencia del contenido.

Principio: **la fantasía está en la ambientación, no en sacrificar legibilidad.**

### 14.5 Iconografía

Usar una combinación de iconos simples y consistentes, preferentemente mediante una librería SVG:

- Lucide Icons
- Tabler Icons
- Phosphor Icons

Los iconos temáticos del dragón pueden ser SVG propios y aparecer en lugares concretos.

Ejemplos conceptuales:

| Acción | Icono/concepto |
| --- | --- |
| Inicio | 🏰 / casa estilizada |
| Biblioteca | 📚 / estantería |
| Favoritos | 💎 / gema |
| Historial | 📜 / pergamino |
| Buscar | 🔍 |
| Fuentes/repos | 🌀 / portal |
| Configuración | ⚙️ / engranaje |
| Progreso | 🔥 / llama |
| Descubrimiento | 🗺️ / brújula |
| NSFW | 😈/🫦/🍑/🍆/💦/ símbolo discreto de advertencia/etiqueta |
| Dragón | 🐲/🐉/ SVG propio |

Los emojis son únicamente referencias conceptuales. La UI final debería utilizar iconografía consistente, no mezclar emojis arbitrariamente con iconos de interfaz.

### 14.6 Recursos visuales a investigar

Para referencias, inspiración y recursos:

- **Lucide:** <https://lucide.dev/>
- **Tabler Icons:** <https://tabler.io/icons>
- **Phosphor Icons:** <https://phosphoricons.com/>
- **Google Fonts:** <https://fonts.google.com/>
- **Fontsource:** <https://fontsource.org/>
- **unDraw:** <https://undraw.co/illustrations>
- **Storyset:** <https://storyset.com/>
- **OpenGameArt:** <https://opengameart.org/>
- **Kenney:** <https://kenney.nl/assets>
- **SVG Repo:** <https://www.svgrepo.com/>
- **Figma Community:** <https://www.figma.com/community/>
- **Coolors:** <https://coolors.co/>
- **Realtime Colors:** <https://www.realtimecolors.com/>
- **Stitch** Usar MCP con el proyecto RyuuNest Dragon Nest Themed UI

Usar estos sitios como fuentes de inspiración o recursos compatibles con sus respectivas licencias. Para elementos centrales de identidad, considerar SVG/ilustraciones originales del proyecto.

### 14.7 El dragón

El dragón debe tener una silueta sencilla y reconocible para poder aparecer en diferentes tamaños:

1. **Avatar pequeño:** cabeza/silueta.
2. **Mascota:** cuerpo completo sentado, durmiendo o leyendo.
3. **Ilustración de bienvenida:** dragón dentro de la guarida.
4. **Estados vacíos:** diferentes poses.
5. **Errores:** dragón confundido/frustrado.
6. **Carga:** dragón realizando una acción breve.

Dirección artística inicial:

- Dragón pequeño/mediano, no necesariamente imponente.
- Expresivo.
- Algo nerd/curioso.
- Diseño reconocible incluso en monocromo.
- Puede tener pequeños detalles inspirados en libros, pergaminos o cristales.

No definir todavía especie, colores definitivos, cuernos, alas o personalidad exacta. Eso debe explorarse con bocetos antes de fijarlo.

### 14.8 Navegación propuesta

La navegación principal debe seguir siendo funcional y familiar aunque utilice nombres temáticos.

```text
🏰 Guarida
├── 📚 Biblioteca
├── 🔥 Continuar leyendo
├── 💎 Favoritos
├── 🗺️ Descubrir
└── ⚙️ Configuración

📖 Dentro de una serie
├── Información
├── Capítulos
├── Progreso
└── Favorito / Carpeta
```

La terminología temática puede mostrarse como nombre principal o subtítulo, pero nunca debe impedir que el usuario entienda qué hace una sección.

### 14.9 Pantalla principal: Guarida

La pantalla de inicio puede ser el principal elemento diferenciador.

Propuesta:

```text
┌──────────────────────────────────────────┐
│ 🐉  NOMBRE DEL PROYECTO       🔍  ⚙️     │
├──────────────────────────────────────────┤
│                                          │
│        🐉                                │
│   "¿Qué aventura continuamos?"           │
│                                          │
│  🔥 CONTINUAR                            │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Manga  │ │ Manga  │ │ Manga  │       │
│  │  82%   │ │  41%   │ │  17%   │       │
│  └────────┘ └────────┘ └────────┘       │
│                                          │
│  💎 TESOROS                              │
│  Favoritos · Carpetas · Recientes        │
│                                          │
│  🗺️ DESCUBRIR                            │
│  Fuentes · Populares · Últimos capítulos │
│                                          │
└──────────────────────────────────────────┘
```

La pantalla no necesita representar literalmente una habitación en todo momento. Puede usar una composición moderna con pequeñas referencias visuales a una guarida.

### 14.10 Biblioteca

La biblioteca debe priorizar búsqueda, filtros y densidad de información sobre decoración.

Posibles vistas:

- Grid de portadas.
- Lista compacta.
- Vista de carpeta.
- Orden por actividad, nombre, progreso o actualización.

Filtros existentes de v1 deben conservarse: tipo, fuente, carpeta, nombre y NSFW/SFW.

### 14.11 Lector

**El lector es sagrado.**

Cuando el usuario está leyendo, la ambientación debe desaparecer casi por completo.

Prioridades:

1. Imagen del capítulo.
2. Navegación anterior/siguiente.
3. Progreso.
4. Selección de capítulo.
5. Controles mínimos.

El dragón puede aparecer únicamente como un detalle opcional en la UI de controles, nunca encima del contenido.

### 14.12 Estados vacíos y mensajes

Aquí sí se puede usar personalidad.

Ejemplos conceptuales:

- Biblioteca vacía: **"La guarida está vacía. Encuentra tu primera aventura."**
- Sin favoritos: **"Todavía no has reclamado ningún tesoro."**
- Sin resultados: **"El dragón buscó por todas partes y no encontró nada."**
- Error de fuente: **"El portal no responde."**
- Módulo actualizado: **"Portal reparado."**
- Sin progreso: **"Aún no has comenzado esta aventura."**

Mantener estos textos cortos y no bloquear la funcionalidad.

### 14.13 Responsive / Android TV

La estética debe adaptarse a las tres plataformas ya definidas en la v1:

- **Web/PWA:** mayor densidad de información y navegación lateral.
- **Android:** navegación táctil, tarjetas y gestos donde sean útiles.
- **Android TV:** elementos grandes, foco visible y navegación completa mediante D-pad.

La temática visual debe ser compartida, pero no forzar exactamente el mismo layout en las tres plataformas.

### 14.14 Principio de diseño

> **La aplicación debe parecer especial cuando la estás explorando y desaparecer cuando estás leyendo.**

La fantasía pertenece a la navegación, descubrimiento y estados de la aplicación. El lector debe permanecer limpio, rápido y cómodo.

### 14.15 Ideas futuras compatibles con la identidad

Estas ideas NO forman parte de la v1; son semillas para explorar posteriormente:

- Dragón personal con diferentes apariencias.
- Guarida personalizable.
- Mapa de descubrimiento de géneros/obras.
- "Crónicas" con historial de lectura.
- Estadísticas de consumo presentadas como un oráculo.
- Recomendaciones presentadas como "alquimia".
- Anime como una futura sección de "proyecciones".
- Noticias como una futura sección de "rumores".
- Libros como "grimorios".
- Descargas como "expediciones sin conexión".

Estas ideas deben evaluarse individualmente para evitar convertir la aplicación en un RPG innecesario.

## 15. Revisión de consecuencias de la sección 14 (Claude)

La sección 14 es una propuesta creativa aportada por ChatGPT en el rol de diseñador. Esta sección la contrasta con las decisiones técnicas y de alcance. No cancela la idea: fija condiciones para que sea viable.

| Punto de la propuesta | Consecuencia | Condición o ajuste |
| --- | --- | --- |
| El dragón como personaje recurrente (14.7) | Requiere ilustración original en varias poses, y hoy no hay quien la haga. Puede frenar la v1. | La v1 usa una silueta SVG sencilla de marcador. Ninguna pantalla depende del arte final. |
| Recursos de la lista 14.6 | Las licencias son mixtas. Un repositorio GPL-3.0 no debe incluir recursos con licencias no libres o de uso no comercial. | Lucide, Tabler, Phosphor, Inter, Manrope y Kenney son en principio compatibles; OpenGameArt, SVG Repo, Figma Community, unDraw y Storyset dependen de cada recurso o tienen condiciones propias (verificar la licencia vigente). Registrar todo en `ASSETS.md`. El arte original del proyecto puede ir con una licencia aparte (por ejemplo CC BY-SA 4.0). |
| Emojis como iconos (14.5) | Se ven distinto en cada dispositivo y en algunas TV pueden faltar o verse mal. | Solo iconos SVG. Los emojis del documento son referencias. |
| Errores temáticos como "El portal no responde" (14.12) | Ocultan la causa real y complican depurar módulos. | Mensaje temático corto más un detalle técnico desplegable (módulo, URL, código HTTP). |
| Textos con humor (14.12) | Son difíciles de traducir y de mantener. | Cadenas en archivo de traducciones desde el inicio (es/en). |
| Pantalla "Guarida" con "Continuar" (14.9) | La app se distribuye **sin módulos**, así que en el primer uso la pantalla estará vacía. | Diseñar primero el estado inicial: el mensaje de biblioteca vacía debe llevar directamente a "Añadir repositorio". |
| Porcentajes de avance (82 %, 41 %) | Hoy solo se conoce el capítulo y la página, no el total de páginas de toda la serie. | Definir el avance como capítulo actual sobre total de capítulos, o mostrar el último capítulo leído. |
| "Historial" y "Crónicas" (14.5, 14.15) | El modelo de datos guarda solo el último progreso por serie. Un historial necesita una tabla nueva de lecturas. | Fuera de la v1. Si se quiere, se agrega `ReadingLog` en una versión posterior. |
| Animaciones y efectos (14.2, 14.9) | En TVs económicas y WebViews antiguos, las animaciones, sombras y desenfoques pesados hacen lenta la interfaz. | Priorizar SVG estático y CSS simple. Respetar `prefers-reduced-motion`. Nada animado dentro del lector. |
| Android TV (14.13) | Los elementos deben ser grandes, con foco visible y márgenes seguros del televisor. | Probar navegación completa con D-pad antes de pulir visuales. |
| Paleta oscura (14.3) | Contraste calculado: todos los textos y acentos sobre fondo, superficie y superficie elevada pasan WCAG AA. El texto claro sobre botones esmeralda (1.87:1) o violeta (2.76:1) no pasa. | Etiquetas oscuras (`#0B0E14`) sobre fondos de acento. Detalle en la sección 16. |
| Contenido NSFW oculto por defecto | Las portadas pueden verse en la vista de apps recientes o en capturas. | Difuminar portadas NSFW cuando el filtro las oculta y evitar mostrarlas en pantallas de inicio. |
| Nombre con dragón | Muchas apps y proyectos usan nombres parecidos. | Comprobar disponibilidad del nombre y del repositorio antes de fijarlo. |
| Ideas futuras (14.15) | Son tentadoras y pueden inflar el proyecto. | Ninguna entra sin pasar por el mismo filtro de alcance que el resto. |

**Regla para resolver desacuerdos entre diseño y arquitectura:** el alcance de la v1 (sección 3) y las decisiones de la sección 5 mandan. La sección 14 puede cambiar cómo se ve y se siente la app, pero no qué hace en la v1.

## 16. Crítica de diseño y ajustes adoptados

Crítica hecha con el marco de `design-critique`. **Contexto:** aplicación de lectura personal, etapa de exploración, foco en móvil y Android TV. **Limitación:** no hay pantallas dibujadas, así que se critica la propuesta de la sección 14 tal como está descrita; los contrastes sí están calculados. El objetivo es conservar la identidad (guarida, dragón, humor en los estados) y quitar fricción.

### Impresión general

El concepto es coherente y tiene personalidad, y el principio "especial al explorar, invisible al leer" es el correcto. La mayor oportunidad está en la estructura: la navegación tiene más secciones temáticas de las que la v1 necesita, y el **primer uso sin módulos** (el momento en que el usuario decide si la app le sirve) no está diseñado.

### Usabilidad

| Hallazgo | Severidad | Recomendación |
| --- | --- | --- |
| Primer uso: la app no trae módulos, así que la Guarida aparece vacía y el camino hacia "Añadir repositorio" no está diseñado | 🔴 Crítico | Flujo de primer uso de 3 pasos (16.4). Es el mejor lugar para el dragón. |
| Los repos y módulos quedan enterrados en Descubrir o Configuración, aunque sin ellos no hay app | 🔴 Crítico | Sección propia "Fuentes" en la navegación principal. |
| El lector no define modo (vertical o paginado), dirección de lectura, zonas táctiles ni precarga del siguiente capítulo | 🔴 Crítico | Especificación en 16.6. |
| Escribir una URL de repo con el control remoto de la TV es muy incómodo | 🔴 Crítico (TV) | El respaldo JSON incluye los repos; importar por archivo o enlace corto. Con la sincronización de la v2 se resuelve. |
| "Biblioteca" y "Favoritos" son lo mismo en la v1 (solo hay series guardadas) | 🟡 Moderado | Una sola sección "Biblioteca" con chips: Todo · Leyendo · Carpetas. |
| "Continuar leyendo" como pestaña duplica la sección "Continuar" de la Guarida | 🟡 Moderado | Quitar la pestaña; vive en Inicio. |
| La pantalla de serie tiene cuatro pestañas (Información, Capítulos, Progreso, Favorito) | 🟡 Moderado | Una sola pantalla con botón principal "Continuar cap. N" (16.5). Favorito es un icono, no una pestaña. |
| Cinco filtros a la vez no caben en un móvil | 🟡 Moderado | Búsqueda por nombre siempre visible; chips para tipo y carpeta; hoja de filtros para fuente y NSFW/SFW. |
| Descubrir obliga a elegir un módulo antes de ver contenido | 🟡 Moderado | Recordar el último módulo usado y mostrar chips de fuente. La búsqueda global llega en la v2. |
| El porcentaje en las tarjetas (82 %) no tiene un cálculo definido | 🟢 Menor | Mostrar "Cap. 41 · pág. 12" y una barra fina de avance por capítulos. |

### Jerarquía visual

- **Qué atrae primero:** el dragón con el saludo, por su tamaño. No es lo correcto: debería ser la tarjeta "Continuar".
- **Flujo de lectura:** encabezado, dragón, Continuar, Tesoros, Descubrir. El orden es bueno, pero Tesoros y Descubrir son solo texto; deben mostrar filas horizontales de portadas.
- **Énfasis:** las portadas son el contenido y deben ser lo más brillante de la pantalla. El dragón usa colores más apagados para no competir con ellas. Esmeralda para acción principal y foco, ámbar solo para progreso, violeta fuera de la v1.

### Consistencia

| Elemento | Problema | Recomendación |
| --- | --- | --- |
| Terminología | Un mismo concepto tiene varios nombres (Tesoros, Favoritos, Reclamado; Portal, Fuente, Módulo, Repo) | Glosario único (16.1). |
| Iconografía | Los mockups mezclan emojis con iconos de interfaz | Solo Lucide más el dragón SVG en pocos lugares (16.8). |
| Color de acento | Tres acentos más los estados invitan al arcoíris | Roles fijos: esmeralda = acción y foco, ámbar = progreso, violeta = tema alterno. |
| Tipografía | La fuente display no está definida | Una sola fuente display para títulos de pantalla y estados vacíos; Inter o Manrope para todo lo demás. |
| Layouts por plataforma | Se pide adaptar sin definir qué se comparte | Tokens compartidos y tres densidades: compacta (web), cómoda (móvil), TV (16.7). |

### Accesibilidad

- **Contraste (calculado, WCAG):**
  - Texto principal sobre fondo, superficie y superficie elevada: 16,95 · 15,45 · 13,98. Pasa AA y AAA.
  - Texto secundario `#9BA5B5`: 7,77 · 7,08 · 6,41. Pasa AA en las tres; AAA solo en las dos primeras.
  - Esmeralda 7,49 a 9,08; ámbar 7,81 a 9,47; violeta 5,06 a 6,14; error 5,29 a 6,42. Todos pasan AA como texto o icono.
  - **Falla:** texto claro sobre botón esmeralda (1,87) o violeta (2,76). Regla: etiquetas oscuras `#0B0E14` sobre fondos de acento (9,08 sobre esmeralda, 9,47 sobre ámbar, 6,14 sobre violeta).
  - El color nunca es el único indicador: los estados llevan icono y texto.
- **Áreas táctiles:** mínimo 48 × 48 dp en móvil. En TV, foco siempre visible con un anillo grueso, sin depender solo del color.
- **Legibilidad:** cuerpo de al menos 16 px en móvil y escala tipográfica mayor en TV, con márgenes seguros de pantalla.
- **Otros:** los botones que solo tienen icono llevan etiqueta accesible, las portadas llevan el título como texto alternativo, se respeta `prefers-reduced-motion` y el lector ofrece botones además de gestos.

### Lo que funciona bien

- El principio de que la fantasía desaparece en el lector.
- La lista de cosas a evitar (MMORPG, gamificación obligatoria, animaciones constantes).
- El humor limitado a estados vacíos, errores y mensajes cortos.
- La paleta oscura tiene contraste sólido en casi todos sus usos.
- Pedir layouts distintos por plataforma en lugar de estirar uno.
- Las ideas futuras están marcadas como semillas, no como alcance.

### Prioridades

1. **Diseñar el primer uso.** Es la pantalla que decide si la app se entiende, y es donde el dragón más aporta.
2. **Simplificar la navegación** a cinco secciones con nombres funcionales y subtítulo temático.
3. **Especificar el lector**, incluida su versión para TV, porque ahí se pasa el 90 % del tiempo.

### 16.1 Glosario

Nombre funcional primero; el temático aparece como subtítulo o en microcopy.

| Concepto | Nombre en la interfaz | Toque temático |
| --- | --- | --- |
| Pantalla de inicio | Inicio | Guarida |
| Series guardadas y carpetas | Biblioteca | Tesoros |
| Explorar contenido de las fuentes | Descubrir | Exploración |
| Repositorios y módulos | Fuentes | Portales |
| Retomar lectura | Continuar | "Continuar la aventura" |
| Repositorio (URL técnica) | Repositorio | Sin tema |
| Un módulo instalado | Módulo | "Portal" solo en textos cortos |

### 16.2 Navegación

`Inicio · Biblioteca · Descubrir · Fuentes · Ajustes`

- Móvil: barra inferior con cinco iconos y etiqueta.
- Web: barra lateral, que admite más densidad.
- TV: riel lateral izquierdo con foco, sin barra inferior.

### 16.3 Inicio

```text
┌────────────────────────────────────────┐
│ 🐉(avatar)  Buenas noches         🔍   │   ← encabezado compacto
├────────────────────────────────────────┤
│ CONTINUAR LA AVENTURA                  │
│ ┌──────────────────────────────────┐   │
│ │ [portada]  Título                │   │   ← tarjeta grande, un toque
│ │            Cap. 41 · pág. 12  ▶  │   │     abre en la página exacta
│ └──────────────────────────────────┘   │
│ Recientes  [▭][▭][▭][▭] →              │
│ Tesoros    [▭][▭][▭][▭] →              │
│ Descubrir  [▭][▭][▭][▭] →              │
└────────────────────────────────────────┘
```

- El saludo y el dragón ocupan una sola línea. La ilustración grande queda para el primer uso y los estados vacíos.
- Si no hay lectura en curso, la primera tarjeta cambia a "Empieza algo nuevo" y lleva a Descubrir.
- Las filas de Descubrir solo aparecen si hay al menos un módulo instalado.

### 16.4 Primer uso

1. **Bienvenida:** dragón grande, una frase y un botón "Empezar". Explica en una línea que la app no trae fuentes y que las añades tú.
2. **Añadir repositorio:** un campo de URL con botón de pegar desde el portapapeles, o "Importar respaldo" para traer repos, favoritos y progreso desde un JSON.
3. **Instalar un módulo:** lista del repo con interruptor por módulo. Al terminar, botón "Ir a leer" que lleva a Descubrir.

En TV, el paso 2 prioriza "Importar respaldo" y un enlace corto; el teclado en pantalla es el último recurso.

### 16.5 Pantalla de serie

```text
┌────────────────────────────────────────┐
│ ←                            ♥  ⋯      │
│ [portada]  Título                      │
│            Tipo · Fuente · Estado      │
│ [ Continuar cap. 41 ]  (botón principal)│
│ Descripción (colapsada, "ver más")     │
│ Capítulos            ↑↓ orden   ⌖ ir al último leído │
│ ✓ Cap. 40                              │
│ ● Cap. 41  (en curso)                  │
│ ○ Cap. 42                              │
└────────────────────────────────────────┘
```

- Capítulos leídos con marca, capítulo en curso destacado en ámbar.
- Si no hay progreso, el botón principal dice "Empezar".
- La carpeta se elige desde el menú "⋯" o al mantener pulsado el corazón.

### 16.6 Lector

- **Modos:** vertical continuo y paginado. Predeterminado por tipo: manhua en vertical, manga paginado de derecha a izquierda, cómic paginado de izquierda a derecha. Se puede cambiar y se recuerda **por serie**.
- **Zonas táctiles:** izquierda, centro y derecha. El centro muestra u oculta los controles. Las zonas laterales se invierten en modo derecha a izquierda.
- **Progreso:** se guarda al cambiar de página (con retraso corto) y al salir. Al reabrir, vuelve a la página exacta.
- **Fin de capítulo:** tarjeta "Siguiente capítulo" y precarga de las primeras imágenes del siguiente mientras se lee el final.
- **Controles mínimos:** cerrar, título, selector de capítulo, modo de lectura. Sin dragón encima del contenido.
- **Zoom** con pellizco; pantalla encendida mientras se lee.
- **TV:** arriba y abajo desplazan (vertical) o cambian de página, izquierda y derecha cambian de página, OK muestra u oculta los controles, Atrás sale. Los controles son grandes y el foco es visible.
- **Errores de imagen:** botón de reintento por imagen y mensaje con el detalle técnico desplegable.

### 16.7 Tokens y densidades

- **Espaciado:** escala base de 4 px; radios y elevaciones definidos una sola vez como variables CSS.
- **Densidades:** compacta (web), cómoda (móvil) y TV (elementos más grandes, márgenes seguros, foco marcado).
- **Movimiento:** transiciones cortas y sencillas; ninguna animación continua fuera de estados de carga breves; nada animado en el lector.

### 16.8 Dónde aparece el dragón

| Pantalla o estado | Dragón | Tamaño |
| --- | --- | --- |
| Marca en el encabezado | Avatar (cabeza o silueta) | Pequeño |
| Primer uso | Ilustración de bienvenida | Grande |
| Biblioteca vacía | Pose con libro o tesoro | Mediano |
| Sin resultados | "Buscó por todas partes" | Mediano |
| Error de portal | Confundido, con detalle técnico desplegable | Mediano |
| Carga breve | Acción corta | Pequeño |
| Todo al día (v2, capítulos nuevos) | Dormido | Mediano |
| Lector | Ninguno | (no aparece) |
