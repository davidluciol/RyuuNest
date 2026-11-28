# RyuuNest — logotipo

El mismo isotipo vectorial del dragón que protege su libro/nido se emplea en los cuatro temas. Se han reducido los detalles del ojo y la altura de los cuernos con respecto al primer concepto.

| Tema | Acento del logotipo |
|---|---|
| Dragon Night | `#35C98A` |
| Ember Hearth | `#E58E3C` |
| Moonlit Frost | `#58A6FF` |
| Arcane Vault | `#9B7BFF` |

Los colores siguen la descripción de acentos de los documentos DESIGN.md y el token `primary-container`.

## Archivos

- `ryuunest-<tema>.svg`: fuente vectorial con fondo transparente y un solo relleno. Todos comparten exactamente la misma geometría.
- `ryuunest-<tema>.png`: exportación transparente de 1024 × 1024 px.
- `ryuunest-monochrome-black.svg/.png` y `ryuunest-monochrome-white.svg/.png`: variantes monocromáticas para fondos claros y oscuros.
- `ryuunest-adaptive.svg`: usa `currentColor` para el color heredado en una incorporación SVG que admita esta propiedad.
- `ryuunest-preview.png`: muestra los cuatro temas y las pruebas de reducción.

Usa el SVG en interfaces escalables e iconos de navegación. Para los recursos nativos, exporta el SVG o utiliza los PNG suministrados como primer plano. Mantén las proporciones y evita deformar, añadir sombras o incluir texto dentro del símbolo. El icono adaptativo del lanzador puede necesitar su propio fondo y márgenes según plataforma.
