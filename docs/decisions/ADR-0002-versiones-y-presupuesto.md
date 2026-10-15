# ADR-0002: Versiones y presupuesto de memoria (calibración de dispositivos)

- **Estado:** borrador — smokes **OK en los 2 teléfonos** (2026-10-14); **MiBox 4 pospuesta** (Android TV de lado, `MEMORY.md` P-43); quedan por fijar las versiones y el tope de imágenes
- **Fecha:** 2026-10-13
- **Tarea:** T05 (Fase 0)
- **Fuentes:** `docs/SPEC.md` §14 y §17.2; `tasks/todo.md` T05; registro npm (2026-10-13)

## Contexto

La Fase 0 exige fijar las versiones de Expo, React Native y React Native TV y medir el
presupuesto de memoria y el arranque en frío en los tres equipos de prueba, con la
**Xiaomi MiBox 4 (Android 9, 2 GB)** como piso de rendimiento. También hay que responder la
pregunta abierta del SPEC §17.2: **¿el SDK de Expo vigente admite Android 9 (API 28)?**

La app de calibración es un shell mínimo en `apps/mobile` (`@ryuunest/mobile`) que además
comprueba que las tres librerías JS puras del núcleo (`@noble/hashes`, `fflate` y
`htmlparser2`) corren en React Native.

> **Este ADR no está cerrado.** Las versiones de abajo son **candidatas** y las tablas de
> medición están vacías hasta que se ejecute la app en los tres dispositivos.

## Versiones candidatas (de `apps/mobile/package.json`)

| Componente | Versión | Estado |
| --- | --- | --- |
| Expo SDK | `~57.0.28` | Candidata (última) |
| React Native | `0.86.3` | Candidata (la que fija el SDK 57) |
| React | `19.2.3` | Candidata (la que fija el SDK 57) |
| expo-status-bar | `~57.0.1` | Candidata |
| TypeScript | `~6.0.3` | Fijada (ver ADR-0001 y `MEMORY.md` P-34) |
| @noble/hashes | `^2.4.0` | Candidata |
| fflate | `^0.8.3` | Candidata |
| htmlparser2 | `^12.0.0` | Candidata |
| better-sqlite3 (dev/test) | `^13.0.3` | Candidata (aún no instalada) |
| react-native-tvos | `0.87.1-1` | **Pendiente de confirmar** contra el SDK 57 |

## Android mínimo (SPEC §17.2)

- **Objetivo:** Android 9 (API 28), para cubrir la MiBox 4 (SPEC §14, D-9).
- **Confirmado (2026-10-13):** el mínimo es Android 9 / API 28 y el SDK 57 lo admite
  (verificado en la MiBox 4). Se recomienda API 29/30 para producción; esa nota se añadirá
  al README tras la primera versión.

| Pregunta | Respuesta | Fecha |
| --- | --- | --- |
| ¿El SDK 57 admite API 28? | **Sí.** Confirmado por el humano en los 3 dispositivos (la MiBox 4 con Android 9 arranca). | 2026-10-13 |
| `minSdkVersion` efectivo | **28** (Android 9). Se adopta como mínimo del proyecto (D-9). Recomendación de API 29/30 para producción: se añadirá al README tras la primera versión. | 2026-10-13 |

## Arranque en frío y memoria

Medir con `adb shell am start -W` (arranque) y el perfil de memoria del sistema, o los
números que muestre la app. Rellenar una fila por dispositivo.

| Dispositivo | Android | Arranque en frío (ms) | Memoria (MB) | Notas |
| --- | --- | --- | --- | --- |
| POCO F6 Pro | 12–15 | 4580ms | 226mb | Equipo principal |
| Galaxy S25 Ultra | 12–15 | 1940ms | 140mb | Equipo principal |
| Xiaomi MiBox 4 | 9 (API 28) | 5600ms | 323mb | Piso de rendimiento (2 GB) |

**Tope de imágenes en memoria para la MiBox 4:** _pendiente_ (lo usará el lector, SPEC §9).
Con el Android TV pospuesto (P-43) hay que decidir **dónde** medirlo: en la MiBox cuando
vuelva, en un teléfono, o fijarlo al construir el lector (T27) — pregunta abierta 12.

## Librerías JS puras en React Native

La app de calibración ejecuta estas comprobaciones y muestra OK/FALLO por dispositivo:

| Comprobación | POCO F6 Pro | Galaxy S25 Ultra | MiBox 4 |
| --- | --- | --- | --- |
| `@noble/hashes` · sha256 | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |
| `fflate` · gzip round-trip | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |
| `htmlparser2` · parse | **OK** (2026-10-14) | **OK** (2026-10-14) | _pospuesto_ (P-43) |

**Evidencia:** `docs/capturasT05/Samsung_s25Ultra.jpeg` (Galaxy S25 Ultra: «Módulo cargado +314490 ms · 3/3 comprobaciones» con las tres filas `OK`) y la misma prueba **3/3 OK** en el POCO, hecha en mano sin captura.

> ⚠ **Pendiente de confirmar el modelo del POCO:** el humano lo llamó «POCO F5 Pro»
> (2026-10-14), mientras el proyecto registra **POCO F6 Pro** (SPEC §14, `MEMORY.md` P-10,
> RNF-1, AC-4, AC-12). Hasta confirmarlo no se renombra ningún equipo.
> ⚠ **Android TV (MiBox 4) queda de lado de momento** — `MEMORY.md` P-43; su alcance está
> por confirmar y arrastra el tope de imágenes (SPEC §9 lo mide en esa MiBox).

## Consecuencias

- Al cerrar la calibración, estas versiones pasan a **fijadas** y se replican en los demás
  paquetes cuando toque.
- Si el SDK 57 exigiera un `minSdk` mayor que 28, se decide entre degradar el SDK o cambiar
  el equipo mínimo (afecta a D-9 y a la MiBox 4) — se registra como decisión nueva.
- El presupuesto de memoria de la MiBox 4 condiciona las políticas del estado del lector
  (T27, SPEC §9).
