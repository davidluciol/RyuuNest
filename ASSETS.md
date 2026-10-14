# ASSETS.md: registro de recursos de terceros

RyuuNest se distribuye bajo **GPL-3.0**. Todo recurso de terceros que se incluya en el
repositorio o se empaquete en la app **debe registrar aquí su licencia y su origen**. En un
repositorio GPL-3.0 no entran recursos con licencias no libres o no comerciales
(`docs/SPEC.md` §12 y §15).

Este archivo cubre **recursos gráficos**: fuentes, iconos e imágenes. Las dependencias de
código se registran con su licencia en los `package.json` y en `pnpm-lock.yaml`.

## Reglas

1. Sin CDN ni recursos remotos: fuentes e iconos se empaquetan localmente (RNF-5).
2. Un recurso sin licencia registrada aquí no se usa.
3. Licencias admitidas: libres y comerciales (por ejemplo OFL, ISC, MIT, BSD, Apache-2.0).
4. Cada marcador temporal se marca como **temporal** y se revisa antes de la v1.0.

## Fuentes

| Recurso | Versión / pesos | Licencia | Origen | Estado |
|---|---|---|---|---|
| **Manrope** | 600, 700 | SIL Open Font License 1.1 (OFL-1.1) | Proyecto Manrope | Previsto (F03) |
| **Inter** | 400, 500, 600 | SIL Open Font License 1.1 (OFL-1.1) | Proyecto Inter | Previsto (F03) |

Notas: un archivo de fuente por peso, cargado explícitamente; sin pesos sintéticos
(`docs/SPEC.md` §11.3).

## Iconos

| Recurso | Licencia | Origen | Estado |
|---|---|---|---|
| **Lucide** (`lucide-react-native` en móvil/TV, `lucide-react` en web) | ISC | Proyecto Lucide | Previsto (F03) |

Notas: un único conjunto de iconos SVG, un icono por significado; sin emojis ni glifos de
texto (`DESIGN_RULES.md` V4).

## Imágenes y marcadores temporales

| Recurso | Licencia / situación | Ubicación | Estado |
|---|---|---|---|
| Dragón y arte de pantallas del diseño | Marcadores generados con IA | `assets/placeholder/` | Temporal |
| Portadas, avatar y dragón de `design/` | Marcadores de ejemplo (nunca se enlazan por URL) | `assets/placeholder/` | Temporal |

Reglas de los marcadores (`docs/SPEC.md` §12):

- Viven solo en `assets/placeholder/`, con un `README` que registra herramienta, fecha e
  indicaciones usadas, y una marca clara de **temporal**.
- No se emplean personajes ni estilos de obras protegidas.
- No se enlazan las imágenes remotas del HTML del diseño (portadas con obras reales o con
  texto); se usan marcadores sin texto.
- Antes de la v1.0 pública se reemplazan los marcadores o se confirma su situación de
  licencia. Ninguna pantalla depende del arte final.

## Cómo registrar un recurso nuevo

Añade una fila en la tabla que corresponda con: recurso, versión/pesos, licencia, origen,
ubicación y estado. Si la licencia no es libre o no comercial, el recurso **no se añade**.
