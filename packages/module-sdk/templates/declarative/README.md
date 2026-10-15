# {{name}}

Módulo **declarativo** de RyuuNest para `{{baseUrl}}`.

| Archivo         | Qué es                                               |
| --------------- | ---------------------------------------------------- |
| `manifest.json` | Metadatos del módulo (SPEC §6.1).                    |
| `index.json`    | Configuración declarativa con selectores (SPEC §6.6). |

`index.json` viene con los selectores del **sitio falso de pruebas**
(`@ryuunest/test-site`), así que puedes probarlo sin tocar nada. Para un sitio real,
sustituye los selectores y las URL.

## Siguientes pasos

1. Revisa `manifest.json`: `kinds`, `lang`, `nsfw` y `permissions.domains`.
2. Ajusta los selectores y los campos de `index.json`.
3. Comprueba el módulo y empaquétalo:

   ```sh
   ryuunest-module validate .
   ryuunest-module pack .
   ```
