# SPEC: RyuuNest

> Lector personal y de código abierto de manga, manhua y cómics, con módulos de scraping que se instalan como paquetes.
> Estado: borrador para revisión · Octubre 2026
> Documentos relacionados: `IDEA.md` (visión, hoja de ruta y dirección visual)
> Licencia: GPL-3.0

**Cómo leer este documento.** Los requisitos llevan prioridad **M** (debe), **S** (debería) o **C** (podría). Los números de rendimiento son **objetivos a validar** con mediciones en los dispositivos reales, no promesas. Las versiones exactas de Expo, React Native y librerías se fijan en la Fase 0 y no se inventan aquí.

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

Sincronización entre dispositivos (v2), descargas sin conexión (v2), anime, libros EPUB, cómics locales y noticias (v3 o después), iOS, publicación en tiendas y cualquier servidor propio. La hoja de ruta completa está en `IDEA.md`, sección 9.

### 1.5 Usuarios y contexto

- Autor y primer usuario: lector intensivo con miles de series.
- Comunidad pública con contribuciones: exige documentación del SDK, API estable y políticas claras (sección 15).
- Un usuario por instalación; sin cuentas ni backend.

### 1.6 Cambios respecto a `IDEA.md`

- Stack: **React Native (Expo)** en lugar de Capacitor; la web pasa a ser un **cliente separado** que comparte el núcleo.
- Los módulos se distribuyen como **paquetes `.zip`** con manifest y hash.
- Se añade la tabla `chapter_read` en la v1 para marcar capítulos leídos; el historial de la v2 se apoya en ella.
- Un capítulo puede tener varias **versiones de publicación** (por ejemplo, distintos grupos), porque el código de referencia (`logicTMO.py`) ya las maneja.

---

## 2. Criterios de aceptación de la v1

| ID | Criterio | Objetivo medible |
|---|---|---|
| AC-1 | Instalar sin módulos y completar el primer uso | El flujo guía hasta añadir un repo y activar un módulo |
| AC-2 | Instalar un paquete desde un repo | Un hash incorrecto o un manifest inválido se rechaza con mensaje claro |
| AC-3 | Buscar y leer un capítulo con un módulo real | Tras cerrar y reabrir la app, el lector vuelve a la página exacta |
| AC-4 | Filtros sobre biblioteca grande | Con 3 000 series sintéticas, filtrar o buscar responde en < 300 ms en el POCO F5 Pro y < 1 s en la MiBox 4 |
| AC-5 | Capacidad de módulos | Con 5 módulos sintéticos instalados, el arranque y la memoria se mantienen dentro de los objetivos RNF-1 y RNF-2 |
| AC-6 | Lector en el equipo más limitado | Un capítulo vertical de 60 imágenes se lee completo en la MiBox 4 sin cierres por memoria |
| AC-7 | Respaldo JSON | Exportar e importar reproduce biblioteca, carpetas, progreso y repos sin pérdidas |
| AC-8 | Instalación solo con confirmación | Ningún enlace profundo, importación de respaldo ni intent instala algo sin confirmación manual |
| AC-9 | TV | Todas las pantallas de la v1 se usan solo con el control remoto (D-pad) |
| AC-10 | Web | Con la extensión instalada, se lee un capítulo desde el navegador |
| AC-11 | Calidad | CI en verde: lint, tipos estrictos, pruebas del contrato y compilación del APK |

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
- **RF-15 (M)** Lista de capítulos con marca de leído, capítulo en curso, orden ascendente o descendente y salto al último leído.
- **RF-16 (M)** Si un capítulo tiene varias versiones de publicación, elegir una; recordar la preferida por serie.
- **RF-17 (M)** Favorito con un toque; elegir carpeta desde el menú o al mantener pulsado.

### 3.4 Lector

- **RF-18 (M)** Dos modos: **vertical continuo** y **paginado**. Predeterminado por tipo: manhua vertical, manga paginado de derecha a izquierda, cómic paginado de izquierda a derecha. El modo se recuerda **por serie**.
- **RF-19 (M)** Zonas táctiles izquierda, centro y derecha; el centro muestra u oculta los controles; las laterales se invierten en derecha a izquierda.
- **RF-20 (M)** Guardar el progreso al cambiar de página (con retraso corto) y al salir. Reabrir lleva a la página exacta.
- **RF-21 (M)** Al final del capítulo, tarjeta "Siguiente capítulo" y precarga de sus primeras imágenes.
- **RF-22 (M)** Controles mínimos: cerrar, título, selector de capítulo, modo de lectura. Nada decorativo sobre el contenido.
- **RF-23 (M)** Zoom con pellizco, pantalla encendida mientras se lee y reintento por imagen con detalle técnico del error.
- **RF-24 (M)** Las imágenes se piden con las cabeceras que indique el módulo (`Referer`, `User-Agent`), porque muchos sitios bloquean enlaces directos.
- **RF-25 (M)** En TV: arriba y abajo desplazan o cambian de página, izquierda y derecha cambian de página, OK muestra u oculta los controles, Atrás sale.

### 3.5 Biblioteca, carpetas y filtros

- **RF-26 (M)** Biblioteca única de favoritos con búsqueda por nombre siempre visible y chips: Todo · Leyendo · Carpetas.
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
- **RF-39 (M)** Ajustes: idioma de la interfaz, NSFW, protección de instalación, tema, modo de lectura predeterminado, gestión de caché.
- **RF-40 (M)** Interfaz en español; las cadenas viven en un archivo de traducciones desde el inicio para añadir inglés después.

---

## 4. Requisitos no funcionales

| ID | Requisito | Objetivo (a validar) |
|---|---|---|
| RNF-1 | Arranque en frío hasta pantalla útil | < 3 s en POCO F5 Pro; < 8 s en MiBox 4 |
| RNF-2 | Memoria del proceso | Sin cierres por memoria en la MiBox 4 (2 GB) leyendo 60 imágenes seguidas; presupuesto medido y registrado en la Fase 0 |
| RNF-3 | Fluidez | Desplazamiento de listas sin pérdidas visibles de cuadros en el teléfono; en TV, navegación con foco sin retrasos perceptibles |
| RNF-4 | Almacenamiento | Caché de imágenes con tope configurable (por defecto menor en TV) y botón para vaciarla |
| RNF-5 | Privacidad | Sin telemetría, sin cuentas, sin servicios de terceros; los datos solo salen del dispositivo por exportación manual |
| RNF-6 | Seguridad | Modelo de la sección 7; nada se instala sin confirmación |
| RNF-7 | Accesibilidad | Contraste WCAG AA, áreas táctiles de al menos 48 × 48 dp, etiquetas accesibles en botones con icono, `prefers-reduced-motion` |
| RNF-8 | Resiliencia | Un módulo roto, lento o bloqueado no tumba la app: tiempo límite, errores contenidos y reintento manual |
| RNF-9 | Compatibilidad | Ver sección 14 |
| RNF-10 | Mantenibilidad | TypeScript en modo estricto, núcleo sin dependencias de plataforma y cobertura del contrato con pruebas |
| RNF-11 | Internacionalización | Todas las cadenas externalizadas; fechas y números con formato local |

---

## 5. Arquitectura

### 5.1 Estructura del monorepo

```text
ryuunest/
  packages/core         TS puro: contrato, runtimes, instalador, biblioteca, lector (estado)
  packages/module-sdk   tipos públicos, validador de manifest, CLI y plantilla de módulos
  packages/ui-tokens    tokens de diseño compartidos (colores, espaciado, tipografía)
  apps/mobile           React Native (Expo) para móvil y variante TV
  apps/web              React + Vite + puente a la extensión
  apps/extension        extensión de navegador (realiza las peticiones de la web)
  docs/                 decisiones (ADR), guía de módulos, CONTRIBUTING
  assets/placeholder/   marcadores temporales (ver sección 12)
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

---

## 6. Contrato de módulo (API v1)

### 6.1 Manifest

```ts
export type MediaKind = "manga" | "manhua" | "comic";

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
  page_index INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL,
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
  "progress":  [{ "moduleId": "…", "seriesId": "…", "chapterId": "…", "releaseId": "…", "pageIndex": 0, "updatedAt": 0 }],
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

### 11.1 Glosario

| Concepto | Nombre en la interfaz | Toque temático |
|---|---|---|
| Pantalla de inicio | Inicio | Guarida |
| Series guardadas y carpetas | Biblioteca | Tesoros |
| Explorar contenido de las fuentes | Descubrir | Exploración |
| Repositorios y módulos | Fuentes | Portales |
| Retomar lectura | Continuar | "Continuar la aventura" |

### 11.2 Navegación

`Inicio · Biblioteca · Descubrir · Fuentes · Ajustes`
Móvil: barra inferior. Web: barra lateral. TV: riel lateral izquierdo con foco.

### 11.3 Wireframes

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

**Inicio**
```text
┌────────────────────────────────────────┐
│ 🐉 (avatar)  Buenas noches        🔍   │
├────────────────────────────────────────┤
│ CONTINUAR LA AVENTURA                  │
│ ┌──────────────────────────────────┐   │
│ │ [portada]  Título                │   │   un toque abre en la página exacta
│ │            Cap. 41 · pág. 12  ▶  │   │
│ └──────────────────────────────────┘   │
│ Recientes  [▭][▭][▭][▭] →              │
│ Tesoros    [▭][▭][▭][▭] →              │
│ Descubrir  [▭][▭][▭][▭] →   (solo si hay módulos)
└────────────────────────────────────────┘
```

**Biblioteca**
```text
┌────────────────────────────────────────┐
│ 🔍 Buscar por nombre…            ⚙︎ filtros│
│ (Todo) Leyendo  Carpetas   Tipo ▾      │
│ [▭][▭][▭]                              │
│ [▭][▭][▭]   cuadrícula virtualizada    │
└────────────────────────────────────────┘
```

**Descubrir**
```text
┌────────────────────────────────────────┐
│ Fuente: [Módulo A ▾]        🔍 buscar  │
│ Popular  [▭][▭][▭][▭] →                │
│ Recién añadidos [▭][▭][▭][▭] →         │
└────────────────────────────────────────┘
```

**Fuentes**
```text
┌────────────────────────────────────────┐
│ Repositorios                  [+ Añadir]│
│ ▸ Mi repo  (3 módulos)                 │
│ Módulos instalados                     │
│ Módulo A  v1.0.0  declarativo   ◉ on   │
│ Módulo B  v1.2.0  script ⚠      ◉ on   │
│           último error: BLOCKED  [ver] │
└────────────────────────────────────────┘
```

**Serie**
```text
┌────────────────────────────────────────┐
│ ←                            ♥  ⋯      │
│ [portada]  Título                      │
│            Tipo · Fuente · Estado      │
│ [ Continuar cap. 41 ]                  │
│ Descripción (colapsada, "ver más")     │
│ Capítulos        ↑↓ orden   ⌖ último leído │
│ ✓ Cap. 40                              │
│ ● Cap. 41  (en curso)                  │
│ ○ Cap. 42                              │
└────────────────────────────────────────┘
```

**Lector** (controles ocultos por defecto)
```text
┌────────────────────────────────────────┐
│  (centro: mostrar/ocultar controles)   │
│  ◀ zona        contenido        zona ▶ │
│ ──────────────────────────────────────  │
│ ✕  Título · Cap. 41      [Cap ▾] [Modo]│   barra superior al mostrar controles
│              12 / 38                    │
└────────────────────────────────────────┘
```

**Ajustes:** Idioma · Mostrar NSFW · Protección de instalación · Tema · Modo de lectura predeterminado · Caché · Respaldo (exportar / importar) · Acerca de y licencias.

**TV:** riel lateral con foco a la izquierda, filas horizontales de portadas con anillo de foco visible, sin barra inferior; el primer uso prioriza "Importar respaldo".

### 11.4 Tokens de diseño (propuesta inicial)

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0B0E14` | Fondo |
| `surface` | `#141923` | Tarjetas |
| `elevated` | `#1B2230` | Hojas y diálogos |
| `text` | `#F2F0EA` | Texto principal |
| `text-secondary` | `#9BA5B5` | Texto secundario |
| `accent` | `#35C98A` | Acción principal y foco |
| `progress` | `#FF9F43` | Avance y capítulo en curso |
| `accent-alt` | `#9B7BFF` | Tema alterno (no se usa en la v1) |
| `positive` | `#4DD599` | Éxito |
| `warning` | `#F5C451` | Advertencia |
| `error` | `#F06A6A` | Error |

- **Regla de contraste:** etiquetas **oscuras** (`#0B0E14`) sobre fondos de acento; el texto claro sobre esmeralda o violeta no cumple AA.
- **Tipografía:** títulos y estados vacíos con Manrope; cuerpo con Inter (ambas con licencia OFL). Cuerpo de al menos 16 px en móvil; escala mayor en TV.
- **Espaciado:** base de 4 px. **Radios:** 8 / 12 / 16.
- **Densidades:** compacta (web), cómoda (móvil), TV (elementos grandes, márgenes seguros, foco marcado).
- **Iconos:** un solo conjunto de iconos SVG, sin emojis como iconos de interfaz.
- **Movimiento:** transiciones cortas; nada animado en el lector; se respeta `prefers-reduced-motion`.

### 11.5 Dónde aparece el dragón

| Pantalla o estado | Dragón | Tamaño |
|---|---|---|
| Encabezado | Avatar | Pequeño |
| Primer uso | Ilustración de bienvenida | Grande |
| Biblioteca vacía | Con libro o tesoro | Mediano |
| Sin resultados | "Buscó por todas partes" | Mediano |
| Error de módulo | Confundido, con detalle técnico desplegable | Mediano |
| Carga breve | Acción corta | Pequeño |
| Lector | Ninguno | Ninguno |

### 11.6 Estados y mensajes

Todo estado vacío o de error lleva una acción siguiente (añadir repo, reintentar, ver detalle). Los textos temáticos son breves y nunca ocultan la causa técnica. Todas las cadenas viven en el archivo de traducciones.

---

## 12. Recursos gráficos

- El arte final del dragón y los iconos los harán artistas. Mientras tanto se usan **imágenes generadas con IA como marcadores**.
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
- **Pruebas manuales por fase** en POCO F5 Pro, Galaxy S25 Ultra y MiBox 4.

---

## 14. Plataformas y compatibilidad

| Plataforma | Dispositivos de prueba | Notas |
|---|---|---|
| Android móvil | POCO F5 Pro, Galaxy S25 Ultra | Pruebas principales en Android 12 a 15 |
| Android TV | Xiaomi MiBox 4 (Android 9, 2 GB de RAM) | Es el equipo más limitado y fija el piso de rendimiento |
| Web | Navegadores de escritorio con la extensión | Ver sección 10 |

- **Android mínimo: 9 (nivel de API 28)**, para que la app corra en la MiBox 4. El objetivo de pruebas y uso es Android 12 a 15. Si el SDK de Expo vigente exige un mínimo más alto, se decide en la Fase 0 (ver sección 17).
- **React Native para TV:** se usa el proyecto React Native TV (`react-native-tvos`) como dependencia `react-native` dentro de Expo, con su plugin de configuración. Su versión debe coincidir con la del SDK de Expo, y se fija en la Fase 0.
- **Navegación con foco** en TV con una librería de navegación espacial, a elegir en la Fase 0.
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
| 0 | Preparación y calibración: monorepo, TS estricto, CI, app de prueba en los 3 dispositivos (incluida la MiBox 4), versiones fijadas y presupuesto de memoria medido | 3 | La app de prueba arranca en los 3 dispositivos y el CI compila el APK |
| 1 | Núcleo y contrato: tipos, errores, host, sitio falso de pruebas, SDK y CLI mínimos | 5 | Pruebas del contrato en verde contra el sitio falso |
| 2 | Repos e instalador de paquetes: índice, verificación, descompresión segura, confirmación | 3 | AC-2 y AC-8 |
| 3 | Runtimes: declarativo (3) y script (5) tras `ModuleRuntime` | 8 | Un módulo de cada tipo pasa las pruebas del contrato |
| 4 | Primer módulo real (port de `logicTMO.py`, apéndice A) | 3 | Busca, lista capítulos y entrega imágenes de un sitio real |
| 5 | Datos: SQLite, favoritos, carpetas, filtros, progreso, capítulos leídos | 5 | AC-4 |
| 6 | Interfaz móvil: navegación, primer uso, Inicio, Biblioteca, Descubrir, Fuentes, Serie (5) y lector (3) | 8 | AC-1, AC-3 y AC-6 en la MiBox con la interfaz móvil provisional |
| 7 | Adaptación a TV: riel, foco y lector con D-pad | 3 | AC-9 |
| 8 | Web y extensión | 5 | AC-10 |
| 9 | Respaldo JSON, endurecimiento, documentación y primera versión empaquetada | 3 | AC-7, AC-5 y AC-11 |
| | **Total** | **46** | |

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

### 17.2 Preguntas abiertas

1. **Versión mínima de Android:** confirmar en la Fase 0 que el SDK de Expo elegido admite Android 9; si no, decidir entre una versión anterior del SDK o dejar la TV para más adelante.
2. **Formato declarativo completo** (paginación, transformaciones, limpieza de texto): se cierra en un SPEC propio en la Fase 3.
3. **Librería de navegación con foco para TV** y librería de listas virtualizadas: se eligen en la Fase 0 con pruebas en la MiBox.
4. **Un favorito en varias carpetas:** hoy una sola (D-12); reevaluar si hace falta.
5. **Búsqueda con filtros de género o tipo dentro de un módulo:** fuera de la v1; decidir si entra en la v2.
6. **Nombre:** verificación de disponibilidad pendiente (sección 15).

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
