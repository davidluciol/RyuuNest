# docs/ASSETS.md: registro de recursos de terceros

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
   **Excepción:** el arte hecho por artistas para RyuuNest va bajo **CC BY-NC-ND 4.0**
   (`LICENSE-ART.md`, P-196), con la aceptación por escrito del artista. Se registra en la
   tabla de imágenes con el estado **«Artista»**, su autor y su enlace.
4. Cada marcador temporal se marca como **temporal** y se revisa antes de la v1.0.

## Fuentes

| Recurso | Versión / pesos | Licencia | Origen | Estado |
|---|---|---|---|---|
| **Manrope** | 4.505 (estáticos 600, 700) | SIL Open Font License 1.1 (OFL-1.1) | `github.com/googlefonts/manrope` → `fonts/ttf/` (descarga 2026-10-16; el repo original `sharanda/manrope` fue borrado) | **Incluida** (F03): `apps/mobile/assets/fonts/Manrope-SemiBold.ttf`, `Manrope-Bold.ttf` + `LICENSE-Manrope.txt`; copias servidas como estáticos locales en `apps/web/public/fonts/` (F24, RNF-5) |
| **Inter** | 4.1 (estáticos 400, 500, 600) | SIL Open Font License 1.1 (OFL-1.1) | release oficial `github.com/rsms/inter` v4.1 → `extras/ttf/` (descarga 2026-10-16) | **Incluida** (F03): `apps/mobile/assets/fonts/Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf` + `LICENSE-Inter.txt`; copias servidas como estáticos locales en `apps/web/public/fonts/` (F24, RNF-5) |
| **JetBrains Mono** | 2.304 (estáticos 400, 500) | SIL Open Font License 1.1 (OFL-1.1) | release oficial `github.com/JetBrains/JetBrainsMono` v2.304 → `fonts/ttf/` (descarga 2026-11-06; SHA-256 Regular `a0bf60ef…d138f`, Medium `31c92d01…4d3d`) | **Incluida** (F34.2): `apps/mobile/assets/fonts/JetBrainsMono-Regular.ttf`, `JetBrainsMono-Medium.ttf` + `LICENSE-JetBrainsMono.txt` (OFL.txt del release); copias servidas como estáticos locales en `apps/web/public/fonts/` (RNF-5). Token `typography.mono`: códigos y detalle técnico |

Notas: un archivo de fuente por peso, cargado explícitamente; sin pesos sintéticos
(`docs/SPEC.md` §11.3). Los nombres embebidos llevan el peso integrado (`Manrope-SemiBold`,
`Inter-Medium`…): el `fontFamily` de React Native por peso es el nombre PostScript del
archivo, listado en `packages/ui-tokens/src/fonts.ts` (`fontFiles`). La puerta automática
`apps/mobile/tests/fonts.test.ts` comprueba existencia, formato, nombre embebido y licencia.

## Iconos

| Recurso | Licencia | Origen | Estado |
|---|---|---|---|
| **Lucide** (`lucide-react-native@^1.57.0` en móvil/TV, `lucide-react@1.66.0` en web) | ISC | `github.com/lucide-icons/lucide` (paquete npm, instalado con `npx expo install` para la versión compatible con SDK 57) | **Incluido** (F03): punto de entrada único `apps/mobile/src/icons.ts`; requiere `react-native-svg@15.15.4` (par nativo, mismo origen ISC/MIT de su paquete). **Web (F24):** `lucide-react@1.66.0` con punto de entrada único `apps/web/src/icons.ts`; la puerta `apps/web/tests/sourceGuards.test.ts` prohíbe importar `lucide-react` a mano desde otra fuente |

| **Tabler Icons** (solo los logos de redes sociales, v3.53.0) | MIT © 2020-2026 Paweł Kuna | `github.com/tabler/tabler-icons` → `icons/outline/brand-{instagram,telegram,x,tiktok,youtube,discord,twitch,patreon,deviantart,bluesky,threads,facebook,behance,linktree,github}.svg` (copia de los trazos `d`, 2026-11-27; sin dependencia npm) | **Incluido** (Acerca de): `apps/mobile/src/about/socialIcons.ts`, dibujado por `components/SocialIcon.tsx`. Misma rejilla que Lucide (24×24, trazo 2). Las marcas son de sus dueños: solo se usan para enlazar al perfil del artista. Las redes sin logo en Tabler (Ko-fi, pixiv, ArtStation, web) usan el genérico de Lucide |

Notas: un único conjunto de iconos SVG para la interfaz (Lucide; Tabler solo aporta logos de redes), un icono por significado; sin emojis ni glifos de
texto (`docs/DESIGN_RULES.md` V4). La puerta `apps/mobile/tests/icons.test.ts` prohíbe emojis en
`src/` y que otra pantalla importe `lucide-react-native` a mano.

## Imágenes y marcadores temporales

| Recurso | Licencia / situación | Ubicación | Estado |
|---|---|---|---|
| Dragón y arte de pantallas del diseño | Marcadores generados con IA | `assets/placeholder/` | Temporal |
| `dragon.svg` (dragón marcador de estados, F08) | Silueta vectorial **original** del proyecto (GPL-3.0), dibujada a mano; registro en `apps/mobile/assets/placeholder/README.md` | `apps/mobile/assets/placeholder/` | Temporal — artista pendiente |
| `page-1.svg`, `page-2.svg`, `page-3.svg` (páginas de ejemplo del lector, F18) | Formas vectoriales **originales** del proyecto (GPL-3.0), sin texto ni obras; registro en `apps/mobile/assets/placeholder/README.md` | `apps/mobile/assets/placeholder/` | Temporal — solo web y pruebas |
| Portadas, avatar y dragón de `design/` | Marcadores de ejemplo (nunca se enlazan por URL) | `assets/placeholder/` | Temporal |
| `apps/web/public/favicon.png` | Derivado de la silueta vectorial **original** del dragón (GPL-3.0, F08) | `apps/web/public/` | **Incluido** (F24): favicon local del cliente web, sin recurso remoto |

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
ubicación y estado. Si la licencia no es libre o no comercial, el recurso **no se añade**
(salvo el arte de artistas de la regla 3).
