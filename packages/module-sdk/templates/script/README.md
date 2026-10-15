# {{name}}

Módulo **script** de RyuuNest para `{{baseUrl}}`.

| Archivo         | Qué es                                            |
| --------------- | ------------------------------------------------- |
| `manifest.json` | Metadatos del módulo (SPEC §6.1).                 |
| `module.js`     | Módulo ES que exporta `create(host)` (SPEC §6.5). |

El módulo solo puede usar `host.*`; el host aplica los permisos de dominio, el tiempo
límite, el máximo de peticiones simultáneas y la pausa entre peticiones. `module.js`
trae los selectores del **sitio falso de pruebas** (`@ryuunest/test-site`), así que
puedes probarlo sin tocar nada.

## Siguientes pasos

1. Revisa `manifest.json`: `kinds`, `lang`, `nsfw` y `permissions.domains`.
2. Ajusta las URL y los selectores de `module.js`.
3. Comprueba el módulo contra las fixtures y empaquétalo:

   ```sh
   ryuunest-module validate .
   ryuunest-module test .
   ryuunest-module pack .
   ```
