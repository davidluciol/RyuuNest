# Formato declarativo de módulos (`index.json`) — API 1

> **Normativo.** Cierra la pregunta 2 del SPEC §17.2 y la R2 del `docs/decisions/ADR-0003-congelacion-api-1.0.md` (T39).
> Lo implementan `packages/core/src/runtimes/{DeclarativeRuntime,transforms}.ts`; lo comprueba `validateDeclarativeConfig` (`@ryuunest/module-sdk`), que usan `ryuunest-module validate` y `ryuunest-module test`.
> Si este documento y el código no coinciden, es un fallo: se corrige uno de los dos con una prueba.

Un módulo declarativo describe con **selectores CSS** dónde está cada dato de un sitio HTML, y el núcleo construye la `ModuleApi` (SPEC §6.3). El alcance es **HTML + CSS por GET**: todo lo demás (JSON, `POST`, cookies, cifrado, lógica condicional) es un módulo `script` (§10, L7).

Cada sección se explica con el mismo **ejemplo real**: `zonatmo` (repo `RyuuNest-Models`), traducido a declarativo a partir de los selectores de su código (`zonatmo/bin/config.js`). Es una traducción ilustrativa: `zonatmo` se publica como `script` y esta versión **no se ha probado contra el sitio real** (las pruebas usan fixtures, nunca sitios reales). Lo que `zonatmo` hace y el declarativo no puede, se dice en §10.

## 1. Estructura

`index.json` es un objeto con cinco claves opcionales: `popular`, `latest`, `search`, `details` y `pages`.

- Si falta `popular` o `latest`, ese método no existe en la `ModuleApi`.
- Si falta `search`, `details` o `pages`, el método existe pero da `UNSUPPORTED` (el contrato los exige; un módulo útil los define).
- **Las claves desconocidas se ignoran** en cualquier nivel (política de compatibilidad del ADR-0003). El validador tampoco avisa: una errata (`popluar`) la descubre `ryuunest-module test`, porque el método no existe.

```json
{
  "popular": { "url": "…", "list": "…", "fields": { … }, "hasNext": { … } },
  "search":  { … },
  "details": { "url": "…", "fields": { … }, "chapters": { … }, "extra": { … } },
  "pages":   { "url": "…", "images": { … }, "title": { … }, "imageHeaders": { … } }
}
```

## 2. Versiones de la app

Las claves marcadas **0.2.0** llegan con la app 0.2.0. Un módulo que use alguna declara `"minAppVersion": "0.2.0"` en su `manifest.json` (SPEC §6.1): una app más antigua lo marca «no compatible» en vez de fallar al usarlo (T38). El validador no lo exige; es responsabilidad del autor.

| Pieza | Desde |
| --- | --- |
| Todo lo demás de este documento | 0.1.0 |
| `pages.imageHeaders` (§7) | 0.2.0 |
| Serie sin capítulos → `chapters: []` (§6) | 0.2.0 (antes daba `PARSE`) |
| `details.extra` (§6) | 0.2.0 |
| Modificador `:raw` en variables (§3) | 0.2.0 |
| Transformaciones `date` y `map` (§9) | 0.2.0 |

## 3. Plantillas y variables

`url` (y cada valor de `imageHeaders`) es una plantilla con variables entre llaves:

| Variable | Dónde | Valor |
| --- | --- | --- |
| `{baseUrl}` | en todas | `manifest.baseUrl`, **nunca** se codifica |
| `{page}` | `popular`, `latest`, `search` | número de página; **empieza en 1** |
| `{query}` | `search` | texto buscado |
| `{id}` | `details` | `SeriesSummary.id` |
| `{chapterId}`, `{releaseId}` | `pages` (`url` e `imageHeaders`) | `Chapter.id` y `Release.id` |

- Por defecto el valor pasa por `encodeURIComponent`.
- Con el modificador **`:raw`** (`{id:raw}`, `{releaseId:raw}`…) se inserta **tal cual**. Sirve cuando el id es una ruta del sitio con `/`, `?` o `=` (los ids son opacos: la app los devuelve sin tocar).
- Una variable que el método no tiene, o un modificador distinto de `raw`, es un error de `validate` y, en ejecución, `UNSUPPORTED`.

Ejemplo (`zonatmo` guarda como id la ruta relativa de la ficha, como `/library/manhwa/9001/serie-falsa-uno` en sus fixtures):

```json
"details": { "url": "{baseUrl}{id:raw}" }
```

## 4. Campos (`FieldSpec`)

Cada dato se describe con un objeto:

| Clave | Tipo | Efecto |
| --- | --- | --- |
| `selector` | cadena | Selector CSS dentro del ámbito. Sin él, el ámbito es el propio elemento (tarjeta, capítulo, release). |
| `attr` | cadena | Atributo a leer. Sin él, el texto del elemento. |
| `regex` | cadena | Expresión regular sobre el valor leído: primer grupo de captura o, si no hay, la coincidencia entera; sin coincidencia, `""`. |
| `all` | booleano | `true`: todos los elementos (lista). Si no, solo el primero. |
| `transform` | lista | Transformaciones, en orden (§9). |

Un campo que no coincide vale `""` (o `[]` si es lista). Los **obligatorios** vacíos dan `PARSE` con `details.selector`; los opcionales vacíos se omiten.

- **`selector` es obligatorio** en los campos que se leen sobre el documento entero, sin elemento como ámbito: `details.fields.*`, `details.extra.*`, `pages.images` y `pages.title`. Solo los campos de una tarjeta, un capítulo o una release pueden omitirlo.
- En cada sitio solo se leen los nombres de campo que lista este documento (§5, §6); cualquier otro nombre se ignora. `details.extra` es la excepción: lee todas sus claves.

## 5. Listados: `popular`, `latest`, `search`

```json
{ "url": "…", "list": "<selector de cada tarjeta>", "fields": { … }, "hasNext": { "selector": "…", "exists": true } }
```

- `fields` se leen dentro de cada tarjeta: `id` y `title` (**obligatorios**), `cover`, `kind`, `nsfw`, `badges` (lista, con `all: true`) y `hint`.
- `kind` solo se acepta si es `manga`, `manhua`, `manhwa` o `comic` (usa `map` para traducir); `nsfw` acepta `true/1/yes/si/sí` y `false/0/no`.
- `hasNext` (opcional): sin él, `hasNext: false`. Con `{ selector }`, hay siguiente si el selector coincide en la página; con `exists: false`, si **no** coincide. `hasNext` es una **estimación** (ADR-0003): la app no da por hecho que la página siguiente traiga series.

`zonatmo` (`SELECTORS.card` y `/biblioteca` ordenada por «me gusta»):

```json
"popular": {
  "url": "{baseUrl}/biblioteca?order_item=likes_count&order_dir=desc&page={page}",
  "list": "div.element",
  "fields": {
    "id": { "selector": "a", "attr": "href", "regex": "^(?:https?://[^/]+)?(/[^?#]*)" },
    "title": { "selector": "div.thumbnail-title h4", "transform": ["trim"] },
    "cover": { "selector": "div.thumbnail", "attr": "data-bg", "transform": ["absoluteUrl"] },
    "kind": {
      "selector": "span.book-type",
      "transform": [["map", { "Manga": "manga", "Manhwa": "manhwa", "Manhua": "manhua" }]]
    }
  },
  "hasNext": { "selector": "a[rel=\"next\"]" }
},
"search": {
  "url": "{baseUrl}/biblioteca?order_item=likes_count&order_dir=desc&title={query}&filter_by=title&page={page}",
  "list": "div.element",
  "fields": { "…": "los mismos que popular" },
  "hasNext": { "selector": "a[rel=\"next\"]" }
}
```

## 6. Ficha: `details`

```json
{ "url": "…", "fields": { … }, "chapters": { … }, "extra": { … } }
```

- `fields`: `title` (**obligatorio**), `cover`, `description`, `status`, `kind`, `nsfw`, `genres` y `altTitles` (listas, con `all: true`).
- `status` solo se acepta si es `ongoing`, `completed`, `hiatus`, `cancelled` o `unknown`; cualquier otro valor da `unknown` (usa `map`).
- `chapters`: `{ list, fields: { id, title, number }, releases: { list, fields: { id, group, publishedAt } } }`. `id` y `title` del capítulo y `id` de la release son **obligatorios**. `publishedAt` debe ser ISO 8601 (usa `date`).
- **Una serie sin capítulos devuelve `chapters: []`** (0.2.0). Un capítulo **sin releases** sigue siendo `PARSE`: el contrato exige al menos una (SPEC §6.2). Ojo: un selector de `chapters.list` mal escrito también da `[]`; `ryuunest-module test` lo detecta porque el arnés exige capítulos en la serie de prueba.
- `extra` (0.2.0, opcional): `{ "<clave>": FieldSpec }`. Cada clave rellena `SeriesDetails.extra` con el **primer valor** del campo (o la lista unida, si lleva `join`); las claves con valor vacío se omiten.

`zonatmo` (`SELECTORS.details`):

```json
"details": {
  "url": "{baseUrl}{id:raw}",
  "fields": {
    "title": { "selector": "h1.element-title", "transform": ["trim"] },
    "cover": { "selector": "img.book-thumbnail", "attr": "src", "transform": ["absoluteUrl"] },
    "description": { "selector": "p.element-description", "transform": ["trim"] },
    "genres": { "selector": "h6 a.badge", "all": true, "transform": ["trim"] },
    "status": {
      "selector": "span.book-status",
      "transform": [["map", {
        "En emisión": "ongoing", "Finalizado": "completed",
        "Completado": "completed", "En pausa": "hiatus", "Cancelado": "cancelled"
      }]]
    }
  },
  "extra": {
    "Puntuación": { "selector": "div.element-image div.score span", "transform": ["trim"] },
    "Demografía": { "selector": "div.element-image div.demography", "transform": ["trim"] },
    "Autor": { "selector": "a[href*=\"filter_by=author\"]", "all": true, "transform": ["trim", ["join", ", "]] }
  },
  "chapters": {
    "list": "li.upload-link",
    "fields": {
      "id": { "selector": "span.chapter-number", "transform": ["trim"] },
      "title": { "selector": "span.chapter-number", "transform": ["trim"] },
      "number": { "selector": "span.chapter-number", "attr": "data-number", "transform": ["number"] }
    },
    "releases": {
      "list": "div.chapter-detail div.d-flex.align-items-center.flex-wrap",
      "fields": {
        "id": { "selector": "a.btn.btn-primary", "attr": "href", "regex": "^(?:https?://[^/]+)?(/[^#]*)" },
        "group": { "selector": "a[href*=\"/groups/\"]", "transform": ["trim"] },
        "publishedAt": { "selector": "span.text-muted.small", "transform": [["date", "DD/MM/YYYY"]] }
      }
    }
  }
}
```

Las etiquetas del `map` de `status` salen de la tabla `STATUSES` del módulo (filtros de la biblioteca); el `script` real decide por expresiones regulares sobre la clase y el texto, así que **hay que comprobarlas en el sitio** antes de publicar algo así.

## 7. Páginas: `pages`

```json
{ "url": "…", "images": { … }, "title": { … }, "imageHeaders": { "<Cabecera>": "<plantilla>" } }
```

- `images` (**obligatorio**) se lee siempre como lista; ninguna imagen es `PARSE`.
- `title` (opcional): título del capítulo en el lector.
- `imageHeaders` (0.2.0, opcional): mapa de cabeceras que se envían al descargar **cada imagen** (`ImageRef.headers`, RF-24). Cada valor es una plantilla con las variables de `pages` (§3). Cubre `Referer` y `User-Agent`, que muchos sitios exigen (`m440` responde 403 sin `Referer`).
- Las portadas (`cover`) **no** llevan cabeceras en la API 1: es una reserva aditiva (§10).

`zonatmo` (`SELECTORS.pages` e `imageRef`):

```json
"pages": {
  "url": "{baseUrl}{releaseId:raw}",
  "images": { "selector": "img.reader-image", "attr": "src", "transform": ["absoluteUrl"] },
  "title": { "selector": "#chapterSelect option[selected]", "transform": ["trim"] },
  "imageHeaders": {
    "Referer": "{baseUrl}/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
  }
}
```

## 8. Red y errores

- Cada método hace **un** `host.fetch(url)` (GET, sin cabeceras propias) y lee el cuerpo como HTML. Los permisos de dominio, el tiempo límite y la concurrencia son del host (SPEC §6.5).
- Solo `200` es éxito: `404` → `NOT_FOUND`, `429` → `RATE_LIMITED`, `401`/`403` → `BLOCKED`, el resto → `NETWORK`.
- Un selector CSS inválido es `PARSE` con `details.selector`; una expresión regular inválida, una transformación o variable desconocida, `UNSUPPORTED`.
- `cover` sale como `{ url }`; las imágenes, como `{ url, headers? }`.

## 9. Transformaciones

Se escriben como nombre (`"trim"`) o como lista con argumentos (`["replace", "a", "b"]`) y se aplican en orden.

| Nombre | Argumentos | Efecto |
| --- | --- | --- |
| `trim` | — | Quita espacios al principio y al final. |
| `path` | — | Último segmento de la ruta (`/serie/x?p=1` → `x`). |
| `absoluteUrl` | — | Resuelve una URL relativa contra `baseUrl`. |
| `regex` | patrón | Primer grupo de captura (o la coincidencia); sin coincidencia, `""`. |
| `number` | — | Primer número (signo y decimales con punto). |
| `replace` | patrón, reemplazo (opcional, `""`) | Sustituye **todas** las coincidencias (expresión regular). |
| `join` | separador | Une la lista en un valor. **Solo** con `all: true`. Omite los vacíos. |
| `date` (0.2.0) | formato | Fecha del sitio → ISO 8601 (ver abajo). |
| `map` (0.2.0) | objeto | Traduce el valor (ver abajo). |

**`date`.** El formato combina los tokens `YYYY` (4 dígitos), `MM`, `DD`, `HH`, `mm` y `ss` (1 o 2 dígitos) con texto literal. `YYYY`, `MM` y `DD` son obligatorios. El valor (recortado) tiene que encajar **entero** con el formato; si no encaja o la fecha no existe (`31/02/2024`), el resultado es `""` y el campo se omite. Sin hora devuelve solo la fecha (`2026-05-27`); con hora devuelve UTC (`2026-05-27T18:30:00Z`, segundos `00` si faltan). No interpreta fechas relativas («hace 2 h»); para eso hace falta un `script`. No hay forma de escapar un token: `MM`, `DD`, `HH`, `mm` o `ss` dentro del texto literal se leen siempre como tokens (si el sitio los escribe, recorta antes con `regex`).

```json
["date", "DD/MM/YYYY"]            "27/05/2026"        → "2026-05-27"
["date", "YYYY-MM-DD HH:mm"]      "2026-05-27 18:30"  → "2026-05-27T18:30:00Z"
```

**`map`.** `["map", { "<valor del sitio>": "<valor>" }]`. Compara el valor recortado y **sin distinguir mayúsculas** con cada clave (también recortada). Si coincide, devuelve el valor asociado; si no, deja el valor igual (y `status`/`kind` caen a su valor por defecto). Solo se usan las claves propias del objeto.

## 10. Fuera del formato (API 1)

| Caso | Qué hacer |
| --- | --- |
| JSON, `POST`, cookies, redirecciones a mano, cifrado, lógica condicional (L7) | Módulo `script`. `zonatmo` usa un espejo JSON de respaldo y `m440` descifra su lista de capítulos: ninguno de los dos cabe entero en declarativo. |
| Cabeceras en las portadas (`cover`) | Reserva aditiva (relacionada con F35). |
| Cabeceras o método propios en la petición de la página | `script`. |
| Fechas relativas («hace 2 h») | `script`. |
| Campos fuera del contrato (`related` de `zonatmo`) | No se pueden expresar; los ignora la app. |

Una clave nueva en este formato es un cambio **aditivo** (ADR-0003, Decisión 3): se documenta aquí con la versión de la app que la trae y los módulos que la usan declaran `minAppVersion`.
