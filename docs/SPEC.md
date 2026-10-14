# SPEC: RyuuNest

> Lector personal y de código abierto de manga, manhua y cómics, con módulos de scraping que se instalan como paquetes.
> Estado: borrador para revisión · Octubre 2026
> Documentos relacionados: `IDEA.md` (visión y hoja de ruta) · `DESIGN.md` (sistema de diseño «Dragon Night») · `DESIGN_RULES.md` (reglas contra el diseño genérico) · `design/stitch/` (7 pantallas exportadas: `screen.png` y `code.html` por pantalla) · `AGENTS.md` (reglas para agentes) · `MEMORY.md` (decisiones e hitos)
> Licencia: GPL-3.0

**Cómo leer este documento.** Los requisitos llevan prioridad **M** (debe), **S** (debería) o **C** (podría). Los números de rendimiento son **objetivos a validar** con mediciones en los dispositivos reales, no promesas. Las versiones exactas de Expo, React Native y librerías se fijan en la Fase 0 y no se inventan aquí.

**Orden de autoridad.** Si dos documentos se contradicen: (1) este SPEC manda sobre **qué** hace la app; (2) `DESIGN_RULES.md` sobre qué se toma del diseño y cómo se usa el color; (3) `DESIGN.md` sobre **cómo se ve** cada componente; (4) los PNG de `design/stitch/` sobre la composición; (5) los HTML solo como referencia; (6) `IDEA.md` es contexto. El PRD y la especificación visual anteriores se eliminaron del repo por contradecir este SPEC. Detalle en la sección 11.1.

---

## 1. Resumen

### 1.1 Problema

Las apps de lectura que usaba el autor dejan de funcionar cuando los sitios cambian o la app deja de mantenerse, y los sitios están llenos de anuncios.

### 1.2 Solución

RyuuNest es solo el **núcleo**: lector, biblioteca, progreso y gestor de paquetes. Todo lo que sabe de un sitio concreto vive en **módulos** que el usuario instala desde repositorios cuya URL añade él mismo. El scraping corre en el dispositivo, sin servidor propio.

### 1.3 Objetivos de la v1

1. Buscar y leer capítulos con módulos instalados.
2. Organizar miles de series favoritas con carpetas y filtros.
3. Guardar el progreso y retomar la lectura en la página exacta.
4. Instalar módulos desde la URL de un repositorio, con verificación de integridad.
5. Funcionar en Android, Android TV y web (con extensión de navegador).

### 1.4 Fuera de la v1

Sincronización entre dispositivos (v2), descargas sin conexión (v2), anime, libros EPUB, cómics locales y noticias (v3 o después), contador de no leídos y filtro «Completado» (v2), temas alternos (pregunta abierta 7), iOS, publicación en tiendas y cualquier servidor propio. La hoja de ruta completa está en `IDEA.md`, sección 9.

### 1.5 Usuarios y contexto

- Autor y primer usuario: lector intensivo con miles de series.
- Comunidad pública con contribuciones: exige documentación del SDK, API estable y políticas claras (sección 15).
- Un usuario por instalación; sin cuentas ni backend.

### 1.6 Cambios respecto a `IDEA.md`

- Stack: **React Native (Expo)** en lugar de Capacitor; la web pasa a ser un **cliente separado** que comparte el núcleo.
- Los módulos se distribuyen como **paquetes `.zip`** con manifest y hash.
- Se añade la tabla `chapter_read` en la v1 para marcar capítulos leídos; el historial de la v2 se apoya en ella.
- Un capítulo puede tener varias **versiones de publicación** (por ejemplo, distintos grupos), porque el código de referencia (`logicTMO.py`) ya las maneja.
- El diseño pasa de propuesta a **fuente de verdad**: `DESIGN.md` y `design/` (sección 11). Los wireframes ASCII solo se conservan para las pantallas que no tienen diseño.
- Se añade `progress.page_total`, necesario para la barra de progreso y el porcentaje del capítulo en curso que muestra el diseño.
- Se añade el tipo `manhwa` al contrato (D-13): el diseño filtra por Manga, Manhwa y Cómic.
- Nueva **Fase 6a** (sistema de diseño y galería de componentes) antes de las pantallas; el total sube a 49 puntos.

---

## 2. Criterios de aceptación de la v1

| ID | Criterio | Objetivo medible |
|---|---|---|
| AC-1 | Instalar sin módulos y completar el primer uso | El flujo guía hasta añadir un repo y activar un módulo |
| AC-2 | Instalar un paquete desde un repo | Un hash incorrecto o un manifest inválido se rechaza con mensaje claro |
| AC-3 | Buscar y leer un capítulo con un módulo real | Tras cerrar y reabrir la app, el lector vuelve a la página exacta |
| AC-4 | Filtros sobre biblioteca grande | Con 3 000 series sintéticas, filtrar o buscar responde en < 300 ms en el POCO F6 Pro y < 1 s en la MiBox 4 |
| AC-5 | Capacidad de módulos | Con 5 módulos sintéticos instalados, el arranque y la memoria se mantienen dentro de los objetivos RNF-1 y RNF-2 |
| AC-6 | Lector en el equipo más limitado | Un capítulo vertical de 60 imágenes se lee completo en la MiBox 4 sin cierres por memoria |
| AC-7 | Respaldo JSON | Exportar e importar reproduce biblioteca, carpetas, progreso y repos sin pérdidas |
| AC-8 | Instalación solo con confirmación | Ningún enlace profundo, importación de respaldo ni intent instala algo sin confirmación manual |
| AC-9 | TV | Todas las pantallas de la v1 se usan solo con el control remoto (D-pad), con anillo de foco visible (2 px `accent`, separación de 2 px) |
| AC-10 | Web | Con la extensión instalada, se lee un capítulo desde el navegador |
| AC-11 | Calidad | CI en verde: lint, tipos estrictos, pruebas del contrato y compilación del APK |
| AC-12 | Fidelidad al diseño | Cada pantalla de la v1 que tiene diseño se compara en el POCO F6 Pro con su `screen.png` usando la lista del apéndice B; no hay diferencias de color, tipografía, radio ni espaciado, y el resto se registra en `design/stitch/DIFFS.md` |
| AC-13 | Reglas del sistema de diseño | Una prueba automática verifica que `ui-tokens` coincide con `DESIGN.md`, que los pares de color usados cumplen WCAG AA y que ningún relleno de acento lleva texto claro; el lint rechaza colores y medidas literales en `apps/*` |

---

## 3. Requisitos funcionales

### 3.1 Fuentes, repositorios y módulos

- **RF-1 (M)** La app se instala **sin módulos**. Mientras no haya ninguno, las pantallas muestran el estado vacío que lleva a "Añadir repositorio".
- **RF-2 (M)** Añadir un repositorio por URL HTTPS. La app descarga y valida `index.json` y lo guarda como `repo`.
- **RF-3 (M)** Listar los módulos de un repo con nombre, tipo, idioma, marca NSFW, runtime (declarativo o script) y permisos.
- **RF-4 (M)** Instalar un módulo con el flujo de la sección 7, con confirmación manual.
- **RF-5 (M)** Activar, desactivar y desinstalar módulos. Mostrar el último error de cada módulo.
- **RF-6 (M)** Actualizar un módulo manualmente. Si la actualización amplía permisos o cambia de declarativo a script, vuelve a pedir confirmación.
- **RF-7 (S)** "Protección de instalación": exigir el bloqueo del dispositivo (PIN o biometría) para añadir repos o instalar módulos script.
- **RF-8 (M)** Eliminar un repo no desinstala sus módulos, pero se avisa de que ya no recibirán actualizaciones.

### 3.2 Descubrir y buscar

- **RF-9 (M)** Pantalla Descubrir con selector de módulo (se recuerda el último) y filas `popular` y `latest` si el módulo las ofrece.
- **RF-10 (M)** Búsqueda por texto dentro del módulo seleccionado, con paginación.
- **RF-11 (M)** Errores de módulo mostrados con mensaje temático breve y detalle técnico desplegable (módulo, URL, código, selector).
- **RF-12 (C)** Búsqueda en todos los módulos a la vez (v2).

### 3.3 Pantalla de serie

- **RF-13 (M)** Mostrar portada, título, tipo, fuente, estado, descripción colapsable, géneros y títulos alternativos.
- **RF-14 (M)** Botón principal "Continuar cap. N" o "Empezar" según haya progreso.
- **RF-15 (M)** Lista de capítulos con marca de leído, capítulo en curso, orden ascendente o descendente y salto al último leído. Tres estados visuales (sin leer, en curso con porcentaje, completado) según `DESIGN.md`; el porcentaje sale de `page_index / page_total`.
- **RF-16 (M)** Si un capítulo tiene varias versiones de publicación, elegir una; recordar la preferida por serie.
- **RF-17 (M)** Favorito con un toque; elegir carpeta desde el menú o al mantener pulsado.

### 3.4 Lector

- **RF-18 (M)** Dos modos: **vertical continuo** y **paginado**. Predeterminado por tipo: manhua y manhwa vertical, manga paginado de derecha a izquierda, cómic paginado de izquierda a derecha. El modo se recuerda **por serie**.
- **RF-19 (M)** Zonas táctiles izquierda, centro y derecha; el centro muestra u oculta los controles; las laterales se invierten en derecha a izquierda.
- **RF-20 (M)** Guardar el progreso al cambiar de página (con retraso corto) y al salir, junto con el total de páginas del capítulo. Reabrir lleva a la página exacta.
- **RF-21 (M)** Al final del capítulo, tarjeta "Siguiente capítulo" y precarga de sus primeras imágenes.
- **RF-22 (M)** Controles mínimos: cerrar, título, selector de capítulo, modo de lectura. Nada decorativo sobre el contenido: barras superior e inferior con fondo `elevated` al 95 % y borde `border`, sin marca, sombras ni mascota.
- **RF-23 (M)** Zoom con pellizco, pantalla encendida mientras se lee y reintento por imagen con detalle técnico del error.
- **RF-24 (M)** Las imágenes se piden con las cabeceras que indique el módulo (`Referer`, `User-Agent`), porque muchos sitios bloquean enlaces directos.
- **RF-25 (M)** En TV: arriba y abajo desplazan o cambian de página, izquierda y derecha cambian de página, OK muestra u oculta los controles, Atrás sale.

### 3.5 Biblioteca, carpetas y filtros

- **RF-26 (M)** Biblioteca única de favoritos con búsqueda por nombre siempre visible y chips: Todo · Leyendo · Carpetas (confirmado por la captura de Biblioteca; «Completado» queda para la v2).
- **RF-27 (M)** Filtros por tipo, fuente, carpeta y NSFW/SFW. Chips para tipo y carpeta; hoja de filtros para fuente y NSFW.
- **RF-28 (M)** Ordenar por nombre, último leído y fecha de adición.
- **RF-29 (M)** Crear, renombrar, reordenar y borrar carpetas. Un favorito pertenece a una carpeta o a ninguna (decisión D-12).
- **RF-30 (M)** Quitar un favorito no borra su progreso.

### 3.6 Progreso

- **RF-31 (M)** Un registro de progreso por serie: capítulo, versión de publicación y página.
- **RF-32 (M)** Marcar capítulos leídos (tabla `chapter_read`), manualmente o al terminar el capítulo.
- **RF-33 (M)** Inicio muestra "Continuar" con la lectura más reciente y una fila de recientes.

### 3.7 NSFW

- **RF-34 (M)** Interruptor global "Mostrar contenido NSFW", **apagado por defecto**.
- **RF-35 (M)** Apagado, el contenido NSFW no aparece en Inicio, Biblioteca ni Descubrir. Un módulo NSFW no aparece en el selector.
- **RF-36 (M)** Las portadas NSFW se difuminan cuando se muestran en listas con el interruptor encendido y en la vista de apps recientes del sistema.

### 3.8 Respaldo y ajustes

- **RF-37 (M)** Exportar un respaldo JSON (sección 8.3) a un archivo y compartirlo.
- **RF-38 (M)** Importar un respaldo: validar el esquema, fusionar por `updated_at` o reemplazar. Los módulos y repos del respaldo **no se instalan solos**; se muestran en una lista para confirmar uno por uno.
- **RF-39 (M)** Ajustes: idioma de la interfaz, NSFW, protección de instalación, modo de lectura predeterminado, gestión de caché.
- **RF-40 (M)** Interfaz en español; las cadenas viven en un archivo de traducciones desde el inicio para añadir inglés después.

### 3.9 Requisitos que nacen del diseño

- **RF-41 (S)** Barra de progreso de 3 px en el borde inferior de la portada de una serie con capítulo en curso, rellena con `progress`. Porcentaje = `page_index / page_total` del progreso guardado.
- **RF-42 (C)** Contador de no leídos y filtro «Completado» (v2): requieren conocer el total de capítulos y refrescarlo en segundo plano. El diseño los muestra y la v1 los omite (`DESIGN_RULES.md` §4).
- **RF-43 (M)** Ningún estado (completado, en curso, fallido, bloqueado) depende solo del color: lleva icono SVG y texto.
- **RF-44 (M)** Las pantallas de la v1 se construyen siguiendo las secciones 11.1 a 11.4. Lo que un diseño muestre fuera del alcance de la v1 (descargas, sincronización, noticias, anime, cuentas, estadísticas, notificaciones) **se omite**; no se deja como botón muerto. Lista de referencia: `DESIGN_RULES.md` §4.

---

## 4. Requisitos no funcionales

| ID | Requisito | Objetivo (a validar) |
|---|---|---|
| RNF-1 | Arranque en frío hasta pantalla útil | < 3 s en POCO F6 Pro; < 8 s en MiBox 4 |
| RNF-2 | Memoria del proceso | Sin cierres por memoria en la MiBox 4 (2 GB) leyendo 60 imágenes seguidas; presupuesto medido y registrado en la Fase 0 |
| RNF-3 | Fluidez | Desplazamiento de listas sin pérdidas visibles de cuadros en el teléfono; en TV, navegación con foco sin retrasos perceptibles |
| RNF-4 | Almacenamiento | Caché de imágenes con tope configurable (por defecto menor en TV) y botón para vaciarla |
| RNF-5 | Privacidad | Sin telemetría, sin cuentas, sin servicios de terceros; los datos solo salen del dispositivo por exportación manual. Fuentes e iconos van empaquetados: nunca se cargan desde un CDN (tampoco en la web) |
| RNF-6 | Seguridad | Modelo de la sección 7; nada se instala sin confirmación |
| RNF-7 | Accesibilidad | Contraste WCAG AA; áreas táctiles de al menos 48 × 48 dp (con `hitSlop` cuando el elemento visible es menor, como los chips de 36 px o las insignias de 24 px); etiquetas accesibles en botones con icono; estados nunca solo por color; `prefers-reduced-motion` |
| RNF-8 | Resiliencia | Un módulo roto, lento o bloqueado no tumba la app: tiempo límite, errores contenidos y reintento manual |
| RNF-9 | Compatibilidad | Ver sección 14 |
| RNF-10 | Mantenibilidad | TypeScript en modo estricto, núcleo sin dependencias de plataforma y cobertura del contrato con pruebas |
| RNF-11 | Internacionalización | Todas las cadenas externalizadas; fechas y números con formato local |
| RNF-12 | Coherencia visual | Todo valor visual sale de `ui-tokens` (derivado de `DESIGN.md`). Cero sombras difusas y cero `backdrop-filter`: la profundidad se logra con escalones de superficie, lo que además protege el rendimiento en la MiBox 4 |

---

## 5. Arquitectura

### 5.1 Estructura del monorepo

```text
ryuunest/
  packages/core         TS puro: contrato, runtimes, instalador, biblioteca, lector (estado)
  packages/module-sdk   tipos públicos, validador de manifest, CLI y plantilla de módulos
  packages/ui-tokens    tokens derivados de DESIGN.md (colores, tipografía, espaciado, radios)
  apps/mobile           React Native (Expo) para móvil y variante TV
  apps/web              React + Vite + puente a la extensión
  apps/extension        extensión de navegador (realiza las peticiones de la web)
  docs/                 decisiones (ADR), guía de módulos, CONTRIBUTING
  assets/placeholder/   marcadores temporales (ver sección 12)
  DESIGN.md             sistema de diseño Dragon Night: tokens y componentes
  DESIGN_RULES.md       reglas contra el diseño genérico (se leen antes de tocar una pantalla)
  design/stitch/        pantallas exportadas (<pantalla>/screen.png y code.html) y DIFFS.md
  design/themes/        DESIGN.md de otros temas (referencia futura, no se implementan)
  AGENTS.md             reglas para quien trabaje en el repo (humano o agente)
  MEMORY.md             decisiones, elecciones e hitos; se actualiza en cada sesión
```

### 5.2 Diagrama lógico

```text
┌──────────── UI (mobile / TV / web) ────────────┐
│  Inicio · Biblioteca · Descubrir · Fuentes · Lector │
└───────────────────┬─────────────────────────────┘
                    │ casos de uso
┌───────────────────▼─────────────────────────────┐
│ core                                             │
│  Library · Progress · Reader state · Backup      │
│  PackageInstaller · ModuleRegistry · ModuleHost  │
│        ├─ DeclarativeRuntime                     │
│        └─ ScriptRuntime (interfaz ModuleRuntime) │
└───────┬───────────┬───────────┬───────────┬──────┘
   Storage      Http         Archive      Clock      ← puertos (adaptadores por plataforma)
 SQLite/IDB   nativo/ext.     unzip        reloj
```

### 5.3 Puertos

| Puerto | Móvil y TV | Web |
|---|---|---|
| `Storage` | SQLite | IndexedDB |
| `Http` | Cliente nativo (sin CORS) | Mensajes a la extensión |
| `Archive` | Descompresión `.zip` en JS | Igual |
| `SecureLock` (opcional) | Autenticación del dispositivo | No disponible |

### 5.4 Decisiones de arquitectura

| ID | Decisión | Alternativas descartadas |
|---|---|---|
| D-1 | Monorepo con núcleo TS puro | Todo dentro de la app móvil |
| D-2 | React Native (Expo) con variante TV | Capacitor; Flutter |
| D-3 | Cliente web separado | React Native Web |
| D-4 | Módulos en dos niveles (declarativo y script) | Solo scripts; solo declarativos |
| D-5 | Script con confianza total en la v1, tras interfaz `ModuleRuntime` | Motor aislado desde el inicio (se deja como mejora futura) |
| D-6 | Paquete `.zip` con manifest y hash | Archivo único; paquetes npm |
| D-7 | SQLite en móvil e IndexedDB en web | Almacén de documentos |
| D-8 | Sin servidor ni cuentas | Backend gestionado |
| D-9 | Android 9 como mínimo (para cubrir la MiBox 4), pruebas principales en Android 12 a 15 | Mínimo Android 12 (dejaría fuera la TV) |
| D-10 | Respaldo JSON en la v1; sincronización en la v2 | Sincronización desde la v1 |
| D-11 | Licencia GPL-3.0 | MIT; Apache-2.0 |
| D-12 | Un favorito pertenece a **una** carpeta o a ninguna | Varias carpetas por favorito (se reevalúa si hace falta) |
| D-13 | Tipos de obra: manga, manhua, manhwa y cómic | Quitar manhua porque el diseño no lo muestra (pregunta abierta 8) |

---

## 6. Contrato de módulo (API v1)

### 6.1 Manifest

```ts
export type MediaKind = "manga" | "manhua" | "manhwa" | "comic";  // manhwa añadido por el diseño (D-13)

export interface ModuleManifest {
  id: string;                    // [a-z0-9-], único dentro del repo
  name: string;
  version: string;               // semver del módulo
  apiVersion: 1;                 // versión del contrato que implementa
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;                  // BCP 47: "es", "en"
  nsfw: boolean;                 // el módulo completo es NSFW
  baseUrl: string;
  capabilities: Array<"popular" | "latest" | "search">;
  permissions: { domains: string[] };   // dominios a los que puede llamar
  entry: string;                 // archivo de entrada dentro del paquete
  minAppVersion?: string;
  author?: string;
  homepage?: string;
  license?: string;
}
```

### 6.2 Tipos de datos

```ts
export interface Page<T> { items: T[]; hasNext: boolean }

export interface ImageRef { url: string; headers?: Record<string, string> }

export interface SeriesSummary {
  id: string;            // estable y relativo al sitio (p. ej. una ruta), no una URL absoluta
  title: string;
  cover?: ImageRef;
  kind?: MediaKind;
  nsfw?: boolean;
  badges?: string[];     // etiquetas cortas ("Seinen", "★ 8.1")
  hint?: string;         // texto secundario ("hace 2 h · Grupo X")
}

export interface Release { id: string; group?: string; publishedAt?: string /* ISO */ }

export interface Chapter {
  id: string;
  title: string;
  number?: number;
  releases: Release[];   // al menos una
}

export interface SeriesDetails extends SeriesSummary {
  description?: string;
  genres: string[];
  status: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  altTitles: string[];
  extra: Record<string, string>;
  chapters: Chapter[];   // más nuevo primero por defecto
}

export interface ChapterPages { title?: string; images: ImageRef[] }
```
**Por qué `id` relativo:** los sitios cambian de dominio. Si el identificador fuera una URL absoluta, cada cambio rompería favoritos y progreso. La clave de una serie en la app es `(moduleId, series.id)`.

### 6.3 Interfaz

```ts
export interface ModuleApi {
  popular?(page: number): Promise<Page<SeriesSummary>>;
  latest?(page: number): Promise<Page<SeriesSummary>>;
  search(query: string, page: number): Promise<Page<SeriesSummary>>;
  details(seriesId: string): Promise<SeriesDetails>;
  pages(chapterId: string, releaseId: string): Promise<ChapterPages>;
}
```

### 6.4 Errores

```ts
export type ModuleErrorCode =
  | "NETWORK" | "TIMEOUT" | "BLOCKED" | "RATE_LIMITED"
  | "NOT_FOUND" | "PARSE" | "UNSUPPORTED" | "INTERNAL";

export class ModuleError extends Error {
  code: ModuleErrorCode;
  details?: { url?: string; status?: number; selector?: string };
}
```
`BLOCKED` identifica protecciones anti-bot. En la v1 se informa al usuario y no se intenta resolver (ver sección 17).

### 6.5 API del host para módulos script

```ts
export interface Host {
  fetch(url: string, init?: HostRequestInit): Promise<HostResponse>;  // permisos de dominio, tiempo límite y límite de concurrencia
  html(text: string): HtmlDocument;     // API de selectores CSS tipo jQuery
  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void;
  settings: { get(key: string): string | undefined; set(key: string, value: string): void };
}

// Un módulo script exporta una fábrica:
export default function create(host: Host): ModuleApi;
```
El host aplica por defecto un tiempo límite por petición, un máximo de peticiones simultáneas por módulo y una pausa mínima entre peticiones al mismo dominio.

### 6.6 Módulos declarativos (borrador)

Un módulo declarativo describe con selectores CSS dónde está cada dato; el núcleo implementa la API. Ejemplo reducido:
```json
{
  "search": {
    "url": "{baseUrl}/library?title={query}&pg={page}",
    "list": "div.element",
    "fields": {
      "id":    { "selector": "a", "attr": "href", "transform": ["path"] },
      "title": { "selector": "h4.text-truncate", "transform": ["trim"] },
      "cover": { "selector": "style", "regex": "url\\(['\"](.*?)['\"]\\)" }
    },
    "hasNext": { "selector": "a[rel=next]", "exists": true }
  }
}
```
Transformaciones previstas: `trim`, `path`, `absoluteUrl`, `regex`, `number`, `join`, `replace`. Cuando un sitio necesita más que esto (redirecciones, lógica condicional), se escribe como módulo script. El formato completo se cierra en un SPEC propio durante la Fase 3.

### 6.7 Índice de repositorio

```json
{
  "format": "ryuunest-repo", "version": 1, "name": "Mi repo", "updatedAt": "2026-10-05T00:00:00Z",
  "modules": [{
    "id": "ejemplo", "name": "Ejemplo", "version": "1.0.0", "apiVersion": 1,
    "runtime": "declarative", "kinds": ["manga"], "lang": "es", "nsfw": false,
    "permissions": { "domains": ["ejemplo.com"] },
    "package": "packages/ejemplo-1.0.0.zip", "sha256": "…", "size": 12345
  }]
}
```
Contenido de un paquete: `manifest.json`, el archivo de entrada y, opcionalmente, un icono y `LICENSE`.

---

## 7. Instalación de paquetes y seguridad

### 7.1 Flujo de instalación

1. El usuario añade un repo (URL HTTPS) y la app descarga `index.json`.
2. El usuario elige un módulo y ve la **pantalla de confirmación**: nombre, autor, repo de origen, runtime, permisos y hash.
3. Si el runtime es `script`, la confirmación es **reforzada** (aviso de que ejecuta código y botón de mantener pulsado).
4. Si está activa la protección de instalación (RF-7), se pide el bloqueo del dispositivo.
5. Descarga del `.zip` con límite de tamaño y verificación de **SHA-256** contra el índice.
6. Descompresión segura: sin rutas fuera del directorio del módulo, límites de tamaño total y de número de archivos.
7. Validación del manifest contra el esquema y comprobación de `apiVersion` y `minAppVersion`.
8. Guardado y registro del módulo. Si falla cualquier paso, no queda nada a medias.

**Límites propuestos:** paquete ≤ 2 MB, contenido descomprimido ≤ 5 MB, ≤ 50 archivos.

### 7.2 Modelo de amenazas

| Amenaza | Mitigación en la v1 |
|---|---|
| Repo malicioso | Solo repos que el usuario añade; confirmación con permisos visibles; módulos script con confirmación reforzada |
| Paquete alterado en tránsito o en el servidor | HTTPS obligatorio y hash SHA-256 verificado |
| Módulo script que abusa del acceso | Sin aislamiento real en la v1 (D-5): los permisos por dominio se hacen cumplir en `host.fetch`, pero un script hostil podría saltárselos. La defensa real es la confianza en el repo. |
| Enlace profundo o intent que instala sin permiso | Los enlaces como `ryuunest://add-repo?url=…` solo abren la pantalla de confirmación; nunca instalan |
| Respaldo JSON malicioso | Validación estricta del esquema y límites de tamaño; los módulos y repos no se instalan solos (RF-38) |
| Zip malicioso (zip-slip, bomba de compresión) | Validación de rutas, límites de tamaño y de archivos |
| Abuso de la extensión por otra página web | La extensión responde solo al origen de la app y solo a dominios autorizados por el usuario (sección 10) |
| Fuga de datos | Sin telemetría; la app no guarda credenciales en la v1 |

### 7.3 Mejoras previstas

Repos firmados con una clave ed25519 y confianza en el primer uso, y un motor JS aislado para scripts. La interfaz `ModuleRuntime` existe para poder cambiar el motor sin tocar el resto.

---

## 8. Datos

### 8.1 Esquema local (SQLite, borrador)

```sql
CREATE TABLE repo (
  id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, name TEXT, added_at INTEGER NOT NULL
);

CREATE TABLE module (
  id TEXT PRIMARY KEY, version TEXT NOT NULL, repo_id TEXT REFERENCES repo(id),
  runtime TEXT NOT NULL, kinds TEXT NOT NULL, lang TEXT, nsfw INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1, installed_at INTEGER NOT NULL, last_error TEXT
);

CREATE TABLE series (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  title TEXT NOT NULL, title_norm TEXT NOT NULL,      -- minúsculas y sin acentos
  cover_url TEXT, kind TEXT, nsfw INTEGER NOT NULL DEFAULT 0,
  status TEXT, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
);

CREATE TABLE folder (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE favorite (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  folder_id INTEGER REFERENCES folder(id) ON DELETE SET NULL,
  added_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
);

CREATE TABLE progress (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL, release_id TEXT, chapter_title TEXT,
  page_index INTEGER NOT NULL DEFAULT 0,
  page_total INTEGER,                     -- páginas del capítulo (porcentaje y barra de progreso)
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
);

CREATE TABLE chapter_read (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id, chapter_id)
);

CREATE TABLE series_pref (
  module_id TEXT NOT NULL, series_id TEXT NOT NULL,
  reader_mode TEXT, preferred_group TEXT, updated_at INTEGER NOT NULL,
  PRIMARY KEY (module_id, series_id)
);

CREATE TABLE setting (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE INDEX idx_series_title   ON series(title_norm);
CREATE INDEX idx_favorite_folder ON favorite(folder_id);
CREATE INDEX idx_progress_recent ON progress(updated_at DESC);
```
- Todas las filas de usuario llevan `updated_at` (milisegundos) para la fusión del respaldo y la sincronización de la v2.
- Los borrados necesitarán marcas de eliminación (tombstones) cuando llegue la sincronización; la v1 no las requiere, pero el esquema no lo impide.
- La búsqueda por nombre usa `title_norm` con `LIKE`; con miles de filas es suficiente. Un índice de texto completo queda como mejora si las mediciones lo piden.
- En IndexedDB (web) se replica la misma estructura lógica detrás del puerto `Storage`.

### 8.2 Rendimiento con miles de series

Listas virtualizadas, paginación por cursor, consultas con índices, portadas con caché limitada y miniaturas reducidas. Las pruebas de carga usan 3 000 series sintéticas (AC-4).

### 8.3 Formato del respaldo JSON

```json
{
  "format": "ryuunest-backup", "version": 1, "createdAt": 1790000000000,
  "repos":     [{ "url": "…", "name": "…" }],
  "modules":   [{ "id": "…", "version": "…", "repoUrl": "…" }],
  "folders":   [{ "id": 1, "name": "…", "sort": 0, "updatedAt": 0 }],
  "series":    [{ "moduleId": "…", "seriesId": "…", "title": "…", "coverUrl": "…", "kind": "…", "nsfw": false, "updatedAt": 0 }],
  "favorites": [{ "moduleId": "…", "seriesId": "…", "folderId": 1, "addedAt": 0, "updatedAt": 0 }],
  "progress":  [{ "moduleId": "…", "seriesId": "…", "chapterId": "…", "releaseId": "…", "pageIndex": 0, "pageTotal": 0, "updatedAt": 0 }],
  "read":      [{ "moduleId": "…", "seriesId": "…", "chapterId": "…", "readAt": 0 }],
  "prefs":     [{ "moduleId": "…", "seriesId": "…", "readerMode": "…", "preferredGroup": "…", "updatedAt": 0 }],
  "settings":  { "nsfwVisible": false, "language": "es" }
}
```
El respaldo no contiene secretos. La importación valida el esquema y el tamaño, y trata los repos y módulos como sugerencias (RF-38).

---

## 9. Lector: estrategia de memoria

- **Paginado:** se decodifica la página actual y se precargan solo las siguientes (ventana pequeña); las anteriores se liberan.
- **Vertical:** lista virtualizada; solo las imágenes cercanas al área visible permanecen decodificadas.
- **Reducción de tamaño:** las imágenes se decodifican al tamaño de pantalla (con un límite de ancho), no a su resolución original.
- **Concurrencia:** pocas descargas y decodificaciones simultáneas; menos aún en TV.
- **Caché:** en disco con tope configurable; vaciable desde Ajustes.
- **Fallos:** reintento por imagen; no se descarta el capítulo entero.
- **Presupuestos:** el tope de imágenes en memoria se mide en la Fase 0 en la MiBox 4 y se fija como constante documentada.

---

## 10. Web y extensión

La web ejecuta los módulos dentro de un **Web Worker sin DOM**, y toda su red pasa por la extensión.

**Protocolo (resumen):**
1. La página envía un mensaje a la extensión con `{ id, url, method, headers, body? }`.
2. La extensión comprueba que el origen de la página sea el de la app y que el dominio de la URL esté autorizado.
3. La extensión hace la petición y responde `{ id, status, headers, body }` (texto o base64).

**Autorización de dominios:** la extensión usa permisos opcionales por dominio. Cuando un módulo necesita un dominio nuevo, el navegador pide al usuario que lo autorice. Sin autorización, no hay petición.

**Limitaciones conocidas:** Chrome en Android no admite extensiones (Firefox para Android sí); el scraping en la web será sobre todo de escritorio.

---

## 11. Interfaz y experiencia

### 11.1 Fuentes de verdad y orden de autoridad

| Fuente | Qué define | Cómo se usa |
|---|---|---|
| Este SPEC | Qué hace la app: alcance, datos, seguridad, comportamiento | Manda sobre la funcionalidad |
| `DESIGN_RULES.md` | Qué se toma y qué no de las pantallas: textos, datos de ejemplo, alcance, presupuesto de color, lista de 20 segundos | Manda sobre el contenido y el uso del color; se lee antes de tocar cualquier pantalla |
| `DESIGN.md` (raíz) | Tokens, tipografía, espaciado, elevación y componentes de Dragon Night | Manda sobre la apariencia de cada componente |
| `design/stitch/<pantalla>/screen.png` | Composición de cada pantalla | Referencia visual |
| `design/stitch/<pantalla>/code.html` | Estructura, jerarquía y espaciados | Solo referencia; **no se copia ni se convierte tal cual** (11.3) |
| `IDEA.md` (sección 14) | Intención creativa: guarida y dragón | Contexto |
| `design/themes/dragon_night/DESIGN.md` y los `DESIGN.md` de otros temas | Exportación cruda de Stitch y temas futuros | **No se usan para implementar** (colores autogenerados, 4 temas) |

**Reglas de conflicto**

1. **Funcionalidad: gana el SPEC.** Si una pantalla muestra algo fuera de la v1, se omite (RF-44) y se anota en `design/stitch/DIFFS.md`.
2. **Contenido y color: gana `DESIGN_RULES.md`** sobre `DESIGN.md`. Ejemplo: `DESIGN.md` pinta las insignias de tipo en esmeralda y la regla V1 las pide neutras; se hacen neutras.
3. **Apariencia: gana `DESIGN.md`** sobre el HTML. Los HTML llevan colores autogenerados por Stitch (`#59e6a4`, `#ffb77a`, `#cdbdff`, etc.) que no son tokens; se usa el token más cercano y se anota.
4. **Composición: gana el PNG** sobre el HTML si difieren.
5. **Lo que no tiene diseño no se inventa a ciegas:** se compone solo con componentes de `DESIGN.md` y se marca «sin diseño» (11.5).
6. **Ante una duda real se pregunta al autor**; no se decide en silencio.

### 11.2 Mapa de pantallas

Las 7 pantallas son de Dragon Night y salen del proyecto de Stitch «RyuuNest Dragon Nest Themed UI». Los nombres de carpeta son los de la exportación; los nombres temáticos («Guarida», «Tesoros») no pasan a la interfaz como nombre de pantalla (11.7).

| Pantalla | Carpeta en `design/stitch/` | Requisitos | Diseño |
|---|---|---|---|
| Inicio | `inicio_guarida` | RF-14, RF-33, RF-41 | Sí |
| Biblioteca | `biblioteca_tesoros` | RF-26 a RF-30, RF-41 | Sí |
| Descubrir | `descubrir_aventuras` | RF-9 a RF-12 | Sí |
| Fuentes | `fuentes_portales` | RF-1 a RF-8 | Sí |
| Serie (detalle) | `detalle_pantalla` | RF-13 a RF-17 | Sí |
| Lector | `pantalla_lector` | RF-18 a RF-25 | Sí |
| Ajustes | `ajustes_pantalla` | RF-37 a RF-40 | Sí |

**Organización de `design/`** (Fase 0): las 7 carpetas de pantalla pasan a `design/stitch/`; `DESIGN.md` y `DESIGN_RULES.md` van en la raíz; los `DESIGN.md` de `ember_hearth`, `arcane_vault`, `moonlit_frost` y `dragon_night` van a `design/themes/`; el PRD y `DESING.md_EspecificacionVisual.md` se eliminan.

### 11.3 Cómo se traduce el HTML a React Native

El HTML exportado es **web** (etiquetas HTML, clases de Tailwind, unidades `rem`, fuentes e imágenes por URL). React Native no tiene DOM ni CSS. El agente **lee** el HTML para obtener jerarquía, orden, textos, tamaños y qué token usa cada elemento; **nunca pega HTML ni clases**.

| En el HTML o en `DESIGN.md` | En React Native |
|---|---|
| `rem` y `em` | 1 rem = 16 px; `letterSpacing` en px (em × tamaño de fuente) |
| Familia y `font-weight` | Un archivo de fuente por peso, cargado de forma explícita (Manrope 600 y 700; Inter 400, 500 y 600); sin pesos sintéticos |
| `backdrop-filter: blur(16px)` en portadas NSFW | `blurRadius` en la imagen de la portada; no se usa `backdrop-filter` |
| `box-shadow` | Ninguno; `elevation: 0` en Android |
| `outline` de foco (TV y teclado) | Borde de 2 px `accent` con separación de 2 px, activado por el estado de foco de la librería de TV |
| Manrope, Inter y los iconos por Google Fonts; Tailwind por CDN (`cdn.tailwindcss.com`) y su `tailwind.config` | Archivos locales empaquetados (RNF-5); Tailwind no se usa y los tokens salen de `DESIGN.md` |
| Imágenes remotas del HTML (`googleusercontent.com`: portadas con obras reales o con texto, avatar, dragón) | No se enlazan ni se copian las portadas con obras reales o con texto (`DESIGN_RULES.md` D2 y D3); se usan marcadores sin texto en `assets/placeholder/` (sección 12) |
| Iconos: el HTML usa Material Symbols y glifos de texto como `●` y `✓` | `lucide-react-native`, siempre SVG; cada icono de Material se sustituye por su equivalente de Lucide (un icono por significado, V4) |
| Clases de Tailwind y colores hexadecimales | Tokens de `ui-tokens`; ninguna clase ni valor literal en los componentes |
| `aspect-ratio: 2/3` | `aspectRatio: 2 / 3` |
| Textos del diseño | Archivo de traducciones; el texto del diseño es la base en español |

### 11.4 Proceso por pantalla (para el agente)

1. Leer `DESIGN_RULES.md` completo (una vez por sesión), abrir `screen.png` y luego `code.html` de esa carpeta.
2. Listar los componentes de la pantalla y reutilizar los de la galería (Fase 6a). Si falta uno, se crea primero en la galería.
3. Construir solo con tokens y componentes; ninguna medida o color suelto.
4. Usar datos reales o fixtures, nunca el texto ni las imágenes de ejemplo del HTML.
5. Cubrir los estados de carga, vacío y error (11.12).
6. Quitar lo que el diseño muestre fuera del alcance de la v1 (RF-44) y anotarlo.
7. Comparar en el dispositivo con `screen.png` usando la lista del apéndice B; registrar diferencias en `design/stitch/DIFFS.md`, y pasar la lista de 20 segundos de `DESIGN_RULES.md` (§6).
8. No pasar a la siguiente pantalla hasta cerrar la actual.

### 11.5 Pantallas y estados sin diseño

Los 7 PNG no cubren lo siguiente. Hasta que existan en `design/`, se componen solo con componentes de `DESIGN.md` y se marcan «sin diseño» en el código.

| Falta | Cómo se resuelve provisionalmente |
|---|---|
| Primer uso (3 pasos) | Wireframe de 11.8 |
| Añadir repositorio | Hoja de nivel 2 con campo de texto y botón primario |
| Confirmación de instalación (normal y reforzada) | Diálogo de nivel 2; en módulos script, aviso y botón de mantener pulsado; permisos como insignias con `warning` |
| Hoja de filtros y selector de carpeta | Hoja inferior de nivel 2, esquinas superiores de 24 px |
| Selector de capítulo y de modo en el lector | Barras del lector de `DESIGN.md` |
| Estados vacíos y de error | Dragón marcador, título en Manrope y una acción (11.12) |
| Importar respaldo y lista de módulos sugeridos | Filas de ajustes y diálogo de confirmación |
| Variante TV de cada pantalla | Reglas de `DESIGN.md` para TV (escala 1,25×, riel, foco) |
| Variante web de cada pantalla | Riel lateral de 240 px y rejilla de 8 columnas (`DESIGN.md`, Layout) |

**Diferencias conocidas entre las capturas y la v1.** La lista completa está en `DESIGN_RULES.md` §4 (sincronización, descargas, contador de no leídos, notificaciones, perfiles, marcador, obras similares, etc.). Además, en las capturas finales:

- **Cabecera:** sin campana de avisos ni avatar de perfil. Lleva logo local, nombre, etiqueta de sección y búsqueda.
- **Inicio:** sin «Novedades de Portales» ni tarjeta de estado del nido; 4 secciones como máximo.
- **Ajustes:** sin «Perfil local» ni «Editar», sin sincronización, sin «Capítulos descargados» ni «Optimizar SQLite». «Zonas táctiles» y «Precarga de páginas» no son ajustes (RF-19 siempre activo; la precarga es una constante medida en la Fase 0, sección 9). «Modo OLED negro puro» no existe: el fondo ya es `bg`. El selector de tema depende de la pregunta abierta 7.

### 11.6 Navegación

`Inicio · Biblioteca · Descubrir · Fuentes · Ajustes`
Móvil: barra inferior flotante (nivel 2). Web: riel lateral de 240 px. TV: riel lateral izquierdo con foco.

### 11.7 Glosario y microcopy

| Concepto | Nombre en la interfaz | Toque temático |
|---|---|---|
| Pantalla de inicio | Inicio | Guarida |
| Series guardadas y carpetas | Biblioteca | Tesoros |
| Explorar contenido de las fuentes | Descubrir | Exploración |
| Repositorios y módulos | Fuentes | Portales |
| Retomar lectura | Continuar | «Continuar la aventura» |

Patrón: etiqueta estructural en mayúsculas (`label-sm`, con tracking) y título temático debajo, por ejemplo «BIBLIOTECA» + «Tesoros». El tono temático es breve y nunca oculta la causa técnica.

### 11.8 Wireframes de pantallas sin diseño

**Primer uso (3 pasos)**
```text
 1/3  Bienvenida                2/3  Añadir repositorio          3/3  Instalar un módulo
┌──────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│     [dragón grande]   │     │ Pega la URL del repo      │     │ Módulos disponibles       │
│  RyuuNest no trae     │     │ [ https://…          ][📋]│     │ [✓] Módulo A  declarativo │
│  fuentes: las añades  │     │                           │     │ [ ] Módulo B  script ⚠    │
│  tú.                  │     │ [ Importar respaldo ]     │     │                           │
│     [ Empezar ]      │     │       [ Continuar ]       │     │    [ Ir a leer ]          │
└──────────────────────┘     └──────────────────────────┘     └──────────────────────────┘
```

**TV:** riel lateral con foco a la izquierda, filas horizontales de portadas con anillo de foco visible, sin barra inferior; el primer uso prioriza «Importar respaldo».

Las pantallas con diseño (Inicio, Biblioteca, Descubrir, Fuentes, Serie, Lector y Ajustes) ya no tienen wireframe en este documento: su referencia es `design/` (11.2).

### 11.9 Tokens de diseño (de `DESIGN.md`)

El front-matter de `DESIGN.md` mezcla tokens propios con tokens genéricos generados (`surface-dim`, `primary-container`, `background`, `error`, etc.) que **contradicen** a los propios: por ejemplo `background` es `#10131a` mientras `bg` es `#0B0E14`, y `error` es `#ffb4ab` mientras `status-error` es `#F06A6A`. **Solo se implementan los de esta tabla**; los demás no se usan.

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0B0E14` | Nivel 0: fondo, lector y tinta sobre acentos |
| `surface` | `#141923` | Nivel 1: tarjetas, filas, campos |
| `elevated` | `#1B2230` | Nivel 2: hojas, diálogos, barra inferior, barras del lector |
| `border` | `#263147` | Contorno fantasma de 1 px |
| `text-primary` | `#F2F0EA` | Texto principal |
| `text-secondary` | `#9BA5B5` | Texto secundario; solo sobre `bg`, `surface` o `elevated` |
| `accent` | `#35C98A` | Acción principal, foco y selección |
| `progress` | `#FF9F43` | Avance y capítulo en curso; nada más (`DESIGN_RULES.md` V1) |
| `accent-alt` | `#9B7BFF` | Descubrimiento y taxonomía alterna (ver pregunta abierta 9) |
| `badge-bg` | `#1C2E29` | Fondo del chip seleccionado |
| `positive` | `#4DD599` | Éxito y capítulo completado |
| `warning` | `#F5C451` | Advertencia |
| `error` | `#F06A6A` | Error y acciones destructivas |

**Reglas de color**

- Todo relleno de `accent` o `progress` lleva texto e iconos en `bg`. El texto claro sobre esos fondos no cumple AA.
- `text-secondary` nunca va sobre insignias teñidas ni capas translúcidas sin comprobar el contraste.
- Cada estado combina color, icono SVG y texto (RF-43).

**Tipografía** (Manrope para títulos, Inter para cuerpo y controles; ambas OFL)

| Token | Fuente | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|---|
| `display-lg` | Manrope | 40 / 48 | 700 | −0,02 em |
| `display-lg-mobile` | Manrope | 30 / 38 | 700 | −0,02 em |
| `headline-lg` | Manrope | 28 / 36 | 700 | −0,01 em |
| `headline-md` | Manrope | 22 / 28 | 600 | −0,01 em |
| `headline-sm` | Manrope | 18 / 24 | 600 | — |
| `title-lg` | Manrope | 16 / 22 | 600 | — |
| `body-lg` | Inter | 16 / 24 | 400 | — |
| `body-md` | Inter | 14 / 20 | 400 | — |
| `body-sm` | Inter | 13 / 18 | 400 | — |
| `label-lg` | Inter | 14 / 20 | 600 | +0,01 em |
| `label-md` | Inter | 12 / 16 | 500 | +0,02 em |
| `label-sm` | Inter | 11 / 14 | 600 | +0,04 em |

- En TV todos los tamaños se multiplican por **1,25**.
- `DESIGN.md` pide cuerpo de al menos 16 px en móvil pero define `body-md` de 14 px y `body-sm` de 13 px. Se resuelve con `DESIGN_RULES.md` V12: cuerpo de 16 px (`body-lg`) en listas y metadatos de 12 px como mínimo. Por eso `label-sm` y la insignia de estado se implementan a 12 px y no a 11 px; se anota como diferencia aceptada.

**Espaciado y rejilla**

- Rejilla de 4 px: `xxs` 4, `xs` 8, `sm` 12, `md` 16, `lg` 24, `xl` 32, `2xl` 48. Toda distancia y relleno es múltiplo de 4.
- Puntos de corte: móvil < 600 px (márgenes 16, separación 12, portadas en 2 o 3 columnas); tablet 600 a 1024 px (márgenes 24, 4 a 6 columnas); escritorio > 1024 px (márgenes 32, separación 24, riel de 240 px y 8 columnas con ajuste automático).
- Portadas con relación 2:3.

**Radios:** 4 (casillas), 8 (campos, botones, filas, insignias en línea), 12 a 16 (tarjetas y portadas; la portada usa 12), 16 a 24 (esquinas superiores de hojas y diálogos), pill para chips e insignias de estado.

**Elevación sin sombras:** nivel 0 `bg`, nivel 1 `surface`, nivel 2 `elevated`. Los bordes de 1 px `border` aclaran los límites. Foco: contorno de 2 px `accent` con separación de 2 px.

**Áreas táctiles:** mínimo 48 × 48 dp en todo elemento interactivo; si el elemento visible es menor (chip de 36 px, insignia de 24 px), se amplía con `hitSlop`.

**Densidades:** compacta (web), cómoda (móvil), TV (elementos grandes, márgenes seguros, foco marcado).

### 11.10 Componentes

El detalle está en `DESIGN.md` (sección Components); esta tabla es un resumen y, si difiere, gana `DESIGN.md`.

| Componente | Resumen |
|---|---|
| Botón primario | 48 px de alto, radio 8, relleno `accent`, texto e icono `bg`, 14 o 16 px en negrita |
| Botón secundario | Relleno `elevated`, borde `border`, texto `text-primary`; al pulsar, capa de `accent` al 10 % |
| Botón destructivo | Borde y texto `error`, sin relleno |
| Chip de filtro | Pill de 36 px; inactivo: `surface`, borde `border`, texto `text-secondary`; seleccionado: `badge-bg`, borde y texto `accent` |
| Insignia de tipo y estado | Pill de 24 px, 12 px; **neutra** (fondo `elevated`, texto `text-secondary`) según `DESIGN_RULES.md` V1; `DESIGN.md` la pinta esmeralda y gana la regla |
| Tarjeta de portada | 2:3, radio 12, borde `border`; barra de progreso de 3 px (RF-41); sin contador de no leídos en la v1 |
| Fila de capítulo | Alto mínimo 56 px, relleno horizontal 16; sin leer (`text-primary`), en curso (marcador y porcentaje en `progress`), completado (`text-secondary` y marca en `positive`) |
| Campo de texto | `surface`, borde `border`, 48 px, radio 8, icono de 20 px; en foco, borde `accent` sin brillo |
| Casilla y radio | 20 × 20, borde de 1,5 px `border`; marcado con relleno `accent` y glifo `bg` |
| Barras del lector | `elevated` al 95 %, borde `border`, sin marca ni sombras |

La **galería de componentes** (pantalla solo para desarrollo, Fase 6a) muestra cada componente en todos sus estados y sirve de base para AC-12 y AC-13.

### 11.11 Reglas contra el diseño genérico («AI-slop»)

Rige `DESIGN_RULES.md` completo. Las que se comprueban de forma automática o en cada revisión:

- Ningún color, tamaño, radio o espacio literal fuera de `ui-tokens` (lint, AC-13).
- Sin sombras, degradados, brillos ni vidrio esmerilado; la profundidad sale de los niveles de superficie.
- Sin emojis ni glifos de texto como iconos; un solo conjunto (Lucide).
- Sin texto claro sobre `accent` ni `progress`.
- Una etiqueta por concepto, igual en todas las pantallas; sin tarjetas-mascota ni textos de ambiente.
- Datos de ejemplo ficticios y coherentes entre pantallas (13); nada que un módulo no pueda dar.
- Sin pantallas, componentes ni textos de relleno inventados.
- Movimiento: transiciones cortas; nada animado en el lector; se respeta `prefers-reduced-motion`.

### 11.12 Dónde aparece el dragón

| Pantalla o estado | Dragón | Tamaño |
|---|---|---|
| Encabezado | Logo (no es un perfil de usuario) | Pequeño |
| Primer uso | Ilustración de bienvenida | Grande |
| Biblioteca vacía | Con libro o tesoro | Mediano |
| Sin resultados | «Buscó por todas partes» | Mediano |
| Error de módulo | Confundido, con detalle técnico desplegable | Mediano |
| Carga breve | Acción corta | Pequeño |
| Lector | Ninguno | Ninguno |

Todo estado vacío o de error lleva una acción siguiente (añadir repo, reintentar, ver detalle). Las cadenas viven en el archivo de traducciones.

---

## 12. Recursos gráficos

- El arte final del dragón y los iconos los harán artistas. Mientras tanto se usan **imágenes generadas con IA como marcadores**.
- Las imágenes de ejemplo de `design/` (portadas, avatar, dragón) son marcadores: se copian a `assets/placeholder/` con su registro y no se enlazan por URL.
- Fuentes e iconos del diseño: Manrope e Inter (OFL) y Lucide (ISC), empaquetados y registrados en `ASSETS.md`.
- Los marcadores viven solo en `assets/placeholder/`, con un `README` que registra herramienta, fecha e indicaciones usadas, y una marca clara de **temporal**. No se emplean personajes ni estilos de obras protegidas.
- `ASSETS.md` registra la licencia de todo recurso de terceros (iconos, fuentes, imágenes). En un repo GPL-3.0 no entran recursos con licencias no libres o no comerciales.
- Antes de la v1.0 pública se reemplazan los marcadores o se confirma su situación de licencia. Ninguna pantalla depende del arte final: el dragón de marcador es una silueta sencilla.

---

## 13. Calidad y herramientas

- **TypeScript estricto**, lint y formato automáticos.
- **Pruebas del contrato:** cada módulo se prueba contra HTML guardado (fixtures). El repo incluye un **sitio falso de pruebas** (HTML estático dentro de los tests, que no se distribuye con la app) para validar el contrato sin depender de un sitio real.
- **Segundo sitio real** antes de congelar la API 1.0, para evitar un contrato ajustado a un solo sitio.
- **CLI del SDK:** crear un módulo desde plantilla, validarlo, probarlo contra fixtures y empaquetarlo con su hash.
- **Pruebas de carga:** 3 000 series sintéticas y 5 módulos sintéticos (AC-4 y AC-5).
- **CI en GitHub Actions:** lint, tipos, pruebas y compilación del APK en cada cambio.
- **Pruebas manuales por fase** en POCO F6 Pro, Galaxy S25 Ultra y MiBox 4.
- **Prueba de tokens (AC-13):** el CI compara `ui-tokens` con el front-matter de `DESIGN.md` (solo los tokens de 11.9) y calcula el contraste WCAG de los pares usados.
- **Playwright:** verifica la web y la galería de componentes contra `screen.png` (composición, tokens, áreas táctiles, foco, cero peticiones externas). No controla la app nativa; ver pregunta abierta 11 y `AGENTS.md` §5.
- **Lint de diseño:** prohibidos colores hexadecimales y medidas literales de fuente, radio o espacio en `apps/*`.
- **Revisión visual por pantalla (AC-12):** captura en el POCO F6 Pro comparada con `screen.png` (apéndice B y lista de 20 segundos de `DESIGN_RULES.md`).
- **Datos de ejemplo:** un único conjunto de fixtures coherente en todas las pantallas (cifras que cuadran, series inventadas, portadas sin texto), según `DESIGN_RULES.md` D1 a D5.

---

## 14. Plataformas y compatibilidad

| Plataforma | Dispositivos de prueba | Notas |
|---|---|---|
| Android móvil | POCO F6 Pro, Galaxy S25 Ultra | Pruebas principales en Android 12 a 15 |
| Android TV | Xiaomi MiBox 4 (Android 9, 2 GB de RAM) | Es el equipo más limitado y fija el piso de rendimiento |
| Web | Navegadores de escritorio con la extensión | Ver sección 10 |

- **Android mínimo: 9 (nivel de API 28)**, para que la app corra en la MiBox 4. El objetivo de pruebas y uso es Android 12 a 15. Si el SDK de Expo vigente exige un mínimo más alto, se decide en la Fase 0 (ver sección 17).
- **React Native para TV:** se usa el proyecto React Native TV (`react-native-tvos`) como dependencia `react-native` dentro de Expo, con su plugin de configuración. Su versión debe coincidir con la del SDK de Expo, y se fija en la Fase 0.
- **Navegación con foco** en TV con una librería de navegación espacial, a elegir en la Fase 0.
- **Foco y escala en TV:** anillo de 2 px `accent` con separación de 2 px y tipografía a 1,25× (11.9).
- Sin iOS y sin publicación en tiendas: distribución por APK directo y PWA.

---

## 15. Código abierto y comunidad

- **Licencia GPL-3.0.** Los módulos son obras independientes de cada autor, que decide su licencia. Esto no es asesoría legal.
- **El repo principal no incluye módulos de sitios concretos.** Los módulos del autor viven en un repo público aparte, no afiliado a la app.
- **README:** declara que no está afiliado a ningún sitio, que no aloja ni distribuye contenido, y que cada usuario es responsable de los repos que añade y de respetar los derechos de autor y los términos de cada sitio.
- **Documentos:** `CONTRIBUTING.md`, guía del SDK de módulos, código de conducta, plantillas de issues y política de seguridad.
- **API versionada con semver.** Un cambio incompatible sube `apiVersion` y la app informa qué módulos no son compatibles.
- **Nombre:** RyuuNest. Antes de fijarlo, verificar disponibilidad del repo y la organización en GitHub, el scope de npm, un dominio y el `applicationId` de Android.

---

## 16. Fases de implementación de la v1

Estimaciones en puntos relativos (S = 1, M = 3, L = 5, XL = 8). La estimación de `IDEA.md` (≈ 31) no contaba la preparación ni la interfaz general; esta es la revisada. Al cerrar la Fase 0 se mide el ritmo real (el autor dispone de unas 4 horas en días laborales) y se convierte a calendario.

| Fase | Entregable | Puntos | Criterio de salida |
|---|---|---|---|
| 0 | Preparación y calibración: monorepo, TS estricto, CI, app de prueba en los 3 dispositivos (incluida la MiBox 4), versiones fijadas, presupuesto de memoria medido inventario de `design/` (tabla de 11.2), `AGENTS.md` y `MEMORY.md` en la raíz | 3 | La app de prueba arranca en los 3 dispositivos y el CI compila el APK |
| 1 | Núcleo y contrato: tipos, errores, host, sitio falso de pruebas, SDK y CLI mínimos | 5 | Pruebas del contrato en verde contra el sitio falso |
| 2 | Repos e instalador de paquetes: índice, verificación, descompresión segura, confirmación | 3 | AC-2 y AC-8 |
| 3 | Runtimes: declarativo (3) y script (5) tras `ModuleRuntime` | 8 | Un módulo de cada tipo pasa las pruebas del contrato |
| 4 | Primer módulo real (port de `logicTMO.py`, apéndice A) | 3 | Busca, lista capítulos y entrega imágenes de un sitio real |
| 5 | Datos: SQLite, favoritos, carpetas, filtros, progreso, capítulos leídos | 5 | AC-4 |
| 6a | Sistema de diseño: `ui-tokens` desde `DESIGN.md` (tokens semánticos, solo Dragon Night), fuentes e iconos empaquetados, componentes base (11.10) y galería | 3 | AC-13 y galería revisada contra `DESIGN.md` |
| 6b | Interfaz móvil según `design/`: navegación, primer uso, Inicio, Biblioteca, Descubrir, Fuentes, Serie (5) y lector (3) | 8 | AC-1, AC-3, AC-6 y AC-12 (AC-6 medido en la MiBox) |
| 7 | Adaptación a TV: riel, foco y lector con D-pad | 3 | AC-9 |
| 8 | Web y extensión | 5 | AC-10 |
| 9 | Respaldo JSON, endurecimiento, documentación y primera versión empaquetada | 3 | AC-7, AC-5 y AC-11 |
| | **Total** | **49** | |

La v2 y la v3 están en `IDEA.md`, sección 9.

---

## 17. Riesgos y preguntas abiertas

### 17.1 Riesgos

| Riesgo | Efecto | Mitigación |
|---|---|---|
| Sin experiencia previa en React Native | Ritmo lento al inicio | Fase 0 de calibración; herramientas de IA para andamiaje; mantener el núcleo en TS puro, que sí domina |
| MiBox 4 con 2 GB | Cierres por memoria en el lector | Presupuesto medido desde la Fase 0, imágenes reducidas y concurrencia mínima |
| Sitios con anti-bot | Algunos módulos no funcionan | Informar `BLOCKED`; solución con WebView y cookies queda para la v2 |
| Sitios que cambian | Módulos rotos | Fixtures para detectar roturas; arreglar un sitio es actualizar un módulo |
| Contrato validado con un solo sitio | API mal ajustada | Sitio falso de pruebas y segundo sitio real antes de congelar 1.0 |
| Scripts sin aislamiento | Código hostil con acceso al runtime | Confirmación reforzada, repos de confianza y motor aislado como mejora (D-5) |
| Dos interfaces (móvil y web) | Más mantenimiento | Núcleo y tokens compartidos; la web va al final de la v1 |
| Arte con IA como marcador | Dudas de licencia | Aislado en `assets/placeholder/` y reemplazado antes de la v1.0 pública |
| Riesgo legal por los módulos de sitios concretos | Exposición de quien los publique | Repo aparte y no afiliado, README claro; no es asesoría legal |
| Diseño exportado como HTML web | El agente copia HTML o Tailwind, o inventa estilos, y la interfaz pierde coherencia | Reglas 11.1 a 11.4 y 11.11, tokens solo desde `DESIGN.md`, lint de diseño, AC-12 y AC-13 |
| Diseño que muestra funciones fuera de la v1 | El alcance crece sin control | Regla de conflicto 1 (SPEC manda en funcionalidad) y RF-44 |
| Pantallas sin diseño (11.5) | Improvisación visual | Componer solo con `DESIGN.md`; generar esas pantallas en Stitch antes de la Fase 6b |
| Documentos de diseño contradictorios en `design/` | El agente implementa funciones fuera de la v1 o colores autogenerados | Eliminar los obsoletos (11.2) y respetar el orden de autoridad (11.1) |

### 17.2 Preguntas abiertas

1. **Versión mínima de Android:** confirmar en la Fase 0 que el SDK de Expo elegido admite Android 9; si no, decidir entre una versión anterior del SDK o dejar la TV para más adelante.
2. **Formato declarativo completo** (paginación, transformaciones, limpieza de texto): se cierra en un SPEC propio en la Fase 3.
3. **Librería de navegación con foco para TV** y librería de listas virtualizadas: se eligen en la Fase 0 con pruebas en la MiBox.
4. **Un favorito en varias carpetas:** hoy una sola (D-12); reevaluar si hace falta.
5. **Búsqueda con filtros de género o tipo dentro de un módulo:** fuera de la v1; decidir si entra en la v2.
6. **Nombre:** verificación de disponibilidad pendiente (sección 15).
7. **Temas:** el selector de Ajustes y el PRD muestran 4 temas (Dragon Night, Ember Hearth, Arcane Vault, Moonlit Frost), pero solo Dragon Night tiene las 7 pantallas (Lector incluido). Propuesta: la v1 trae solo Dragon Night, con tokens semánticos que permitan añadir temas, y el selector no se muestra hasta que existan dos. Decide el autor.
8. **Tipos de obra:** el diseño filtra por Manga, Manhwa y Cómic; el SPEC y `IDEA.md` incluyen manhua. El contrato admite los cuatro (D-13); decidir si los filtros muestran los cuatro.
9. **Violeta `accent-alt`:** `DESIGN.md` lo reserva para descubrimiento, pero `DESIGN_RULES.md` V1 limita el color de acento. Regla provisional: no se usa en la v1.
10. **Pantallas sin diseño (11.5):** decidir cuáles se generan en Stitch antes de la Fase 6b.
11. **Verificación visual de la app nativa:** Playwright solo cubre el navegador. Decidir si la galería también se compila para web o si las pantallas nativas se verifican con capturas del dispositivo (AC-12).
---

## Apéndice A. Port de `logicTMO.py`

### A.1 Correspondencia de funciones

| Código actual | Contrato nuevo |
|---|---|
| `getElementsTMO` (`div.element`) | `popular()` y resultados de `search()` |
| `getLastAddedTMO` (`div.upload-file-row`) | `latest()` |
| `getLibraryTMO(title, page)` | `search(query, page)` |
| `scraperBookTMO` | `details(seriesId)` |
| `getChapterTMO` y `scraperChapterBookTMO` | `pages(chapterId, releaseId)` |

### A.2 Correspondencia de modelos

| Modelo actual | Modelo nuevo |
|---|---|
| `ITmo` (título, URL, imagen, score, tipo, demografía, tiempo, scan) | `SeriesSummary` (`id`, `title`, `cover`, `kind`, `badges`, `hint`) |
| `ITmoBook` | `SeriesDetails` |
| `ICapituloBook` (título, servidores, visto) | `Chapter` con `releases`; **`visto` sale del módulo** y pasa al progreso local |
| `IServerBook` (grupo, fecha, enlace, URL original) | `Release` (`id`, `group`, `publishedAt`) |
| `IPartsBook` | `ChapterPages` |

### A.3 Comportamientos específicos del sitio

- Al abrir un capítulo se sigue la redirección y se reemplaza `paginated` por `cascade` en la URL para obtener todas las imágenes.
- Las imágenes salen de `data-src` en los elementos `img.viewer-img`.
- Las peticiones y las imágenes llevan `Referer` y `User-Agent`; en el contrato nuevo viajan en `ImageRef.headers`.

### A.4 Defectos del código actual que no se heredan

1. En `scraperChapterBookTMO`, el título se arma con `" ".join(f"…split()…")`, que une caracteres de un texto que contiene la representación de una lista.
2. Las comillas anidadas dentro de f-strings solo son válidas en Python 3.12 o superior.
3. `headers` es un diccionario de clase y se modifica al asignar `Referer`: el estado se comparte entre llamadas.
4. `requests` es bloqueante dentro de funciones `async`.
5. `getRuterTMO` devuelve `None` sin avisar si la ruta no existe, y luego se llama a `getSoupTMO(None)`.
6. Los errores se imprimen y se devuelve `None`, sin códigos ni causa.
7. No hay tiempos límite en las peticiones.
8. `if not soup` después de crear un `BeautifulSoup` nunca es falso, así que esa comprobación no valida nada.

En el módulo nuevo estos puntos se resuelven con errores tipados (`ModuleError`), tiempos límite y peticiones a través del host, sin estado compartido.

---

## Apéndice B. Lista de verificación visual por pantalla

Se completa para cada pantalla antes de darla por cerrada (AC-12), junto con la lista de 20 segundos de `DESIGN_RULES.md` (§6).

- [ ] Fondo y superficies en el nivel correcto (0, 1 o 2); ninguna sombra.
- [ ] Todo color, tamaño, radio y espacio sale de tokens; texto sobre acentos en `bg`.
- [ ] Títulos en Manrope y cuerpo en Inter, con los tamaños de 11.9.
- [ ] Espacios múltiplos de 4 px y márgenes del punto de corte correcto.
- [ ] Áreas táctiles de al menos 48 dp (con `hitSlop` en chips e insignias).
- [ ] Estados (sin leer, en curso, completado, error) con icono y texto, no solo color.
- [ ] Iconos de Lucide; ningún emoji ni glifo de texto.
- [ ] Textos desde el archivo de traducciones; ningún texto ni imagen de ejemplo del HTML.
- [ ] Nada fuera de la v1 (sin descargas, sincronización, noticias, cuentas, perfiles, campana de avisos ni contador de no leídos).
- [ ] Estados de carga, vacío y error resueltos.
- [ ] En TV: foco visible, escala 1,25× y uso completo con D-pad.
- [ ] Captura comparada con `screen.png`; diferencias en `design/stitch/DIFFS.md`.
