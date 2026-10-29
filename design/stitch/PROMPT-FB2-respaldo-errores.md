# Prompt para Stitch — FB2 + Respaldo (F21/F29)

> Generado el 2026-10-28 al cerrar F29 y F21 (P-96). Estos elementos quedaron
> **sin diseño** (P-30) y se compusieron con `DESIGN.md`; este bloque los
> pide a Stitch para que FB2 los diseñe y F28/F33 los comparen después.
> La autoridad sigue siendo SPEC → `DESIGN_RULES.md` → `DESIGN.md` → PNG.

## Bloque base (pegar tal cual, de `DESIGN_RULES.md` §7)

```text
Interfaz móvil en español para un lector de manga con sistema de diseño Dragon Night.
Una sola cabecera y una sola barra inferior (Inicio, Biblioteca, Descubrir, Fuentes, Ajustes)
iguales en todas las pantallas. Una etiqueta por concepto, sin textos de ambiente ni tarjetas
de mascota. Usar solo los colores del sistema de diseño: esmeralda únicamente para la acción
principal, la selección y el foco; ámbar únicamente para el progreso; el resto en neutros.
Sin sombras ni degradados de brillo. Datos de ejemplo ficticios y coherentes entre pantallas:
series inventadas, sin autores ni editoriales reales, portadas sin texto. Sin sincronización en
la nube, descargas, notificaciones, perfiles, niveles, valoraciones ni totales de obras.
Títulos de serie a dos líneas, sin puntos suspensivos. Cuerpo de 16 px, áreas táctiles de 48 dp.
```

## Tokens exactos (SPEC §11.9 — no inventar otros)

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#0B0E14` | Nivel 0: fondo |
| `surface` | `#141923` | Nivel 1: tarjetas, filas, campos, banner inline |
| `elevated` | `#1B2230` | Nivel 2: hojas, diálogos, toast, barra inferior |
| `border` | `#263147` | Contorno fantasma de 1 px |
| `text-primary` | `#F2F0EA` | Texto principal |
| `text-secondary` | `#9BA5B5` | Texto secundario (solo sobre bg/surface/elevated) |
| `accent` | `#35C98A` | Acción principal, foco, selección, severidad «info» |
| `progress` | `#FF9F43` | Avance y capítulo en curso; nada más |
| `positive` | `#4DD599` | Éxito |
| `warning` | `#F5C451` | Advertencia |
| `error` | `#F06A6A` | Error y acciones destructivas |

Tipografía: Manrope (600/700) para títulos, Inter (400/500/600) para cuerpo. Radios: control 8, tarjeta 12, hoja 16 (esquinas superiores), pill completo para chips. Relleno de filas 16 px, alto mínimo de fila 56 px, área táctil 48 dp.

## Pantallas y piezas a generar (en este orden)

1. **Ajustes con la sección «Respaldo»** (la pantalla `ajustes_pantalla` ya existe; añadir la sección al final, tras «Almacenamiento y caché»): encabezado de sección «Respaldo» y dos filas de ajustes — «Exportar respaldo» (hint: «Guarda tu biblioteca, progreso y ajustes en un archivo JSON para compartirlo o guardarlo.») y «Importar respaldo» (hint: «Recupera tu biblioteca, progreso y ajustes desde un archivo de respaldo.»); cada fila con un botón secundario a la derecha. Un solo botón primario por pantalla: aquí no hay ninguno.

2. **Hoja de modo de importación** (hoja de nivel 2, esquinas superiores 16 px, nivel `elevated`, sin sombra): título «Importar respaldo», línea «Elige cómo aplicar el respaldo:», opción «Fusionar» con hint «Añade lo que falta y actualiza lo más reciente; no borra nada.» (botón primario), opción «Reemplazar» con hint «Borra el estado actual y restaura el del respaldo.» (botón destructivo: borde y texto `error`, sin relleno), y «Cancelar» (secundario).

3. **Hoja de confirmación de reemplazo** (hoja de nivel 2): título «Reemplazar el estado actual», texto de aviso «Se borrará tu biblioteca, progreso y ajustes actuales y se restaurarán los del respaldo. Esta acción no se puede deshacer.» (en `error` o con icono de advertencia), botones «Cancelar» (secundario) y «Reemplazar» (destructivo).

4. **Hoja de sugerencias del respaldo** (hoja de nivel 2): título «Fuentes del respaldo», línea «El respaldo sugiere estos repositorios y módulos. Nada se instala solo: confirma cada uno.»; lista de repos (nombre + URL, botón «Añadir» que pasa a «Añadido» deshabilitado) y de módulos (fila de módulo: nombre, metadatos «Manga · es · v1.0.0», insignias neutras, acción «Ir a Fuentes»); estado vacío: «El respaldo no sugiere repositorios ni módulos.»; «Cerrar» (secundario).

5. **Toast** (aviso transitorio): pill/bloque de nivel `elevated` con borde de 1 px del color de severidad (`accent` info, `warning` advertencia, `error` error), una línea de texto `text-primary`, acción opcional a la derecha en el color de severidad y botón de cerrar; alto mínimo 48 px; desaparece a los 4 s (mostrar el estado estático).

6. **Banner inline de error** (dentro de la pantalla, nivel `surface`, borde del color de severidad, radio de control): causa en Manrope, código en etiqueta del color de severidad, explicación en Inter `text-secondary`, acciones «Reintentar» y «Ver detalle» como enlaces en el color de severidad, y el detalle desplegado (caja `surface` con borde: «módulo: …», «URL: …», «código: …», «selector: …»).

7. **Diálogo de error bloqueante** (nivel 2 centrado, `elevated`, radio de tarjeta, sin sombra, velo oscurecido): título en Manrope, código en etiqueta del color de severidad, explicación simple en Inter, «Ver detalle» desplegable (misma caja del banner), botones «Cerrar» (secundario) y «Reintentar» (primario).

8. **Ajustes → Diagnóstico** (para F30, FB2): lista de registros del diagnóstico (fecha, nivel con insignia neutra, código, mensaje de una línea), acciones «Exportar» (JSON + texto) y «Borrar» (destructivo, con confirmación), y estado vacío con dragón marcador, título y una acción.

## Reglas que el diseño no puede romper

- Una etiqueta por concepto; sin jerga técnica visible (no «RF-37», no «SQLite»); el código de error aparece solo como dato técnico dentro del detalle desplegable.
- Nada fuera de la v1: sin sincronización, descargas, contador de no leídos, campana, perfiles, temas, OLED ni «Optimizar SQLite».
- Sin tarjeta-mascota ni avisos de relleno; sin promesas que la v1 no cumple («tus datos jamás viajan…» junto a exportación a archivo sí es válido: el respaldo es local).
- Un botón primario por pantalla/hoja; el destructivo solo para acciones irreversibles (Reemplazar, Borrar registros).
- Datos de ejemplo coherentes con el resto de la app (mismos fixtures: «El dragón de ceniza», «Repositorio de ejemplo», módulo «m-ejemplo-a»).
- Portadas sin texto; sin obras, autores ni sitios reales.
