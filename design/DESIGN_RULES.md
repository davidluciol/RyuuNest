# RyuuNest: reglas de diseño contra el AI-slop

> Para el agente que implemente o regenere la interfaz. Se lee antes de tocar cualquier pantalla.
> Nace de la revisión de 7 capturas del tema Dragon Night (Inicio, Biblioteca, Descubrir, Fuentes, Lector, Detalle, Ajustes).
> Complementa `SPEC.md` (comportamiento y alcance) y `design/stitch/` (apariencia). Si chocan: SPEC > estas reglas > plantilla.

**Principio.** Si un elemento no responde a un requisito del SPEC o a una necesidad de quien lee, no existe. Un detalle bonito que nadie pidió es relleno.

---

## 1. Qué se toma de la plantilla y qué no

| Se toma | No se toma |
|---|---|
| Estructura de pantallas y orden de secciones | Cabeceras, textos y nombres de sección |
| Jerarquía (CTA de continuar, tarjeta de módulo, fila de capítulo) | Datos, cifras, series, autores y portadas |
| Patrón de error de módulo (causa, código, reintentar, ver detalle) | Funciones fuera de la v1 (sección 4) |
| Tokens de la sección 11.9 del SPEC | Cualquier color escrito a mano en el HTML |

---

## 2. Texto

| # | Regla | Por qué |
|---|---|---|
| T1 | La barra inferior usa **una etiqueta funcional por destino**, igual en todas las pantallas: Inicio, Biblioteca, Descubrir, Fuentes, Ajustes. | En las capturas, la barra cambia a "Guarida, Tesoros, Aventuras, Portales, Config" en Fuentes y Ajustes. |
| T2 | **Un nombre por concepto.** Descubrir (no "Exploración del Nido"). "Tesoros" solo significa Biblioteca (no "Tesoros Populares"). Modo "Vertical continuo" (no "Cascada", que es jerga del código de TMO). | La captura de Descubrir tiene tres nombres para la misma pantalla. "Cascada" y "Vertical" se alternan para el mismo modo. |
| T3 | **Un toque temático por pantalla, en el encabezado.** Nada en botones, avisos ni pie de pantalla. | El tema temático es identidad, no contenido. |
| T4 | **Prohibida la tarjeta-mascota al pie.** Ejemplos vistos: "Modo Santuario disponible", "Guardián del Nido · OLED Ready", "El Dragón de RyuuNest vigila…", "Seguridad del Nido". | Aparece al final de 5 de 7 pantallas con el mismo patrón: es relleno de plantilla. |
| T5 | Ninguna jerga técnica ni identificador interno en la interfaz: `RF-34`, "blur 16px", "SQLite", "Ryuu Core v1.4", "OLED Ready", "Arquitectura Nativa". | `RF-34` aparece como insignia en Ajustes: el generador copió el SPEC a la interfaz. |
| T6 | **No afirmar lo que la v1 no hace.** "Sandbox activado" (D-5: sin aislamiento), "paquete cifrado" (el respaldo es JSON legible), "Oficial", "tus datos jamás viajan a servidores ajenos" junto a sincronización con Google Drive. | Son promesas falsas de seguridad y privacidad. |
| T7 | Nada importante termina en "…". Títulos de serie a dos líneas; si aun así no caben, se rediseña la tarjeta. | En Biblioteca casi todos los títulos aparecen cortados ("Solo Leveli…", "Chainsaw …"). |
| T8 | Las cadenas van al archivo de traducciones. Ninguna en inglés suelta. | La pantalla de Serie se titula "Manga Detail". |

---

## 3. Datos de ejemplo

| # | Regla |
|---|---|
| D1 | **Un solo conjunto de datos, coherente en todas las pantallas.** Las cifras cuadran: 48 favoritos = suma de carpetas más los que no tienen carpeta (D-12: una carpeta o ninguna). El mismo capítulo muestra el mismo porcentaje en todos lados. |
| D2 | **Sin obras, autores, editoriales ni sitios reales.** Nada de Berserk, Frieren, Shueisha, Naver Webtoon, MangaDex ni Asura. Se usan nombres inventados y "Módulo de ejemplo A". |
| D3 | **Portadas sin texto.** Generarlas con "sin letras ni rótulos". Revisar cada una: en las capturas hay portadas con el título de la pantalla horneado en la imagen ("Descubrir - Aventuras (Dragon Night)"). |
| D4 | **Solo cifras que un módulo puede dar.** El contrato devuelve `hasNext`, no totales. Fuera: "1,420 obras", "página 1 de 48", vistas ("1.4M"), rankings, "popularidad ★★★★★". Una valoración, si existe, viene como insignia de texto. |
| D5 | Valoraciones variadas y plausibles, o ninguna. Nueve series con 9,4 a 9,9 parecen inventadas. |

Contradicciones reales en las capturas, como ejemplo de lo que D1 evita: la misma serie aparece al 78 %, al 43 % y al 42 %. Inicio dice 3 carpetas y Biblioteca dice 4. Las carpetas de Inicio suman 54 obras con 48 favoritos.

---

## 4. Alcance de la v1: no se dibuja

Si el diseño muestra algo de esta lista, se quita, o se marca "v2" y no se implementa. Cada diferencia aceptada se anota en `design/stitch/DIFFS.md`.

- Sincronización en la nube (Google Drive, Dropbox), chip "Sincronizado", "Solo con Wi-Fi".
- Descargas y modo sin conexión: "caps offline", icono de nube con check, botón Descargar, "Capítulos offline".
- Contador de no leídos y chip "Completado".
- Campana de notificaciones.
- Perfil, nivel, rango, "espíritu protector", apodo y título.
- Marcador en el lector, obras similares, orden y filtro por género en Descubrir, interruptor "Páginas / Infinito".
- Respaldo automático, "Optimizar SQLite", inicio de sesión en módulos.

Lo que el SPEC exige y las capturas no muestran: **idioma de la interfaz** (RF-39), **permisos y marca NSFW de cada módulo** (RF-3), **selector de capítulo** en el lector (RF-22).

---

## 5. Visual

| # | Regla |
|---|---|
| V1 | **Presupuesto de color.** Esmeralda (`accent`): acción primaria, selección, foco y destino activo. Nada más. Insignias de tipo y estado en neutro; enlaces secundarios ("Ver todas", "Gestionar") en `text` con chevron. Ámbar (`progress`): avance y capítulo en curso. No para avisos de actualización, "Retomar" ni números de capítulo. |
| V2 | **Cero hexadecimales en el código de la interfaz.** Solo tokens. Un lint lo comprueba. En las capturas, el mismo botón primario usa `#59E6A4` en Inicio y `#38C88A` en Detalle, y "Actualizar" usa `#FFB77A`. Son valores autogenerados por Stitch, no los de la sección 11.9 del SPEC. |
| V3 | **Un botón primario por pantalla.** El avatar de la cabecera no usa el color del botón primario. |
| V4 | **Un icono por significado.** Favorito es siempre el mismo (corazón). Hoy hay corazón, marcador y estrella. Los títulos de sección llevan un icono monocromo `text-secondary` o ninguno, no uno de color distinto cada vez. |
| V5 | **Una cabecera, un componente.** El logo es un recurso local; el texto alternativo nunca se dibuja. En 3 capturas se ve "RyuuNest Dragon Icon" como texto roto y "Ini…" sobrante. |
| V6 | **Densidad.** Inicio, 4 secciones como máximo. Un solo acceso a carpetas por pantalla (hoy están en Inicio, en el chip "Carpetas" y en "Nidos y Carpetas"). |
| V7 | **Tarjeta de serie:** insignia de tipo más, como mucho, un estado sobre la portada. La ranura de metadatos tiene un solo tipo de contenido. Hoy mezcla corazón, "Ayer", pausa, check, "Hoy" y porcentaje. Sin corazón dentro de una biblioteca que ya es de favoritos. Sin menú ⋮ por tarjeta: se abre al mantener pulsado. |
| V8 | **Leído se atenúa y lleva ✓. No se tacha.** Máximo dos señales por estado; hoy hay cuatro (tachado, "Leído", ✓, 100 %). |
| V9 | **Controles de solo icono:** dos por fila como máximo y con etiqueta accesible. La fila de capítulo muestra una acción visible y el resto en un menú. |
| V10 | **Lector (RF-22):** cerrar, título, selector de capítulo, modo de lectura y progreso. Nada decorativo. |
| V11 | **Dragon Night es plano.** Sin brillos ni degradados de tinte en tarjetas; la profundidad sale de los niveles de superficie. Los brillos pertenecen a los temas que los declaran. |
| V12 | **Tamaños.** Cuerpo de 16 px en listas; metadatos de 12 px como mínimo; área táctil de 48 dp. |
| V13 | **Los estados incompatibles no conviven.** Un módulo "retenido temporalmente" no tiene el interruptor encendido. |

---

## 6. Lista de 20 segundos antes de aprobar una pantalla

- [ ] ¿Algún texto depende del tema para entenderse?
- [ ] ¿Las cifras cuadran con las demás pantallas?
- [ ] ¿Hay algún hexadecimal o tamaño escrito a mano?
- [ ] ¿Algún título o dato importante termina en "…"?
- [ ] ¿Aparece algo de la sección 4?
- [ ] ¿Hay una tarjeta-mascota o un aviso de relleno?
- [ ] ¿Las portadas llevan texto o son obras reales?
- [ ] ¿La barra inferior y la cabecera son las de las demás pantallas?
- [ ] ¿Hay más de un botón primario?
- [ ] ¿Una función se anuncia con una promesa que la v1 no cumple?

---

## 7. Bloque para pegar en Stitch al regenerar pantallas

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
