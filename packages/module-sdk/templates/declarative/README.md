# {{name}}

Módulo **declarativo** de RyuuNest para `{{baseUrl}}`.

| Archivo         | Qué es                                               |
| --------------- | ---------------------------------------------------- |
| `manifest.json` | Metadatos del módulo (SPEC §6.1).                    |
| `index.json`    | Configuración declarativa con selectores (SPEC §6.6). |

`index.json` viene con los selectores del **sitio falso de pruebas**
(`@ryuunest/test-site`), así que puedes probarlo sin tocar nada. Para un sitio real,
sustituye los selectores y las URL. El formato completo está en
`docs/declarative-format.md` del repositorio de RyuuNest.

La plantilla trae ejemplos de las claves que llegan con la app 0.2.0 (por eso el
manifest declara `"minAppVersion": "0.2.0"`):

- `map` en `details.fields.status`: traduce la etiqueta del sitio («En curso») al valor
  del contrato (`ongoing`).
- `date` en `publishedAt`: convierte la fecha del sitio a ISO 8601.
- `details.extra`: datos libres de la ficha («Origen»).
- `pages.imageHeaders`: cabeceras de cada imagen (por ejemplo `Referer`).

Si no usas ninguna, puedes quitar `minAppVersion`.

## Siguientes pasos

1. Revisa `manifest.json`: `kinds`, `lang`, `nsfw` y `permissions.domains`.
2. Ajusta los selectores y los campos de `index.json`.
3. Comprueba el módulo y empaquétalo:

   ```sh
   ryuunest-module validate .
   ryuunest-module test .
   ryuunest-module pack .
   ```
