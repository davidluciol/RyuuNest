# Análisis F33: revisión general UX/UI observable

> Fecha: 2026-11-08. Entregable único de F33 (decisión del humano): una lista clasificada de hallazgos, **sin desarrollar nada**. Cada bloqueante o importante se convertirá en tarea (o se enlazará a una existente) antes del merge. Este archivo vive aparte de `tasks/todo.md` hasta que el humano lo integre.

## 1. Alcance y método

| Superficie | Cómo se observó | Capturas |
|---|---|---|
| Web 426 / 556 / 377 / 390 / 273 px y 1440 / 1600 px | Build de `apps/web` + `f28Screens.cjs` (Playwright): datos y estado vacío; comprobaciones automáticas en verde (overflow 0, sin «…», áreas ≥ 48, tokens, fuentes locales, consola limpia, cero peticiones externas) | `docs/capturasF28/` (regeneradas y restauradas; no se tocaron) |
| App nativa (Android) | Galaxy S25 Ultra `SM-S938B` (1440 × 3120), Expo Go + Metro local, agent-device. Módulos instalados: M440, YupManga y ZonaTMO; NSFW **activado** por el humano | `docs/capturasF33/movil-*.png` |
| TV / D-pad / MiBox 4 | **No cubierto.** Sigue en F22, F23 y F37 | n/d |

Cobertura ampliada el mismo día (§4.1): hojas de añadir y gestionar, Diagnóstico, modo paginado D → I y la muestra de primer uso. **Sigue sin verse en el teléfono** (bloqueante R1): hojas de instalar, actualizar, desinstalar y quitar repositorio, primer uso real, Respaldo, diálogos de error y el modo paginado I → D.

Referencias: `DESIGN_RULES.md` (T1–T8, D1–D5, V1–V13, lista de 20 s), `design/stitch/*/screen.png` y `design/stitch/DIFFS.md`.

Leyenda: 🔴 bloqueante · 🟠 importante · 🟡 menor. «Tarea» indica dónde se resuelve; **nueva** significa que no existe todavía.

## 2. Decisiones del humano que aplican a este análisis

| # | Decisión | Efecto |
|---|---|---|
| Q1 | F33 entrega **solo este análisis**; cada tarea corrige sus hallazgos. | F33 no toca código. |
| Q2 | «Ejecuta código» y NSFW pasan a un **icono de aviso con texto de permisos**, separado de los metadatos. | Hallazgo P3. |
| Q3 | La ficha **lleva portada y sinopsis** como en Stitch. | Hallazgo S3: la ficha nativa ya lo cumple; falta la web. |

### 2.1 Respuestas del humano a las preguntas abiertas (2026-11-08)

| Pregunta | Decisión | Efecto |
|---|---|---|
| N18 Aviso NSFW | **Sí:** aviso de primera vez al abrir o instalar un módulo NSFW, para que quien no quiera ese contenido decida si sigue. | Hallazgo R3 (bloqueante, tarea nueva). |
| N1 Inicio sin datos | **Estado vacío propio** en Inicio: explica que hay que instalar un módulo y trae un botón que lleva a Fuentes (Portales). | Hallazgo N1 pasa a esta solución exacta. |
| N8 «disponibles» | **Debe seguir visible.** Los módulos pueden ser del humano o de la comunidad: Portales muestra los módulos disponibles que el humano aprueba o recomienda. Hace falta una sección **«Recomendados»** en Fuentes donde el humano pone los enlaces a «servidores de módulos» (como RyuuNest-Models) para que aparezcan más módulos. | Hallazgo R2 (bloqueante, **requiere SPEC**: ver §8). |
| Cobertura | **Repetir el recorrido nativo** de hojas de Portales, primer uso, Diagnóstico y modos paginados, y registrarlos como bloqueantes. | Hecho el 2026-11-08; hallazgos en §4.1. |

### 2.2 Segunda ronda de decisiones del humano (2026-11-08)

| Tema | Decisión | Efecto |
|---|---|---|
| «Recomendados» (R2) | **Índice remoto.** Un índice de índices que el humano actualiza cuando encuentra o le recomiendan un sitio; la app lo descarga. | F44. Es una petición de red nueva: exige actualizar RNF-5 en el SPEC (hoy «cero peticiones externas» salvo repos y módulos) y que sea **solo bajo acción del usuario** o al abrir Portales, nunca en segundo plano. «Nada se instala solo» se mantiene. |
| Aviso NSFW (R3) | **Dos avisos distintos:** (1) al **instalar**: «Estás instalando un módulo NSFW»; (2) al **abrirlo la primera vez**: advierte del contenido. En ambos, **explicar qué es NSFW** («contenido para adultos, sexual o explícito»), porque no todos lo saben. | F45. |
| R1 | **Autorizado** borrar los datos de la app o desinstalar un módulo para ver un primer uso adecuado. | Hecho: YupManga desinstalado y reinstalado desde la hoja; datos de Expo Go borrados (`pm clear`). Resultados en §4.2. |

## 3. Qué funciona bien (no tocar)

- Ajustes nativo: tarjetas por sección, interruptores con «Sí/No» y borde visible, verbos cortos («Vaciar»), chips legibles.
- Ficha nativa: portada, estado, título completo (2 líneas), género, sinopsis con «Ver más», un solo botón primario («Empezar») y «Guardar»/«Carpeta» como secundarios.
- Descubrir nativo con portadas reales: tarjetas con insignia de tipo, títulos hasta 3 líneas, selector de módulo y búsqueda en una fila.
- Tarjeta «Continuar la aventura» nativa: portada, capítulo en ámbar, barra de progreso y botón primario único.
- Barra inferior idéntica en todas las pantallas; etiqueta funcional por destino (T1).
- Tipografía: Manrope e Inter locales en web y nativo; sin serif de respaldo.
- Estados vacíos coherentes: dragón + título + una acción.

## 4. Hallazgos nativos (S25 Ultra)

| # | Sev | Pantalla | Hallazgo (evidencia) | Cambio propuesto | Tarea |
|---|---|---|---|---|---|
| N1 | 🔴 | Inicio | **Inicio muestra datos de ejemplo en un dispositivo real.** `apps/mobile/src/app/(tabs)/index.tsx` importa `SAMPLE_HOME_DATA` (`homeFixtures.ts`): «El dragón de ceniza», «Sombras de Arcano», «Favoritos Épicos 24 obras»… mientras Tesoros está vacío y Portales tiene 3 módulos instalados. Rompe D1 y es lo primero que ve quien abre la app. (`movil-inicio.png`, `movil-tesoros.png`) | Conectar Inicio al progreso y a la biblioteca reales (como `useLibraryData`). **Decisión del humano:** sin datos, estado vacío propio que dice que hay que instalar un módulo y trae un botón que lleva a Fuentes (Portales). Test en rojo: Inicio sin lecturas no muestra series. | **nueva** (F40) |
| N2 | 🟠 | Inicio | Tarjetas de carpeta con nombre cortado: «Favorito…», «Lectura …», «Comple…», y la insignia «24 obras» envuelta en dos líneas o encima del icono. T7 pide texto completo. (`movil-inicio-2.png`) | Tarjeta de carpeta a una columna o a 2 con nombre hasta 2 líneas; el contador debajo del nombre, no en un chip flotante. | **nueva** (F40) |
| N3 | 🟠 | Inicio | Portadas en blanco con solo la insignia de tipo (sin icono ni imagen) en «Lecturas recientes». La web muestra el dragón; el nativo, un rectángulo vacío. (`movil-inicio.png`) | Marcador de portada local (dragón) cuando no hay imagen, igual que la web. | F35 + **nueva** (F40) |
| N4 | 🟡 | Inicio | Títulos de sección en Title Case («Lecturas Recientes», «Tesoros Guardados», «Continuar la Aventura»); el resto de la app usa mayúscula solo inicial («Más recientes», «Almacenamiento y caché»). | Una regla: mayúscula inicial. Corregir las tres cadenas en `es.json`. | **nueva** (F40) |
| N5 | 🟡 | Inicio | «Tesoros Guardados» y «Tesoros» para dos cosas distintas: una lista de carpetas y la biblioteca. T2 pide un nombre por concepto. | «Carpetas» para la sección de carpetas. | **nueva** (F40) |
| N6 | 🟡 | Inicio | «Retomar >» y «Ver todas >» en blanco: dos enlaces con el mismo estilo y destinos distintos; «Retomar» no se entiende (¿qué retoma?). | «Ver todas» en ambos; quitar «Retomar» o llamarlo «Ver historial». | **nueva** (F40) |
| N7 | 🟠 | Portales | **Título duplicado:** la cabecera dice «Portales» y la pantalla también (`h1` «Portales»). Pasa solo aquí; Inicio, Tesoros, Aventuras y Ajustes usan la etiqueta de la cabecera. (`movil-portales.png`) | Quitar el título interno o la etiqueta de cabecera; una sola forma en las cinco pestañas. | **nueva** (F42) |
| N8 | 🟠 | Portales | «**3 instalados · 0 disponibles**» en verde: «disponibles» cuenta los no instalados, dato poco útil junto a «3 instalados». Verde = acento reservado a acción (V1). La subfrase «Gestión de repositorios y módulos independientes para tus tesoros locales» es jerga y larga. | **«Disponibles» se queda** (decisión del humano): son los módulos de los repositorios y, cuando exista, de «Recomendados» (R2). Mostrarlo en neutro, no en verde; borrar la subfrase o dejar «Repositorios y módulos». Plural correcto. | **nueva** (F42) |
| N9 | 🟠 | Portales | Insignias «Ejecuta código» y «NSFW» como píldoras idénticas a las de tipo. Es un permiso (RF-3), no un metadato. (`movil-portales.png`) | Decisión Q2: icono de aviso + texto «Ejecuta código» / «Para adultos» en una línea de permisos, aparte de «Manga, Manhwa · es · v0.1.0». | **nueva** (F42) |
| N10 | 🟡 | Portales | La lista de chips de tipo se corta a la derecha sin pista clara en el primer vistazo («Mar…»). El degradado existe, pero el chip cortado compite con el de «Manhua (2)». | Aceptable (F34.3). Revisar solo si se añaden más tipos. | — |
| N11 | 🟡 | Todas | **Botón flotante «Tools» de Expo Go** sobre la cabecera, tapa «Cap. 36» en el lector. Es del cliente de desarrollo, no de la app. | Nada: se anota para que no se reporte como defecto. En el APK no aparece. | — |
| N12 | 🟠 | Aventuras | Fila de filas horizontales («Más recientes», «Populares») con la misma obra repetible; título de tarjeta y metadatos repiten el tipo («Manhwa · En emisión · 36 caps» además de la insignia «Manhwa» sobre la portada). V7: una sola señal de tipo. (`movil-aventuras-2.png`) | Quitar el tipo del texto de la tarjeta o la insignia; dejar «En emisión · 36 caps». | **nueva** (F41) |
| N13 | 🟡 | Aventuras | La búsqueda («Buscar obras…») solo se envía con la tecla del teclado y no hay botón de buscar (ya en F38). El placeholder acaba en «…». | Ver F38; placeholder «Título». | F38 |
| N14 | 🟠 | Ficha | Cada fila de capítulo repite tres líneas: «Capítulo 36: Capítulo 36», «Sin leer» y «TMO Bot ⌄». El título duplica el número; el estado y el grupo ocupan una línea cada uno aunque sean iguales en toda la lista. (`movil-ficha-2.png`) | Una línea: «Capítulo 36». Estado solo cuando ≠ «Sin leer» (V8: leído se atenúa con ✓). El grupo en el selector de la cabecera de la lista, no por fila. | **nueva** (F41) |
| N15 | 🟡 | Ficha | Cabecera «Ficha» (T5: jerga) y ficha sin barra inferior: al entrar, el único modo de volver es la flecha. | Título = nombre de la obra o «Obra»; mantener el comportamiento de fuera de pestañas. Ver también «volver a Aventuras» (P-139). | **nueva** (F41) |
| N16 | 🟡 | Ficha | Insignia «En curso» sobre el título, y más abajo los capítulos usan «En curso» (ámbar) para lectura. Dos significados con el mismo texto. | Estado de la obra: «En emisión» (el texto ya usado en Aventuras). | **nueva** (F41) |
| N17 | 🟠 | Lector | Barra superior: título en 2 líneas + selector «Cap. 36 ⌄»; abajo prev/next, «Pág. 1 / 16», «0 %» y la píldora «Vertical continuo» flotando sobre la imagen. La píldora y la barra tapan arte; «Pág. 1/16» y «0 %» dicen casi lo mismo. (`movil-lector.png`) | Quitar el porcentaje o la página (RF-41: un indicador); mover el modo a la barra superior; que las barras se oculten con el toque central (ya existe) y no queden por defecto en la primera pantalla. | **nueva** (F43) |
| N18 | 🟡 | Lector | Con módulos NSFW activados, la **primera imagen sugerente** llena la pantalla sin aviso. Es esperado porque el humano activó NSFW, pero no hay confirmación al abrir un módulo `NSFW` por primera vez. | **Decidido:** aviso de primera vez por módulo NSFW (ver R3). | F45 |
| N19 | 🔴 | Inicio / Tesoros | **Contradicción entre pestañas:** Inicio dice «Continuar cap. 41» y 24 + 14 + 10 obras; Tesoros dice «Tus tesoros están vacíos». Mismo origen que N1. (`movil-inicio.png` vs `movil-tesoros.png`) | Se resuelve con N1. | **nueva** (F40) |
| N20 | 🟡 | Tesoros | El estado vacío usa «Añadir repositorio», que es una acción de Portales. Con repositorios ya instalados (3 módulos) la acción correcta es «Ir a Aventuras». (`movil-tesoros.png`) | CTA según el estado: sin módulos → «Ir a Portales»; con módulos → «Explorar Aventuras». | **nueva** (F40) |
| N21 | 🟡 | Ajustes | Sección «Idioma» y tarjeta «Idioma de la aplicación» repiten el mismo concepto; «Español» es texto verde sin forma de control. (`movil-ajustes.png`) | Una sola fila con valor y chevron («Idioma · Español ›»). | **nueva** (F42) |
| N22 | 🟡 | Ajustes | La tarjeta «Modo de lectura por defecto» tiene un separador entre descripción y chips; los chips ocupan 3 filas con anchos distintos. | Chips en una columna de ancho completo o control segmentado. | **nueva** (F42) |

### 4.1 Recorrido ampliado (2026-11-08): hojas de Portales, primer uso, Diagnóstico y lector paginado

Cobertura lograda en el S25 Ultra (capturas `docs/capturasF33/movil-portales-add.png`, `movil-portales-gestionar.png`, `movil-diagnostico.png`, `movil-lector-modo.png`, `movil-lector-paginado*.png`, `movil-primer-uso*.png`):

| Área | Estado | Nota |
|---|---|---|
| Hoja «Añadir repositorio» | ✅ vista | |
| Hoja «Gestionar» módulo | ✅ vista | |
| Diagnóstico | ✅ vista (45 eventos reales) | |
| Hoja «Modo de lectura» y modo paginado D → I | ✅ vistas, giro de página con toque probado | I → D no se probó |
| Primer uso (3 pasos) | ⚠️ solo la **muestra de la galería** (`/_dev/gallery`) | El flujo real exige borrar los datos de la app; no se hizo sin permiso |
| Hojas «Confirmar instalación», «Actualizar», «Desinstalar», «Quitar repositorio» | ❌ no vistas | Los 3 módulos ya estaban instalados; verlas implica instalar/desinstalar o quitar el repo oficial |
| Hojas de Respaldo y diálogos de error nativos | ❌ no vistas | Pendiente |

| # | Sev | Pantalla | Hallazgo (evidencia) | Cambio propuesto | Tarea |
|---|---|---|---|---|---|
| R1 | 🔴 | Cobertura | **Cubierto en su mayor parte** (ver §4.2): instalar, desinstalar, quitar repositorio y primer uso real. **Siguen sin verse** la hoja de actualizar, las hojas de Respaldo, los diálogos de error nativos y el modo paginado I → D. Por decisión del humano, bloqueante del merge hasta cerrarlo. | Forzar una actualización (subir la versión del módulo en el índice de prueba), importar un respaldo exportado, provocar un error de módulo y probar I → D. | F33 (continuación) |
| R2 | 🔴 | Portales | **Falta «Recomendados».** Hoy `0 disponibles` y un solo repositorio. El humano quiere una sección donde él pone los enlaces a servidores de módulos aprobados o recomendados (aparte de los repos que añade cada usuario), para que aparezcan más módulos. Cambia el SPEC (RF-1…RF-8 y «nada se instala solo»). | **Decidido: índice remoto** que el humano mantiene (§2.2). Sección «Recomendados» en Fuentes que descarga ese índice y lista los servidores de módulos; añadir uno equivale a «Añadir repositorio» con confirmación (nada se instala solo). Requiere SPEC (RNF-5), formato del índice (JSON con nombre, URL, descripción, NSFW sí/no, firma o huella) y estado sin red / índice inválido. | **nueva** (F44) |
| R3 | 🔴 | NSFW | **Sin aviso de primera vez al abrir o instalar un módulo NSFW** (decisión del humano). La primera imagen sugerente llena la pantalla (N17/N18). | **Dos avisos distintos (decisión del humano):** (1) en la hoja de instalar: «Estás instalando un módulo NSFW» con la definición («NSFW significa contenido para adultos: puede incluir escenas sexuales o explícitas»); (2) al abrir el módulo por primera vez: advertencia del contenido con «Continuar» / «Volver». Se recuerda la respuesta por módulo; texto sin tono moralista. Test en rojo + `ConfirmSheet`. | **nueva** (F45) |
| R4 | 🟠 | Gestionar módulo | La hoja muestra «Tipo de módulo: **Con código propio**» mientras la lista dice «**Ejecuta código**»: dos nombres para el mismo concepto (T2). Falta la marca NSFW y la línea de permisos (RF-3); solo hay «Dominios permitidos». «Desactivar» y «Desinstalar» (rojo) están a 52 px una de otra, sin separación (ya en F38). (`movil-portales-gestionar.png`) | Un nombre («Ejecuta código» con icono de aviso, decisión Q2) en lista y hoja; añadir permisos y NSFW; separar la acción destructiva con un espacio mayor o un paso de confirmación (ya existe `ConfirmSheet`). | F42 (+F38) |
| R5 | 🟡 | Añadir repositorio | El texto «(index.json)» es jerga (T5); el campo es de una sola línea y recorta la URL por la izquierda en el primer uso (se ve «…idluciol/RyuuNest-Models/main/index.json»). (`movil-portales-add.png`, `movil-primer-uso-2.png`) | «Enlace del repositorio»; campo de 2 líneas o URL partida (T7). | F42 |
| R6 | 🟠 | Diagnóstico | La lista enseña el texto técnico **en inglés y sin resumen** («Failed to load resource / There was 1 root cause: java.net.UnknownHostException…») en 4 líneas por evento, y el mismo error se repite hasta 45 veces. Son eventos de antes del arreglo de F32, pero el texto técnico debe estar en «Ver detalle», no en la lista. (`movil-diagnostico.png`) | Línea de resumen en español por tipo de fallo + «Ver detalle» con el texto original; agrupar repetidos («×12 · hace 5 min»). | **nueva** (F43) |
| R7 | 🟡 | Diagnóstico | El botón «Exportar informe» (verde) y «Borrar» (borde rojo) conviven bien; «Formato del informe» con los chips «Texto plano» y «JSON» (jerga). | «Texto» y «Datos» o dejar solo «Texto plano» y un enlace «Para soporte»; revisar la puerta de i18n. | F43 |
| R8 | 🟡 | Ajustes → Diagnóstico | El chevrón de la fila «Registro de diagnóstico» queda **debajo** del texto, alineado a la izquierda, en lugar de a la derecha de la fila. En web está a la derecha. (`movil-ajustes-3.png`) | Fila en horizontal con el chevrón a la derecha (`SettingsRow`). | F42 |
| R9 | 🟡 | Ajustes → Respaldo | «…en un archivo JSON…» (T5: jerga). | «…en un archivo de respaldo…». | F42 |
| R10 | 🟠 | Lector (hoja de modo) | La marca ✓ del modo activo está **en otra línea**, debajo de la descripción, no junto al nombre; la hoja ocupa 45 % de la pantalla. Los nombres «Paginado D → I · Manga» y «Paginado I → D · Cómic» mezclan flechas y el tipo de obra. (`movil-lector-modo.png`) | Fila con ✓ a la derecha del nombre; nombres «Derecha a izquierda (manga)» e «Izquierda a derecha (cómic)». | F43 |
| R11 | 🟠 | Lector (paginado) | En modo paginado las barras superior e inferior **siguen fijas** y la página se centra con grandes bandas negras (la página 2 es horizontal y ocupa 20 % del alto). Los controles prev/next duplican el toque lateral. (`movil-lector-paginado-2.png`) | Barras que se ocultan al leer y vuelven con el toque central (como en F18); quitar prev/next o dejar uno solo. | F43 |
| R12 | 🟡 | Lector (paginado) | El selector «Cap. 36 ⌄» queda tapado por el botón «Tools» de Expo Go (artefacto de desarrollo, N11), pero el título ocupa 2 líneas y empuja el selector a una caja pequeña. | Revisar sin Expo Go; título en 1 línea con «Capítulo 36» como subtítulo. | F43 |
| R13 | 🟠 | Primer uso (galería) | Paso 1: «Bienvenido a tu nido / RyuuNest no trae portales: los añades tú» usa vocabulario temático («nido», «portales») en un texto explicativo (T3: un toque temático solo en el encabezado). Los botones «Saltar» y «Empezar» no ocupan el ancho. (`movil-primer-uso.png`) | «Bienvenido a RyuuNest / La app no trae fuentes: añade un repositorio de módulos para empezar.» Botón primario a ancho completo y «Saltar» como enlace. | **nueva** (F45) |
| R14 | 🟡 | Primer uso (galería) | Paso 3 «Módulos disponibles»: el botón «Instalar» es secundario (correcto) y no hay ningún primario hasta «Continuar»; aceptable. Los módulos de ejemplo (Portal Cénit, Duna, Ember, Fresno) cumplen D2. | Sin cambio. | — |

### 4.2 Recorrido real con datos borrados (2026-11-08, S25 Ultra)

Se desinstaló YupManga (hoja de confirmación), se vio la hoja de instalar, se borraron los datos de Expo Go y se recorrió el **primer uso real**: bienvenida → añadir repositorio → módulos → instalar M440 → «Ir a leer» → Inicio. Capturas: `docs/capturasF33/movil-desinstalar.png`, `movil-instalar.png`, `movil-real-0…7.png`, `movil-quitar-repo.png`.

| # | Sev | Pantalla | Hallazgo (evidencia) | Cambio propuesto | Tarea |
|---|---|---|---|---|---|
| V1 | 🔴 | Inicio tras el primer uso | **Confirmado en instalación limpia (N1):** un usuario nuevo, sin leer nada, termina el primer uso y ve «Continuar la aventura: El dragón de ceniza, Cap. 41», «Lecturas recientes» y carpetas ficticias. Es el primer contacto con la app. (`movil-real-7.png`) | Estado vacío de Inicio (decisión: instalar un módulo + botón a Fuentes); Inicio con datos reales. | F40 |
| V2 | 🔴 | Instalar módulo NSFW | La hoja «Instalar módulo» de un módulo marcado NSFW **no avisa de contenido para adultos**: solo «ejecuta código en tu dispositivo». Los tres módulos oficiales son NSFW y se pueden instalar desde el primer uso sin ninguna advertencia. (`movil-instalar.png`, `movil-real-4.png`) | Primer aviso (al instalar), con definición de NSFW. Ver R3. | F45 |
| V3 | 🟠 | Instalar módulo | El botón principal «Mantén pulsado para instalar» tiene el mismo estilo que «Cancelar» (ninguno es primario), no hay indicación de progreso al mantener ni confirmación al terminar: el módulo pasa a «Gestionar» sin mensaje. «Huella SHA-256» y «Tipo de módulo: Con código propio» son jerga (T2/T5). | Botón primario verde con barra de progreso visible; aviso «M440 instalado»; «Huella de verificación» en un bloque plegable. | F42 |
| V4 | 🟠 | Primer uso | El flujo **añade el repositorio oficial sin que lo veas** (paso 2 solo muestra la URL precargada y recortada por la izquierda, sin etiqueta) y la barra inferior de pestañas sigue activa durante el primer uso (se puede salir a medias). En el paso 3, «Ir a leer» es primario y verde aunque no haya ningún módulo instalado; «Saltar» y «Ir a leer» confunden. (`movil-real-2.png`, `movil-real-3.png`) | Etiqueta «Repositorio oficial de RyuuNest» en vez de URL; ocultar la barra inferior; «Ir a leer» deshabilitado hasta instalar un módulo, con «Saltar» como enlace. | F45 |
| V5 | 🟡 | Primer uso | Las pantallas dejan el 55 % inferior vacío; el contenido queda arriba (bienvenida con el dragón sin separación del texto). | Centrar verticalmente o anclar los botones abajo a ancho completo. | F45 |
| V6 | 🟡 | Primer uso | **La primera pulsación en «Ir a leer» no respondió** y la segunda sí (dos intentos, posible latencia de la app tras instalar). No reproducido de forma fiable. | Medir y reproducir antes de abrir una tarea; añadir estado «cargando» al botón. | F45 |
| V7 | 🟡 | Quitar repositorio | Tocar la tarjeta del repositorio abre «Quitar repositorio»: la acción destructiva no se anuncia (la tarjeta parece informativa) y el botón de sincronizar es solo icono. La hoja en sí es clara. (`movil-quitar-repo.png`) | Botón visible «Quitar» en el menú de la tarjeta; etiqueta «Sincronizar». | F42 |
| V8 | 🟡 | Desinstalar | La hoja de desinstalar es clara («Se borrarán el módulo y sus archivos. Tus tesoros no cambian») y usa el patrón único de F34; tras confirmar, el módulo vuelve a «Instalar» y baja al final de la lista sin aviso. (`movil-desinstalar.png`) | Aviso «YupManga desinstalado» (mismo toast). | F42 |

Cobertura que **sigue sin verse** (R1, parcial): hoja «Actualizar módulo» (no hay actualización disponible), hojas de **Respaldo** (exportar/importar abren los selectores del sistema), **diálogos de error** nativos y el modo paginado I → D. Se cierran cuando exista un módulo con actualización, un respaldo para importar y un error de módulo forzado.

## 5. Hallazgos web (Playwright)

| # | Sev | Pantalla | Hallazgo (evidencia) | Cambio propuesto | Tarea |
|---|---|---|---|---|---|
| W1 | 🔴 | Descubrir | Placeholder y etiqueta del campo dicen lo mismo («Buscar obras…» ×2) y el botón de enviar se llama «Buscar obras…» con puntos suspensivos; parece otro campo. (`discover-377.png`) | Etiqueta «Buscar», placeholder «Título», botón «Buscar». Una etiqueta por concepto. | **nueva** (F41) |
| W2 | 🔴 | Biblioteca | La búsqueda de Biblioteca usa la clave `series.search` («Buscar capítulo o título…»; en Biblioteca no hay capítulos) y no lleva etiqueta propia. Ya anotado en F28 sin arreglar. (`library-556.png`) | Clave propia `library.search`: «Buscar en tus tesoros». | **nueva** (F41) |
| W3 | 🔴 | Portales | «**1 instalados** · 4 disponibles» (plural) y «Quitar repositorio» como bloque rojo a ancho completo; «Sincronizar» y «Quitar» apilados. Ya anotado en F28. (`sources-390.png`) | Plural por regla de i18n; acciones en una fila, «Quitar» secundaria con texto de peligro y confirmación (ya existe). | **nueva** (F42) |
| W4 | 🔴 | Ficha | **La ficha web no tiene portada ni sinopsis** ni acción principal «Empezar / Continuar»: solo metadatos, chips «Oficial/Scan» sin título y la lista. La nativa sí. Q3 la exige. (`series-390.png`) | Cabecera con portada, estado, género, sinopsis con «Ver más» y botón primario, igual que nativo. | **nueva** (F41) |
| W5 | 🟠 | Ficha | El botón «Guardada» es la acción de favorito pero no se ve como acción (sin corazón relleno, con anillo de foco permanente); «Guardada» y «Favorito» son dos nombres. | Un nombre («Guardar»/«Guardado») y corazón relleno; sin foco residual. | **nueva** (F41) |
| W6 | 🟠 | Ficha | «Buscar capítulo o título…» queda a la derecha de «Capítulos», «Invertir orden» ocupa una fila entera. Fila desordenada a 390 px. | Una fila: título «Capítulos», buscador y orden con icono. | **nueva** (F41) |
| W7 | 🟠 | Inicio | La tarjeta de «Continuar la aventura» es solo una portada pequeña con barra verde suelta al borde; no tiene botón «Continuar» ni capítulo ni %. Falta la sección «Carpetas» (nativo sí). (`home-426.png`) | Misma tarjeta que nativo y paridad de carpetas (ya listado en F28). | **nueva** (F40) |
| W8 | 🟠 | Inicio / Tesoros | Una **barra verde vertical** sobresale a la derecha de la primera tarjeta («Lecturas recientes» a 1440 px, «Continuar» a 426 px). Parece un anillo de foco o una barra de progreso mal colocada. (`home-1440.png`, `home-426.png`) | Reproducir y corregir (anillo de foco con teclado, V1). | **nueva** (F40) |
| W9 | 🟠 | Descubrir | Tres listas con la misma obra repetida («Más recientes», «Populares», «Explorar catálogo»), sin portadas, y «Anterior / Siguiente» con el mismo aspecto aunque «Anterior» no aplica. | Una lista principal; «Anterior» solo si hay página previa. Portadas: ver F35. | F38 + F35 |
| W10 | 🟠 | Biblioteca | Rejilla con tarjetas de **tamaños distintos** (120×180 y 98×146) y huecos irregulares. (`library-1440.png`) | Ancho de columna y proporción 2:3 únicos (`LibraryCard`). | **nueva** (F41) |
| W11 | 🟠 | Biblioteca | Chips mezclan estado y tipo («Todos (2)», «Continuar la Aventura», «Manhwa», «Manga»); «Continuar la Aventura» es una sección de Inicio usada como filtro. | Dos grupos: estado («En curso») y tipo. | **nueva** (F41) |
| W12 | 🟠 | Portales | Los contadores de tipo suman más que los módulos (un módulo cuenta en cada tipo). Chips «Manga (4)», «Manhwa (4)» sobre 4 módulos. | Filtrar por tipo sin contador o con «módulos que incluyen…». | **nueva** (F42) |
| W13 | 🟠 | Portales | Dos botones primarios verdes en una vista: «Añadir repositorio» y «Instalar» ×3 (V3). | «Instalar» secundario, o un solo primario por vista. | **nueva** (F42) |
| W14 | 🟠 | Lector | El banner de error queda pegado al borde, sin esquina redondeada, sin código ni «Ver detalle». (`error-banner-426.png`) | Alinear con `ErrorBanner` de F29. | **nueva** (F43) |
| W15 | 🟠 | Lector | A 1440 px la barra superior pone «Cerrar lector» a la izquierda y «Pág. 3/3» + «Modo de lectura» a la derecha, sin selector de capítulo visible (RF-22). | Barra: cerrar, título + selector, progreso, modo. | **nueva** (F43) |
| W16 | 🟠 | Ajustes (273 px) | La barra inferior tapa «Protección de instalación» y la etiqueta «Aventuras» se parte; el texto ámbar «no se puede activar» es una promesa de seguridad dudosa (T6). | Revisar copy («No disponible en este dispositivo») y reserva inferior de scroll. | **nueva** (F42) |
| W17 | 🟡 | Todas (≥ 1024) | A 1440 px el contenido ocupa 25 % del ancho y deja un vacío enorme; riel de 240 px casi vacío. | Cuadrícula que escale y ancho de contenido hasta ~1100 px (como `contentMaxWidth`). | **nueva** (F43) |
| W18 | 🟡 | Descubrir | Chip de módulo único («Demo») con foco visible aunque nadie lo enfocó. | Selector solo con ≥ 2 módulos; foco solo `:focus-visible`. | **nueva** (F41) |
| W19 | 🟡 | Portales | Trazo verde a la izquierda de la pestaña «Guarida» en la barra inferior (`sources-390.png`). | Revisar borde de la pestaña activa. | **nueva** (F43) |
| W20 | 🟡 | Estados vacíos | «Tus tesoros están vacíos» y «Tu guarida está vacía» repiten el texto y el CTA «Añadir repositorio»; el dragón ocupa > 40 % de la altura. | Texto por pantalla; CTA como en N20; dragón más pequeño. | **nueva** (F40) |

## 6. Diferencias entre web y nativo (paridad)

| Pantalla | Web | Nativo | Acción |
|---|---|---|---|
| Inicio | Datos reales; sin carpetas; tarjeta sin botón | **Datos de ejemplo**; carpetas; tarjeta completa | N1, W7 |
| Descubrir | Filas de texto sin portada | Portadas reales con insignia | W9, F35 |
| Ficha | Sin portada ni sinopsis | Completa | W4 |
| Ajustes | Idioma, lectura, seguridad; avisos en ámbar | Más limpio, tarjetas y interruptores con «Sí/No» | N21, W16 |
| Lector | Barra superior simple | Barra superior + inferior + píldora de modo | N17, W15 |

## 7. Resumen y siguiente paso

| Severidad | Cantidad | Ids |
|---|---|---|
| 🔴 Bloqueante | 11 filas (8 problemas: N1, N19 y V1 son el mismo; R3 y V2 también) | N1, N19, V1, W1, W2, W3, W4, R1, R2, R3, V2 |
| 🟠 Importante | 27 | N2, N3, N7, N8, N9, N12, N14, N17, W5–W16, R4, R6, R10, R11, R13, V3, V4 |
| 🟡 Menor | 26 | N4–N6, N10, N11, N13, N15, N16, N18, N20–N22, W17–W20, R5, R7, R8, R9, R12, R14, V5–V8 (N10, N11 y R14 no requieren cambio) |

### 7.1 Índice de todos los hallazgos por nivel

Total: **64 filas** (22 nativas N, 20 web W, 14 del recorrido ampliado R, 8 del recorrido real V). Los hallazgos de la primera versión del análisis (borrador web con ids D, I, B, P, S, L, A, E y T) quedaron integrados en estas series: D1→W1, D2/D4→W9, D3→W9/F35, D5→W18, I1/I5→W7, I2→W8, I3→W17, I4→N4, B1→W2, B2→W11, B3→W10, B4/T1→W18, P1→W3, P2→W12, P3→N9, P4→W19, P5→N8, S1→W5, S2→W6, S3→W4, S4→N16, L2→W15, L3→W14, A1→N21, A2→W16, E1→N20/W20, T2→W13, T5→W17.

| Nivel | Id | Pantalla | Resumen | Tarea |
|---|---|---|---|---|
| 🔴 | N1 / N19 / V1 | Inicio | Inicio nativo muestra datos de ejemplo, incluso en una instalación limpia | F40 |
| 🔴 | V2 / R3 | Instalar / abrir módulo NSFW | Sin aviso de contenido para adultos; dos avisos con definición de NSFW | F45 |
| 🔴 | R1 | Cobertura | Faltan en el teléfono: actualizar módulo, Respaldo, diálogos de error, paginado I → D | F33 (cont.) |
| 🔴 | R2 | Portales | Falta «Recomendados» (índice remoto) | F44 |
| 🔴 | W1 | Descubrir (web) | Etiqueta, placeholder y botón de búsqueda repiten «Buscar obras…» | F41 |
| 🔴 | W2 | Biblioteca (web) | Búsqueda con la clave `series.search` («capítulo o título») | F41 |
| 🔴 | W3 | Portales (web) | «1 instalados», acciones apiladas, «Quitar» como bloque rojo | F42 |
| 🔴 | W4 | Ficha (web) | Sin portada, sinopsis ni acción principal | F41 |
| 🟠 | N2 | Inicio | Carpetas con nombre cortado («Favorito…») | F40 |
| 🟠 | N3 | Inicio | Portadas en blanco sin marcador | F35 + F40 |
| 🟠 | N7 | Portales | Título duplicado con la cabecera | F42 |
| 🟠 | N8 | Portales | «disponibles» en verde y subfrase con jerga | F42 |
| 🟠 | N9 | Portales | «Ejecuta código» y NSFW como insignias neutras | F42 |
| 🟠 | N12 | Aventuras | Tipo repetido en insignia y texto | F41 |
| 🟠 | N14 | Ficha | Fila de capítulo con tres líneas repetidas | F41 |
| 🟠 | N17 | Lector | Barras y píldora de modo tapan arte; página y % duplicados | F43 |
| 🟠 | W5 | Ficha (web) | «Guardada» no se ve como acción; dos nombres | F41 |
| 🟠 | W6 | Ficha (web) | Búsqueda de capítulos y orden desordenados | F41 |
| 🟠 | W7 | Inicio (web) | Tarjeta sin botón «Continuar» y sin «Carpetas» | F40 |
| 🟠 | W8 | Inicio (web) | Barra verde suelta junto a la primera tarjeta | F40 |
| 🟠 | W9 | Descubrir (web) | Tres listas con la obra repetida; «Anterior» siempre activo | F38 + F35 |
| 🟠 | W10 | Biblioteca (web) | Tarjetas de distinto tamaño | F41 |
| 🟠 | W11 | Biblioteca (web) | Chips mezclan estado y tipo | F41 |
| 🟠 | W12 | Portales (web) | Contadores de tipo no suman | F42 |
| 🟠 | W13 | Portales (web) | Dos botones primarios verdes | F42 |
| 🟠 | W14 | Lector (web) | Banner de error sin código ni detalle | F43 |
| 🟠 | W15 | Lector (web) | Barra sin selector de capítulo visible | F43 |
| 🟠 | W16 | Ajustes (web, 273 px) | Barra inferior tapa texto; copy de «Protección» | F42 |
| 🟠 | R4 | Gestionar módulo | «Con código propio» vs «Ejecuta código»; faltan permisos y NSFW | F42 |
| 🟠 | R6 | Diagnóstico | Texto técnico en inglés en la lista, 45 repetidos | F43 |
| 🟠 | R10 | Lector (hoja de modo) | ✓ en otra línea; nombres con flechas | F43 |
| 🟠 | R11 | Lector (paginado) | Barras fijas y bandas negras | F43 |
| 🟠 | R13 | Primer uso | Copy temático («nido», «portales») | F45 |
| 🟠 | V3 | Instalar módulo | Botón principal sin énfasis ni progreso; sin aviso al terminar | F42 |
| 🟠 | V4 | Primer uso | Repositorio oculto, barra inferior activa, «Ir a leer» siempre verde | F45 |
| 🟡 | N4 | Inicio | Títulos en Title Case | F40 |
| 🟡 | N5 | Inicio | «Tesoros Guardados» vs «Tesoros» | F40 |
| 🟡 | N6 | Inicio | «Retomar» y «Ver todas» ambiguos | F40 |
| 🟡 | N10 | Portales | Chip cortado a la derecha (aceptable) | — |
| 🟡 | N11 | Todas | Botón «Tools» de Expo Go (no es de la app) | — |
| 🟡 | N13 | Aventuras | Sin botón de buscar; placeholder con «…» | F38 |
| 🟡 | N15 | Ficha | Título «Ficha» y falta de pestañas | F41 |
| 🟡 | N16 | Ficha | «En curso» con dos significados | F41 |
| 🟡 | N18 | Lector | Imagen sugerente sin aviso (resuelto por R3) | F45 |
| 🟡 | N20 | Tesoros | CTA «Añadir repositorio» con módulos ya instalados | F40 |
| 🟡 | N21 | Ajustes | «Idioma» duplicado y «Español» sin forma de control | F42 |
| 🟡 | N22 | Ajustes | Chips de modo de lectura en 3 filas desiguales | F42 |
| 🟡 | W17 | Escritorio | Vacío a 1440 px y riel casi vacío | F43 |
| 🟡 | W18 | Descubrir (web) | Selector con un solo módulo y foco residual | F41 |
| 🟡 | W19 | Portales (web) | Trazo verde en la pestaña «Guarida» | F43 |
| 🟡 | W20 | Estados vacíos | Textos casi iguales y dragón de más del 40 % | F40 |
| 🟡 | R5 | Añadir repositorio | «(index.json)» y URL recortada | F42 |
| 🟡 | R7 | Diagnóstico | «JSON» y «Texto plano» como jerga | F43 |
| 🟡 | R8 | Ajustes | Chevron bajo el texto, no a la derecha | F42 |
| 🟡 | R9 | Ajustes | «archivo JSON» en Respaldo | F42 |
| 🟡 | R12 | Lector | Título en 2 líneas aprieta el selector | F43 |
| 🟡 | R14 | Primer uso (galería) | Sin cambio | — |
| 🟡 | V5 | Primer uso | Mitad inferior vacía | F45 |
| 🟡 | V6 | Primer uso | Primera pulsación de «Ir a leer» sin respuesta (no reproducido) | F45 |
| 🟡 | V7 | Portales | Tocar la tarjeta del repo abre «Quitar»; sincronizar sin etiqueta | F42 |
| 🟡 | V8 | Desinstalar | Sin aviso al terminar | F42 |

**Tareas nuevas propuestas** (pendientes de que el humano las apruebe y las pase a `todo.md`):

| Tarea | Alcance | Hallazgos |
|---|---|---|
| F40 Inicio con datos reales y paridad | Inicio nativo sin fixtures y con estado vacío propio (instalar módulo + botón a Fuentes), carpetas completas, tarjeta continuar en web | N1–N6, N19, N20, V1, W7, W8, W20 |
| F41 Descubrir, Biblioteca y ficha | Búsqueda, rejilla, chips, ficha web con portada y sinopsis, filas de capítulo | N12, N14–N16, W1, W2, W4–W6, W10, W11, W18 |
| F42 Portales y Ajustes | Título duplicado, plural, «disponibles» visible, permisos con icono de aviso, hoja de gestionar e instalar, aviso al terminar, botones, idioma, filas | N7–N9, N21, N22, W3, W12, W13, W16, R4, R5, R8, R9, V3, V7, V8 |
| F43 Lector, Diagnóstico y escritorio | Barras del lector, hoja de modo, paginado, banner, Diagnóstico con resumen, ancho en escritorio | N17, W14, W15, W17, W19, R6, R7, R10–R12 |
| F44 «Recomendados» en Fuentes | Índice remoto mantenido por el humano; **requiere actualizar el SPEC (RNF-5)** | R2 |
| F45 Aviso NSFW y primer uso | Dos avisos NSFW (instalar y primera apertura) con definición; primer uso sin jerga, con repositorio visible y sin barra inferior | R3, V2, V4–V6, R13 |
| F33 (continuación) | Recorrer en el S25 Ultra lo que sigue sin verse (bloqueante): R1 | R1 |

Reglas de reparto: cada tarea cumple `AGENTS.md`/CLAUDE (TDD, ≤ 5 archivos por corte, un PR por tarea, `DIFFS.md` actualizado).

## 8. Preguntas abiertas para el humano

Las preguntas anteriores quedaron respondidas (§2.1 y §2.2). Quedan:

1. **F44, dónde vive el índice remoto:** ¿qué URL y qué formato? Recomendación: un `recommended.json` en el repo oficial (`RyuuNest-Models`), con `{ name, indexUrl, description, nsfw }` por servidor, descargado **solo al abrir Portales o al pulsar «Actualizar recomendados»** (no en segundo plano) y con un estado «sin conexión» que no bloquea la pantalla. Necesito tu visto bueno para cambiar RNF-5 y RF-1…RF-8 del SPEC.
2. **R1, lo que queda:** para ver la hoja de «Actualizar módulo» hace falta que un módulo tenga una versión nueva en el índice. ¿Subo una versión de prueba en un índice local (sin tocar `RyuuNest-Models`) o prefieres esperar a una actualización real?
3. **Orden de trabajo:** ¿qué va primero? Recomendación: **F40 (Inicio real y vacío) → F45 (NSFW y primer uso) → F41/F42 → F43 → F44**, porque F40 y F45 afectan al primer contacto y no necesitan cambiar el SPEC.

## 9. Verificación de la lista de 20 segundos (`DESIGN_RULES.md` §6) sobre lo observado

| Punto | Resultado |
|---|---|
| ¿Texto que depende del tema? | No. |
| ¿Cifras cuadran entre pantallas? | **No:** Inicio nativo (N1/N19). |
| ¿Hexadecimales o tamaños escritos a mano? | No (gate de lint verde; F28 sin colores fuera de tokens). |
| ¿Títulos o datos terminados en «…»? | **Sí en nativo:** carpetas de Inicio (N2) y placeholder «Buscar obras…». |
| ¿Algo de la sección 4 (v2)? | No observado. |
| ¿Tarjeta-mascota o relleno? | No. |
| ¿Portadas con texto o reales? | Portadas reales de módulos con texto en la imagen: contenido del sitio, no de la app. |
| ¿Barra inferior y cabecera iguales? | Sí, salvo el título duplicado de Portales (N7). |
| ¿Más de un botón primario? | **Sí en Portales** (W13). |
| ¿Promesa que la v1 no cumple? | Revisar «Protección de instalación» (W16). |
| ¿Texto técnico o en inglés en la interfaz? | **Sí:** Diagnóstico (R6), «JSON»/«index.json» (R5, R9). |
